import { Router, Request, Response } from 'express';
import { CropRecommendationService } from '../services/cropRecommendationService.js';
import { DiseaseService } from '../services/diseaseService.js';
import { store } from '../services/storage.js';
import { db } from '../services/db.js';

export const cropRouter = Router();

// Crop Recommendation
cropRouter.post('/recommendations', async (req: Request, res: Response) => {
  const { farmId, season } = req.body;
  const farms = await db.getFarms();
  const farm = farms.find((f) => f.id === farmId) || store.farms.get(farmId);
  const soilRecords = await db.getSoilRecords(farmId);
  const latestSoil = soilRecords[0] || (store.soilRecords.get(farmId) || [])[0];

  if (!farm || !latestSoil) {
    return res.status(400).json({
      error: 'Farm and Soil Record required to generate agronomic recommendations'
    });
  }

  const result = CropRecommendationService.recommend({
    farmId,
    soil: latestSoil,
    season,
    irrigationSource: farm.irrigationSource
  });

  return res.json(result);
});

// Disease Diagnosis
cropRouter.post('/:cropCycleId/diagnose', (req: Request, res: Response) => {
  const { farmId, imageFileName } = req.body;
  const result = DiseaseService.diagnose(req.params.cropCycleId, farmId, imageFileName);

  const existing = store.diseaseDiagnoses.get(req.params.cropCycleId) || [];
  existing.unshift(result);
  store.diseaseDiagnoses.set(req.params.cropCycleId, existing);

  return res.json(result);
});

cropRouter.get('/:cropCycleId/diagnoses', (req: Request, res: Response) => {
  const existing = store.diseaseDiagnoses.get(req.params.cropCycleId) || [];
  return res.json(existing);
});
