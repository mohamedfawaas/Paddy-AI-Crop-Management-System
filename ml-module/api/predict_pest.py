import os
import joblib
import numpy as np
from fastapi import APIRouter, HTTPException
from api.schemas import PestRequest, PestResponse

router = APIRouter()
BASE = os.path.join(os.path.dirname(__file__), '..', 'models')
_models = _stage_enc = _pest_enc = _risk_enc = None

PREVENTION = {
    'Brown Planthopper': [
        'Avoid excess nitrogen fertilizer — it favors BPH breeding',
        'Maintain alternate wetting-and-drying instead of continuous flooding',
        'Use resistant varieties (e.g. BG 379-2) where available',
        'Conserve natural enemies (spiders, mirid bugs) — avoid broad-spectrum sprays',
    ],
    'Stem Borer': [
        'Remove and destroy stubble/egg masses after harvest',
        'Synchronize planting across the area to break the pest cycle',
        'Install pheromone/light traps to monitor moth activity',
        'Avoid excess nitrogen which increases larval survival',
    ],
    'Leaf Folder': [
        'Avoid excess nitrogen and overly dense planting',
        'Drain field briefly to disturb larvae if infestation is early',
        'Encourage natural enemies; avoid unnecessary insecticide use',
    ],
    'Rice Bug': [
        'Keep field bunds clean of grassy weeds (alternate host)',
        'Synchronized planting reduces prolonged attractive flowering stage',
        'Hand-netting/collection during early morning if infestation is localized',
    ],
    'Rice Blast Risk': [
        'Avoid excess nitrogen, split doses instead of one heavy application',
        'Ensure good field drainage — avoid prolonged leaf wetness',
        'Use resistant varieties and treat seed before sowing',
    ],
}
PESTICIDE = {
    'Brown Planthopper': 'Buprofezin or Imidacloprid (as per local Dept. of Agriculture label rate) — spray at base of plants',
    'Stem Borer': 'Cartap hydrochloride or Chlorantraniliprole granules at recommended dose',
    'Leaf Folder': 'Chlorantraniliprole or Cartap hydrochloride, spray only if damage exceeds threshold',
    'Rice Bug': 'Malathion or Fenitrothion spray during early morning/late evening when bugs are active',
    'Rice Blast Risk': 'Tricyclazole or Isoprothiolane fungicide, applied preventively before heading',
}
ORGANIC = {
    'Brown Planthopper': 'Neem oil spray (3-5%) + conserve spiders/mirid bug predators',
    'Stem Borer': 'Release Trichogramma egg parasitoids; neem seed kernel extract spray',
    'Leaf Folder': 'Neem oil spray; encourage parasitic wasps',
    'Rice Bug': 'Neem-based repellent spray + light traps for adults',
    'Rice Blast Risk': 'Pseudomonas fluorescens bio-fungicide seed/foliar treatment',
}

def _load():
    global _models, _stage_enc, _pest_enc, _risk_enc
    mp = os.path.join(BASE, 'pest_model.pkl')
    if not os.path.exists(mp):
        raise HTTPException(503, "Run: python models/train_pest.py first")
    _models    = joblib.load(mp)
    _stage_enc = joblib.load(os.path.join(BASE, 'pest_stage_encoder.pkl'))
    _pest_enc  = joblib.load(os.path.join(BASE, 'pest_name_encoder.pkl'))
    _risk_enc  = joblib.load(os.path.join(BASE, 'pest_risk_encoder.pkl'))

@router.post("/pest", response_model=PestResponse)
def predict_pest(req: PestRequest):
    global _models, _stage_enc, _pest_enc, _risk_enc
    if _models is None:
        _load()
    try:
        stage_enc = _stage_enc.transform([req.growth_stage])[0]
    except ValueError:
        raise HTTPException(400, f"Unknown growth_stage. Use one of: {list(_stage_enc.classes_)}")

    features = np.array([[req.temperature, req.humidity, req.rainfall_7d_mm, stage_enc]])

    risk_model = _models['risk_model']
    pest_model = _models['pest_model']

    risk_probs = risk_model.predict_proba(features)[0]
    risk_idx = int(np.argmax(risk_probs))
    risk_level = _risk_enc.inverse_transform([risk_idx])[0]
    risk_confidence = float(risk_probs[risk_idx])

    pest_probs = pest_model.predict_proba(features)[0]
    pest_idx = int(np.argmax(pest_probs))
    pest_name = _pest_enc.inverse_transform([pest_idx])[0]

    return PestResponse(
        risk_level=risk_level,
        risk_score=round(risk_confidence * 100, 1),
        likely_pest=pest_name,
        prevention=PREVENTION.get(pest_name, ['Monitor field regularly', 'Consult local agriculture officer']),
        recommended_pesticide=PESTICIDE.get(pest_name, 'Consult local agriculture extension officer'),
        organic_option=ORGANIC.get(pest_name, 'Neem-based bio-pesticide'),
        low_confidence=risk_confidence < 0.55,
    )
