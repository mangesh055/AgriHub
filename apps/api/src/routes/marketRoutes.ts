import { Router, Request, Response } from 'express';
import { MarketService } from '../services/marketService.js';

export const marketRouter = Router();

marketRouter.get('/prices', (req: Request, res: Response) => {
  const crop = (req.query.crop as string) || 'Soybean';
  const prices = MarketService.getMandiPrices(crop);
  return res.json(prices);
});

marketRouter.get('/comparison', (req: Request, res: Response) => {
  const crop = (req.query.crop as string) || 'Soybean';
  const quantity = Number(req.query.quantity || 45);
  const comparisons = MarketService.getMandiComparison(crop, quantity);
  return res.json(comparisons);
});

marketRouter.get('/decision-support', (req: Request, res: Response) => {
  const crop = (req.query.crop as string) || 'Soybean';
  const support = MarketService.getDecisionSupport(crop);
  return res.json(support);
});
