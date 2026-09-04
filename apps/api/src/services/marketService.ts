import {
  MandiPriceRecord,
  MandiComparison,
  MarketDecisionSupport
} from '@agrihub/contracts';
import { store } from './storage.js';

export class MarketService {
  public static getMandiPrices(cropName: string = 'Soybean'): MandiPriceRecord[] {
    return store.mandis.filter(
      (m) => m.cropName.toLowerCase() === cropName.toLowerCase()
    );
  }

  public static getMandiComparison(
    cropName: string = 'Soybean',
    quantityQuintals: number = 45
  ): MandiComparison[] {
    // Distance from Uruli Kanchan demo farm to regional APMCs
    const mandiDistances: Record<string, number> = {
      'Pune APMC (Gultekdi)': 28, // km
      'Baramati APMC': 64, // km
      'Shirur APMC': 48 // km
    };

    const FREIGHT_PER_KM_PER_Q = 3.2; // ₹ per km per quintal

    const prices = this.getMandiPrices(cropName);
    const comparisons: MandiComparison[] = prices.map((m) => {
      const dist = mandiDistances[m.mandiName] || 40;
      const transportCost = Math.round(dist * FREIGHT_PER_KM_PER_Q);
      const netRealized = m.modalPrice - transportCost;
      return {
        mandiId: m.id,
        mandiName: m.mandiName,
        distanceKm: dist,
        modalPrice: m.modalPrice,
        transportCostPerQuintal: transportCost,
        netRealizedPricePerQuintal: netRealized,
        isRecommended: false
      };
    });

    // Find highest net realized price
    let maxNet = -1;
    let bestIdx = 0;
    comparisons.forEach((c, idx) => {
      if (c.netRealizedPricePerQuintal > maxNet) {
        maxNet = c.netRealizedPricePerQuintal;
        bestIdx = idx;
      }
    });

    if (comparisons.length > 0) {
      comparisons[bestIdx].isRecommended = true;
    }

    return comparisons;
  }

  public static getDecisionSupport(cropName: string = 'Soybean'): MarketDecisionSupport {
    const comparisons = this.getMandiComparison(cropName);
    const currentPrice = comparisons[0]?.modalPrice || 4850;
    const forecastPrice7Days = currentPrice + 280; // Projected upward swing
    const holdingCostPerWeek = 45; // Storage + bag handling per quintal
    const netGain = forecastPrice7Days - currentPrice - holdingCostPerWeek;

    const action = netGain > 80 ? 'HOLD_FOR_TARGET' : 'SELL_NOW';
    const rationale =
      action === 'HOLD_FOR_TARGET'
        ? `Upcoming festival demand and reduced arrivals are forecasted to raise prices from ₹${currentPrice} to ₹${forecastPrice7Days}/Q. Net gain after holding cost (₹${holdingCostPerWeek}/Q) is +₹${netGain}/Q. Recommendation: Hold stock in warehouse for 7-10 days.`
        : `Prices are near local seasonal peak. Holding costs will erode margins. Recommendation: Sell harvest at ${comparisons.find((c) => c.isRecommended)?.mandiName}.`;

    return {
      cropName,
      currentModalPrice: currentPrice,
      forecastPrice7Days,
      priceTrend: 'RISING',
      action,
      rationale,
      holdingCostPerQuintalPerWeek: holdingCostPerWeek,
      netHoldingGainProjected: netGain,
      nearbyMandis: comparisons
    };
  }
}
