from pydantic import BaseModel
from typing import Optional

class SuitabilityRequest(BaseModel):
    temperature: float
    rainfall: float
    ph: float
    soil_type: str
    humidity: float

class SuitabilityResponse(BaseModel):
    suitable: bool
    confidence: float
    recommendation: str
    soil_type: str
    risk_level: str
    low_confidence: bool = False

class DiseaseResponse(BaseModel):
    disease_name: str
    confidence: float
    severity: str
    treatment: str
    prevention: str
    low_confidence: bool = False
    heatmap_image: Optional[str] = None   # base64 PNG Grad-CAM overlay

class IrrigationRequest(BaseModel):
    temperature: float
    humidity: float
    rainfall: float
    soil_moisture: float
    crop_stage: str

class IrrigationResponse(BaseModel):
    irrigation_needed: bool
    urgency: str
    recommended_water_mm: float
    next_check_days: int
    reason: str
    low_confidence: bool = False

class FertilizerRequest(BaseModel):
    temperature: float
    humidity: float
    moisture: float
    soil_type: str
    crop_type: str = "Paddy"
    nitrogen: float
    potassium: float
    phosphorous: float

class FertilizerResponse(BaseModel):
    fertilizer_name: str
    confidence: float
    quantity_kg_per_acre: float
    application_schedule: str
    organic_alternative: str
    low_confidence: bool = False

class YieldRequest(BaseModel):
    fertilizer_kg_acre: float
    rainfall_mm: float
    temperature: float
    seed_variety: str
    irrigation_type: str
    disease_status: str
    soil_quality: str

class YieldResponse(BaseModel):
    estimated_yield_kg_acre: float
    expected_harvest_days: int
    production_efficiency_score: float
    baseline_yield_kg_ha: float
    notes: str
    low_confidence: bool = False

class PestRequest(BaseModel):
    temperature: float
    humidity: float
    rainfall_7d_mm: float
    growth_stage: str

class PestResponse(BaseModel):
    risk_level: str
    risk_score: float
    likely_pest: str
    prevention: list[str]
    recommended_pesticide: str
    organic_option: str
    low_confidence: bool = False

class WeatherRequest(BaseModel):
    temperature: float
    humidity: float
    rainfall_forecast_mm: float
    growth_stage: str

class WeatherResponse(BaseModel):
    best_planting_advice: str
    fertilizer_timing: str
    irrigation_timing: str
    harvest_planning: str
    alerts: list[str]
