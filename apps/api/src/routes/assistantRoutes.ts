import { Router, Request, Response } from 'express';
import { AssistantService } from '../services/assistantService.js';
import { store } from '../services/storage.js';

export const assistantRouter = Router();

assistantRouter.post('/chat', (req: Request, res: Response) => {
  const { farmId, message } = req.body;
  const targetFarmId = farmId || Array.from(store.farms.keys())[0];

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message string is required' });
  }

  const reply = AssistantService.handleQuery(targetFarmId, message);
  return res.json({
    reply,
    timestamp: new Date().toISOString()
  });
});
