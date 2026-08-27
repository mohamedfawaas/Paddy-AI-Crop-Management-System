"""
Train Random Forest for paddy pest risk prediction.

Data source note (read before your viva):
  No clean public dataset exists that maps weather + growth stage to
  rice pest occurrence with per-row labels (published studies use
  proprietary light-trap survey data from research institutes, e.g.
  PhilRice / BRRI, that is not redistributable). This module instead
  encodes the WEATHER THRESHOLDS reported in published rice-pest
  research into a rule base, then trains a classifier on data
  generated from that rule base (+ noise) so the served model is a
  genuine trained ML classifier rather than a hand-coded if/else:

    - Brown Planthopper (BPH): thrives at high humidity (>80%),
      warm temps (25-30C), still/stagnant water, dense N-fertilized
      crop in vegetative-reproductive stage.
    - Stem Borer: warm humid conditions, most damaging at
      vegetative/tillering and reproductive stage.
    - Leaf Folder: high humidity + high nitrogen/lush canopy,
      vegetative stage.
    - Rice Bug (Gundhi Bug): active during flowering/grain-filling
      stage, warm conditions, near ripening fields.
    - Rice Blast risk rises with high humidity + moderate temp +
      free leaf moisture (cool nights / heavy dew) - included as a
      secondary "disease-like" risk signal.

Run: python models/train_pest.py
"""
import os
import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report

DATA_OUT      = os.path.join(os.path.dirname(__file__), '..', 'data', 'pest_data.csv')
MODEL_PATH    = os.path.join(os.path.dirname(__file__), '..', 'models', 'pest_model.pkl')
STAGE_ENC_PATH= os.path.join(os.path.dirname(__file__), '..', 'models', 'pest_stage_encoder.pkl')
PEST_ENC_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', 'pest_name_encoder.pkl')
RISK_ENC_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', 'pest_risk_encoder.pkl')

GROWTH_STAGES = ['Seedling', 'Vegetative', 'Tillering', 'Flowering', 'Ripening']

def score_pest(temp, hum, rain_7d, stage):
    """Returns (pest_name, risk_score 0-1) — the dominant risk driver for this row."""
    scores = {}
    # Brown Planthopper
    scores['Brown Planthopper'] = (
        (hum > 80) * 0.4 + (25 <= temp <= 30) * 0.3 +
        (stage in ['Vegetative', 'Tillering', 'Flowering']) * 0.2 + (rain_7d < 40) * 0.1
    )
    # Stem Borer
    scores['Stem Borer'] = (
        (hum > 70) * 0.3 + (26 <= temp <= 32) * 0.3 +
        (stage in ['Vegetative', 'Tillering']) * 0.3 + (rain_7d > 20) * 0.1
    )
    # Leaf Folder
    scores['Leaf Folder'] = (
        (hum > 75) * 0.35 + (stage in ['Vegetative', 'Tillering']) * 0.35 +
        (24 <= temp <= 30) * 0.3
    )
    # Rice Bug
    scores['Rice Bug'] = (
        (stage in ['Flowering', 'Ripening']) * 0.5 + (temp >= 27) * 0.25 + (hum > 65) * 0.25
    )
    # Rice Blast (weather-driven disease pressure, included as pest-risk-adjacent signal)
    scores['Rice Blast Risk'] = (
        (hum > 85) * 0.45 + (20 <= temp <= 28) * 0.35 + (rain_7d > 30) * 0.2
    )
    best = max(scores, key=scores.get)
    return best, scores[best]

def generate_dataset(n=4000, seed=42):
    rng = np.random.default_rng(seed)
    temp    = rng.uniform(18, 38, n)
    hum     = rng.uniform(30, 100, n)
    rain_7d = rng.uniform(0, 120, n)
    stage   = rng.choice(GROWTH_STAGES, n)

    pests, risk_levels, risk_scores = [], [], []
    for t, h, r, s in zip(temp, hum, rain_7d, stage):
        pest, score = score_pest(t, h, r, s)
        score = float(np.clip(score + rng.normal(0, 0.05), 0, 1))
        level = 'High' if score >= 0.68 else ('Medium' if score >= 0.42 else 'Low')
        pests.append(pest); risk_levels.append(level); risk_scores.append(round(score, 3))

    df = pd.DataFrame({
        'temperature': temp.round(1), 'humidity': hum.round(1), 'rainfall_7d_mm': rain_7d.round(1),
        'growth_stage': stage, 'likely_pest': pests, 'risk_score': risk_scores, 'risk_level': risk_levels,
    })
    return df

def train():
    df = generate_dataset()
    os.makedirs(os.path.dirname(DATA_OUT), exist_ok=True)
    df.to_csv(DATA_OUT, index=False)
    print(f"Generated {len(df)} rows -> {DATA_OUT}")
    print(df['risk_level'].value_counts())
    print(df['likely_pest'].value_counts())

    stage_le = LabelEncoder(); pest_le = LabelEncoder(); risk_le = LabelEncoder()
    df['stage_enc'] = stage_le.fit_transform(df['growth_stage'])
    df['pest_enc']  = pest_le.fit_transform(df['likely_pest'])
    df['risk_enc']  = risk_le.fit_transform(df['risk_level'])

    FEATURES = ['temperature', 'humidity', 'rainfall_7d_mm', 'stage_enc']

    # Model A: predicts the likely pest
    Xtr, Xte, ytr, yte = train_test_split(df[FEATURES], df['pest_enc'], test_size=0.2, random_state=42, stratify=df['pest_enc'])
    pest_model = RandomForestClassifier(n_estimators=120, max_depth=9, random_state=42, n_jobs=-1)
    pest_model.fit(Xtr, ytr)
    print(f"\nPest-type accuracy: {accuracy_score(yte, pest_model.predict(Xte))*100:.2f}%")

    # Model B: predicts risk level (Low/Medium/High) — this is what we ship as pest_model.pkl
    Xtr2, Xte2, ytr2, yte2 = train_test_split(df[FEATURES], df['risk_enc'], test_size=0.2, random_state=42, stratify=df['risk_enc'])
    risk_model = RandomForestClassifier(n_estimators=120, max_depth=9, random_state=42, n_jobs=-1)
    risk_model.fit(Xtr2, ytr2)
    print(f"Risk-level accuracy: {accuracy_score(yte2, risk_model.predict(Xte2))*100:.2f}%")
    print(classification_report(yte2, risk_model.predict(Xte2), target_names=risk_le.classes_, zero_division=0))

    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump({'risk_model': risk_model, 'pest_model': pest_model}, MODEL_PATH, compress=3)
    joblib.dump(stage_le, STAGE_ENC_PATH)
    joblib.dump(pest_le,  PEST_ENC_PATH)
    joblib.dump(risk_le,  RISK_ENC_PATH)
    print(f"Model saved to {MODEL_PATH}")

if __name__ == '__main__':
    train()
