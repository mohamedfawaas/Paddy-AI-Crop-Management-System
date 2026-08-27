import os
import io
import json
import base64
import numpy as np
from fastapi import APIRouter, UploadFile, File, HTTPException
from api.schemas import DiseaseResponse

router   = APIRouter()
BASE     = os.path.join(os.path.dirname(__file__), '..', 'models')
_model   = None
_classes = None
IMG_SIZE = (224, 224)
CONFIDENCE_THRESHOLD = 60.0   # below this => low_confidence warning shown to farmer

INFO = {
    # 3-class local model (Kaggle "rice-leaf-diseases" — already trained)
    "Bacterial leaf blight": {"severity": "Severe",   "treatment": "Apply Copper oxychloride (3g/L) or Streptocycline spray.", "prevention": "Use resistant varieties. Avoid excess nitrogen. Ensure field drainage."},
    "Brown spot":            {"severity": "Moderate", "treatment": "Apply Mancozeb (2.5g/L) or Propiconazole.",               "prevention": "Use certified seeds. Avoid water/nutrient stress. Balanced fertilization."},
    "Leaf smut":              {"severity": "Mild",     "treatment": "Apply Propiconazole or Tricyclazole fungicide.",           "prevention": "Use clean seed, seed treatment before sowing, balanced fertilization."},

    # 8-class Kaggle "Rice Leaf Disease Dataset" model (mdmehedihasan19) — trained on Kaggle GPU
    "Leaf Blast":             {"severity": "Severe",   "treatment": "Apply Tricyclazole (0.6g/L) or Isoprothiolane. Remove and destroy infected leaves.", "prevention": "Use resistant varieties (e.g. BG 359). Avoid excess nitrogen. Ensure good field drainage."},
    "Sheath Blight":          {"severity": "Severe",   "treatment": "Apply Hexaconazole or Validamycin fungicide at the base of plants.",                  "prevention": "Avoid excess plant density and nitrogen. Maintain proper water management (avoid continuous flooding)."},
    "Leaf scald":             {"severity": "Moderate", "treatment": "Apply Propiconazole; remove severely affected leaves.",                                "prevention": "Use resistant varieties. Balanced potassium fertilization reduces severity."},
    "Narrow Brown Leaf Spot": {"severity": "Mild",     "treatment": "Apply Mancozeb if severe; usually low-impact.",                                        "prevention": "Correct potassium deficiency in soil. Balanced fertilization during late growth stages."},
    "Rice Hispa":             {"severity": "Moderate", "treatment": "This is a pest (not a fungal/bacterial disease) — apply Chlorpyrifos or hand-pick adults/larvae.", "prevention": "Clip and destroy damaged leaf tips early in infestation. Avoid excess nitrogen."},
    "Tungro":                 {"severity": "Severe",   "treatment": "No direct cure — remove and destroy infected plants to reduce spread. Control the leafhopper vector with Imidacloprid.", "prevention": "Use resistant varieties. Control green leafhopper population. Synchronize planting across the area."},

    # Kept as a fallback so the API never crashes on an unseen label
    "Healthy":                {"severity": "None",     "treatment": "No treatment needed.",                                    "prevention": "Maintain good practices. Monitor weekly."},
    "Healthy Rice Leaf":      {"severity": "None",     "treatment": "No treatment needed.",                                    "prevention": "Maintain good practices. Monitor weekly."},
}
INFO_CI = {k.lower(): v for k, v in INFO.items()}  # case-insensitive lookup — the two trained
                                                     # models use slightly different casing
                                                     # ("Brown spot" vs "Brown Spot") for the same disease

def _load():
    global _model, _classes
    try:
        import tensorflow as tf
    except ImportError:
        raise HTTPException(503, "TensorFlow not installed. Run: pip install tensorflow")
    mp = os.path.join(BASE, 'disease_model.keras')
    if not os.path.exists(mp):
        # fallback: allow an older .h5 file to still be picked up if present
        mp_h5 = os.path.join(BASE, 'disease_model.h5')
        if os.path.exists(mp_h5):
            mp = mp_h5
        else:
            raise HTTPException(503, "Run: python models/train_disease_cnn.py first")
    try:
        # safe_mode=False: extra safety net; native .keras format doesn't have
        # the legacy H5 "Unknown layer: TrueDivide" issue, but kept here in case
        # an older .h5 model is still being loaded via the fallback above.
        _model = tf.keras.models.load_model(mp, safe_mode=False, compile=False)
    except TypeError:
        # older TF/Keras (<3.0) doesn't have the safe_mode kwarg at all
        _model = tf.keras.models.load_model(mp, compile=False)
    cp       = os.path.join(BASE, 'class_names.json')
    _classes = json.load(open(cp)) if os.path.exists(cp) else ['Bacterial leaf blight', 'Brown spot', 'Leaf smut']


