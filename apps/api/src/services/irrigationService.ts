import {
  IrrigationRecommendation,
  CropStage
} from '@agrihub/contracts';
import { randomUUID } from 'crypto';

interface IrrigationEvalInput {
  farmId: string;
  cropCycleId?: string;
  cropStage?: CropStage;
  soilMoisturePct: number;
  forecastRainfallMm: number;
  rainProbabilityPct: number;
}

export class IrrigationService {
  public static evaluate(input: IrrigationEvalInput): IrrigationRecommendation {
    const {
      farmId,
      cropCycleId,
      cropStage = 'FLOWERING',
      soilMoisturePct,
      forecastRainfallMm,
      rainProbabilityPct
    } = input;

    // Agronomic thresholds for Soybean / Drip
    const WILTING_THRESHOLD = 30; // % moisture
    const FIELD_CAPACITY = 65; // % moisture

    // Scenario 1: Excess Moisture or Waterlogging Risk
    if (soilMoisturePct > FIELD_CAPACITY) {
      return {
        id: randomUUID(),
        farmId,
        cropCycleId,
        decision: 'REDUCE_OR_DRAIN',
        urgency: 'HIGH',
        reason: `Soil moisture (${soilMoisturePct}%) exceeds field capacity (${FIELD_CAPACITY}%). Risk of root hypoxia and collar rot.`,
        waterLitersRecommended: 0,
        runTimeMinutesRecommended: 0,
        metricsSnapshot: {
          soilMoisturePct,
          forecastRainfallMm,
          cropStage
        },
        createdAt: new Date().toISOString()
      };
    }

    // Scenario 2: Impending Rain Override (Rainfall >= 15mm or prob >= 65%)
    if (forecastRainfallMm >= 15 || rainProbabilityPct >= 65) {
      return {
        id: randomUUID(),
        farmId,
        cropCycleId,
        decision: 'WAIT',
        urgency: 'MEDIUM',
        reason: `Rainfall anticipated (${forecastRainfallMm}mm, ${rainProbabilityPct}% probability). Conserve irrigation water and energy; recheck moisture post-rain.`,
        waterLitersRecommended: 0,
        runTimeMinutesRecommended: 0,
        metricsSnapshot: {
          soilMoisturePct,
          forecastRainfallMm,
          cropStage
        },
        createdAt: new Date().toISOString()
      };
    }

    // Scenario 3: Soil moisture below threshold and dry forecast
    if (soilMoisturePct < WILTING_THRESHOLD) {
      return {
        id: randomUUID(),
        farmId,
        cropCycleId,
        decision: 'IRRIGATE',
        urgency: 'HIGH',
        reason: `Soil moisture (${soilMoisturePct}%) has fallen below critical threshold (${WILTING_THRESHOLD}%) during moisture-sensitive ${cropStage} stage. Immediate drip irrigation recommended.`,
        waterLitersRecommended: 12500, // liters per acre
        runTimeMinutesRecommended: 90, // minutes
        metricsSnapshot: {
          soilMoisturePct,
          forecastRainfallMm,
          cropStage
        },
        createdAt: new Date().toISOString()
      };
    }

    // Scenario 4: Adequate moisture
    return {
      id: randomUUID(),
      farmId,
      cropCycleId,
      decision: 'WAIT',
      urgency: 'LOW',
      reason: `Current soil moisture (${soilMoisturePct}%) is optimal for root uptake. No supplementary irrigation required today.`,
      waterLitersRecommended: 0,
      runTimeMinutesRecommended: 0,
      metricsSnapshot: {
        soilMoisturePct,
        forecastRainfallMm,
        cropStage
      },
      createdAt: new Date().toISOString()
    };
  }
}
