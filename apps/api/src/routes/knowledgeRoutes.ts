import { Router, Request, Response } from 'express';
import { store } from '../services/storage.js';

export const knowledgeRouter = Router();

// Schemes
knowledgeRouter.get('/schemes', (req: Request, res: Response) => {
  return res.json(store.schemes);
});

// Seeds
knowledgeRouter.get('/seeds', (req: Request, res: Response) => {
  const crop = req.query.crop as string;
  if (crop) {
    const filtered = store.seeds.filter((s) =>
      s.cropName.toLowerCase().includes(crop.toLowerCase())
    );
    return res.json(filtered);
  }
  return res.json(store.seeds);
});
