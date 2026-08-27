"""Paddy AI - 5 focused Python unit tests.

These tests exercise the decision logic of five ML/advisory modules WITHOUT
starting the FastAPI server and WITHOUT depending on the trained .pkl files.
External ML objects are replaced by small deterministic fakes, so each test is
fast, repeatable and genuinely isolated as a unit test.

Run from the project's ml-module directory:
    python -m pytest tests/test_paddy_ai_unit.py -v
"""

import numpy as np

from api.schemas import (
    SuitabilityRequest,
    IrrigationRequest,
    FertilizerRequest,
    YieldRequest,
    PestRequest,
)

import api.predict_suitability as suitability_module
import api.predict_irrigation as irrigation_module
import api.predict_fertilizer as fertilizer_module
import api.predict_yield as yield_module
import api.predict_pest as pest_module


class IdentityScaler:
    """Returns numeric input unchanged."""
    def transform(self, values):
        return np.asarray(values)


class SimpleEncoder:
    """Small deterministic label encoder used by the tests."""
    def __init__(self, mapping):
        self.mapping = mapping
        self.classes_ = np.array(list(mapping.keys()))

    def transform(self, values):
        result = []
        for value in values:
            if value not in self.mapping:
                raise ValueError(f"Unknown value: {value}")
            result.append(self.mapping[value])
        return np.asarray(result)


# ---------------------------------------------------------------------------
# UT01 - Land Suitability
# ---------------------------------------------------------------------------
def test_ut01_suitability_returns_suitable_for_positive_model_prediction(monkeypatch):
    class FakeSuitabilityModel:
        def predict(self, features):
            return np.array([1])

        def predict_proba(self, features):
            return np.array([[0.04, 0.96]])

    monkeypatch.setattr(suitability_module, "_model", FakeSuitabilityModel())
    monkeypatch.setattr(suitability_module, "_scaler", IdentityScaler())
    monkeypatch.setattr(
        suitability_module,
        "_encoder",
        SimpleEncoder({"clay": 0, "loam": 1, "sandy": 2}),
    )

    request = SuitabilityRequest(
        temperature=28,
        rainfall=200,
        ph=6.5,
        soil_type="Loam",
        humidity=75,
    )

    result = suitability_module.predict_suitability(request)

    assert result.suitable is True
    assert result.confidence == 96.0
    assert result.risk_level == "Low"
    assert result.soil_type == "Loam"
    assert "suitable" in result.recommendation.lower()


# ---------------------------------------------------------------------------
# UT02 - Irrigation
# ---------------------------------------------------------------------------
def test_ut02_irrigation_marks_critically_low_moisture_as_urgent(monkeypatch):
    class FakeIrrigationModel:
        def predict(self, features):
            return np.array([1])

        def predict_proba(self, features):
            return np.array([[0.08, 0.92]])

    monkeypatch.setattr(irrigation_module, "_model", FakeIrrigationModel())
    monkeypatch.setattr(irrigation_module, "_scaler", IdentityScaler())
    monkeypatch.setattr(
        irrigation_module,
        "_le",
        SimpleEncoder({"seedling": 0, "vegetative": 1, "flowering": 2, "ripening": 3}),
    )

    request = IrrigationRequest(
        temperature=31,
        humidity=70,
        rainfall=5,
        soil_moisture=20,
        crop_stage="flowering",
    )

    result = irrigation_module.predict_irrigation(request)

    assert result.irrigation_needed is True
    assert result.urgency == "Urgent"
    assert result.recommended_water_mm > 0
    assert result.next_check_days == 1
    assert "critically low" in result.reason.lower()


