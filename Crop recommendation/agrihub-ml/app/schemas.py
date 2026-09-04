from typing import Optional, List, Literal, Dict, Any
from pydantic import BaseModel, Field, model_validator

class SoilTestData(BaseModel):
    nitrogen: Optional[float] = Field(None, ge=0, le=500, description="Available Soil Nitrogen (N) in kg/ha (KVK Baramati range: 140-280)")
    phosphorus: Optional[float] = Field(None, ge=0, le=200, description="Available Phosphorus (P) in kg/ha (KVK Baramati range: 12-28)")
    potassium: Optional[float] = Field(None, ge=0, le=800, description="Available Potassium (K) in kg/ha (Baramati basalt soils: 250-500)")
    ph: Optional[float] = Field(None, ge=4.0, le=10.0, description="Soil pH level (Baramati typical: 7.2-8.4)")
    organic_carbon: Optional[float] = Field(None, ge=0.0, le=5.0, description="Organic Carbon % (Baramati typical: 0.35-0.65%)")
    source: Literal["soil_test", "unknown", "estimated"] = Field("unknown", description="Source of soil test values")

class WeatherData(BaseModel):
    temperature_avg: float = Field(27.5, ge=-5, le=55, description="Average temperature in Celsius (KVK agromet station)")
    temperature_min: float = Field(20.0, ge=-10, le=50, description="Minimum temperature in Celsius")
    temperature_max: float = Field(34.0, ge=0, le=60, description="Maximum temperature in Celsius")
    humidity_avg: float = Field(65.0, ge=5, le=100, description="Average relative humidity %")
    rainfall: float = Field(450.0, ge=0, le=3000, description="Rainfall in mm (Baramati scarcity mean: 450-550 mm)")
    rainfall_probability: float = Field(45.0, ge=0, le=100, description="Rainfall probability %")
    forecast_rainfall: float = Field(25.0, ge=0, le=1000, description="Rainfall forecast for next 7-14 days in mm")
    historical_seasonal_rainfall: float = Field(480.0, ge=0, le=3000, description="Historical Baramati seasonal rainfall in mm")
    wind_speed: float = Field(12.0, ge=0, le=100, description="Average wind speed in km/h")

