"""
Train Random Forest for paddy suitability prediction.
Run: python models/train_suitability.py
"""
import os
import pandas as pd
import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import accuracy_score, classification_report

DATA_PATH   = os.path.join(os.path.dirname(__file__), '..', 'data', 'soil_data.csv')
MODEL_PATH  = os.path.join(os.path.dirname(__file__), '..', 'models', 'suitability_model.pkl')
SCALER_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', 'suitability_scaler.pkl')
ENC_PATH    = os.path.join(os.path.dirname(__file__), '..', 'models', 'soil_encoder.pkl')

def generate_sample():
    print("Generating synthetic data...")
    np.random.seed(42)
    n = 500
    soil = np.random.choice(['clay', 'loam', 'sandy'], n)
    temp = np.random.uniform(20, 38, n)
    rain = np.random.uniform(80, 350, n)
    ph   = np.random.uniform(4.5, 8.5, n)
    hum  = np.random.uniform(40, 95, n)
    suit = ((temp>=22)&(temp<=32)&(rain>=150)&(ph>=5.5)&(ph<=7.5)).astype(int)
    df = pd.DataFrame({'soil_type':soil,'temperature':temp,'rainfall':rain,'ph':ph,'humidity':hum,'suitable':suit})
    os.makedirs(os.path.dirname(DATA_PATH), exist_ok=True)
    df.to_csv(DATA_PATH, index=False)
    print(f"Saved {n} rows to {DATA_PATH}")
    return df

def train():
    df = pd.read_csv(DATA_PATH) if os.path.exists(DATA_PATH) else generate_sample()
    print(f"Loaded {len(df)} rows")
    le = LabelEncoder()
    df['soil_enc'] = le.fit_transform(df['soil_type'])
    X = df[['temperature','rainfall','ph','humidity','soil_enc']]
    y = df['suitable']
    scaler = StandardScaler()
    Xs = scaler.fit_transform(X)
    Xtr, Xte, ytr, yte = train_test_split(Xs, y, test_size=0.2, random_state=42)
    model = RandomForestClassifier(n_estimators=200, max_depth=10, random_state=42, n_jobs=-1)
    model.fit(Xtr, ytr)
    print(f"Accuracy: {accuracy_score(yte, model.predict(Xte))*100:.2f}%")
    print(classification_report(yte, model.predict(Xte), target_names=['Not Suitable','Suitable']))
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(model,  MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)
    joblib.dump(le,     ENC_PATH)
    print(f"Model saved to {MODEL_PATH}")

if __name__ == '__main__':
    train()
