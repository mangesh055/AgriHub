import sys
import os
from pathlib import Path

# Add Crop recommendation/agrihub-ml to path for shared disease_engine
ml_app_dir = Path(__file__).resolve().parent.parent.parent / "Crop recommendation" / "agrihub-ml"
if str(ml_app_dir) not in sys.path:
    sys.path.insert(0, str(ml_app_dir))

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import datetime

try:
    from app.disease_engine import diagnose_leaf, CROP_DISPLAY_NAMES
except Exception:
    # If app import fails, try direct import
    try:
        from disease_engine import diagnose_leaf, CROP_DISPLAY_NAMES
    except Exception:
        diagnose_leaf = None
        CROP_DISPLAY_NAMES = {}

app = FastAPI(
    title="AgriHub Machine Learning & Agronomic Intelligence Service",
    description="Inference endpoints for crop recommendation and HuggingFace ConvNeXt disease classification.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {
        "status": "online",
        "service": "AgriHub ML Engine",
        "vision_models": "HuggingFace ixrbhii/multicrop-disease-models",
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
    
    candidates.sort(key=lambda x: x.suitability_score, reverse=True)
    
    return RecommendationResponse(
        farm_id=req.farm_id,
        recommendations=candidates,
        timestamp=datetime.datetime.utcnow().isoformat()
    )

@app.post("/api/v1/diagnose-disease")
@app.post("/v1/diagnose-disease")
async def diagnose_disease_endpoint(payload: Dict[str, Any]):
    image_data = payload.get("image") or payload.get("imageBase64") or payload.get("imageUrl")
    if not image_data:
        raise HTTPException(status_code=400, detail="Missing 'image' or 'imageBase64' field.")
    crop = payload.get("crop") or payload.get("cropName") or "auto"
    if diagnose_leaf:
        return diagnose_leaf(image_data, crop_requested=crop)
    raise HTTPException(status_code=500, detail="Disease inference engine not initialized.")

@app.post("/api/v1/diagnose-disease-upload")
@app.post("/v1/diagnose-disease-upload")
async def diagnose_disease_upload(
    crop: str = Form("auto"),
    image: UploadFile = File(...)
):
    if not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image (jpeg/png)")
    
    content = await image.read()
    if diagnose_leaf:
        return diagnose_leaf(content, crop_requested=crop)
    raise HTTPException(status_code=500, detail="Disease inference engine not initialized.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
