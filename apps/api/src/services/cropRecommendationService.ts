import {
  SoilRecord,
  CropRecommendationItem,
  CropRecommendationResult
} from '@agrihub/contracts';
import { randomUUID } from 'crypto';

interface RecommendationInput {
  farmId: string;
  soil: SoilRecord;
  season?: 'KHARIF' | 'RABI' | 'ZAID';
  irrigationSource: string;
}

export class CropRecommendationService {
  public static recommend(input: RecommendationInput): CropRecommendationResult {
    const { farmId, soil, season = 'KHARIF', irrigationSource } = input;
    const recommendations: CropRecommendationItem[] = [];

    const prevCrop = (soil.previousCrop || '').toLowerCase();
    const prevYield = soil.previousYieldQuintals || 0;
    const hasDrip = irrigationSource.includes('DRIP');
    const hasBorewell = irrigationSource.includes('BOREWELL');
    const hasCanal = irrigationSource.includes('CANAL');
    const isHeavySoil = soil.soilType === 'BLACK_COTTON' || soil.soilType === 'CLAY_LOAM' || soil.soilType === 'SILTY_CLAY';
    const isLoamySoil = soil.soilType === 'ALLUVIAL' || soil.soilType === 'SANDY_LOAM';

    // 1. Soybean Rule
    let soybeanScore = 80;
    const soybeanReasons: string[] = [];
    if (soil.ph >= 6.5 && soil.ph <= 7.8) {
      soybeanScore += 8;
      soybeanReasons.push(`Soil pH (${soil.ph}) is in the optimal range (6.5 - 7.5).`);
    }
    if (soil.potassium > 250) {
      soybeanScore += 5;
      soybeanReasons.push(`High potassium (${soil.potassium} kg/ha) promotes pod filling and disease resistance.`);
    }
    if (isHeavySoil) {
      soybeanScore += 5;
      soybeanReasons.push(`Heavy/black soil provides excellent moisture retentivity during flowering.`);
    }
    if (prevCrop.includes('cotton') || prevCrop.includes('sugarcane') || prevCrop.includes('maize')) {
      soybeanScore += 8;
      soybeanReasons.push(`Excellent crop rotation: Soybean legumes restore nitrogen depleted by previous ${soil.previousCrop}.`);
    }
    if (prevYield > 10) {
      soybeanReasons.push(`Historical plot productivity (${prevYield} Qt/Acre) indicates high vigor.`);
    }

    const soybeanYieldLow = prevYield > 10 ? Math.round(prevYield * 0.95) : 10;
    const soybeanYieldHigh = prevYield > 10 ? Math.round(prevYield * 1.3) : 14;

    recommendations.push({
      cropName: 'Soybean (JS-335 / NRC-37)',
      suitabilityScore: Math.min(soybeanScore, 98),
      matchReasons: soybeanReasons,
      waterRequirement: 'MEDIUM',
      durationDays: 95,
      estimatedYieldRange: `${soybeanYieldLow} - ${soybeanYieldHigh} Quintals/Acre`,
      projectedRoiPct: 44
    });

    // 2. Bt Cotton Rule
    let cottonScore = 75;
    const cottonReasons: string[] = [];
    if (soil.soilType === 'BLACK_COTTON') {
      cottonScore += 10;
      cottonReasons.push('Deep black cotton soil provides ideal root anchorage and capillary moisture.');
    }
    if (hasDrip) {
      cottonScore += 8;
      cottonReasons.push('Drip irrigation enables precision fertigation during boll formation.');
    }
    if (prevCrop.includes('soybean') || prevCrop.includes('gram') || prevCrop.includes('pulse')) {
      cottonScore += 8;
      cottonReasons.push(`Beneficial rotation: Follows legume crop (${soil.previousCrop}) utilizing fixed organic nitrogen.`);
    }
    if (soil.potassium > 280) {
      cottonScore += 4;
      cottonReasons.push('Strong potassium levels prevent premature leaf reddening and square drop.');
    }
    recommendations.push({
      cropName: 'Bt Cotton (Bollgard II)',
      suitabilityScore: Math.min(cottonScore, 95),
      matchReasons: cottonReasons,
      waterRequirement: 'HIGH',
      durationDays: 160,
      estimatedYieldRange: '12 - 16 Quintals/Acre',
      projectedRoiPct: 39
    });

    // 3. Wheat Rule (Rabi / Winter)
    let wheatScore = 76;
    const wheatReasons: string[] = [];
    if (soil.soilType === 'ALLUVIAL' || soil.soilType === 'BLACK_COTTON' || soil.soilType === 'CLAY_LOAM') {
      wheatScore += 8;
      wheatReasons.push('Soil texture supports firm tillering and root spread.');
    }
    if (hasBorewell || hasCanal) {
      wheatScore += 8;
      wheatReasons.push('Assured irrigation sources cover critical Crown Root Initiation (CRI) stages.');
    }
    if (prevCrop.includes('soybean') || prevCrop.includes('paddy')) {
      wheatScore += 6;
      wheatReasons.push(`Standard high-yield sequential rotation following ${soil.previousCrop}.`);
    }
    recommendations.push({
      cropName: 'Sharbati / Durum Wheat',
      suitabilityScore: Math.min(wheatScore, 92),
      matchReasons: wheatReasons,
      waterRequirement: 'MEDIUM',
      durationDays: 115,
      estimatedYieldRange: '18 - 22 Quintals/Acre',
      projectedRoiPct: 40
    });

    // 4. Red Onion (Late Kharif / Rabi)
    let onionScore = 72;
    const onionReasons: string[] = [];
    if (soil.ph >= 6.0 && soil.ph <= 7.6) {
      onionScore += 8;
      onionReasons.push(`Soil pH (${soil.ph}) is well-suited for bulb development.`);
    }
    if (soil.organicCarbon >= 0.6) {
      onionScore += 7;
      onionReasons.push(`Organic carbon (${soil.organicCarbon}%) provides friable root structure.`);
    }
    if (hasDrip) {
      onionScore += 6;
      onionReasons.push('Micro-sprinkler or drip prevents purple blotch disease compared to flood.');
    }
    recommendations.push({
      cropName: 'Red Onion (Bhima Super / Shakti)',
      suitabilityScore: Math.min(onionScore, 90),
      matchReasons: onionReasons,
      waterRequirement: 'MEDIUM',
      durationDays: 120,
      estimatedYieldRange: '90 - 130 Quintals/Acre',
      projectedRoiPct: 56
    });

    // 5. Chickpea / Bengal Gram (Chana)
    let gramScore = 70;
    const gramReasons: string[] = [];
    if (soil.ph >= 6.8 && soil.ph <= 8.2) {
      gramScore += 7;
      gramReasons.push('Tolerant to mild alkalinity and requires low residual nitrogen.');
    }
    if (isHeavySoil) {
      gramScore += 8;
      gramReasons.push('Subsurface moisture in deep soils supports rainfed/minimal irrigation chana.');
    }
    recommendations.push({
      cropName: 'Chickpea / Bengal Gram (Digvijay)',
      suitabilityScore: Math.min(gramScore, 89),
      matchReasons: gramReasons,
      waterRequirement: 'LOW',
      durationDays: 105,
      estimatedYieldRange: '8 - 12 Quintals/Acre',
      projectedRoiPct: 48
    });

    // Sort by suitability score
    recommendations.sort((a, b) => b.suitabilityScore - a.suitabilityScore);

    return {
      id: randomUUID(),
      farmId,
      recommendations,
      inputSnapshot: {
        soilType: soil.soilType,
        ph: soil.ph,
        nitrogen: soil.nitrogen,
        phosphorus: soil.phosphorus,
        potassium: soil.potassium,
        organicCarbon: soil.organicCarbon,
        irrigationSource,
        season
      },
      modelVersion: 'RF-Agronomic-Rotation-V2.5',
      createdAt: new Date().toISOString()
    };
  }
}
