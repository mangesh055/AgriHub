import os
from pathlib import Path

# Base directory paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
ARTIFACTS_DIR = BASE_DIR / "artifacts"

# API Security
API_KEY_NAME = "X-API-Key"
API_KEY = os.getenv("AGRIHUB_API_KEY", "agrihub-prod-key-2026")

# Artifact files
MODEL_PATH = ARTIFACTS_DIR / "crop_model.joblib"
REGIONAL_SCORES_PATH = ARTIFACTS_DIR / "regional_scores.json"
CROP_PROFILES_PATH = ARTIFACTS_DIR / "crop_profiles.json"
FEATURE_SCHEMA_PATH = ARTIFACTS_DIR / "feature_schema.json"
MODEL_METADATA_PATH = ARTIFACTS_DIR / "model_metadata.json"

# Ranking Weights (Default: 50% Agro, 20% Region, 20% Water, 10% Pref)
WEIGHT_AGRONOMIC = float(os.getenv("WEIGHT_AGRONOMIC", "0.50"))
WEIGHT_REGIONAL = float(os.getenv("WEIGHT_REGIONAL", "0.20"))
WEIGHT_WATER = float(os.getenv("WEIGHT_WATER", "0.20"))
WEIGHT_PREFERENCE = float(os.getenv("WEIGHT_PREFERENCE", "0.10"))
