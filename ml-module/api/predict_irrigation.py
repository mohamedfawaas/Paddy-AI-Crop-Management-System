import os
import joblib
import numpy as np
from fastapi import APIRouter, HTTPException
from api.schemas import IrrigationRequest, IrrigationResponse

router = APIRouter()
BASE   = os.path.join(os.path.dirname(__file__), '..', 'models')
_model = _scaler = _le = None

STAGE_WATER = {"seedling": 25.0, "vegetative": 40.0, "flowering": 50.0, "ripening": 20.0}

def _load():
    global _model, _scaler, _le
    mp = os.path.join(BASE, 'irrigation_model.pkl')
    if not os.path.exists(mp):
        raise HTTPException(503, "Run: python models/train_irrigation.py first")
    _model  = joblib.load(mp)
    _scaler = joblib.load(os.path.join(BASE, 'irrigation_scaler.pkl'))
    _le     = joblib.load(os.path.join(BASE, 'stage_encoder.pkl'))

@router.post("/irrigation", response_model=IrrigationResponse)
def predict_irrigation(req: IrrigationRequest):
    global _model, _scaler, _le
    if _model is None:
        _load()
    try:
        stage_enc = _le.transform([req.crop_stage.lower()])[0]
    except ValueError:
        raise HTTPException(400, "Unknown crop_stage. Use: seedling, vegetative, flowering, ripening")

    fs     = _scaler.transform(np.array([[req.temperature, req.humidity,
                                          req.rainfall, req.soil_moisture, stage_enc]]))
    pred   = _model.predict(fs)[0]
    needed = bool(pred == 1)
    bw     = STAGE_WATER.get(req.crop_stage.lower(), 30.0)
    try:
        conf = float(max(_model.predict_proba(fs)[0])) * 100
    except Exception:
        conf = 100.0

    if needed:
        rw = round(bw + max(0, 60 - req.soil_moisture) * 0.5, 1)
        if req.soil_moisture < 25:
            u, n, r = "Urgent",   1, f"Critically low ({req.soil_moisture}%). Immediate irrigation needed!"
        else:
            u, n, r = "Moderate", 2, f"Below optimal ({req.soil_moisture}%). Irrigation recommended."
    else:
        rw, u, n = 0.0, "Not Required", 3
        r = f"Sufficient moisture ({req.soil_moisture}%) and rainfall ({req.rainfall}mm). No irrigation needed."

    return IrrigationResponse(irrigation_needed=needed, urgency=u,
                              recommended_water_mm=rw, next_check_days=n, reason=r,
                              low_confidence=conf < 60.0)
