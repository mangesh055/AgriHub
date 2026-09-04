import pytest
import sys
from pathlib import Path

# Ensure agrihub-ml is on sys.path
PROJECT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_DIR))

from fastapi.testclient import TestClient
from app.main import app
from app.config import API_KEY, API_KEY_NAME

client = TestClient(app)
AUTH_HEADERS = {API_KEY_NAME: API_KEY}

def test_health_endpoints():
    """Verify root and health endpoints for Baramati engine."""
    res_root = client.get("/")
    assert res_root.status_code == 200
    assert res_root.json()["status"] == "online"

    res_health = client.get("/health")
    assert res_health.status_code == 200
    data = res_health.json()
    assert data["artifacts_loaded"]["model_pipeline"] is True
    assert data["artifacts_loaded"]["classes_count"] == 8

def test_auth_rejection():
    """Verify that requests without valid API Key are rejected with 401."""
    payload = {
        "village": "Malegaon",
        "season": "kharif"
    }
    res_no_key = client.post("/api/v1/recommend", json=payload)
    assert res_no_key.status_code == 401

def test_scenario_1_malegaon_canal_sugarcane():
    """
    Scenario 1 — Malegaon (Nira Canal Left Bank Belt)
    Deep black vertisol, Canal/River irrigation, High water availability.
    Sugarcane (Co 86032) should rank #1 with 95% water feasibility.
    """
    payload = {
        "village": "Malegaon",
        "microzone": "canal_command",
        "soil_type": "deep_black_vertisol",
        "season": "annual",
        "farm_area_acres": 4.0,
        "irrigation_source": "canal",
        "water_availability": "high",
        "seasonal_water_reliability": "reliable",
        "irrigation_method": "drip"
    }
    res = client.post("/api/v1/recommend", json=payload, headers=AUTH_HEADERS)
    assert res.status_code == 200
    data = res.json()
    assert len(data["recommendations"]) == 3
    assert data["recommendations"][0]["crop"] == "sugarcane"
    assert data["recommendations"][0]["water_feasibility_score"] >= 0.90
    assert "Co 86032 (Nira)" in data["recommendations"][0]["kvk_varieties"]

def test_scenario_2_supa_scarcity_maldandi_jowar():
    """
    Scenario 2 — Supa / Morgaon (Baramati Rainfed Scarcity Belt)
    Shallow murrum soil, rainfed, low water.
    Maldandi Rabi Jowar and Bajra must dominate; Sugarcane must be penalized.
    """
    payload = {
        "village": "Supa",
        "microzone": "rainfed_scarcity",
        "soil_type": "shallow_murrum",
        "season": "rabi",
        "farm_area_acres": 3.0,
        "irrigation_source": "rainfed",
        "water_availability": "low",
        "seasonal_water_reliability": "unreliable",
        "irrigation_method": "rainfed"
    }
    res = client.post("/api/v1/recommend", json=payload, headers=AUTH_HEADERS)
    assert res.status_code == 200
    data = res.json()
    top_crop = data["recommendations"][0]["crop"]
    assert top_crop in ["sorghum", "bajra", "chickpea"]
    assert data["recommendations"][0]["crop"] != "sugarcane"

def test_scenario_3_shardanagar_kvk_soybean():
    """
    Scenario 3 — Shardanagar (KVK Baramati Farm Belt)
    Borewell + Drip, Kharif, Medium Clay Loam.
    Soybean (Phule Sangam) should feature at top.
    """
    payload = {
        "village": "Shardanagar",
        "microzone": "well_irrigated",
        "soil_type": "medium_clay_loam",
        "season": "kharif",
        "farm_area_acres": 3.0,
        "irrigation_source": "borewell",
        "water_availability": "medium",
        "seasonal_water_reliability": "reliable",
        "irrigation_method": "drip"
    }
    res = client.post("/api/v1/recommend", json=payload, headers=AUTH_HEADERS)
    assert res.status_code == 200
    data = res.json()
    top_crops = [r["crop"] for r in data["recommendations"]]
    assert "soybean" in top_crops

def test_scenario_4_rabi_wheat_and_gram():
    """
    Scenario 4 — Baramati Rabi Winter (Canal/Well Irrigated)
    Wheat (Phule Samadhan) and Chickpea (Phule Vikram) should dominate.
    """
    payload = {
        "village": "Pandare",
        "microzone": "canal_command",
        "soil_type": "deep_black_vertisol",
        "season": "rabi",
        "irrigation_source": "canal",
        "water_availability": "medium",
        "seasonal_water_reliability": "reliable",
        "irrigation_method": "flood",
        "previous_crop": "soybean"
    }
    res = client.post("/api/v1/recommend", json=payload, headers=AUTH_HEADERS)
    assert res.status_code == 200
    data = res.json()
    top_crops = [r["crop"] for r in data["recommendations"]]
    assert any(c in top_crops for c in ["wheat", "chickpea", "sorghum", "onion"])

def test_scenario_5_missing_soil_test_baramati():
    """
    Scenario 5 — Missing KVK Soil Test Data
    Farmer provides no N, P, K, pH. System should accurately predict based on
    Baramati village/microzone and soil type.
    """
    payload = {
        "village": "Malegaon",
        "microzone": "canal_command",
        "soil_type": "deep_black_vertisol",
        "season": "annual",
        "irrigation_source": "canal",
        "water_availability": "high",
        "seasonal_water_reliability": "reliable",
        "irrigation_method": "drip",
        "soil_test": {
            "nitrogen": None,
            "phosphorus": None,
            "potassium": None,
            "ph": None,
            "source": "unknown"
        }
    }
    res = client.post("/api/v1/recommend", json=payload, headers=AUTH_HEADERS)
    assert res.status_code == 200
    data = res.json()
    assert len(data["recommendations"]) == 3
    assert "No Lab Test Provided" in data["soil_test_status"]
