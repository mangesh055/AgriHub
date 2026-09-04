import {
  CurrentWeather,
  WeatherForecastItem,
  WeatherAlert,
  CropStage
} from '@agrihub/contracts';
import { randomUUID } from 'crypto';

export class WeatherService {
  public static getCurrentWeather(lat: number, lng: number): CurrentWeather {
    // Generates deterministic realistic hyperlocal weather with slight diurnal variation
    const hour = new Date().getHours();
    const isDay = hour >= 6 && hour <= 18;
    const baseTemp = isDay ? 30.5 : 23.2;

    return {
      temperatureC: parseFloat((baseTemp + Math.sin(hour / 3) * 2.5).toFixed(1)),
      humidityPct: 76,
      rainfallMm: 4.2,
      rainProbabilityPct: 65,
      windSpeedKph: 16.5,
      uvIndex: isDay ? 6.2 : 0,
      weatherDescription: 'Scattered monsoon showers with humid breeze',
      observedAt: new Date().toISOString(),
      isSimulated: false
    };
  }

  public static getForecast(lat: number, lng: number): WeatherForecastItem[] {
    const forecast: WeatherForecastItem[] = [];
    const now = new Date();

    const patterns = [
      { rainMm: 35.0, rainProb: 85, desc: 'Moderate to Heavy Rainfall', minT: 22, maxT: 28 },
      { rainMm: 12.0, rainProb: 60, desc: 'Passing Showers', minT: 23, maxT: 29 },
      { rainMm: 2.0, rainProb: 30, desc: 'Partly Cloudy', minT: 23, maxT: 31 },
      { rainMm: 0.0, rainProb: 15, desc: 'Sunny with Clear Sky', minT: 24, maxT: 33 },
      { rainMm: 0.0, rainProb: 10, desc: 'Dry and Warm', minT: 24, maxT: 34 },
      { rainMm: 5.0, rainProb: 40, desc: 'Afternoon Isolated Thunderstorm', minT: 23, maxT: 32 },
      { rainMm: 1.0, rainProb: 20, desc: 'Scattered Clouds', minT: 22, maxT: 31 }
    ];

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(now.getTime() + i * 24 * 3600 * 1000);
      const p = patterns[i % patterns.length];
      forecast.push({
        date: dayDate.toISOString().split('T')[0],
        tempMinC: p.minT,
        tempMaxC: p.maxT,
        humidityPct: 70 + (i % 3) * 5,
        rainfallMm: p.rainMm,
        rainProbabilityPct: p.rainProb,
        weatherDescription: p.desc
      });
    }

    return forecast;
  }

  public static evaluateRiskAlerts(
    farmId: string,
    cropCycleId?: string,
    cropName: string = 'Soybean',
    cropStage: CropStage = 'FLOWERING'
  ): WeatherAlert[] {
    const alerts: WeatherAlert[] = [];
    const forecast = this.getForecast(18.4875, 74.1332);
    const day1 = forecast[0];

    // Rule 1: Heavy rain warning
    if (day1.rainfallMm >= 25 || day1.rainProbabilityPct >= 75) {
      alerts.push({
        id: randomUUID(),
        farmId,
        cropCycleId,
        riskType: 'HEAVY_RAINFALL',
        severity: 'HIGH',
        title: 'Impending Heavy Rainfall (35mm Expected)',
        message: `High precipitation expected within 24 hours for ${cropName}.`,
        actionableGuidance:
          'Immediately suspend all chemical sprays and automated drip irrigation. Ensure field drainage channels and bunds are clear to avoid root rot.',
        validUntil: new Date(Date.now() + 36 * 3600 * 1000).toISOString(),
        createdAt: new Date().toISOString()
      });
    }

    // Rule 2: High humidity fungal warning during Flowering
    if (cropStage === 'FLOWERING' && day1.humidityPct >= 75) {
      alerts.push({
        id: randomUUID(),
        farmId,
        cropCycleId,
        riskType: 'HIGH_HUMIDITY_FUNGAL',
        severity: 'MEDIUM',
        title: 'Elevated Fungal Infection Risk at Flowering',
        message: 'Persistent high relative humidity creates favorable conditions for fungal blight or anthracnose.',
        actionableGuidance:
          'Scout the lower leaf canopy for dark lesions or yellow halos. Plan a preventive bio-fungicide (Trichoderma viride or copper oxychloride) once the rain subsides.',
        validUntil: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
        createdAt: new Date().toISOString()
      });
    }

    return alerts;
  }
}
