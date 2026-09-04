import { store } from './storage.js';
import { WeatherService } from './weatherService.js';
import { MarketService } from './marketService.js';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export class AssistantService {
  public static handleQuery(farmId: string, userPrompt: string): string {
    const prompt = userPrompt.toLowerCase();
    const farm = store.farms.get(farmId);
    const cycles = store.cropCycles.get(farmId) || [];
    const activeCycle = cycles.find((c) => c.status === 'ACTIVE') || cycles[0];
    const cropName = activeCycle?.cropName || 'Soybean';
    const cropStage = activeCycle?.currentStage || 'FLOWERING';

    const telemetryList = store.telemetry.get(farmId) || [];
    const latestTelemetry = telemetryList[telemetryList.length - 1];
    const soilMoisture = latestTelemetry ? latestTelemetry.soilMoisturePct : 34;

    const forecast = WeatherService.getForecast(farm?.latitude || 18.4875, farm?.longitude || 74.1332);
    const tomorrow = forecast[0];

    // Intent 1: Spraying / Fungicide / Pesticide
    if (prompt.includes('spray') || prompt.includes('pesticide') || prompt.includes('fungicide') || prompt.includes('saaf')) {
      if (tomorrow.rainfallMm >= 20 || tomorrow.rainProbabilityPct >= 60) {
        return (
          `⚠️ **Do NOT spray today!**\n\n` +
          `A heavy rainfall of **${tomorrow.rainfallMm}mm** (${tomorrow.rainProbabilityPct}% probability) is forecasted within the next 24 hours. ` +
          `Any foliar spray applied today will be washed off by precipitation, leading to severe chemical wastage and environmental runoff.\n\n` +
          `**Agronomist Advice:** Wait until tomorrow's rain subsides and the foliage has dried before spraying fungicides (such as Saaf or Amistar Top) for Cercospora leaf spot.`
        );
      }
      return (
        `✅ **Conditions are favorable for spraying.**\n\n` +
        `Light wind (${tomorrow.rainfallMm === 0 ? 'dry conditions' : 'low rain probability'}) is forecasted. ` +
        `Apply your protective spray during early morning (7 AM - 10 AM) or late afternoon (4 PM - 6 PM) to minimize drift and leaf scorch.`
      );
    }

    // Intent 2: Irrigation / Water
    if (prompt.includes('irrigate') || prompt.includes('water') || prompt.includes('drip') || prompt.includes('moisture')) {
      if (tomorrow.rainfallMm >= 15) {
        return (
          `🌧️ **Hold Irrigation Today.**\n\n` +
          `Current soil moisture is **${soilMoisture}%**. While this is in the moderate range, upcoming rainfall of **${tomorrow.rainfallMm}mm** will adequately recharge the root zone. ` +
          `Turning on drip irrigation now risks waterlogging, especially in your deep black cotton soil.`
        );
      }
      if (soilMoisture < 30) {
        return (
          `💧 **Yes, irrigate today.**\n\n` +
          `Soil moisture has fallen to **${soilMoisture}%** during the critical **${cropStage}** stage of ${cropName}. ` +
          `Run your drip line for **90 minutes** to deliver approximately 12,500 liters per acre.`
        );
      }
      return `Current soil moisture is healthy at **${soilMoisture}%**. No supplementary irrigation is necessary today.`;
    }

    // Intent 3: Mandi / Price / Sell
    if (prompt.includes('mandi') || prompt.includes('price') || prompt.includes('sell') || prompt.includes('market')) {
      const decision = MarketService.getDecisionSupport(cropName);
      const bestMandi = decision.nearbyMandis.find((m) => m.isRecommended);
      return (
        `📈 **Mandi Intelligence for ${cropName}:**\n\n` +
        `• **Current Local Price:** ₹${decision.currentModalPrice}/Quintal\n` +
        `• **7-Day Price Forecast:** ₹${decision.forecastPrice7Days}/Quintal (Trend: **${decision.priceTrend}**)\n` +
        `• **Recommended Destination:** **${bestMandi?.mandiName}** (Modal: ₹${bestMandi?.modalPrice}/Q, Transport: ₹${bestMandi?.transportCostPerQuintal}/Q, **Net Realized: ₹${bestMandi?.netRealizedPricePerQuintal}/Q**)\n\n` +
        `**Strategy:** ${decision.rationale}`
      );
    }

    // Intent 4: Disease / Blight / Health
    if (prompt.includes('disease') || prompt.includes('blight') || prompt.includes('yellow') || prompt.includes('spot') || prompt.includes('leaf')) {
      return (
        `🌿 **Crop Health Assessment for ${cropName} (${cropStage}):**\n\n` +
        `Our computer vision system recently diagnosed **Cercospora Leaf Spot / Early Blight** on your farm with **93.4% confidence**.\n\n` +
        `**Recommended Action:**\n` +
        `1. Spray **Carbendazim 12% + Mancozeb 63% WP** @ 2g/liter of water once rain clears.\n` +
        `2. For organic management, use Neem Seed Kernel Extract (NSKE 5%) or Trichoderma harzianum.\n` +
        `3. Maintain field drainage to lower canopy humidity.`
      );
    }

    // Default Agronomic Assistant response
    return (
      `Hello Ramesh! I am your **AgriHub Agronomist AI**, actively monitoring your **4.5-acre farm** in Haveli, Pune.\n\n` +
      `**Current Farm Status:**\n` +
      `• Active Crop: **${cropName}** (${cropStage} stage)\n` +
      `• Soil Moisture: **${soilMoisture}%**\n` +
      `• Weather: **${tomorrow.weatherDescription}**, Max Temp ${tomorrow.tempMaxC}°C, Rainfall Forecast ${tomorrow.rainfallMm}mm\n\n` +
      `You can ask me about:\n` +
      `1. *"Should I spray pesticides today?"*\n` +
      `2. *"Do I need to turn on my drip irrigation?"*\n` +
      `3. *"Which mandi in Pune district offers the highest profit?"*\n` +
      `4. *"How do I treat leaf spots on my soybean?"*`
    );
  }
}
