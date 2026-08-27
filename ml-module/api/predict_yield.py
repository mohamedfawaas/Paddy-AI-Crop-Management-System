import os
import joblib
import numpy as np
from fastapi import APIRouter, HTTPException
from api.schemas import YieldRequest, YieldResponse

router = APIRouter()
BASE = os.path.join(os.path.dirname(__file__), '..', 'models')
_model = _seed_enc = _irr_enc = _dis_enc = _soil_enc = _trend = None

# Maturity days by seed variety (kept in sync with models/train_yield.py::SEED_MATURITY)
SEED_MATURITY = {'BG 352': 105, 'BG 358': 108, 'BG 359': 115, 'AT 362': 100, 'Traditional': 135}

# Theoretical max attainable yield for Sri Lankan paddy under ideal conditions (kg/acre) — used for efficiency score
MAX_ATTAINABLE_KG_ACRE = 2600.0

def _load():
    global _model, _seed_enc, _irr_enc, _dis_enc, _soil_enc, _trend
    mp = os.path.join(BASE, 'yield_model.pkl')
    if not os.path.exists(mp):
        raise HTTPException(503, "Run: python models/train_yield.py first")
    _model    = joblib.load(mp)
    _seed_enc = joblib.load(os.path.join(BASE, 'yield_seed_encoder.pkl'))
    _irr_enc  = joblib.load(os.path.join(BASE, 'yield_irrigation_encoder.pkl'))
    _dis_enc  = joblib.load(os.path.join(BASE, 'yield_disease_encoder.pkl'))
    _soil_enc = joblib.load(os.path.join(BASE, 'yield_soil_encoder.pkl'))
    _trend    = joblib.load(os.path.join(BASE, 'yield_baseline_trend.pkl'))

@router.post("/yield", response_model=YieldResponse)
def predict_yield(req: YieldRequest):
    global _model, _seed_enc, _irr_enc, _dis_enc, _soil_enc, _trend
    if _model is None:
        _load()

    def enc(encoder, value, field, fallback):
        try:
            return encoder.transform([value])[0]
        except ValueError:
            raise HTTPException(400, f"Unknown {field} '{value}'. Use one of: {list(encoder.classes_)}")

    seed_e = enc(_seed_enc, req.seed_variety, 'seed_variety', None)
    irr_e  = enc(_irr_enc, req.irrigation_type, 'irrigation_type', None)
    dis_e  = enc(_dis_enc, req.disease_status, 'disease_status', None)
    soil_e = enc(_soil_enc, req.soil_quality, 'soil_quality', None)

    import datetime
    current_year = datetime.date.today().year
    baseline_kg_ha = float(_trend.predict([[current_year]])[0])

    features = np.array([[req.fertilizer_kg_acre, req.rainfall_mm, req.temperature, baseline_kg_ha,
                           seed_e, irr_e, dis_e, soil_e]])
    pred_kg_acre = float(_model.predict(features)[0])

    # confidence proxy: agreement across the forest's trees (lower std = more confident)
    tree_preds = np.array([t.predict(features)[0] for t in _model.estimators_])
    spread = float(np.std(tree_preds))
    confidence = max(40.0, min(95.0, 95.0 - spread / 5))

    efficiency = round(min(100.0, (pred_kg_acre / MAX_ATTAINABLE_KG_ACRE) * 100), 1)
    maturity_days = SEED_MATURITY.get(req.seed_variety, 110)

    notes = (f"Baseline regional yield for the current season (trend-fitted on real FAO Sri Lanka "
             f"paddy data) is ~{baseline_kg_ha:.0f} kg/ha. Your inputs adjust this based on "
             f"fertilizer, irrigation, disease and soil conditions.")

    return YieldResponse(
        estimated_yield_kg_acre=round(pred_kg_acre, 1),
        expected_harvest_days=maturity_days,
        production_efficiency_score=efficiency,
        baseline_yield_kg_ha=round(baseline_kg_ha, 1),
        notes=notes,
        low_confidence=confidence < 60.0,
    )
