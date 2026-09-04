import { Router, Request, Response } from 'express';
import { WeatherService } from '../services/weatherService.js';
import { store } from '../services/storage.js';
import { db } from '../services/db.js';

export const weatherRouter = Router();

async function resolveFarmLocation(farmId?: string): Promise<{ lat: number; lng: number; farm: any }> {
  let lat = 18.4875;
  let lng = 74.1332;
  let farm: any = null;

  if (farmId && farmId !== 'undefined' && farmId !== 'null') {
    const farms = await db.getFarms();
    farm = farms.find((f) => f.id === farmId) || store.farms.get(farmId);
    if (farm) {
      lat = Number(farm.latitude) || 18.4875;
      lng = Number(farm.longitude) || 74.1332;
    }
  } else {
    const farms = await db.getFarms();
    farm = farms[0] || Array.from(store.farms.values())[0] || null;
    if (farm) {
      lat = Number(farm.latitude) || 18.4875;
      lng = Number(farm.longitude) || 74.1332;
    }
  }
  return { lat, lng, farm };
}

// 1. Comprehensive Master Weather Data (All 11 Inputs + Forecast + Alerts)
weatherRouter.get('/comprehensive', async (req: Request, res: Response) => {
  const farmId = req.query.farmId as string;
  const { lat, lng, farm } = await resolveFarmLocation(farmId);

  const data = await WeatherService.getComprehensiveWeather(lat, lng, farm?.id);
  return res.json({
    ...data,
    farm: farm
      ? {
          id: farm.id,
          name: farm.name,
          village: farm.village,
          taluka: farm.taluka,
          district: farm.district,
          state: farm.state,
          latitude: lat,
          longitude: lng
        }
      : null
  });
});

// 2. Specific Agronomic Inputs Matrix
weatherRouter.get('/agronomic-inputs', async (req: Request, res: Response) => {
  const farmId = req.query.farmId as string;
  const { lat, lng } = await resolveFarmLocation(farmId);
  const data = await WeatherService.getComprehensiveWeather(lat, lng, farmId);
  return res.json(data.agronomicInputs);
});

// 3. Current Weather
weatherRouter.get('/current', async (req: Request, res: Response) => {
  const farmId = req.query.farmId as string;
  const { lat, lng, farm } = await resolveFarmLocation(farmId);
  const data = await WeatherService.getComprehensiveWeather(lat, lng, farm?.id);
  return res.json({
    ...data.current,
    agronomicInputs: data.agronomicInputs,
    farmName: farm?.name || 'Primary Farm'
  });
});

// 4. Forecast
weatherRouter.get('/forecast', async (req: Request, res: Response) => {
  const farmId = req.query.farmId as string;
  const { lat, lng } = await resolveFarmLocation(farmId);
  const data = await WeatherService.getComprehensiveWeather(lat, lng, farmId);
  return res.json(data.forecast);
});

// 5. Risk Alerts
weatherRouter.get('/alerts', async (req: Request, res: Response) => {
  const farmId = req.query.farmId as string;
  const { lat, lng } = await resolveFarmLocation(farmId);
  const data = await WeatherService.getComprehensiveWeather(lat, lng, farmId);

  let activeCycle: any = null;
  if (farmId && farmId !== 'undefined') {
    const cycles = await db.getCropCycles(farmId);
    activeCycle = cycles.find((c) => c.status === 'ACTIVE') || (store.cropCycles.get(farmId) || [])[0];
  }

  const evaluatedAlerts = WeatherService.evaluateRiskAlerts(
    farmId || 'demo-farm',
    activeCycle?.id,
    activeCycle?.cropName,
    activeCycle?.currentStage
  );

  // Combine live weather alerts with crop alerts
  const allAlerts = [...data.alerts, ...evaluatedAlerts];
  // Deduplicate by title
  const uniqueAlerts = Array.from(new Map(allAlerts.map((a) => [a.title, a])).values());
  return res.json(uniqueAlerts);
});
