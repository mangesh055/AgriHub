import {
  SoilRecord,
  CropRecommendationItem,
  CropRecommendationResult
} from '@agrihub/contracts';
import { randomUUID } from 'crypto';

interface RecommendationInput {
  farmId: string;
  farm?: any;
  soil: SoilRecord;
  season?: string;
  irrigationSource: string;
}

const ML_SERVICE_URL = process.env.AGRIHUB_ML_URL || 'http://127.0.0.1:8000';
const ML_API_KEY = process.env.AGRIHUB_API_KEY || 'agrihub-prod-key-2026';

export class CropRecommendationService {
  /**
   * Generates Top-3 Crop Recommendations.
   * Primary: Baramati ML Microservice (calibrated via ICAR-NIASM & KVK Baramati).
   * Fallback: Local Baramati Agronomic Rule-Engine.
   */
  public static async recommend(input: RecommendationInput): Promise<CropRecommendationResult> {
    const { farmId, farm, soil, season = 'KHARIF', irrigationSource } = input;

    // 1. Resolve Baramati microzone and soil type from farm & soil records
    const village = farm?.village || 'Malegaon';
    const vLower = village.toLowerCase();

    // Base microzone from village or water sources
    let microzone: 'canal_command' | 'well_irrigated' | 'rainfed_scarcity' = 'canal_command';
    if (vLower.includes('supa') || vLower.includes('morgaon') || vLower.includes('khandaj') || vLower.includes('anjangaon')) {
      microzone = 'rainfed_scarcity';
    } else if (vLower.includes('shardanagar') || vLower.includes('jalochi') || vLower.includes('kashti') || vLower.includes('rui') || vLower.includes('songaon')) {
      microzone = 'well_irrigated';
    } else {
      microzone = 'canal_command';
    }

    // Resolve soil type: prioritize farmer's registered soil record
    let soilType: 'deep_black_vertisol' | 'medium_clay_loam' | 'shallow_murrum' = 'deep_black_vertisol';
    const registeredSoil = (soil?.soilType || '').toLowerCase();

    if (registeredSoil.includes('shallow') || registeredSoil.includes('murrum') || registeredSoil.includes('red') || registeredSoil.includes('sandy')) {
      soilType = 'shallow_murrum';
    } else if (registeredSoil.includes('medium') || registeredSoil.includes('alluvial') || registeredSoil.includes('clay_loam') || registeredSoil.includes('loam') || registeredSoil.includes('silt')) {
      soilType = 'medium_clay_loam';
    } else if (registeredSoil.includes('deep') || registeredSoil.includes('vertisol') || registeredSoil.includes('black')) {
      soilType = 'deep_black_vertisol';
    } else {
      // Microzone fallback if not specified
      soilType = microzone === 'rainfed_scarcity' ? 'shallow_murrum' : microzone === 'well_irrigated' ? 'medium_clay_loam' : 'deep_black_vertisol';
    }

    // Map season
    const sLower = season.toLowerCase();
    let mappedSeason = 'kharif';
    if (sLower.includes('annual') || sLower.includes('adsali') || sLower.includes('suru')) {
      mappedSeason = 'annual';
    } else if (sLower.includes('rabi') || sLower.includes('winter')) {
      mappedSeason = 'rabi';
    } else if (sLower.includes('zaid') || sLower.includes('summer')) {
      mappedSeason = 'summer';
    }

    // Map water resources and irrigation methods
    const allWaterTokens = [
      ...(Array.isArray(farm?.waterSources) ? farm.waterSources : []),
      farm?.irrigationSource || '',
      irrigationSource || ''
    ].join(' ').toUpperCase();

    const isCanal = allWaterTokens.includes('CANAL');
    const isRiver = allWaterTokens.includes('RIVER');
    const isBorewell = allWaterTokens.includes('BOREWELL');
    const isOpenWell = allWaterTokens.includes('OPEN_WELL') || allWaterTokens.includes('WELL');
    const isFarmPond = allWaterTokens.includes('FARM_POND') || allWaterTokens.includes('POND');
    const isRainfed = allWaterTokens.includes('RAINFED');

    const isDrip = allWaterTokens.includes('DRIP');
    const isSprinkler = allWaterTokens.includes('SPRINKLER');
    const isFlood = allWaterTokens.includes('FLOOD');

    // Categorize primary irrigation source
    let mappedSource: 'canal' | 'borewell' | 'open_well' | 'river' | 'farm_pond' | 'rainfed' = 'canal';
    if (isCanal) mappedSource = 'canal';
    else if (isRiver) mappedSource = 'river';
    else if (isBorewell) mappedSource = 'borewell';
    else if (isOpenWell) mappedSource = 'open_well';
    else if (isFarmPond) mappedSource = 'farm_pond';
    else if (isRainfed) mappedSource = 'rainfed';
    else mappedSource = 'canal';

    // Categorize irrigation method
    let irrigationMethod: 'drip' | 'sprinkler' | 'flood' | 'rainfed' = 'drip';
    if (isDrip) irrigationMethod = 'drip';
    else if (isSprinkler) irrigationMethod = 'sprinkler';
    else if (isFlood) irrigationMethod = 'flood';
    else if (isRainfed && !isCanal && !isBorewell && !isOpenWell) irrigationMethod = 'rainfed';
    else irrigationMethod = 'drip';

    // Derive volume and reliability
    let waterAvailability: 'very_high' | 'high' | 'medium' | 'low' | 'scarce' = 'high';
    if (isCanal || isRiver) waterAvailability = isDrip ? 'very_high' : 'high';
    else if (isBorewell || isOpenWell) waterAvailability = 'medium';
    else if (isFarmPond) waterAvailability = 'medium';
    else if (isRainfed) waterAvailability = 'low';

    let waterReliability: 'highly_reliable' | 'reliable' | 'moderate' | 'unreliable' = 'reliable';
    if (isCanal) waterReliability = 'highly_reliable';
    else if (isRiver || isBorewell) waterReliability = 'reliable';
    else if (isOpenWell || isFarmPond) waterReliability = 'moderate';
    else if (isRainfed) waterReliability = 'unreliable';

    // 2. Attempt prediction from Baramati ML Microservice
    try {
      const mlPayload = {
        district: 'Pune',
        taluka: 'Baramati',
        village,
        microzone,
        soil_type: soilType,
        season: mappedSeason,
        farm_area_acres: Number(farm?.areaAcres) || 4.0,
        irrigation_source: mappedSource,
        water_availability: waterAvailability,
        seasonal_water_reliability: waterReliability,
        irrigation_method: irrigationMethod,
        previous_crop: (soil?.previousCrop || 'Sugarcane').toLowerCase(),
        soil_test: {
          nitrogen: soil?.nitrogen ? Number(soil.nitrogen) : null,
          phosphorus: soil?.phosphorus ? Number(soil.phosphorus) : null,
          potassium: soil?.potassium ? Number(soil.potassium) : null,
          ph: soil?.ph ? Number(soil.ph) : null,
          organic_carbon: soil?.organicCarbon ? Number(soil.organicCarbon) : null,
          source: soil?.nitrogen ? 'soil_test' : 'unknown'
        },
        weather: {
          temperature_avg: 27.5,
          temperature_min: 20.0,
          temperature_max: 34.0,
          humidity_avg: 68.0,
          rainfall: 480.0,
          rainfall_probability: 45.0,
          wind_speed: 13.0
        }
      };

      const mlRes = await fetch(`${ML_SERVICE_URL}/api/v1/recommend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': ML_API_KEY
        },
        body: JSON.stringify(mlPayload),
        signal: AbortSignal.timeout(3000)
      });

      if (mlRes.ok) {
        const mlData = await mlRes.json();
        if (mlData.recommendations && mlData.recommendations.length > 0) {
          console.log(`[CropRecommendationService] Live prediction received from Baramati ML Service (${mlData.recommendations.length} crops)`);

          const mappedRecs: CropRecommendationItem[] = mlData.recommendations.map((item: any) => {
            const primaryVariety = item.kvk_varieties && item.kvk_varieties.length > 0 ? item.kvk_varieties[0] : '';
            const displayName = primaryVariety ? `${item.crop_name} (${primaryVariety})` : item.crop_name;
            const duration = Array.isArray(item.duration_days) ? item.duration_days[0] : (item.duration_days || 95);

            // Yield range estimation based on KVK trials
            let yieldRange = '12 - 16 Quintals/Acre';
            let roi = 42;
            if (item.crop === 'sugarcane') {
              yieldRange = '40 - 55 Tonnes/Acre (Adsali/Suru)';
              roi = 48;
            } else if (item.crop === 'soybean') {
              yieldRange = '10 - 14 Quintals/Acre';
              roi = 45;
            } else if (item.crop === 'wheat') {
              yieldRange = '18 - 24 Quintals/Acre';
              roi = 39;
            } else if (item.crop === 'onion') {
              yieldRange = '90 - 130 Quintals/Acre';
              roi = 58;
            } else if (item.crop === 'sorghum') {
              yieldRange = '8 - 12 Quintals/Acre (Maldandi)';
              roi = 36;
            } else if (item.crop === 'chickpea') {
              yieldRange = '8 - 11 Quintals/Acre';
              roi = 44;
            } else if (item.crop === 'maize') {
              yieldRange = '22 - 28 Quintals/Acre';
              roi = 40;
            }

            return {
              cropName: displayName,
              marathiName: item.marathi_name,
              kvkVarieties: item.kvk_varieties || [],
              suitabilityScore: Math.round(item.confidence_pct || (item.final_score * 100)),
              matchReasons: item.reasons || [],
              tradeoffs: item.tradeoffs || [],
              waterRequirement: (item.water_requirement || 'MEDIUM').toUpperCase(),
              waterFeasibilityScore: item.water_feasibility_score,
              regionalScore: item.regional_score,
              agronomicScore: item.agronomic_score,
              droughtTolerance: item.drought_tolerance,
              regionalStatus: item.regional_status,
              durationDays: duration,
              estimatedYieldRange: yieldRange,
              projectedRoiPct: roi
            };
          });

          return {
            id: randomUUID(),
            farmId,
            recommendations: mappedRecs,
            inputSnapshot: mlPayload,
            modelVersion: mlData.model_version || 'agrihub-baramati-ml-v2.0',
            microzone: mlData.farmer_summary?.microzone || microzone,
            village,
            soilTestStatus: mlData.soil_test_status || 'KVK Baramati Agronomic Standards',
            researchPartner: 'ICAR-NIASM & KVK Baramati',
            createdAt: new Date().toISOString()
          };
        }
      }
    } catch (err: any) {
      console.warn('[CropRecommendationService] ML Microservice not responding, executing Baramati agronomic fallback:', err?.message || err);
    }

    // 3. Fallback: Local Baramati Agronomic Rule-Engine
    const recommendations: CropRecommendationItem[] = [];

    // Sugarcane (Baramati Canal Belt Champion)
    if (mappedSeason === 'annual' || isCanal) {
      recommendations.push({
        cropName: 'Sugarcane (Co 86032 - Nira)',
        marathiName: 'ऊस (को ८६०३२ - नीरा)',
        kvkVarieties: ['Co 86032 (Nira)', 'VSI 08005', 'MS 10001'],
        suitabilityScore: isCanal ? 95 : 65,
        matchReasons: [
          'High adaptability in Nira Left Bank Canal command with Deep Black Vertisols.',
          'Certified KVK Baramati variety Co 86032 offers high sucrose content (13.5%).',
          'Heavy soil profile retains adequate capillary moisture.'
        ],
        tradeoffs: [
          'Requires 1800-2500 mm water across 300+ days; KVK recommends drip automation.',
          'Risk of secondary salinity if flood irrigation is practiced.'
        ],
        waterRequirement: 'VERY_HIGH',
        waterFeasibilityScore: isCanal ? 0.95 : 0.45,
        regionalScore: 0.95,
        durationDays: 360,
        estimatedYieldRange: '45 - 55 Tonnes/Acre',
        projectedRoiPct: 48
      });
    }

    // Soybean (KVK Shardanagar Rainfed/Drip Champion)
    recommendations.push({
      cropName: 'Soybean (Phule Sangam - KDS-726)',
      marathiName: 'सोयाबीन (फुले संगम)',
      kvkVarieties: ['Phule Sangam (KDS-726)', 'JS-335', 'Phule Kimaya'],
      suitabilityScore: isRainfed ? 74 : 92,
      matchReasons: [
        'KVK Baramati flagship variety Phule Sangam exhibits rust and pod-shattering resistance.',
        'Biological nitrogen fixation replenishes soil exhausted by previous harvest.',
        'Optimal match for Baramati Kharif planting window (June 15 - July 15).'
      ],
      tradeoffs: [
        'Excessive rainfall during harvesting (Sept-Oct) can cause seed discoloration.'
      ],
      waterRequirement: 'MEDIUM',
      waterFeasibilityScore: 0.88,
      regionalScore: 0.92,
      durationDays: 100,
      estimatedYieldRange: '11 - 15 Quintals/Acre',
      projectedRoiPct: 45
    });

    // Rabi Jowar (Supa / Scarcity Champion)
    recommendations.push({
      cropName: 'Rabi Jowar (Maldandi M 35-1)',
      marathiName: 'रब्बी ज्वारी (मालदांडी एम ३५-१)',
      kvkVarieties: ['Maldandi M 35-1', 'Phule Revati', 'Phule Vasudha'],
      suitabilityScore: microzone === 'rainfed_scarcity' ? 96 : 85,
      matchReasons: [
        'ICAR-NIASM benchmark scarcity crop with extreme abiotic drought tolerance.',
        'Excels in Shallow Murrum and moisture-stress pockets of Supa and Morgaon.',
        'Produces premium pearly grain and superior nutritional cattle stover.'
      ],
      tradeoffs: [
        'Gross cash yield is lower than commercial sugarcane or onion.'
      ],
      waterRequirement: 'LOW',
      waterFeasibilityScore: 0.95,
      regionalScore: 0.96,
      durationDays: 115,
      estimatedYieldRange: '9 - 13 Quintals/Acre',
      projectedRoiPct: 38
    });

    // Red Onion
    recommendations.push({
      cropName: 'Red Onion (Bhima Super)',
      marathiName: 'कांदा (भीमा सुपर)',
      kvkVarieties: ['Bhima Super', 'Bhima Red', 'Bhima Kiran'],
      suitabilityScore: 84,
      matchReasons: [
        'DOGR/KVK recommended variety with uniform bulb size and bulb-rotting tolerance.',
        'High cash liquidity at Baramati and Pandare APMC market yards.'
      ],
      tradeoffs: [
        'Sensitive to thrips and purple blotch under humid conditions; requires disciplined scouting.'
      ],
      waterRequirement: 'MEDIUM',
      waterFeasibilityScore: 0.82,
      regionalScore: 0.85,
      durationDays: 120,
      estimatedYieldRange: '95 - 130 Quintals/Acre',
      projectedRoiPct: 56
    });

    // Chickpea (Rabi)
    recommendations.push({
      cropName: 'Chickpea / Chana (Phule Vikram)',
      marathiName: 'हरभरा (फुले विक्रम)',
      kvkVarieties: ['Phule Vikram', 'Digvijay', 'Vijay'],
      suitabilityScore: 82,
      matchReasons: [
        'Ideal for mechanical harvesting with erect plant architecture.',
        'Low water footprint; thrives on residual moisture after Kharif harvest.'
      ],
      tradeoffs: [
        'Vulnerable to pod borer (Helicoverpa) during pod development.'
      ],
      waterRequirement: 'LOW',
      waterFeasibilityScore: 0.90,
      regionalScore: 0.88,
      durationDays: 105,
      estimatedYieldRange: '8 - 12 Quintals/Acre',
      projectedRoiPct: 44
    });

    recommendations.sort((a, b) => b.suitabilityScore - a.suitabilityScore);

    return {
      id: randomUUID(),
      farmId,
      recommendations,
      inputSnapshot: {
        village,
        microzone,
        soilType,
        season: mappedSeason,
        irrigationSource
      },
      modelVersion: 'Baramati-Agronomic-Heuristic-v2.0',
      microzone,
      village,
      soilTestStatus: 'Baramati Micro-Zone Default (Fallback Heuristic)',
      researchPartner: 'ICAR-NIASM & KVK Baramati',
      createdAt: new Date().toISOString()
    };
  }
}