def _find_last_conv_layer(model):
    """Search a (possibly nested Sequential-of-base-model) Keras model for the
    last Conv2D layer, so Grad-CAM has a feature map to differentiate against."""
    import tensorflow as tf
    last_conv = None
    def _scan(m):
        nonlocal last_conv
        for layer in m.layers:
            if isinstance(layer, tf.keras.Model) or hasattr(layer, 'layers'):
                _scan(layer)
            if isinstance(layer, tf.keras.layers.Conv2D):
                last_conv = layer
    _scan(model)
    return last_conv


def _make_gradcam_heatmap(img_array, model, class_idx):
    """Standard Grad-CAM: gradient of the predicted class score w.r.t. the last
    convolutional feature map, weighted-averaged into a single 2D importance map."""
    import tensorflow as tf
    conv_layer = _find_last_conv_layer(model)
    if conv_layer is None:
        return None
    try:
        grad_model = tf.keras.models.Model(
            inputs=model.inputs, outputs=[conv_layer.output, model.output]
        )
        with tf.GradientTape() as tape:
            conv_output, predictions = grad_model(img_array)
            class_channel = predictions[:, class_idx]
        grads = tape.gradient(class_channel, conv_output)
        if grads is None:
            return None
        pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))
        conv_output = conv_output[0]
        heatmap = tf.reduce_sum(conv_output * pooled_grads, axis=-1)
        heatmap = tf.maximum(heatmap, 0)
        max_val = tf.math.reduce_max(heatmap)
        if max_val == 0:
            return None
        heatmap = heatmap / max_val
        return heatmap.numpy()
    except Exception:
        return None


def _overlay_heatmap(original_img, heatmap, alpha=0.45):
    """Resize the low-res Grad-CAM heatmap to the original image size, apply a
    jet-style colour map, and blend it over the original leaf photo."""
    from PIL import Image
    heat_img = Image.fromarray(np.uint8(heatmap * 255)).resize(original_img.size, Image.BILINEAR)
    heat_arr = np.array(heat_img).astype(np.float32) / 255.0

    # Simple jet-like colormap (blue -> cyan -> green -> yellow -> red)
    r = np.clip(1.5 - np.abs(4 * heat_arr - 3), 0, 1)
    g = np.clip(1.5 - np.abs(4 * heat_arr - 2), 0, 1)
    b = np.clip(1.5 - np.abs(4 * heat_arr - 1), 0, 1)
    heat_rgb = np.stack([r, g, b], axis=-1) * 255

    orig_arr = np.array(original_img).astype(np.float32)
    blended = orig_arr * (1 - alpha) + heat_rgb * alpha
    blended = np.clip(blended, 0, 255).astype(np.uint8)
    return Image.fromarray(blended)


def _to_base64_png(pil_img):
    buf = io.BytesIO()
    pil_img.save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("utf-8")


@router.post("/disease", response_model=DiseaseResponse)
async def predict_disease(file: UploadFile = File(...)):
    if file.content_type not in ["image/jpeg", "image/png", "image/jpg", "image/webp"]:
        raise HTTPException(400, "Only JPG, JPEG, PNG or WebP image files are accepted.")
    try:
        if _model is None:
            _load()
        from PIL import Image
        contents = await file.read()
        if len(contents) > 5 * 1024 * 1024:
            raise HTTPException(400, "Image must be 5 MB or smaller.")
        img_original = Image.open(io.BytesIO(contents)).convert("RGB")
        img  = img_original.resize(IMG_SIZE)
        # NOTE: do NOT divide by 255 here — both trained models bake
        # tf.keras.applications.mobilenet_v2.preprocess_input into the model
        # graph itself (applied right after the augmentation layer), so the
        # API must feed raw 0-255 pixel values, not pre-normalized [0,1] floats.
        arr  = np.expand_dims(np.array(img).astype(np.float32), axis=0)
        pred = _model.predict(arr, verbose=0)[0]
        idx  = int(np.argmax(pred))
        conf = round(float(pred[idx]) * 100, 2)
        dis  = _classes[idx]
        info = INFO_CI.get(dis.lower(), INFO["Healthy"])

        # Feature 3: Grad-CAM explainability heatmap (best-effort; never blocks the response)
        heatmap_b64 = None
        try:
            heatmap = _make_gradcam_heatmap(arr.astype(np.float32), _model, idx)
            if heatmap is not None:
                overlay = _overlay_heatmap(img_original.resize((300, 300)), heatmap)
                heatmap_b64 = _to_base64_png(overlay)
        except Exception:
            heatmap_b64 = None  # graceful degradation — disease result still returned

        # Feature 4: low-confidence warning flag
        low_conf = conf < CONFIDENCE_THRESHOLD

        return DiseaseResponse(
            disease_name=dis.replace("_", " "), confidence=conf,
            severity=info["severity"], treatment=info["treatment"],
            prevention=info["prevention"], low_confidence=low_conf,
            heatmap_image=heatmap_b64,
        )
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print("=" * 60)
        print("DISEASE PREDICTION FAILED — full traceback below:")
        traceback.print_exc()
        print("=" * 60)
        raise HTTPException(500, f"Prediction error: {str(e)}")
