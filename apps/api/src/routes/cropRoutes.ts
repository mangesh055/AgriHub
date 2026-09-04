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
  const farm = (farmId ? farms.find((f) => f.id === farmId) : null) || farms[0] || store.farms.get(farmId) || store.farms.get('33333333-3333-3333-3333-333333333333');
  const targetFarmId = farm?.id || farmId || '33333333-3333-3333-3333-333333333333';
  const soilRecords = await db.getSoilRecords(targetFarmId);
  const latestSoil = soilRecords[0] || (store.soilRecords.get(targetFarmId) || [])[0] || (store.soilRecords.get('33333333-3333-3333-3333-333333333333') || [])[0] || {
    id: 'default-soil-rec',
    farmId: targetFarmId,
    soilType: 'BLACK_COTTON',
    ph: 7.2,
    nitrogen: 48,
    phosphorus: 22,
    potassium: 290,
    organicCarbonPct: 0.65,
    electricalConductivity: 0.42,
    previousCrop: 'Cotton',
    previousYieldQuintals: 11,
    testDate: new Date().toISOString().split('T')[0]
  };

  const result = CropRecommendationService.recommend({
    farmId: targetFarmId,
    soil: latestSoil,
    season,
    irrigationSource: farm?.irrigationSource || 'DRIP'
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
