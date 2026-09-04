import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { IngestTelemetrySchema } from '@agrihub/contracts';
import { store } from '../services/storage.js';
import { db } from '../services/db.js';
import { IrrigationService } from '../services/irrigationService.js';
import { WeatherService } from '../services/weatherService.js';

export const iotRouter = Router();

// Ingest telemetry from physical ESP32 or gateway
iotRouter.post('/telemetry', async (req: Request, res: Response) => {
  const data = IngestTelemetrySchema.parse(req.body);
  const farmId = (req.query.farmId as string) || Array.from(store.farms.keys())[0];

  const newReading = {
    id: randomUUID(),
    farmId,
    deviceUid: data.deviceUid,
    soilMoisturePct: data.soilMoisturePct,
    temperatureC: data.temperatureC,
    humidityPct: data.humidityPct,
    batteryPct: data.batteryPct || 100,
    timestamp: data.timestamp || new Date().toISOString()
  };

  await db.recordTelemetry(newReading);
  return res.status(201).json({ success: true, reading: newReading });
});

// Simulator endpoint to test different moisture values from UI
iotRouter.post('/simulate', async (req: Request, res: Response) => {
  const { farmId, soilMoisturePct, temperatureC, humidityPct } = req.body;
  const targetFarmId = farmId || Array.from(store.farms.keys())[0];

  const simulatedReading = {
    id: randomUUID(),
    farmId: targetFarmId,
    deviceUid: 'SIMULATOR-ESP32-NODE',
    soilMoisturePct: Number(soilMoisturePct ?? 28),
    temperatureC: Number(temperatureC ?? 31),
    humidityPct: Number(humidityPct ?? 68),
    batteryPct: 95,
    timestamp: new Date().toISOString()
  };

  await db.recordTelemetry(simulatedReading);
  return res.json({ success: true, reading: simulatedReading });
});

// Latest sensor reading
iotRouter.get('/latest', async (req: Request, res: Response) => {
  const farmId = (req.query.farmId as string) || Array.from(store.farms.keys())[0];
  const latest = await db.getLatestTelemetry(farmId);
  if (!latest) {
    return res.status(404).json({ error: 'No sensor telemetry recorded yet' });
  }
  return res.json(latest);
});

// Sensor history for charts
iotRouter.get('/history', (req: Request, res: Response) => {
  const farmId = (req.query.farmId as string) || Array.from(store.farms.keys())[0];
  const list = store.telemetry.get(farmId) || [];
  return res.json(list);
});

// Smart Irrigation Decision
iotRouter.get('/irrigation-recommendation', (req: Request, res: Response) => {
  const farmId = (req.query.farmId as string) || Array.from(store.farms.keys())[0];
  const farm = store.farms.get(farmId);
  const cycles = store.cropCycles.get(farmId) || [];
  const activeCycle = cycles.find((c) => c.status === 'ACTIVE') || cycles[0];

  const list = store.telemetry.get(farmId) || [];
  const latest = list[list.length - 1];
  const soilMoisture = latest ? latest.soilMoisturePct : 34;

  const forecast = WeatherService.getForecast(farm?.latitude || 18.4875, farm?.longitude || 74.1332);
  const tomorrow = forecast[0];

  const recommendation = IrrigationService.evaluate({
    farmId,
    cropCycleId: activeCycle?.id,
    cropStage: activeCycle?.currentStage,
    soilMoisturePct: soilMoisture,
    forecastRainfallMm: tomorrow.rainfallMm,
    rainProbabilityPct: tomorrow.rainProbabilityPct
  });

  return res.json(recommendation);
});
