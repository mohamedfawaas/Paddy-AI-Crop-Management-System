#!/bin/bash
set -e
cd "$(dirname "$0")"
echo "============================================"
echo "  🌾 Paddy AI — ML Server Startup"
echo "============================================"
echo ""
echo "📦 Installing dependencies..."
pip install -r requirements.txt --quiet
echo "  ✅ Done"
echo ""
echo "🤖 Checking / Training ML models..."
mkdir -p models data
if [ ! -f "models/suitability_model.pkl" ]; then
    echo "  → Training Suitability model..."
    python models/train_suitability.py && echo "  ✅ Suitability done"
else echo "  ✅ Suitability model exists"; fi
if [ ! -f "models/irrigation_model.pkl" ]; then
    echo "  → Training Irrigation model..."
    python models/train_irrigation.py && echo "  ✅ Irrigation done"
else echo "  ✅ Irrigation model exists"; fi
if [ ! -f "models/disease_model.h5" ]; then
    echo "  → Creating Disease demo model (TensorFlow CNN)..."
    python models/train_disease_cnn.py && echo "  ✅ Disease demo model ready"
else echo "  ✅ Disease model exists"; fi
echo ""
echo "============================================"
echo "🚀 Starting FastAPI server on port 8000..."
echo "   Docs: http://localhost:8000/docs"
echo "============================================"
python -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
