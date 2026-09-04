from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import random
import datetime

app = FastAPI(
    title="AgriHub Machine Learning & Agronomic Intelligence Service",
    description="Inference endpoints for crop recommendation, disease classification, and price forecasting.",
    version="1.0.0"
)

@app.get("/health")
def health_check():
    return {
        "status": "online",
        "service": "AgriHub ML Engine",
        "timestamp": datetime.datetime.utcnow().isoformat()
    }

class SoilContext(BaseModel):
    ph: float = Field(..., ge=3.0, le=11.0)
    nitrogen: float = Field(..., ge=0)
    phosphorus: float = Field(..., ge=0)
    potassium: float = Field(..., ge=0)
    organic_carbon: float = Field(..., ge=0)
    soil_type: str

class RecommendationRequest(BaseModel):
    farm_id: str
    soil: SoilContext
    irrigation_source: str
    season: Optional[str] = "KHARIF"

class CropCandidate(BaseModel):
    crop_name: str
    suitability_score: float
    reasons: List[str]
    water_requirement: str
    duration_days: int
    projected_roi_pct: float

class RecommendationResponse(BaseModel):
    farm_id: str
    recommendations: List[CropCandidate]
    model_version: str = "RF-Agronomic-V2.1"
    timestamp: str

@app.post("/v1/recommend-crops", response_model=RecommendationResponse)
def recommend_crops(req: RecommendationRequest):
    candidates = []
    
    # Agronomic evaluation rule logic
    # Soybean
    sb_score = 82.0
    sb_reasons = []
    if 6.5 <= req.soil.ph <= 7.8:
        sb_score += 7
        sb_reasons.append(f"Optimal soil pH ({req.soil.ph}) for legume nodulation.")
    if req.soil.potassium >= 250:
        sb_score += 5
        sb_reasons.append("High potassium levels support pod development.")
    candidates.append(CropCandidate(
        crop_name="Soybean",
        suitability_score=min(sb_score, 98.0),
        reasons=sb_reasons or ["Favorable agro-climatic zone"],
        water_requirement="MEDIUM",
        duration_days=95,
        projected_roi_pct=42.0
    ))
    
    # Cotton
    ct_score = 76.0
    ct_reasons = ["Deep soil supports taproot development."]
    if req.soil.soil_type.upper() in ["BLACK_COTTON", "CLAY_LOAM"]:
        ct_score += 10
        ct_reasons.append("Black cotton soil has optimal cation exchange capacity.")
    candidates.append(CropCandidate(
        crop_name="Bt Cotton",
        suitability_score=min(ct_score, 91.0),
        reasons=ct_reasons,
        water_requirement="HIGH",
        duration_days=160,
        projected_roi_pct=38.5
    ))
    
    # Sort top candidates
    candidates.sort(key=lambda x: x.suitability_score, reverse=True)
    
    return RecommendationResponse(
        farm_id=req.farm_id,
        recommendations=candidates,
        timestamp=datetime.datetime.utcnow().isoformat()
    )

@app.post("/v1/diagnose-disease")
async def diagnose_disease(
    crop: str = Form("Soybean"),
    image: UploadFile = File(...)
):
    if not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image (jpeg/png)")
    
    # Simulated EfficientNet/ResNet model response with certainty calibration
    confidence = 94.2
    return {
        "crop_detected": crop,
        "disease_name": "Cercospora Leaf Spot / Early Blight",
        "confidence_pct": confidence,
        "status": "CONFIRMED" if confidence >= 75.0 else "UNCERTAIN",
        "severity": "HIGH",
        "symptoms": [
            "Concentric necrotic rings on trifoliate leaf lamina",
            "Yellow halo around dark lesions"
        ],
        "treatment_organic": [
            "Neem oil spray (10,000 ppm) @ 3ml/L",
            "Trichoderma harzianum foliar application"
        ],
        "treatment_chemical": [
            "Carbendazim 12% + Mancozeb 63% WP (Saaf) @ 2g/L",
            "Azoxystrobin 18.2% + Difenoconazole 11.4% SC @ 1ml/L"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
