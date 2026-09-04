import { ProfitSummary, ExpenseCategory } from '@agrihub/contracts';
import { store } from './storage.js';
import { MarketService } from './marketService.js';

export class ProfitService {
  public static calculate(farmId: string): ProfitSummary {
    const expenses = store.expenses.get(farmId) || [];
    const farm = store.farms.get(farmId);
    const activeCycles = store.cropCycles.get(farmId) || [];
    const activeCycle = activeCycles.find((c) => c.status === 'ACTIVE') || activeCycles[0];

    let totalExpenses = 0;
    const expensesByCategory: Record<string, number> = {
      SEEDS: 0,
      FERTILIZERS: 0,
      PESTICIDES: 0,
      IRRIGATION_ELECTRICITY: 0,
      LABOR: 0,
      MACHINERY_FUEL: 0,
      TRANSPORT: 0,
      STORAGE: 0,
      OTHER: 0
    };

    expenses.forEach((e) => {
      totalExpenses += e.amount;
      expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + e.amount;
    });

    // Agronomic Yield model: Average 11.5 quintals / acre for Soybean on Black Cotton
    const area = farm?.areaAcres || 4.5;
    const estimatedYieldQuintals = Math.round(area * 11.5);

    // Revenue calculation based on best net mandi price
    const cropName = activeCycle?.cropName || 'Soybean';
    const comparisons = MarketService.getMandiComparison(cropName);
    const bestPrice = comparisons.find((c) => c.isRecommended)?.netRealizedPricePerQuintal || 4980;

    const estimatedRevenue = estimatedYieldQuintals * bestPrice;
    const netProfitProjected = estimatedRevenue - totalExpenses;
    const roiPercentage = totalExpenses > 0 ? Math.round((netProfitProjected / totalExpenses) * 100) : 0;

    return {
      totalExpenses,
      expensesByCategory: expensesByCategory as any,
      estimatedYieldQuintals,
      estimatedRevenue,
      netProfitProjected,
      roiPercentage
    };
  }
}
