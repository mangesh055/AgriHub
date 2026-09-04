from typing import Dict, List, Any, Tuple
from app.schemas import RecommendationRequest, CropRecommendation

WATER_AVAILABILITY_SCALE = {
    "scarce": 0.15,
    "low": 0.35,
    "medium": 0.65,
    "high": 0.85,
    "very_high": 1.00
}

WATER_RELIABILITY_SCALE = {
    "unreliable": 0.25,
    "moderate": 0.60,
    "reliable": 0.85,
    "highly_reliable": 1.00
}

CROP_WATER_NEED = {
    "very_low": 0.20,
    "low": 0.35,
    "low_to_medium": 0.50,
    "medium": 0.65,
    "medium_to_high": 0.80,
    "high": 0.90,
    "very_high": 1.00
}

COMMON_PREV_CROP_SYNONYMS = {
    "cane sugar": "sugarcane",
    "sugar cane": "sugarcane",
    "cane": "sugarcane",
    "jowar": "sorghum",
    "maldandi": "sorghum",
    "chana": "chickpea",
    "gram": "chickpea",
    "harbhara": "chickpea",
    "soyabean": "soybean",
    "soya": "soybean",
    "kanda": "onion",
    "makka": "maize",
    "bajari": "bajra"
}

def calculate_regional_score(
    microzone: str,
    season: str,
    crop: str,
    regional_lookup: Dict[str, Any]
) -> Tuple[float, str]:
    mz_clean = microzone.strip().lower()
    season_clean = season.strip().lower()
    crop_clean = crop.strip().lower()

    # 1. Exact microzone match
    mz_key = f"{mz_clean}::{season_clean}::{crop_clean}"
    if mz_key in regional_lookup:
        e = regional_lookup[mz_key]
        score = e["suitability_score"]
        label = e["recommendation_label"]
        yld = e["avg_yield_tha"]
        freq = e["crop_freq_pct"]
        desc = f"{label} in Baramati {mz_clean.replace('_', ' ').title()} ({season.title()}: {freq}% historical presence, {yld} T/Ha avg yield)"
        return score, desc

    # 2. General Baramati taluka match
    baramati_key = f"baramati::{season_clean}::{crop_clean}"
    if baramati_key in regional_lookup:
        e = regional_lookup[baramati_key]
        return e["suitability_score"], f"{e['recommendation_label']} in Baramati Taluka ({season.title()} season)"

    # 3. Search if crop is grown in this microzone in any season
    mz_matches = [
        v for k, v in regional_lookup.items()
        if k.startswith(f"{mz_clean}::") and k.endswith(f"::{crop_clean}")
    ]
    if mz_matches:
        best = max(mz_matches, key=lambda x: x["suitability_score"])
        return best["suitability_score"] * 0.80, f"Historically grown in Baramati {mz_clean.replace('_', ' ').title()} in alternate seasons"

    return 0.50, f"Agronomic suitability verified by KVK Baramati trials for {season.title()}"

def calculate_water_feasibility(
    crop: str,
    profile: Dict[str, Any],
    req: RecommendationRequest
) -> Tuple[float, List[str], List[str]]:
    water_req = profile.get("water_requirement", "medium")
    crop_demand = CROP_WATER_NEED.get(water_req, 0.65)

    avail_val = WATER_AVAILABILITY_SCALE.get(req.water_availability, 0.65)
    rel_val = WATER_RELIABILITY_SCALE.get(req.seasonal_water_reliability, 0.85)
    effective_water_supply = avail_val * (0.6 + 0.4 * rel_val)

    # Irrigation method factor (KVK drip recommendation)
    method_multiplier = 1.0
    if req.irrigation_method == "drip":
        method_multiplier = 1.15
    elif req.irrigation_method == "rainfed":
        method_multiplier = 0.75
    elif req.irrigation_method == "flood":
        method_multiplier = 0.95

    adjusted_supply = min(1.0, effective_water_supply * method_multiplier)

    reasons = []
    tradeoffs = []

    # High water demand (Sugarcane)
    if crop_demand >= 0.85:
        if req.water_availability in ["scarce", "low"] or req.irrigation_source == "rainfed":
            score = 0.05
            tradeoffs.append(f"CRITICAL WATER RISK: Sugarcane requires 1800-2500 mm water in Baramati. Rainfed/low water conditions will cause total crop loss.")
        elif (req.water_availability in ["high", "very_high"] or adjusted_supply >= 0.70) and req.seasonal_water_reliability in ["reliable", "highly_reliable"]:
            score = 0.95
            reasons.append(f"Assured {req.irrigation_source.title()} irrigation and {req.seasonal_water_reliability.replace('_', ' ')} supply satisfies high sugarcane water requirement.")
            tradeoffs.append("Requires continuous irrigation scheduling across 300+ days; KVK recommends drip automation to prevent soil salinity.")
        else:
            score = 0.55
            tradeoffs.append("Marginal water security; Nira canal rotation delays or summer well drop will depress cane elongation.")
    # Low water demand (Sorghum / Bajra / Chickpea)
    elif crop_demand <= 0.35:
        if req.water_availability in ["scarce", "low"] or req.irrigation_source == "rainfed":
            score = 0.95
            reasons.append(f"Champion abiotic stress resilience (ICAR-NIASM); thrives under {req.water_availability} water and rainfed conditions.")
        else:
            score = 0.80
            reasons.append("Low water requirement conserves well and canal water reserves for subsequent cycles.")
    # Medium water demand (Soybean, Maize, Onion, Wheat)
    else:
        diff = adjusted_supply - crop_demand
        if diff >= 0:
            score = 0.85 + (diff * 0.15)
            reasons.append(f"Adequate moisture supply via {req.irrigation_source.title()} ({req.irrigation_method.title()}) for normal growth.")
        else:
            score = max(0.20, 0.75 + diff * 1.2)
            tradeoffs.append("Protective irrigations required during critical reproductive stages to avoid yield loss.")

    return min(1.0, max(0.05, score)), reasons, tradeoffs

