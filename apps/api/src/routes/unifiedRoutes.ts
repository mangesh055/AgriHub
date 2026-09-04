import { Router, Request, Response } from 'express';
import { UnifiedDecisionEngine } from '../services/unifiedDecisionEngine.js';
import { store } from '../services/storage.js';

export const unifiedRouter = Router();

unifiedRouter.get('/action', (req: Request, res: Response) => {
  const farmId = req.query.farmId as string;
  if (!farmId || farmId === 'undefined' || farmId === 'null') {
    return res.json(null);
  }

  const action = UnifiedDecisionEngine.synthesize(farmId);
  return res.json(action);
});