# ---------------------------------------------------------------------------
# UT03 - Fertilizer Recommendation
# ---------------------------------------------------------------------------
def test_ut03_fertilizer_returns_urea_with_expected_quantity_and_schedule(monkeypatch):
    class FakeFertilizerModel:
        def predict_proba(self, features):
            # Class index 0 wins with 90% confidence.
            return np.array([[0.90, 0.10]])

    class FakeFertilizerNameEncoder:
        def inverse_transform(self, indexes):
            return np.array(["Urea" for _ in indexes])

    monkeypatch.setattr(fertilizer_module, "_model", FakeFertilizerModel())
    monkeypatch.setattr(
        fertilizer_module,
        "_soil_enc",
        SimpleEncoder({"Clayey": 0, "Sandy": 1, "Loamy": 2}),
    )
    monkeypatch.setattr(
        fertilizer_module,
        "_crop_enc",
        SimpleEncoder({"Paddy": 0}),
    )
    monkeypatch.setattr(fertilizer_module, "_fert_enc", FakeFertilizerNameEncoder())

    request = FertilizerRequest(
        temperature=29,
        humidity=78,
        moisture=45,
        soil_type="Clayey",
        crop_type="Paddy",
        nitrogen=20,
        potassium=30,
        phosphorous=25,
    )

    result = fertilizer_module.predict_fertilizer(request)

    assert result.fertilizer_name == "Urea"
    assert result.confidence == 90.0
    assert result.quantity_kg_per_acre == 45
    assert "3 split doses" in result.application_schedule
    assert result.organic_alternative != ""


# ---------------------------------------------------------------------------
# UT04 - Yield Prediction
# ---------------------------------------------------------------------------
def test_ut04_yield_returns_expected_yield_and_bg358_maturity(monkeypatch):
    class FakeTree:
        def __init__(self, value):
            self.value = value

        def predict(self, features):
            return np.array([self.value])

    class FakeYieldModel:
        estimators_ = [FakeTree(2180), FakeTree(2200), FakeTree(2220)]

        def predict(self, features):
            return np.array([2200.0])

    class FakeTrend:
        def predict(self, features):
            return np.array([4500.0])

    monkeypatch.setattr(yield_module, "_model", FakeYieldModel())
    monkeypatch.setattr(yield_module, "_seed_enc", SimpleEncoder({"BG 358": 0}))
    monkeypatch.setattr(yield_module, "_irr_enc", SimpleEncoder({"Flood": 0}))
    monkeypatch.setattr(yield_module, "_dis_enc", SimpleEncoder({"None": 0}))
    monkeypatch.setattr(yield_module, "_soil_enc", SimpleEncoder({"Good": 0}))
    monkeypatch.setattr(yield_module, "_trend", FakeTrend())

    request = YieldRequest(
        fertilizer_kg_acre=45,
        rainfall_mm=200,
        temperature=28,
        seed_variety="BG 358",
        irrigation_type="Flood",
        disease_status="None",
        soil_quality="Good",
    )

    result = yield_module.predict_yield(request)

    assert result.estimated_yield_kg_acre == 2200.0
    assert result.expected_harvest_days == 108
    assert result.production_efficiency_score == 84.6
    assert result.baseline_yield_kg_ha == 4500.0
    assert result.low_confidence is False


# ---------------------------------------------------------------------------
# UT05 - Pest Risk
# ---------------------------------------------------------------------------
def test_ut05_pest_high_risk_returns_rice_bug_guidance(monkeypatch):
    class FakeRiskModel:
        def predict_proba(self, features):
            return np.array([[0.05, 0.90, 0.05]])

    class FakePestModel:
        def predict_proba(self, features):
            return np.array([[0.10, 0.10, 0.10, 0.70]])

    class FakeRiskEncoder:
        def inverse_transform(self, indexes):
            return np.array(["High" for _ in indexes])

    class FakePestEncoder:
        def inverse_transform(self, indexes):
            return np.array(["Rice Bug" for _ in indexes])

    monkeypatch.setattr(
        pest_module,
        "_models",
        {"risk_model": FakeRiskModel(), "pest_model": FakePestModel()},
    )
    monkeypatch.setattr(
        pest_module,
        "_stage_enc",
        SimpleEncoder({"Seedling": 0, "Vegetative": 1, "Flowering": 2, "Ripening": 3}),
    )
    monkeypatch.setattr(pest_module, "_risk_enc", FakeRiskEncoder())
    monkeypatch.setattr(pest_module, "_pest_enc", FakePestEncoder())

    request = PestRequest(
        temperature=31,
        humidity=88,
        rainfall_7d_mm=120,
        growth_stage="Flowering",
    )

    result = pest_module.predict_pest(request)

    assert result.risk_level == "High"
    assert result.risk_score == 90.0
    assert result.likely_pest == "Rice Bug"
    assert len(result.prevention) > 0
    assert "Malathion" in result.recommended_pesticide
    assert "Neem" in result.organic_option
