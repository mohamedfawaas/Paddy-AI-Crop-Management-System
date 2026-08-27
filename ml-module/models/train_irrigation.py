"""
Train Gradient Boosting for irrigation recommendation.
Run: python models/train_irrigation.py
"""
import os
import pandas as pd
import numpy as np
import joblib
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import accuracy_score, classification_report

DATA_PATH   = os.path.join(os.path.dirname(__file__), '..', 'data', 'weather_data.csv')
MODEL_PATH  = os.path.join(os.path.dirname(__file__), '..', 'models', 'irrigation_model.pkl')
SCALER_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', 'irrigation_scaler.pkl')
STAGE_ENC   = os.path.join(os.path.dirname(__file__), '..', 'models', 'stage_encoder.pkl')

def generate_sample():
    print("Generating synthetic data...")
    np.random.seed(0)
    n = 600
    stages = np.random.choice(['seedling','vegetative','flowering','ripening'], n)
    temp   = np.random.uniform(22, 38, n)
    hum    = np.random.uniform(30, 95, n)
    rain   = np.random.uniform(0, 100, n)
    moist  = np.random.uniform(10, 80, n)
    irr    = ((moist < 40) & (rain < 30) & (temp > 28)).astype(int)
    df = pd.DataFrame({'crop_stage':stages,'temperature':temp,'humidity':hum,'rainfall':rain,'soil_moisture':moist,'irrigation_needed':irr})
    os.makedirs(os.path.dirname(DATA_PATH), exist_ok=True)
    df.to_csv(DATA_PATH, index=False)
    print(f"Saved {n} rows to {DATA_PATH}")
    return df

def train():
    df = pd.read_csv(DATA_PATH) if os.path.exists(DATA_PATH) else generate_sample()
    print(f"Loaded {len(df)} rows")
    le = LabelEncoder()
    df['stage_enc'] = le.fit_transform(df['crop_stage'])
    X = df[['temperature','humidity','rainfall','soil_moisture','stage_enc']]
    y = df['irrigation_needed']
    scaler = StandardScaler()
    Xs = scaler.fit_transform(X)
    Xtr, Xte, ytr, yte = train_test_split(Xs, y, test_size=0.2, random_state=42)
    model = GradientBoostingClassifier(n_estimators=150, learning_rate=0.1, max_depth=5, random_state=42)
    model.fit(Xtr, ytr)
    print(f"Accuracy: {accuracy_score(yte, model.predict(Xte))*100:.2f}%")
    print(classification_report(yte, model.predict(Xte), target_names=['No Irrigation','Irrigation Needed']))
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(model,  MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)
    joblib.dump(le,     STAGE_ENC)
    print(f"Model saved to {MODEL_PATH}")

if __name__ == '__main__':
    train()
