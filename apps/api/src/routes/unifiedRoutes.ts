import { Router, Request, Response } from 'express';
import { UnifiedDecisionEngine } from '../services/unifiedDecisionEngine.js';
import { store } from '../services/storage.js';

export const unifiedRouter = Router();

unifiedRouter.get('/action', (req: Request, res: Response) => {
  const farmId = (req.query.farmId as string) || Array.from(store.farms.keys())[0];
  if (!farmId) {
    return res.status(404).json({ error: 'No farm found' });
  }

  const action = UnifiedDecisionEngine.synthesize(farmId);
  return res.json(action);
});
