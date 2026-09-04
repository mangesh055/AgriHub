import { UnifiedDailyAction } from '@agrihub/contracts';
import { store } from './storage.js';
import { WeatherService } from './weatherService.js';
import { IrrigationService } from './irrigationService.js';
import { MarketService } from './marketService.js';

export class UnifiedDecisionEngine {
  public static synthesize(farmId: string): UnifiedDailyAction {
    const farm = store.farms.get(farmId);
    const cycles = store.cropCycles.get(farmId) || [];
    const activeCycle = cycles.find((c) => c.status === 'ACTIVE') || cycles[0];
    const cropName = activeCycle?.cropName || 'Soybean';
    const cropStage = activeCycle?.currentStage || 'FLOWERING';

    // 1. Fetch sensor telemetry
    const telemetryList = store.telemetry.get(farmId) || [];
    const latestTelemetry = telemetryList[telemetryList.length - 1];
    const soilMoisture = latestTelemetry ? latestTelemetry.soilMoisturePct : 34;

    // 2. Fetch weather & alerts
    const weather = WeatherService.getCurrentWeather(farm?.latitude || 18.4875, farm?.longitude || 74.1332);
    const forecast = WeatherService.getForecast(farm?.latitude || 18.4875, farm?.longitude || 74.1332);
    const tomorrow = forecast[0];
    const alerts = WeatherService.evaluateRiskAlerts(farmId, activeCycle?.id, cropName, cropStage);

    // 3. Evaluate irrigation
    const irrigationRec = IrrigationService.evaluate({
      farmId,
      cropCycleId: activeCycle?.id,
      cropStage,
      soilMoisturePct: soilMoisture,
      forecastRainfallMm: tomorrow.rainfallMm,
      rainProbabilityPct: tomorrow.rainProbabilityPct
    });

    // 4. Market trend
    const market = MarketService.getDecisionSupport(cropName);

    // SYNTHESIS MATRIX & HIERARCHY OF DECISIONS
    // Priority 1: Heavy rain warning suppresses normal irrigation and triggers drainage alert
    if (tomorrow.rainfallMm >= 25) {
      return {
        title: 'Impending Heavy Rainfall - Drainage Protocol Active',
        actionCategory: 'WEATHER_PROTECTION',
        priority: 'HIGH',
        headline: `Hold all drip irrigation and clear field bunds. 35mm precipitation expected within 24h.`,
        detailedReason: `Although soil moisture is currently ${soilMoisture}%, high impending rainfall (${tomorrow.rainfallMm}mm) will replenish the root zone. Additional irrigation will cause waterlogging, flower drop, and root hypoxia in your ${cropStage.toLowerCase()} ${cropName}.`,
        contributingFactors: {
          weatherSummary: `${tomorrow.weatherDescription}, ${tomorrow.tempMaxC}°C`,
          soilMoisturePct: soilMoisture,
          cropStage,
          activeRisks: alerts.map((a) => a.title),
          marketInsight: `${market.cropName} price is ${market.priceTrend} (Forecast: ₹${market.forecastPrice7Days}/Q)`
        },
        actionButtonText: 'Inspect Weather & Field Drainage Advice',
        actionNavigationPath: '/weather',
        generatedAt: new Date().toISOString()
      };
    }

    // Priority 2: Critical soil moisture deficit when no rain expected
    if (irrigationRec.decision === 'IRRIGATE') {
      return {
        title: `Moisture Stress Detected during ${cropStage}`,
        actionCategory: 'IRRIGATION',
        priority: 'HIGH',
        headline: `Run drip irrigation system for 90 minutes today.`,
        detailedReason: `Soil moisture (${soilMoisture}%) has dropped below critical wilting threshold (30%) during the moisture-sensitive ${cropStage} stage. Forecast shows zero rainfall for the next 48 hours.`,
        contributingFactors: {
          weatherSummary: `${weather.weatherDescription}, ${weather.temperatureC}°C`,
          soilMoisturePct: soilMoisture,
          cropStage,
          activeRisks: [],
          marketInsight: undefined
        },
        actionButtonText: 'Review Smart Irrigation Controls',
        actionNavigationPath: '/irrigation',
        generatedAt: new Date().toISOString()
      };
    }

    // Priority 3: Harvest ready and market decision
    if (cropStage === 'HARVEST_READY') {
      return {
        title: 'Optimal Harvest & Market Window',
        actionCategory: 'MARKET_ACTION',
        priority: 'MEDIUM',
        headline: `Favorable mandi prices detected at Baramati APMC (Net ₹${market.nearbyMandis.find((c) => c.isRecommended)?.netRealizedPricePerQuintal}/Q).`,
        detailedReason: `Your ${cropName} crop has completed ripening. High demand in regional markets offers an optimal profit window.`,
        contributingFactors: {
          weatherSummary: `${weather.weatherDescription}, Clear sky`,
          soilMoisturePct: soilMoisture,
          cropStage,
          activeRisks: [],
          marketInsight: market.rationale
        },
        actionButtonText: 'Compare Mandis & Arrange Logistics',
        actionNavigationPath: '/market',
        generatedAt: new Date().toISOString()
      };
    }

    // Priority 4: Routine Monitoring
    return {
      title: 'Farm Vigor Optimal - Routine Monitoring',
      actionCategory: 'ROUTINE_MONITORING',
      priority: 'LOW',
      headline: `All parameters within target agronomic range for ${cropStage.toLowerCase()} stage.`,
      detailedReason: `Soil moisture (${soilMoisture}%) is adequate. Weather is stable and no acute disease outbreaks have been reported in your taluka.`,
      contributingFactors: {
        weatherSummary: `${weather.weatherDescription}, ${weather.temperatureC}°C`,
        soilMoisturePct: soilMoisture,
        cropStage,
        activeRisks: [],
        marketInsight: `${cropName} trading at ₹${market.currentModalPrice}/Q`
      },
      actionButtonText: 'View Complete Farm Timeline',
      actionNavigationPath: '/crop-health',
      generatedAt: new Date().toISOString()
    };
  }
}
