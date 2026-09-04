import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from typing import Dict, Any, List

from app.config import (
    MODEL_PATH,
    REGIONAL_SCORES_PATH,
    CROP_PROFILES_PATH,
    MODEL_METADATA_PATH,
    WEIGHT_AGRONOMIC,
    WEIGHT_REGIONAL,
    WEIGHT_WATER,
    WEIGHT_PREFERENCE
)
from app.schemas import RecommendationRequest, RecommendationResponse
from app.ranking import rank_and_explain

class AgriHubPredictor:
    def __init__(self):
        self.model = None
        self.crop_profiles = {}
        self.regional_lookup = {}
        self.metadata = {}
        self.classes = []
        self._load_artifacts()

    def _load_artifacts(self):
        print(f"Loading model pipeline from {MODEL_PATH}...")
        self.model = joblib.load(MODEL_PATH)
        self.classes = list(self.model.named_steps["classifier"].classes_)

        print(f"Loading regional scores from {REGIONAL_SCORES_PATH}...")
        with open(REGIONAL_SCORES_PATH, "r", encoding="utf-8") as f:
            self.regional_lookup = json.load(f)

        print(f"Loading crop profiles from {CROP_PROFILES_PATH}...")
        with open(CROP_PROFILES_PATH, "r", encoding="utf-8") as f:
            self.crop_profiles = json.load(f)

        if MODEL_METADATA_PATH.exists():
            with open(MODEL_METADATA_PATH, "r", encoding="utf-8") as f:
                self.metadata = json.load(f)

        print(f"AgriHub Predictor initialized with {len(self.classes)} classes.")

    def predict(self, req: RecommendationRequest) -> RecommendationResponse:
        # 1. Prepare single-row DataFrame matching the model's exact ColumnTransformer expectations
        st = req.soil_test or None
        w = req.weather

        row = {
            # Optional chemical soil test features (cleanly np.nan if absent)
            "nitrogen": st.nitrogen if st and st.nitrogen is not None else np.nan,
            "phosphorus": st.phosphorus if st and st.phosphorus is not None else np.nan,
            "potassium": st.potassium if st and st.potassium is not None else np.nan,
            "ph": st.ph if st and st.ph is not None else np.nan,
            "organic_carbon": st.organic_carbon if st and st.organic_carbon is not None else np.nan,

            # Continuous weather features with root zone irrigation allowance
            "temperature_avg": w.temperature_avg,
            "temperature_min": w.temperature_min,
            "temperature_max": w.temperature_max,
            "humidity_avg": w.humidity_avg,
            "rainfall": (
                max(w.rainfall, 1800.0 if req.season == "annual" else 800.0)
                if (req.irrigation_source in ["canal", "river", "borewell"] and req.water_availability in ["high", "very_high"] and req.seasonal_water_reliability in ["reliable", "highly_reliable"])
                else (max(w.rainfall, 650.0) if req.water_availability == "medium" and req.irrigation_source != "rainfed" else w.rainfall)
            ),
            "rainfall_probability": w.rainfall_probability,
            "forecast_rainfall": w.forecast_rainfall,
            "historical_seasonal_rainfall": w.historical_seasonal_rainfall,
            "wind_speed": w.wind_speed,

            # Categorical compulsory features
            "microzone": req.microzone,
            "soil_type": req.soil_type,
            "season": req.season
        }

        df_input = pd.DataFrame([row])

        # 2. Predict probabilities across all crops
        probas = self.model.predict_proba(df_input)[0]
        agronomic_probs = {cls_name: float(prob) for cls_name, prob in zip(self.classes, probas)}

        # 3. Determine weights (use request override if provided, else config defaults)
        w_agro = req.weight_agronomic if req.weight_agronomic is not None else WEIGHT_AGRONOMIC
        w_reg = req.weight_regional if req.weight_regional is not None else WEIGHT_REGIONAL
        w_water = req.weight_water if req.weight_water is not None else WEIGHT_WATER
        w_pref = req.weight_preference if req.weight_preference is not None else WEIGHT_PREFERENCE

        # 4. Rank and generate reasons
        recommendations = rank_and_explain(
            agronomic_probs=agronomic_probs,
            req=req,
            crop_profiles=self.crop_profiles,
            regional_lookup=self.regional_lookup,
            w_agro=w_agro,
            w_reg=w_reg,
            w_water=w_water,
            w_pref=w_pref,
            top_k=3
        )

        has_chemical = any(
            v is not None and not np.isnan(v)
            for v in [row["nitrogen"], row["phosphorus"], row["potassium"], row["ph"]]
        )

        soil_status = (
            "Measured KVK Soil Health Card (Lab NPK/pH Provided)"
            if has_chemical
            else "Baramati Micro-Zone Default (No Lab Test Provided; Handled via Missing Indicator Pipeline)"
        )

        return RecommendationResponse(
            status="success",
            region="Baramati, Pune District (ICAR-NIASM & KVK Baramati)",
            model_version=self.metadata.get("model_version", "agrihub-baramati-v1.0.0"),
            timestamp=datetime.now().isoformat(),
            farmer_summary={
                "region": "Baramati, Pune District",
                "village_circle": req.village.title() if req.village else "Baramati Rural",
                "microzone": req.microzone.replace("_", " ").title(),
                "soil_type": req.soil_type.replace("_", " ").title(),
                "season": req.season.title(),
                "farm_area_acres": req.farm_area_acres,
                "irrigation": f"{req.irrigation_source.title()} ({req.irrigation_method.title()})",
                "water_availability": req.water_availability.title(),
                "seasonal_water_reliability": req.seasonal_water_reliability.title()
            },
            soil_test_status=soil_status,
            recommendations=recommendations,
            disclaimer="AgriHub Baramati engine recommendations are calibrated with research trial standards from ICAR-NIASM (Malegaon Khurd) and KVK Baramati (Shardanagar). Always consult KVK Baramati experts or local taluka agriculture officers for certified seed availability."
        )

# Global singleton predictor
predictor = AgriHubPredictor()
