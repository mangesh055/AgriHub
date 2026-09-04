from fastapi import FastAPI, HTTPException, Security, Depends, status
from fastapi.security.api_key import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any, List

from app.config import API_KEY_NAME, API_KEY
from app.schemas import RecommendationRequest, RecommendationResponse
from app.predictor import predictor

app = FastAPI(
    title="AgriHub Baramati Crop Recommendation Service",
    description=(
        "Hyper-local ML Engine specialized for Baramati, Pune District. "
        "Calibrated with verified research from ICAR-NIASM (Malegaon Khurd) and KVK Baramati (Shardanagar)."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

def verify_api_key(key: str = Security(api_key_header)):
    if not key or key != API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or missing API Key. Provide a valid key in the '{API_KEY_NAME}' header."
        )
    return key

@app.get("/", tags=["Health & Info"])
def root():
    return {
        "service": "AgriHub Crop Recommendation ML Engine",
        "status": "online",
        "region": "Baramati (ICAR-NIASM & KVK Baramati)",
        "model_version": predictor.metadata.get("model_version", "agrihub-baramati-v1.0.0"),
        "top3_accuracy": predictor.metadata.get("metrics", {}).get("test_top3_accuracy", 1.0),
        "docs_url": "/docs",
        "api_endpoint": "POST /api/v1/recommend"
    }

@app.get("/health", tags=["Health & Info"])
def health_check():
    return {
        "status": "healthy",
        "artifacts_loaded": {
            "model_pipeline": predictor.model is not None,
            "classes_count": len(predictor.classes),
            "regional_lookup_entries": len(predictor.regional_lookup),
            "crop_profiles_count": len(predictor.crop_profiles)
        }
    }

@app.post(
    "/api/v1/recommend",
    response_model=RecommendationResponse,
    tags=["Recommendations"],
    summary="Get Top-3 Crop Recommendations with Reasons and Trade-offs"
)
def recommend_crops(
    request: RecommendationRequest,
    _auth: str = Depends(verify_api_key)
):
    """
    Receives farmer plot context, soil type, irrigation setup, weather, and optional soil test NPK.
    Returns ranked Top-3 crops with agronomic reasons, water feasibility, and management trade-offs.
    """
    try:
        response = predictor.predict(request)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction error: {str(e)}"
        )

@app.get("/api/v1/crops", tags=["Agronomic Profiles"])
def list_crops(_auth: str = Depends(verify_api_key)):
    """List verified Baramati crops with their KVK varieties and water profiles."""
    return {
        "region": "Baramati, Pune District (ICAR-NIASM & KVK Baramati)",
        "supported_crops_count": len(predictor.crop_profiles),
        "crops": predictor.crop_profiles
    }

@app.get("/api/v1/microzones", tags=["Baramati Geography"])
def list_microzones(_auth: str = Depends(verify_api_key)):
    """List Baramati agricultural micro-zones, soil types, and village clusters."""
    try:
        import json
        with open("../artifacts/baramati_microzones.json", "r", encoding="utf-8") as f:
            microzones = json.load(f)
        return microzones
    except Exception:
        return {}

@app.get("/api/v1/districts", tags=["Baramati Geography"])
def list_baramati_villages(_auth: str = Depends(verify_api_key)):
    """List Baramati revenue circles and village clusters."""
    return {
        "taluka": "Baramati",
        "district": "Pune",
        "research_institutes": [
            "ICAR-National Institute of Abiotic Stress Management (NIASM), Malegaon Khurd",
            "Krishi Vigyan Kendra (KVK), Shardanagar, Baramati"
        ],
        "village_clusters": [
            "Malegaon (Canal Command / Sugar Belt)",
            "Shardanagar (KVK / Well Irrigated)",
            "Supa (Scarcity / Murrum Soil)",
            "Morgaon (Rainfed Scarcity)",
            "Pandare (Nira Canal Left Bank)",
            "Someshwar (Canal Belt)",
            "Songaon (Dairy & Fodder Belt)",
            "Jalochi (Well Irrigated)",
            "Baramati Rural"
        ]
    }

@app.get("/api/v1/metadata", tags=["Health & Info"])
def model_metadata(_auth: str = Depends(verify_api_key)):
    """Get Baramati ML training metrics and feature specifications."""
    return predictor.metadata
    return predictor.metadata