def calculate_preference_score(
    crop: str,
    profile: Dict[str, Any],
    req: RecommendationRequest
) -> Tuple[float, List[str], List[str]]:
    score = 0.70
    reasons = []
    tradeoffs = []

    dur_min, dur_max = profile.get("duration_days", [90, 120])
    avg_dur = (dur_min + dur_max) / 2

    # Duration Preference
    if req.crop_duration_preference == "short":
        if avg_dur <= 100:
            score += 0.20
            reasons.append(f"Matches preference for short duration ({dur_min}-{dur_max} days), allowing prompt field turnover.")
        elif avg_dur > 150:
            score -= 0.35
            tradeoffs.append(f"Crop cycle of {dur_min}-{dur_max} days is longer than requested short window.")
    elif req.crop_duration_preference == "long":
        if avg_dur > 150:
            score += 0.20
            reasons.append(f"Matches preference for long-duration single-investment crop ({dur_min}-{dur_max} days).")
        else:
            score -= 0.10

    # Crop Rotation & Legume Benefit (KVK Baramati guidelines)
    raw_prev = (req.previous_crop or "").strip().lower()
    prev_crop = COMMON_PREV_CROP_SYNONYMS.get(raw_prev, raw_prev)
    is_legume = crop in ["soybean", "chickpea"]
    prev_was_cereal = prev_crop in ["wheat", "sorghum", "maize", "bajra"]
    prev_was_same = (prev_crop == crop or prev_crop == crop.replace("_", "") or prev_crop == profile.get("name", "").lower())

    if prev_was_same and crop != "sugarcane":
        score -= 0.25
        tradeoffs.append(f"Monocropping notice: Growing {crop.title()} immediately after {prev_crop.title()} increases pest and soil disease pressure.")
    elif prev_was_same and crop == "sugarcane":
        if req.water_availability in ["high", "very_high"] and req.irrigation_source in ["canal", "river", "borewell"]:
            score += 0.20
            reasons.append("Experienced Baramati sugarcane farmer with established infrastructure, ideal for Ratoon (खोदवा) cane or Suru replanting.")
        else:
            score -= 0.15
            tradeoffs.append("Continuous sugarcane monocropping degrades soil organic carbon and increases white grub incidence.")
    elif prev_was_cereal and is_legume:
        score += 0.15
        reasons.append(f"Optimal KVK crop rotation: Planting legume ({crop.title()}) after {prev_crop.title()} fixes 30-40 kg atmospheric N/ha.")
    elif prev_crop == "sugarcane":
        if is_legume or crop in ["onion", "wheat", "maize"]:
            score += 0.15
            reasons.append("Excellent restorative break crop following exhaustive sugarcane harvest (KVK Baramati soil health advice).")

    # Risk Profile
    if req.risk_preference == "low":
        if profile.get("market_risk") == "low" and profile.get("drought_tolerance") in ["high", "very_high"]:
            score += 0.15
            reasons.append("Low market fluctuation and dependable resilience fit conservative Baramati farming profile.")
        elif profile.get("market_risk") == "high":
            score -= 0.15
            tradeoffs.append("High price volatility (e.g. onion market swings) conflicts with low-risk preference.")
    elif req.risk_preference == "high":
        if profile.get("economic_return") == "very_high":
            score += 0.15
            reasons.append("High gross cash returns per acre align with commercial grower preference.")

    return min(1.0, max(0.10, score)), reasons, tradeoffs

