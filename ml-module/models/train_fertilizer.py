"""
Train Random Forest for fertilizer recommendation.
Dataset: Kaggle "Fertilizer Prediction" dataset (data/fertilizer_data.csv)
Run: python models/train_fertilizer.py
"""
import os
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report

DATA_PATH     = os.path.join(os.path.dirname(__file__), '..', 'data', 'fertilizer_data.csv')
MODEL_PATH    = os.path.join(os.path.dirname(__file__), '..', 'models', 'fertilizer_model.pkl')
SOIL_ENC_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', 'fert_soil_encoder.pkl')
CROP_ENC_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', 'fert_crop_encoder.pkl')
FERT_ENC_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', 'fert_name_encoder.pkl')

FEATURES = ['Temperature', 'Humidity', 'Moisture', 'soil_enc', 'crop_enc', 'Nitrogen', 'Potassium', 'Phosphorous']

def train():
    df = pd.read_csv(DATA_PATH)
    print(f"Loaded {len(df)} rows from Kaggle Fertilizer Prediction dataset")

    soil_le = LabelEncoder()
    crop_le = LabelEncoder()
    fert_le = LabelEncoder()
    df['soil_enc'] = soil_le.fit_transform(df['Soil Type'])
    df['crop_enc'] = crop_le.fit_transform(df['Crop Type'])
    df['fert_enc'] = fert_le.fit_transform(df['Fertilizer Name'])

    X = df[FEATURES]
    y = df['fert_enc']

    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    model = RandomForestClassifier(n_estimators=300, max_depth=12, random_state=42, n_jobs=-1)
    model.fit(Xtr, ytr)

    acc = accuracy_score(yte, model.predict(Xte))
    print(f"Accuracy: {acc*100:.2f}%")
    print(classification_report(yte, model.predict(Xte), target_names=fert_le.classes_, zero_division=0))

    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(model, MODEL_PATH, compress=3)
    joblib.dump(soil_le, SOIL_ENC_PATH)
    joblib.dump(crop_le, CROP_ENC_PATH)
    joblib.dump(fert_le, FERT_ENC_PATH)
    print(f"Model saved to {MODEL_PATH}")
    print("Soil types:", list(soil_le.classes_))
    print("Crop types:", list(crop_le.classes_))
    print("Fertilizers:", list(fert_le.classes_))

if __name__ == '__main__':
    train()
