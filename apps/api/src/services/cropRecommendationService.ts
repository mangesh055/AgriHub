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

    // Agronomic Suitability Engine
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
    if (soil.soilType === 'BLACK_COTTON' || soil.soilType === 'CLAY_LOAM') {
      soybeanScore += 5;
      soybeanReasons.push(`Black cotton soil provides excellent moisture retentivity.`);
    }
    recommendations.push({
      cropName: 'Soybean',
      suitabilityScore: Math.min(soybeanScore, 98),
      matchReasons: soybeanReasons,
      waterRequirement: 'MEDIUM',
      durationDays: 95,
      estimatedYieldRange: '10 - 14 Quintals/Acre',
      projectedRoiPct: 42
    });

    // 2. Cotton Rule
    let cottonScore = 75;
    const cottonReasons: string[] = [];
    if (soil.soilType === 'BLACK_COTTON') {
      cottonScore += 10;
      cottonReasons.push('Deep black soil provides deep root anchorage and water retention.');
    }
    if (irrigationSource === 'DRIP') {
      cottonScore += 8;
      cottonReasons.push('Drip irrigation enables precision fertigation during square formation.');
    }
    recommendations.push({
      cropName: 'Bt Cotton',
      suitabilityScore: Math.min(cottonScore, 92),
      matchReasons: cottonReasons,
      waterRequirement: 'HIGH',
      durationDays: 160,
      estimatedYieldRange: '12 - 16 Quintals/Acre',
      projectedRoiPct: 38
    });

    // 3. Onion Rule (Late Kharif / Rabi)
    let onionScore = 70;
    const onionReasons: string[] = [];
    if (soil.ph >= 6.0 && soil.ph <= 7.5) {
      onionScore += 8;
      onionReasons.push(`Soil pH (${soil.ph}) is well-suited for bulb development.`);
    }
    if (soil.organicCarbon >= 0.6) {
      onionScore += 7;
      onionReasons.push(`Organic carbon (${soil.organicCarbon}%) provides friable root structure.`);
    }
    recommendations.push({
      cropName: 'Red Onion (Late Kharif)',
      suitabilityScore: Math.min(onionScore, 88),
      matchReasons: onionReasons,
      waterRequirement: 'MEDIUM',
      durationDays: 120,
      estimatedYieldRange: '80 - 120 Quintals/Acre',
      projectedRoiPct: 55
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
      modelVersion: 'RF-Agronomic-V2.1',
      createdAt: new Date().toISOString()
    };
  }
}
