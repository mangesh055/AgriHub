import { Router, Request, Response } from 'express';
import { WeatherService } from '../services/weatherService.js';
import { store } from '../services/storage.js';

export const weatherRouter = Router();

weatherRouter.get('/current', (req: Request, res: Response) => {
  const farmId = req.query.farmId as string;
  const farm = farmId ? store.farms.get(farmId) : undefined;
  const lat = farm?.latitude || 18.4875;
  const lng = farm?.longitude || 74.1332;

  const weather = WeatherService.getCurrentWeather(lat, lng);
  return res.json(weather);
});

weatherRouter.get('/forecast', (req: Request, res: Response) => {
  const farmId = req.query.farmId as string;
  const farm = farmId ? store.farms.get(farmId) : undefined;
  const lat = farm?.latitude || 18.4875;
  const lng = farm?.longitude || 74.1332;

  const forecast = WeatherService.getForecast(lat, lng);
  return res.json(forecast);
});

weatherRouter.get('/alerts', (req: Request, res: Response) => {
  const farmId = (req.query.farmId as string) || Array.from(store.farms.keys())[0];
  const cycles = store.cropCycles.get(farmId) || [];
  const activeCycle = cycles.find((c) => c.status === 'ACTIVE') || cycles[0];

  const alerts = WeatherService.evaluateRiskAlerts(
    farmId,
    activeCycle?.id,
    activeCycle?.cropName,
    activeCycle?.currentStage
  );
  return res.json(alerts);
});
