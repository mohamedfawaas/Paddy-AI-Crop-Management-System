from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.predict_suitability import router as suit_router
from api.predict_disease      import router as disease_router
from api.predict_irrigation   import router as irr_router
from api.predict_fertilizer   import router as fert_router
from api.predict_yield        import router as yield_router
from api.predict_pest         import router as pest_router
from api.predict_weather      import router as weather_router

app = FastAPI(title="Paddy AI ML API", version="1.2.0")

app.add_middleware(CORSMiddleware,
    allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

app.include_router(suit_router,    prefix="/predict", tags=["Suitability"])
app.include_router(disease_router, prefix="/predict", tags=["Disease"])
app.include_router(irr_router,     prefix="/predict", tags=["Irrigation"])
app.include_router(fert_router,    prefix="/predict", tags=["Fertilizer"])
app.include_router(yield_router,   prefix="/predict", tags=["Yield"])
app.include_router(pest_router,    prefix="/predict", tags=["Pest"])
app.include_router(weather_router, prefix="/predict", tags=["Weather"])

@app.get("/")
def root():
    return {"service": "Paddy AI ML API", "status": "running",
            "endpoints": {"suitability": "/predict/suitability",
                          "disease": "/predict/disease",
                          "irrigation": "/predict/irrigation",
                          "fertilizer": "/predict/fertilizer",
                          "yield": "/predict/yield",
                          "pest": "/predict/pest",
                          "docs": "/docs"}}

@app.get("/health")
def health():
    return {"status": "ok"}