class RecommendationRequest(BaseModel):
    # Baramati geography
    district: str = Field("Pune", description="District (Fixed to Pune for Baramati region)")
    taluka: str = Field("Baramati", description="Taluka (Fixed to Baramati)")
    village: Optional[str] = Field("Malegaon", description="Baramati village/circle (e.g. Malegaon, Shardanagar, Supa, Pandare, Morgaon)")

    # Baramati agro-ecological micro-zone
    microzone: Literal["canal_command", "well_irrigated", "rainfed_scarcity"] = Field(
        "canal_command",
        description="Baramati farming zone: 'canal_command' (Nira Left Bank Canal), 'well_irrigated' (Borewell/KVK), 'rainfed_scarcity' (Supa/Morgaon)"
    )

    # Baramati soil classifications
    soil_type: Literal["deep_black_vertisol", "medium_clay_loam", "shallow_murrum"] = Field(
        "deep_black_vertisol",
        description="Baramati soil type: 'deep_black_vertisol' (Heavy black vertisol), 'medium_clay_loam', 'shallow_murrum' (Rain-shadow basalt murrum)"
    )

    season: str = Field(
        "kharif",
        description="Agricultural season: 'kharif', 'rabi', 'summer', 'annual'"
    )
    farm_area_acres: float = Field(3.0, gt=0, le=1000, description="Farm plot size in acres")

    # Water and irrigation setup
    irrigation_source: Literal["canal", "borewell", "open_well", "river", "farm_pond", "rainfed"] = Field(
        "canal",
        description="Water source (Nira Left Bank Canal, River, Borewell, etc.)"
    )
    water_availability: Literal["very_high", "high", "medium", "low", "scarce"] = Field(
        "high",
        description="General volume of water available"
    )
    seasonal_water_reliability: Literal["highly_reliable", "reliable", "moderate", "unreliable"] = Field(
        "reliable",
        description="Reliability of water throughout the crop cycle"
    )
    irrigation_method: Literal["drip", "sprinkler", "flood", "rainfed"] = Field(
        "drip",
        description="Irrigation method"
    )

    # Farming history and preferences
    previous_crop: Optional[str] = Field(None, description="Previous crop harvested (e.g. 'sugarcane', 'soybean', 'wheat')")
    previous_season: Optional[str] = Field(None, description="Previous season")
    crop_duration_preference: Literal["short", "medium", "long", "any"] = Field("any", description="Farmer duration preference")
    risk_preference: Literal["low", "moderate", "high"] = Field("moderate", description="Farmer risk appetite")

    # Optional chemical soil test report (KVK Baramati 8-parameter standards)
    soil_test: Optional[SoilTestData] = Field(default_factory=SoilTestData)

    # Weather parameters
    weather: Optional[WeatherData] = Field(default_factory=WeatherData)

    # Weights
    weight_agronomic: Optional[float] = Field(None, ge=0.0, le=1.0)
    weight_regional: Optional[float] = Field(None, ge=0.0, le=1.0)
    weight_water: Optional[float] = Field(None, ge=0.0, le=1.0)
    weight_preference: Optional[float] = Field(None, ge=0.0, le=1.0)

    @model_validator(mode="before")
    @classmethod
    def normalize_baramati_inputs(cls, values: Any) -> Any:
        if isinstance(values, dict):
            # Enforce Baramati geography
            values["district"] = "Pune"
            values["taluka"] = "Baramati"

            # Village to micro-zone auto-inference if village provided
            v = str(values.get("village", "")).strip().lower()
            if "malegaon" in v or "someshwar" in v or "pandare" in v or "nira" in v:
                values["microzone"] = "canal_command"
                if "soil_type" not in values or values.get("soil_type") == "black_cotton":
                    values["soil_type"] = "deep_black_vertisol"
            elif "shardanagar" in v or "songaon" in v or "jalochi" in v or "karanje" in v or "bhavani" in v:
                values["microzone"] = "well_irrigated"
                if "soil_type" not in values or values.get("soil_type") == "black_cotton":
                    values["soil_type"] = "medium_clay_loam"
            elif "supa" in v or "morgaon" in v or "tardoli" in v or "jalgaon" in v:
                values["microzone"] = "rainfed_scarcity"
                if "soil_type" not in values:
                    values["soil_type"] = "shallow_murrum"

            # Soil normalization
            st = str(values.get("soil_type", "")).strip().lower()
            if "murrum" in st or "light" in st or "shallow" in st or "red" in st or "gravel" in st:
                values["soil_type"] = "shallow_murrum"
            elif "deep" in st or "vertisol" in st or "regur" in st or "black" in st:
                values["soil_type"] = "deep_black_vertisol"
            else:
                values["soil_type"] = "medium_clay_loam"

            # Season normalization
            sn = str(values.get("season", "")).strip().lower()
            if "rabi" in sn or "winter" in sn:
                values["season"] = "rabi"
            elif "summer" in sn or "zaid" in sn:
                values["season"] = "summer"
            elif "annual" in sn or "whole" in sn or "year" in sn:
                values["season"] = "annual"
            else:
                values["season"] = "kharif"

            # Map flat NPK if provided at root level
            st_dict = values.get("soil_test")
            if not isinstance(st_dict, dict):
                st_dict = {}
            for k in ["nitrogen", "phosphorus", "potassium", "ph", "organic_carbon"]:
                if k in values and values[k] is not None:
                    st_dict[k] = values.pop(k)
                    st_dict["source"] = "soil_test"
            if st_dict:
                values["soil_test"] = st_dict

        return values

class CropRecommendation(BaseModel):
    rank: int
    crop: str
    crop_name: str
    marathi_name: Optional[str] = None
    kvk_varieties: List[str] = Field(default_factory=list, description="Recommended KVK Baramati seed varieties")
    final_score: float
    confidence_pct: float
    agronomic_score: float
    regional_score: float
    water_feasibility_score: float
    preference_score: float
    reasons: List[str]
    tradeoffs: List[str]
    water_requirement: str
    water_requirement_mm: List[float]
    duration_days: List[int]
    drought_tolerance: str
    management_commitment: str
    regional_status: str

class RecommendationResponse(BaseModel):
    status: str = "success"
    region: str = "Baramati, Pune District (ICAR-NIASM & KVK Baramati)"
    model_version: str
    timestamp: str
    farmer_summary: Dict[str, Any]
    soil_test_status: str
    recommendations: List[CropRecommendation]
    disclaimer: str
