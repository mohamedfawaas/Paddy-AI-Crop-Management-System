"""
Weather-Based Farming Advisory — rule-based (no ML training needed).
Combines temperature, humidity, rainfall forecast and growth stage into
practical advisory text, following DOA Sri Lanka extension guidance.
"""
from fastapi import APIRouter
from api.schemas import WeatherRequest, WeatherResponse

router = APIRouter()

STAGE_ADVICE = {
    'Land Preparation': "Best planting window is when soil moisture is adequate but not waterlogged — plough 2-3 weeks ahead of sowing.",
    'Seedling':          "Keep a thin water film (2-3cm); avoid deep flooding which can damage young seedlings.",
    'Vegetative':        "Maintain 5cm water depth; this is the key window for basal + first top-dress fertilizer application.",
    'Tillering':         "Apply top-dress nitrogen now if not already done; maintain consistent shallow flooding to encourage tillering.",
    'Flowering':         "Avoid water stress at all costs — this is the most drought-sensitive stage; ensure continuous water supply.",
    'Ripening':          "Begin draining the field 7-10 days before expected harvest to firm up the soil for harvesting machinery.",
}

def _fertilizer_timing(stage, rainfall):
    if rainfall > 40:
        return "Delay fertilizer application — heavy rain forecast will wash away nutrients. Wait until rainfall subsides."
    return STAGE_ADVICE.get(stage, "Follow standard split-dose fertilizer schedule for your seed variety.")

def _irrigation_timing(rainfall, temp):
    if rainfall > 30:
        return "No irrigation needed — sufficient rainfall expected this week."
    if temp > 32:
        return "Irrigate in early morning or evening to reduce evaporation loss; high temperatures increase water demand."
    return "Monitor soil moisture; irrigate if the top 5cm of soil begins to dry out."

def _harvest_planning(stage):
    if stage == 'Ripening':
        return "Harvest when 80-85% of grains have turned golden yellow. Avoid harvesting immediately after rain."
    return "Plan harvest logistics (labour, machinery) 2-3 weeks ahead of the expected ripening date."

@router.post("/weather-advisory", response_model=WeatherResponse)
def weather_advisory(req: WeatherRequest):
    alerts = []
    if req.rainfall_forecast_mm > 75:
        alerts.append("🌧️ Heavy rainfall alert — risk of flooding. Check field drainage and bunds.")
    if req.temperature > 35:
        alerts.append("🌡️ Heat stress warning — high temperatures may affect flowering and grain filling.")
    if req.humidity > 85 and req.temperature < 28:
        alerts.append("🍃 High humidity + cool conditions — elevated risk of fungal disease (blast/blight). Monitor closely.")
    if req.rainfall_forecast_mm < 5 and req.temperature > 30:
        alerts.append("☀️ Dry spell warning — increase irrigation frequency to prevent water stress.")

    return WeatherResponse(
        best_planting_advice=STAGE_ADVICE.get(req.growth_stage, "Follow the recommended cultivation calendar for your region."),
        fertilizer_timing=_fertilizer_timing(req.growth_stage, req.rainfall_forecast_mm),
        irrigation_timing=_irrigation_timing(req.rainfall_forecast_mm, req.temperature),
        harvest_planning=_harvest_planning(req.growth_stage),
        alerts=alerts or ["✅ No weather alerts — conditions are within normal range."],
    )
