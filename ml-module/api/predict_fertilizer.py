import os
import joblib
import numpy as np
from fastapi import APIRouter, HTTPException
from api.schemas import FertilizerRequest, FertilizerResponse

router = APIRouter()
BASE = os.path.join(os.path.dirname(__file__), '..', 'models')
_model = _soil_enc = _crop_enc = _fert_enc = None

# Typical application rate per acre for a full season (kg) — DOA Sri Lanka extension guidance
QUANTITY_TABLE = {
    'Urea': 45, 'DAP': 25, '14-35-14': 30, '10-26-26': 30, '28-28': 22, '20-20': 35, '17-17-17': 32,
}
ORGANIC_ALT = {
    'Urea': 'Compost / well-rotted farmyard manure + green manure (Gliricidia, Azolla) for slow-release N',
    'DAP': 'Rock phosphate + bone meal, combined with compost',
    '14-35-14': 'Bone meal + wood ash (K source) + compost blend',
    '10-26-26': 'Rock phosphate + wood ash + compost blend',
    '28-28': 'Compost enriched with bone meal',
    '20-20': 'Compost + rock phosphate mix',
    '17-17-17': 'Balanced compost + Azolla + wood ash mix',
}

def _load():
    global _model, _soil_enc, _crop_enc, _fert_enc
    mp = os.path.join(BASE, 'fertilizer_model.pkl')
    if not os.path.exists(mp):
        raise HTTPException(503, "Run: python models/train_fertilizer.py first")
    _model    = joblib.load(mp)
    _soil_enc = joblib.load(os.path.join(BASE, 'fert_soil_encoder.pkl'))
    _crop_enc = joblib.load(os.path.join(BASE, 'fert_crop_encoder.pkl'))
    _fert_enc = joblib.load(os.path.join(BASE, 'fert_name_encoder.pkl'))

@router.post("/fertilizer", response_model=FertilizerResponse)
def predict_fertilizer(req: FertilizerRequest):
    global _model, _soil_enc, _crop_enc, _fert_enc
    if _model is None:
        _load()
    try:
        soil_enc = _soil_enc.transform([req.soil_type])[0]
    except ValueError:
        raise HTTPException(400, f"Unknown soil_type. Use one of: {list(_soil_enc.classes_)}")
    try:
        crop_enc = _crop_enc.transform([req.crop_type])[0]
    except ValueError:
        crop_enc = _crop_enc.transform(['Paddy'])[0]  # default to Paddy if unseen crop label

    features = np.array([[req.temperature, req.humidity, req.moisture, soil_enc, crop_enc,
                           req.nitrogen, req.potassium, req.phosphorous]])
    probs = _model.predict_proba(features)[0]
    idx = int(np.argmax(probs))
    fert_name = _fert_enc.inverse_transform([idx])[0]
    confidence = round(float(probs[idx]) * 100, 2)

    schedule = ("Apply in 2 split doses: 50% as basal dose at transplanting/sowing, "
                "50% top-dressed at active tillering stage (~25-30 days after planting).")
    if fert_name == 'Urea':
        schedule = ("Apply in 3 split doses: 1/3 basal, 1/3 at tillering (~25 DAS), "
                     "1/3 at panicle initiation (~45-50 DAS) to reduce nitrogen loss.")

    return FertilizerResponse(
        fertilizer_name=fert_name,
        confidence=confidence,
        quantity_kg_per_acre=QUANTITY_TABLE.get(fert_name, 30),
        application_schedule=schedule,
        organic_alternative=ORGANIC_ALT.get(fert_name, 'Compost + green manure blend'),
        low_confidence=confidence < 60.0,
    )
