import os
import joblib
import numpy as np
from fastapi import APIRouter, HTTPException
from api.schemas import SuitabilityRequest, SuitabilityResponse

router = APIRouter()
BASE = os.path.join(os.path.dirname(__file__), '..', 'models')
_model = _scaler = _encoder = None

def _load():
    global _model, _scaler, _encoder
    mp = os.path.join(BASE, 'suitability_model.pkl')
    if not os.path.exists(mp):
        raise HTTPException(503, "Run: python models/train_suitability.py first")
    _model   = joblib.load(mp)
    _scaler  = joblib.load(os.path.join(BASE, 'suitability_scaler.pkl'))
    _encoder = joblib.load(os.path.join(BASE, 'soil_encoder.pkl'))

@router.post("/suitability", response_model=SuitabilityResponse)
def predict_suitability(req: SuitabilityRequest):
    global _model, _scaler, _encoder
    if _model is None:
        _load()
    try:
        soil_enc = _encoder.transform([req.soil_type.lower()])[0]
    except ValueError:
        raise HTTPException(400, "Unknown soil_type. Use: clay, loam, sandy")

    features = np.array([[req.temperature, req.rainfall, req.ph, req.humidity, soil_enc]])
    fs   = _scaler.transform(features)
    pred = _model.predict(fs)[0]
    conf = round(float(max(_model.predict_proba(fs)[0])) * 100, 2)
    ok   = bool(pred == 1)

    if ok:
        rec, risk = "Land is suitable for paddy. Ensure proper leveling and irrigation.", "Low"
    else:
        risk   = "High"
        issues = []
        if not (22 <= req.temperature <= 32): issues.append(f"Temp {req.temperature}C (ideal 22-32)")
        if req.rainfall < 150:                issues.append(f"Rainfall {req.rainfall}mm (need >=150)")
        if not (5.5 <= req.ph <= 7.5):        issues.append(f"pH {req.ph} (ideal 5.5-7.5)")
        rec = "Not suitable. Issues: " + ("; ".join(issues) if issues else "conditions not optimal") + "."

    return SuitabilityResponse(suitable=ok, confidence=conf,
                               recommendation=rec, soil_type=req.soil_type, risk_level=risk,
                               low_confidence=conf < 60.0)
