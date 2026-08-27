"""
⚠️ WARNING — READ BEFORE RUNNING THIS SCRIPT ⚠️
If you already trained the 8-class model on Kaggle (using
kaggle_train_disease_cnn.py) and uploaded disease_model.h5 +
class_names.json into this models/ folder, DO NOT run this script —
it will OVERWRITE that better model with a weaker 3-class one trained
on only 120 local images. Only run this if you specifically want to
go back to the small local 3-class dataset.

Train a real CNN for paddy leaf disease detection using transfer learning
(MobileNetV2 base) on the Kaggle "rice-leaf-diseases" dataset
(https://www.kaggle.com/datasets/vbookshelf/rice-leaf-diseases).

IMPORTANT - read before your viva:
  This dataset contains only 3 classes (120 images total, 40 each):
    - Bacterial leaf blight
    - Brown spot
    - Leaf smut

  Your report lists 6 target classes (Leaf Blast, Brown Spot,
  Bacterial Leaf Blight, Sheath Blight, Tungro Disease, Healthy Leaf).
  This dataset only overlaps on 2 of those (Brown Spot, Bacterial Leaf
  Blight) and adds "Leaf smut" which isn't in your list. It has NO
  images for Leaf Blast, Sheath Blight, Tungro, or Healthy leaves.

  So this model is a REAL, HONESTLY-TRAINED 3-class CNN — not a demo —
  but it does not yet cover all 6 diseases from your report. To get
  full 6-class coverage, add images from a larger dataset such as
  Kaggle "Paddy Doctor: Paddy Disease Classification" (has blast,
  bacterial_leaf_blight, brown_spot, tungro, normal/healthy — missing
  only Sheath Blight) and re-run this script; it auto-detects classes
  from the folder names under data/rice_leaf_diseases/.

Given the small dataset (120 images), this uses:
  - Transfer learning (frozen MobileNetV2 ImageNet base) so we don't
    need to learn low-level image features from scratch
  - Heavy on-the-fly data augmentation (flip/rotate/zoom/contrast)
  - A stratified 80/20 train/validation split
  - Early stopping to avoid overfitting the tiny validation set

Run: python models/train_disease_cnn.py
Requires: pip install tensorflow  (NOT run in the sandbox that produced
this file — no TensorFlow / no internet in that environment. Run this
locally where TensorFlow is installed, exactly like the other pipelines.)
"""
import os
import json

BASE = os.path.dirname(__file__)
DATA_DIR = os.path.join(BASE, '..', 'data', 'rice_leaf_diseases')
MODEL_PATH = os.path.join(BASE, 'disease_model.keras')
CLASS_PATH = os.path.join(BASE, 'class_names.json')
IMG_SIZE = (224, 224)
BATCH_SIZE = 8          # small batch size suits a small dataset
EPOCHS = 30
SEED = 42

def train():
    import tensorflow as tf
    # NOTE: `from tensorflow.keras import layers, models` works perfectly at
    # runtime (TensorFlow resolves it lazily), but Pylance/Pyright cannot see
    # inside TensorFlow's dynamic module loader and flags it as
    # "reportMissingImports" even though nothing is actually missing.
    # Importing via the `tf.keras` attribute instead resolves cleanly for
    # both the type checker and Python itself.
    from tensorflow import keras
    layers = keras.layers
    models = keras.models

    print(f"TensorFlow {tf.__version__}")
    if not os.path.isdir(DATA_DIR):
        raise SystemExit(f"Dataset folder not found: {DATA_DIR}\n"
                          f"Expected subfolders per disease class (from Kaggle rice-leaf-diseases).")

    train_ds = tf.keras.utils.image_dataset_from_directory(
        DATA_DIR, validation_split=0.2, subset="training", seed=SEED,
        image_size=IMG_SIZE, batch_size=BATCH_SIZE, label_mode='categorical')
    val_ds = tf.keras.utils.image_dataset_from_directory(
        DATA_DIR, validation_split=0.2, subset="validation", seed=SEED,
        image_size=IMG_SIZE, batch_size=BATCH_SIZE, label_mode='categorical')

    class_names = train_ds.class_names
    print(f"Found classes: {class_names}")
    print(f"Train batches: {len(train_ds)}  Val batches: {len(val_ds)}")

    AUTOTUNE = tf.data.AUTOTUNE
    train_ds = train_ds.cache().shuffle(200).prefetch(buffer_size=AUTOTUNE)
    val_ds = val_ds.cache().prefetch(buffer_size=AUTOTUNE)

    data_augmentation = models.Sequential([
        layers.RandomFlip("horizontal_and_vertical"),
        layers.RandomRotation(0.15),
        layers.RandomZoom(0.15),
        layers.RandomContrast(0.15),
    ])

    base = tf.keras.applications.MobileNetV2(
        input_shape=IMG_SIZE + (3,), include_top=False, weights='imagenet')
    base.trainable = False  # freeze — only 120 images, avoid overfitting the base

    inputs = tf.keras.Input(shape=IMG_SIZE + (3,))
    x = data_augmentation(inputs)
    # NOTE: use the Rescaling LAYER (not calling preprocess_input as a bare
    # function on the tensor) — a raw function call bakes an unserializable
    # "TrueDivide" op into the saved graph, which Keras 3 cannot reload later
    # ("Unknown layer: 'TrueDivide'"). Rescaling is a proper registered Keras
    # layer that does the exact same math (x/127.5 - 1.0) but saves/loads cleanly.
    x = layers.Rescaling(1./127.5, offset=-1.0)(x)
    x = base(x, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dense(128, activation='relu')(x)
    x = layers.Dropout(0.4)(x)
    outputs = layers.Dense(len(class_names), activation='softmax')(x)
    model = tf.keras.Model(inputs, outputs)

    model.compile(optimizer=tf.keras.optimizers.Adam(1e-3),
                  loss='categorical_crossentropy', metrics=['accuracy'])

    callbacks = [
        tf.keras.callbacks.EarlyStopping(monitor='val_accuracy', patience=8, restore_best_weights=True),
        tf.keras.callbacks.ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=4),
    ]

    history = model.fit(train_ds, validation_data=val_ds, epochs=EPOCHS, callbacks=callbacks)

    val_loss, val_acc = model.evaluate(val_ds)
    print(f"\nFinal validation accuracy: {val_acc*100:.2f}%  (val loss: {val_loss:.3f})")
    print("NOTE: with only 120 images this accuracy will have high variance run-to-run.")
    print("      Add more images per class (Kaggle 'Paddy Doctor' dataset recommended) for")
    print("      a more robust, production-grade model.")

    model.save(MODEL_PATH)
    json.dump(class_names, open(CLASS_PATH, 'w'))
    print(f"\nModel saved to {MODEL_PATH}")
    print(f"Classes saved to {CLASS_PATH}: {class_names}")

if __name__ == '__main__':
    train()
