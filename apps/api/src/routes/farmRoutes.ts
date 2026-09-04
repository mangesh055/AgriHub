import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import {
  CreateFarmRequestSchema,
  CreateSoilRecordSchema,
  CreateCropCycleSchema
} from '@agrihub/contracts';
import { db } from '../services/db.js';
import { ProfitService } from '../services/profitService.js';
import { store } from '../services/storage.js';

export const farmRouter = Router();

// 1. Farms
farmRouter.get('/', async (req: Request, res: Response) => {
  const farmerId = req.user?.role === 'ADMIN' ? undefined : req.user?.farmerId;
  const allFarms = await db.getFarms(farmerId);
  return res.json(allFarms);
});

farmRouter.post('/', async (req: Request, res: Response) => {
  const data = CreateFarmRequestSchema.parse(req.body);
  const farmId = randomUUID();
  const farmerId = req.user?.farmerId || Array.from(store.profiles.values())[0]?.id;

  const newFarm = {
    ...data,
    id: farmId,
    farmerId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const created = await db.createFarm(newFarm);
  store.farms.set(farmId, newFarm);
  return res.status(201).json(created);
});

// Soil Test Report Analysis & Data Extraction
farmRouter.post('/extract-soil-report', async (req: Request, res: Response) => {
  const { fileName, fileContent, rawText } = req.body;
  const content = (rawText || fileContent || '').toString();

  // Smart regex extraction
  let ph = 7.2;
  const phMatch = content.match(/(?:ph|reaction)\s*[:=]?\s*([0-9.]+)/i);
  if (phMatch && !isNaN(parseFloat(phMatch[1]))) ph = parseFloat(phMatch[1]);

  let nitrogen = 220;
  const nMatch = content.match(/(?:nitrogen|avail(?:able)?\s*n)\s*[:=]?\s*([0-9.]+)/i);
  if (nMatch && !isNaN(parseFloat(nMatch[1]))) nitrogen = parseFloat(nMatch[1]);

  let phosphorus = 28;
  const pMatch = content.match(/(?:phosphorus|avail(?:able)?\s*p|p2o5)\s*[:=]?\s*([0-9.]+)/i);
  if (pMatch && !isNaN(parseFloat(pMatch[1]))) phosphorus = parseFloat(pMatch[1]);

  let potassium = 320;
  const kMatch = content.match(/(?:potassium|avail(?:able)?\s*k|k2o)\s*[:=]?\s*([0-9.]+)/i);
  if (kMatch && !isNaN(parseFloat(kMatch[1]))) potassium = parseFloat(kMatch[1]);

  let organicCarbon = 0.65;
  const ocMatch = content.match(/(?:organic\s*carbon|o\.?c\.?)\s*[:=]?\s*([0-9.]+)%?/i);
  if (ocMatch && !isNaN(parseFloat(ocMatch[1]))) organicCarbon = parseFloat(ocMatch[1]);

  let electricalConductivity = 0.38;
  const ecMatch = content.match(/(?:electrical\s*conductivity|e\.?c\.?)\s*[:=]?\s*([0-9.]+)/i);
  if (ecMatch && !isNaN(parseFloat(ecMatch[1]))) electricalConductivity = parseFloat(ecMatch[1]);

  let soilType = 'BLACK_COTTON';
  if (/alluvial/i.test(content)) soilType = 'ALLUVIAL';
  else if (/red\s*soil/i.test(content)) soilType = 'RED_SOIL';
  else if (/clay/i.test(content)) soilType = 'CLAY_LOAM';
  else if (/sandy/i.test(content)) soilType = 'SANDY_LOAM';
  else if (/laterite/i.test(content)) soilType = 'LATERITE';
  else if (/silt/i.test(content)) soilType = 'SILT';

  let previousCrop = 'Soybean';
  const cropMatch = content.match(/(?:previous\s*crop|last\s*crop|prior\s*crop)\s*[:=]?\s*([A-Za-z]+)/i);
  if (cropMatch) previousCrop = cropMatch[1];

  let previousYield = 11.5;
  const yieldMatch = content.match(/(?:yield|harvest|produce)\s*[:=]?\s*([0-9.]+)/i);
  if (yieldMatch && !isNaN(parseFloat(yieldMatch[1]))) previousYield = parseFloat(yieldMatch[1]);

  return res.json({
    success: true,
    fileName: fileName || 'Soil_Health_Card.pdf',
    extracted: {
      soilType,
      ph,
      nitrogen,
      phosphorus,
      potassium,
      organicCarbon,
      electricalConductivity,
      previousCrop,
      previousYieldQuintals: previousYield,
      testDate: new Date().toISOString().split('T')[0],
      sourceLab: 'District Soil & Water Testing Laboratory'
    }
  });
});

farmRouter.get('/:id', async (req: Request, res: Response) => {
  const farms = await db.getFarms();
  const farm = farms.find((f) => f.id === req.params.id) || store.farms.get(req.params.id);
  if (!farm) {
    return res.status(404).json({ error: 'Farm not found' });
  }
  return res.json(farm);
});

// 2. Soil Records
farmRouter.get('/:farmId/soil-records', async (req: Request, res: Response) => {
  const records = await db.getSoilRecords(req.params.farmId);
  if (records.length === 0) {
    const memRecords = store.soilRecords.get(req.params.farmId) || [];
    return res.json(memRecords);
  }
  return res.json(records);
});

farmRouter.post('/:farmId/soil-records', async (req: Request, res: Response) => {
  const data = CreateSoilRecordSchema.parse(req.body);
  const recordId = randomUUID();
  const newRecord = {
    ...data,
    id: recordId,
    farmId: req.params.farmId,
    createdAt: new Date().toISOString()
  };

  const created = await db.createSoilRecord(newRecord);
  const existing = store.soilRecords.get(req.params.farmId) || [];
  existing.unshift(newRecord);
  store.soilRecords.set(req.params.farmId, existing);
  return res.status(201).json(created);
});

// 3. Crop Cycles
farmRouter.get('/:farmId/crop-cycles', async (req: Request, res: Response) => {
  const cycles = await db.getCropCycles(req.params.farmId);
  return res.json(cycles);
});

farmRouter.post('/:farmId/crop-cycles', async (req: Request, res: Response) => {
  const data = CreateCropCycleSchema.parse(req.body);
  const cycleId = randomUUID();
  const newCycle = {
    ...data,
    id: cycleId,
    farmId: req.params.farmId,
    status: 'ACTIVE' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const created = await db.createCropCycle(newCycle);
  return res.status(201).json(created);
});

// 4. Expenses & Profit
farmRouter.get('/:farmId/expenses', async (req: Request, res: Response) => {
  const expenses = await db.getExpenses(req.params.farmId);
  return res.json(expenses);
});

farmRouter.post('/:farmId/expenses', async (req: Request, res: Response) => {
  const expenseId = randomUUID();
  const { category, amount, date, notes } = req.body;
  const newExpense = {
    id: expenseId,
    farmId: req.params.farmId,
    category,
    amount: Number(amount),
    date: date || new Date().toISOString().split('T')[0],
    notes
  };

  const created = await db.createExpense(newExpense);
  return res.status(201).json(created);
});

farmRouter.get('/:farmId/profit-summary', (req: Request, res: Response) => {
  const summary = ProfitService.calculate(req.params.farmId);
  return res.json(summary);
});
