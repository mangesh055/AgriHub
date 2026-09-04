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
  const allFarms = await db.getFarms();
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
  return res.status(201).json(created);
});

farmRouter.get('/:id', async (req: Request, res: Response) => {
  const farms = await db.getFarms();
  const farm = farms.find((f) => f.id === req.params.id);
  if (!farm) {
    return res.status(404).json({ error: 'Farm not found' });
  }
  return res.json(farm);
});

// 2. Soil Records
farmRouter.get('/:farmId/soil-records', async (req: Request, res: Response) => {
  const records = await db.getSoilRecords(req.params.farmId);
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

  const existing = store.cropCycles.get(req.params.farmId) || [];
  existing.unshift(newCycle);
  store.cropCycles.set(req.params.farmId, existing);

  return res.status(201).json(newCycle);
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