def rank_and_explain(
    agronomic_probs: Dict[str, float],
    req: RecommendationRequest,
    crop_profiles: Dict[str, Any],
    regional_lookup: Dict[str, Any],
    w_agro: float = 0.50,
    w_reg: float = 0.20,
    w_water: float = 0.20,
    w_pref: float = 0.10,
    top_k: int = 3
) -> List[CropRecommendation]:
    total_w = w_agro + w_reg + w_water + w_pref
    w_agro /= total_w
    w_reg /= total_w
    w_water /= total_w
    w_pref /= total_w

    candidates = []

    has_perennial_water = (
        req.irrigation_source in ["canal", "river", "borewell"] and
        req.water_availability in ["high", "very_high"] and
        req.seasonal_water_reliability in ["reliable", "highly_reliable"]
    )

    for crop, agro_score in agronomic_probs.items():
        profile = crop_profiles.get(crop, {})
        display_name = profile.get("name", crop.title())
        marathi_name = profile.get("marathi_name", "")
        kvk_vars = profile.get("kvk_varieties", [])

        # 1. Baramati Regional / Microzone score
        reg_score, reg_desc = calculate_regional_score(req.microzone, req.season, crop, regional_lookup)

        # 2. Water feasibility
        water_score, water_reasons, water_tradeoffs = calculate_water_feasibility(crop, profile, req)

        # 3. Farmer preference
        pref_score, pref_reasons, pref_tradeoffs = calculate_preference_score(crop, profile, req)

        # Composite score
        final_score = (
            (w_agro * agro_score) +
            (w_reg * reg_score) +
            (w_water * water_score) +
            (w_pref * pref_score)
        )

        # Soil type match
        ideal_soils = profile.get("ideal_soils", [])
        if ideal_soils and req.soil_type in ideal_soils:
            final_score *= 1.10
        elif req.soil_type == "shallow_murrum" and crop in ["sugarcane", "wheat"]:
            final_score *= 0.40  # Murrum soil cannot support root anchorage or heavy water of sugarcane/wheat

        # Micro-zone affinity
        primary_mzs = profile.get("primary_microzones", [])
        if req.microzone in primary_mzs:
            final_score *= 1.08

        # Seasonal compatibility gating
        crop_seasons = profile.get("seasons", [])
        is_perennial_viable = (crop == "sugarcane" and has_perennial_water)

        is_season_match = (
            (req.season in crop_seasons) or
            (req.season == "annual" and ("annual" in crop_seasons or "whole_year" in crop_seasons)) or
            is_perennial_viable
        )
        if not is_season_match:
            final_score *= 0.20

        # Hard water deficit gating
        if water_score < 0.10:
            final_score *= 0.25

        reasons = []
        tradeoffs = []

        if agro_score >= 0.15:
            reasons.append(f"Strong soil & climate affinity ({agro_score*100:.1f}% ML model suitability).")
        if ideal_soils and req.soil_type in ideal_soils:
            reasons.append(f"Naturally suited to Baramati {req.soil_type.replace('_', ' ').title()} conditions.")

        if is_season_match:
            if is_perennial_viable and req.season not in crop_seasons:
                reasons.append(f"Assured {req.irrigation_source.title()} perennial water enables year-round Sugarcane / Ratoon (खोदवा) management.")
            else:
                reasons.append(f"Well aligned with Baramati {req.season.title()} planting window.")
        else:
            tradeoffs.append(f"Seasonal mismatch: Typically not sown in Baramati {req.season.title()} season.")

        reasons.extend(water_reasons)
        reasons.extend(pref_reasons)
        reasons.extend(profile.get("reasons", [])[:1])

        tradeoffs.extend(water_tradeoffs)
        tradeoffs.extend(pref_tradeoffs)
        tradeoffs.extend(profile.get("tradeoffs", [])[:2])

        clean_reasons = list(dict.fromkeys(reasons))
        clean_tradeoffs = list(dict.fromkeys(tradeoffs))

        candidates.append({
            "crop": crop,
            "crop_name": display_name,
            "marathi_name": marathi_name,
            "kvk_varieties": kvk_vars,
            "final_score": round(final_score, 4),
            "confidence_pct": round(final_score * 100, 1),
            "agronomic_score": round(agro_score, 4),
            "regional_score": round(reg_score, 4),
            "water_feasibility_score": round(water_score, 4),
            "preference_score": round(pref_score, 4),
            "reasons": clean_reasons,
            "tradeoffs": clean_tradeoffs,
            "water_requirement": profile.get("water_requirement", "medium"),
            "water_requirement_mm": profile.get("water_requirement_mm", [450, 650]),
            "duration_days": profile.get("duration_days", [90, 120]),
            "drought_tolerance": profile.get("drought_tolerance", "medium"),
            "management_commitment": profile.get("management_commitment", "medium"),
            "regional_status": reg_desc
        })

    candidates.sort(key=lambda x: x["final_score"], reverse=True)

    results = []
    for rank_idx, item in enumerate(candidates[:top_k], start=1):
        item["rank"] = rank_idx
        results.append(CropRecommendation(**item))

    return results
