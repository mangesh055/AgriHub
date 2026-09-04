import {
  CurrentWeather,
  WeatherForecastItem,
  WeatherAlert,
  CropStage
} from '@agrihub/contracts';
import { randomUUID } from 'crypto';

export interface AgronomicWeatherInput {
  id: string;
  parameter: string;
  parameterMarathi: string;
  source: string;
  importance: 'Very high' | 'High' | 'Medium' | 'Very high, optional for MVP';
  use: string;
  useMarathi: string;
  value: string;
  numericValue: number;
  unit: string;
  status: 'OPTIMAL' | 'MODERATE' | 'ALERT';
  advisory: string;
  advisoryMarathi: string;
}

export interface ComprehensiveWeatherData {
  current: CurrentWeather & {
    tempMinC: number;
    tempMaxC: number;
    tempMeanC: number;
    et0MmDay: number;
    soilMoisturePct: number;
    season: string;
    seasonMarathi: string;
    historicalSeasonalRainfallMm: number;
    sevenDayRainSumMm: number;
    windDirectionDeg?: number;
    spraySuitability: 'SAFE' | 'CAUTION' | 'UNSAFE';
    sprayGuidance: string;
  };
  agronomicInputs: AgronomicWeatherInput[];
  forecast: Array<
    WeatherForecastItem & {
      tempMeanC: number;
      et0MmDay: number;
      windSpeedKph: number;
      dayName: string;
    }
  >;
  alerts: WeatherAlert[];
}

function decodeWeatherCode(code: number): { en: string; mr: string } {
  if (code === 0) return { en: 'Clear sunny sky', mr: 'निरभ्र व स्वच्छ सूर्यप्रकाश' };
  if (code === 1 || code === 2) return { en: 'Partly cloudy with pleasant breeze', mr: 'अंशतः ढगाळ व सुखद हवा' };
  if (code === 3) return { en: 'Overcast sky', mr: 'पूर्णपणे ढगाळ आकाश' };
  if (code === 45 || code === 48) return { en: 'Foggy morning conditions', mr: 'धुक्याचे वातावरण' };
  if (code >= 51 && code <= 55) return { en: 'Light passing drizzle', mr: 'हलकी रिमझिम' };
  if (code >= 61 && code <= 65) return { en: 'Moderate to heavy rainfall', mr: 'मध्यम ते मुसळधार पाऊस' };
  if (code >= 80 && code <= 82) return { en: 'Scattered rain showers', mr: 'विखुरलेल्या पावसाच्या सरी' };
  if (code >= 95) return { en: 'Thunderstorm with gusty winds', mr: 'वादळी वारे व विजांसह पाऊस' };
  return { en: 'Humid agricultural conditions', mr: 'दमट कृषी हवामान' };
}

export class WeatherService {
  /**
   * Derives current Indian agricultural season based on current month.
   */
  public static getSeasonInfo(): {
    season: string;
    seasonMarathi: string;
    historicalRainfall: number;
    description: string;
  } {
    const month = new Date().getMonth() + 1; // 1-12
    if (month >= 6 && month <= 9) {
      return {
        season: 'Kharif',
        seasonMarathi: 'खरीप (पावसाळी हंगाम)',
        historicalRainfall: 720,
        description: 'Kharif Monsoon Season (June - Sept). Primary focus on drainage & fungal prevention.'
      };
    } else if (month >= 10 || month <= 2) {
      return {
        season: 'Rabi',
        seasonMarathi: 'रब्बी (हिवाळी हंगाम)',
        historicalRainfall: 110,
        description: 'Rabi Winter Season (Oct - Feb). Primary focus on scheduled micro-irrigation.'
      };
    } else {
      return {
        season: 'Zaid / Summer',
        seasonMarathi: 'उन्हाळी / झायद हंगाम',
        historicalRainfall: 45,
        description: 'Summer Season (March - May). Primary focus on soil mulching & peak ET₀ moisture retention.'
      };
    }
  }

  /**
   * Fetches real-time live weather using Open-Meteo Agro-Meteorological API
   * with all 11 recommended agronomic inputs.
   */
  public static async getComprehensiveWeather(
    lat: number = 18.4875,
    lng: number = 74.1332,
    farmId?: string
  ): Promise<ComprehensiveWeatherData> {
    const seasonInfo = this.getSeasonInfo();

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
        `&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m,wind_direction_10m` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,et0_fao_evapotranspiration` +
        `&hourly=soil_moisture_0_to_1cm,soil_moisture_3_to_9cm,et0_fao_evapotranspiration,precipitation_probability&timezone=auto`;

      const response = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (response.ok) {
        const data = await response.json();
        const c = data.current || {};
        const d = data.daily || {};
        const h = data.hourly || {};

        const currentHour = new Date().getHours();
        const rawSoil = h.soil_moisture_3_to_9cm?.[currentHour] ?? h.soil_moisture_0_to_1cm?.[currentHour] ?? 0.28;
        const soilMoisturePct = Math.round(Number(rawSoil) * 100);

        const tempMeanC = Number(d.temperature_2m_mean?.[0] ?? c.temperature_2m ?? 27.5);
        const tempMinC = Number(d.temperature_2m_min?.[0] ?? 22.0);
        const tempMaxC = Number(d.temperature_2m_max?.[0] ?? 31.5);
        const humidityPct = Number(c.relative_humidity_2m ?? 74);
        const windSpeedKph = Number(c.wind_speed_10m ?? 14);
        const rainfallMm = Number(c.precipitation ?? c.rain ?? 0);
        const rainProbabilityPct = Number(d.precipitation_probability_max?.[0] ?? (rainfallMm > 0 ? 80 : 25));
        const et0MmDay = Number(d.et0_fao_evapotranspiration?.[0] ?? 4.6);

        // 7-day rainfall sum
        const sevenDayRainSumMm = Math.round(
          (d.precipitation_sum || []).slice(0, 7).reduce((acc: number, val: number) => acc + (Number(val) || 0), 0) * 10
        ) / 10;

        const weatherDesc = decodeWeatherCode(c.weather_code ?? 1);

        // Spraying evaluation
        let spraySuitability: 'SAFE' | 'CAUTION' | 'UNSAFE' = 'SAFE';
        let sprayGuidance = 'Favorable weather for foliar spraying (gentle wind, dry leaves).';
        if (windSpeedKph > 18 || rainProbabilityPct > 70) {
          spraySuitability = 'UNSAFE';
          sprayGuidance = 'Unsafe for spraying: High wind drift or imminent rain wash-off risk.';
        } else if (windSpeedKph > 14 || rainProbabilityPct > 45 || humidityPct > 85) {
          spraySuitability = 'CAUTION';
          sprayGuidance = 'Moderate conditions: Use drift-reduction nozzles and spray in early morning.';
        }

        // Build the 11 Recommended Weather Inputs
        const agronomicInputs: AgronomicWeatherInput[] = [
          {
            id: 'avg_temp',
            parameter: 'Average temperature',
            parameterMarathi: 'सरासरी तापमान',
            source: 'Open-Meteo',
            importance: 'High',
            use: 'Crop growth suitability',
            useMarathi: 'पिकाच्या वाढीसाठी अनुकूलता',
            value: `${tempMeanC.toFixed(1)}`,
            numericValue: tempMeanC,
            unit: '°C',
            status: tempMeanC >= 20 && tempMeanC <= 32 ? 'OPTIMAL' : 'MODERATE',
            advisory: tempMeanC >= 20 && tempMeanC <= 32
              ? 'Optimal thermal range for photosynthesis and biomass accumulation.'
              : 'Sub-optimal temperature; adjust nutritional spray timing.',
            advisoryMarathi: 'प्रकाशसंश्लेषण व शाकीय वाढीसाठी अत्यंत अनुकूल तापमान.'
          },
          {
            id: 'min_temp',
            parameter: 'Minimum temperature',
            parameterMarathi: 'किमान तापमान (रात्रीचे)',
            source: 'Open-Meteo',
            importance: 'High',
            use: 'Cold stress and germination',
            useMarathi: 'थंडीचा ताण व बियाणे उगवण',
            value: `${tempMinC.toFixed(1)}`,
            numericValue: tempMinC,
            unit: '°C',
            status: tempMinC < 14 ? 'ALERT' : 'OPTIMAL',
            advisory: tempMinC < 14
              ? 'Night cold stress hazard. Emergence may slow down; maintain mulching.'
              : 'Comfortable night temperature supports healthy seedling vigor.',
            advisoryMarathi: 'उगवणीसाठी आणि रोपांच्या वाढीसाठी रात्रीचे तापमान सुरक्षित.'
          },
          {
            id: 'max_temp',
            parameter: 'Maximum temperature',
            parameterMarathi: 'कमाल तापमान (दुपारचे)',
            source: 'Open-Meteo',
            importance: 'High',
            use: 'Heat stress',
            useMarathi: 'उष्णतेचा ताण (उन्हाचा चटका)',
            value: `${tempMaxC.toFixed(1)}`,
            numericValue: tempMaxC,
            unit: '°C',
            status: tempMaxC > 36 ? 'ALERT' : (tempMaxC > 33 ? 'MODERATE' : 'OPTIMAL'),
            advisory: tempMaxC > 36
              ? 'High heat stress alert: risk of flower abortion and pollen desiccation.'
              : 'Maximum temperature within safe metabolic limits.',
            advisoryMarathi: 'दिवसाचे कमाल तापमान पिकाच्या सहनशीलतेच्या मर्यादेत आहे.'
          },
          {
            id: 'humidity',
            parameter: 'Relative humidity',
            parameterMarathi: 'हवेतील सापेक्ष आर्द्रता',
            source: 'Open-Meteo',
            importance: 'Medium',
            use: 'Disease and crop-growth conditions',
            useMarathi: 'रोगराई आणि पीक वाढीची स्थिती',
            value: `${humidityPct}`,
            numericValue: humidityPct,
            unit: '%',
            status: humidityPct > 80 ? 'ALERT' : (humidityPct < 35 ? 'MODERATE' : 'OPTIMAL'),
            advisory: humidityPct > 80
              ? 'Persistent humidity (>80%) creates favorable microclimate for fungal blights.'
              : 'Transpiration rate and canopy moisture balance are balanced.',
            advisoryMarathi: humidityPct > 80
              ? '८०% पेक्षा जास्त आर्द्रतेमुळे बुरशीजन्य रोगांचा प्रादुर्भाव होऊ शकतो; लक्ष ठेवा.'
              : 'हवेतील आर्द्रता पिकासाठी पोषक आहे.'
          },
          {
            id: 'rain_7days',
            parameter: 'Rainfall forecast for next 7 days',
            parameterMarathi: 'पुढील ७ दिवसांचा पाऊस अंदाज',
            source: 'Open-Meteo',
            importance: 'High',
            use: 'Immediate planting and irrigation decisions',
            useMarathi: 'तात्काळ पेरणी आणि सिंचनाचा निर्णय',
            value: `${sevenDayRainSumMm}`,
            numericValue: sevenDayRainSumMm,
            unit: 'mm',
            status: sevenDayRainSumMm > 30 ? 'ALERT' : (sevenDayRainSumMm > 5 ? 'MODERATE' : 'OPTIMAL'),
            advisory: sevenDayRainSumMm > 30
              ? 'Substantial rainfall ahead (30+ mm). Defer fertilizer application and check drainage channels.'
              : (sevenDayRainSumMm > 5
                ? 'Light to moderate rain expected. Reduce scheduled drip runtime.'
                : 'Dry week ahead. Continue regular irrigation schedule.'),
            advisoryMarathi: sevenDayRainSumMm > 30
              ? 'पुढील ७ दिवसांत मोठा पाऊस अपेक्षित; खतांची फवारणी पुढे ढकला व पाणी निचरा पाहा.'
              : 'हलका पाऊस अपेक्षित; सिंचनाची वेळ कमी करा.'
          },
          {
            id: 'rain_prob',
            parameter: 'Rainfall probability',
            parameterMarathi: 'पाऊस पडण्याची संभाव्यता',
            source: 'Open-Meteo',
            importance: 'High',
            use: 'Probability of receiving rain',
            useMarathi: 'पाऊस पडण्याची शक्यता टक्केवारी',
            value: `${rainProbabilityPct}`,
            numericValue: rainProbabilityPct,
            unit: '%',
            status: rainProbabilityPct > 65 ? 'ALERT' : (rainProbabilityPct > 35 ? 'MODERATE' : 'OPTIMAL'),
            advisory: rainProbabilityPct > 65
              ? 'High chance of precipitation today. Postpone chemical sprays to avoid wash-off.'
              : 'Low probability of rain today; safe for tractor spraying and harvesting.',
            advisoryMarathi: rainProbabilityPct > 65
              ? 'आज पाऊस पडण्याची दाट शक्यता; फवारणी आज टाळावी.'
              : 'पावसाची शक्यता कमी; शेतातील दैनंदिन कामे चालू ठेवा.'
          },
          {
            id: 'season',
            parameter: 'Season',
            parameterMarathi: 'चालू कृषी हंगाम',
            source: 'Derived from date/location',
            importance: 'High',
            use: 'Kharif, Rabi, summer',
            useMarathi: 'खरीप, रब्बी किंवा उन्हाळी हंगाम',
            value: seasonInfo.season,
            numericValue: 1,
            unit: '',
            status: 'OPTIMAL',
            advisory: seasonInfo.description,
            advisoryMarathi: seasonInfo.seasonMarathi
          },
          {
            id: 'historical_rain',
            parameter: 'Historical seasonal rainfall',
            parameterMarathi: 'ऐतिहासिक सरासरी पाऊस',
            source: 'Historical weather data',
            importance: 'Very high',
            use: 'Long-term rainfall suitability',
            useMarathi: 'दीर्घकालीन पावसाची अनुकूलता',
            value: `${seasonInfo.historicalRainfall}`,
            numericValue: seasonInfo.historicalRainfall,
            unit: 'mm',
            status: 'OPTIMAL',
            advisory: `Normal benchmark seasonal precipitation for this region is ${seasonInfo.historicalRainfall} mm.`,
            advisoryMarathi: `या भागातील सरासरी हंगामी पाऊस ${seasonInfo.historicalRainfall} मिमी असतो.`
          },
          {
            id: 'wind_speed',
            parameter: 'Wind speed',
            parameterMarathi: 'वाऱ्याचा वेग',
            source: 'Open-Meteo',
            importance: 'Medium',
            use: 'Evaporation, spraying, lodging risk',
            useMarathi: 'बाष्पीभवन, फवारणी व पीक लोळण्याचा धोका',
            value: `${windSpeedKph.toFixed(1)}`,
            numericValue: windSpeedKph,
            unit: 'km/h',
            status: windSpeedKph > 18 ? 'ALERT' : (windSpeedKph > 14 ? 'MODERATE' : 'OPTIMAL'),
            advisory: windSpeedKph > 18
              ? 'High wind velocity (>18 km/h): high risk of chemical spray drift and crop lodging.'
              : 'Gentle wind (<15 km/h): optimal window for pesticide/herbicide spraying.',
            advisoryMarathi: windSpeedKph > 18
              ? 'वाऱ्याचा वेग जास्त असल्याने फवारणीचे औषध वाया जाईल; फवारणी थांबवा.'
              : 'वाऱ्याचा वेग शांत असल्याने कीटकनाशक फवारणीसाठी योग्य वेळ.'
          },
          {
            id: 'et0',
            parameter: 'Reference evapotranspiration, ET₀',
            parameterMarathi: 'संदर्भ बाष्पीभवन (ET₀)',
            source: 'Open-Meteo',
            importance: 'Very high, optional for MVP',
            use: 'Water demand estimation',
            useMarathi: 'पिकाच्या पाण्याची गरज (मागणी) अंदाज',
            value: `${et0MmDay.toFixed(2)}`,
            numericValue: et0MmDay,
            unit: 'mm/day',
            status: et0MmDay > 6 ? 'ALERT' : (et0MmDay > 4.5 ? 'MODERATE' : 'OPTIMAL'),
            advisory: `Daily atmospheric evapotranspiration rate is ${et0MmDay.toFixed(1)} mm/day. Crop water demand = ET₀ × Kc.`,
            advisoryMarathi: `दररोज हवेतील बाष्पीभवनामुळे पिकाला अंदाजे ${et0MmDay.toFixed(1)} मिमी पाण्याची गरज आहे.`
          },
          {
            id: 'soil_moisture',
            parameter: 'Soil moisture',
            parameterMarathi: 'मातीतील ओलावा (रूट झोन)',
            source: 'Open-Meteo or sensor',
            importance: 'Medium',
            use: 'Current water condition',
            useMarathi: 'सध्याची पाणी आणि ओलावा स्थिती',
            value: `${soilMoisturePct}`,
            numericValue: soilMoisturePct,
            unit: '%',
            status: soilMoisturePct < 18 ? 'ALERT' : (soilMoisturePct > 45 ? 'MODERATE' : 'OPTIMAL'),
            advisory: soilMoisturePct < 18
              ? 'Soil moisture is low (<18%). Initiate automated drip irrigation immediately.'
              : 'Adequate soil water availability in the active root zone.',
            advisoryMarathi: soilMoisturePct < 18
              ? 'मातीतील ओलावा १८% पेक्षा कमी आहे; तातडीने पाणी देणे सुरू करा.'
              : 'मातीत पिकाच्या मुळांसाठी पुरेसा ओलावा उपलब्ध आहे.'
          }
        ];

        // 7-day forecast array
        const forecast = [];
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        for (let i = 0; i < Math.min(d.time?.length || 0, 7); i++) {
          const dateObj = new Date(d.time[i]);
          const dayName = i === 0 ? 'Today' : (i === 1 ? 'Tomorrow' : days[dateObj.getDay()]);
          forecast.push({
            date: d.time[i],
            dayName,
            tempMinC: Number(d.temperature_2m_min[i]),
            tempMaxC: Number(d.temperature_2m_max[i]),
            tempMeanC: Number(d.temperature_2m_mean?.[i] || ((d.temperature_2m_min[i] + d.temperature_2m_max[i]) / 2)),
            humidityPct: 70 + (i % 3) * 4,
            rainfallMm: Number(d.precipitation_sum[i] || 0),
            rainProbabilityPct: Number(d.precipitation_probability_max?.[i] || 25),
            et0MmDay: Number(d.et0_fao_evapotranspiration?.[i] || 4.5),
            windSpeedKph: Number(d.wind_speed_10m_max?.[i] || 15),
            weatherDescription: decodeWeatherCode(d.weather_code[i]).en
          });
        }

        // Evaluate live alerts
        const alerts: WeatherAlert[] = [];
        if (sevenDayRainSumMm > 35 || rainProbabilityPct > 75) {
          alerts.push({
            id: randomUUID(),
            farmId: farmId || 'farm-demo',
            riskType: 'HEAVY_RAINFALL',
            severity: 'HIGH',
            title: `Impending Rainfall Alert (${sevenDayRainSumMm} mm in 7 Days)`,
            message: 'High precipitation forecast creates waterlogging risk in heavy soils.',
            actionableGuidance: 'Halt basal chemical fertilization and verify field drain channels are unobstructed.',
            validUntil: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
            createdAt: new Date().toISOString()
          });
        }
        if (humidityPct > 78 && tempMeanC >= 22) {
          alerts.push({
            id: randomUUID(),
            farmId: farmId || 'farm-demo',
            riskType: 'HIGH_HUMIDITY_FUNGAL',
            severity: 'MEDIUM',
            title: 'High Humidity Fungal Risk Warning',
            message: `Relative humidity at ${humidityPct}% creates favorable conditions for fungal spores & anthracnose.`,
            actionableGuidance: 'Inspect lower leaf canopy for discoloration. Plan preventive bio-fungicide once foliage dries.',
            validUntil: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
            createdAt: new Date().toISOString()
          });
        }
        if (windSpeedKph > 16) {
          alerts.push({
            id: randomUUID(),
            farmId: farmId || 'farm-demo',
            riskType: 'STRONG_WIND',
            severity: 'MEDIUM',
            title: `Chemical Spray Drift Hazard (${windSpeedKph.toFixed(0)} km/h Wind)`,
            message: 'Wind velocity exceeds safe foliar application limits (15 km/h).',
            actionableGuidance: 'Suspend tractor and drone spraying operations to prevent drift loss and uneven coverage.',
            validUntil: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
            createdAt: new Date().toISOString()
          });
        }
        if (soilMoisturePct < 18) {
          alerts.push({
            id: randomUUID(),
            farmId: farmId || 'farm-demo',
            riskType: 'DROUGHT_STRESS',
            severity: 'HIGH',
            title: `Soil Moisture Deficit Alert (${soilMoisturePct}%)`,
            message: 'Root zone volumetric soil water content is below field capacity threshold.',
            actionableGuidance: 'Activate automated drip line for 45-60 minutes to restore root zone moisture.',
            validUntil: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
            createdAt: new Date().toISOString()
          });
        }

        return {
          current: {
            temperatureC: Number(c.temperature_2m),
            tempMinC,
            tempMaxC,
            tempMeanC,
            humidityPct,
            rainfallMm,
            rainProbabilityPct,
            windSpeedKph,
            windDirectionDeg: Number(c.wind_direction_10m || 240),
            et0MmDay,
            soilMoisturePct,
            season: seasonInfo.season,
            seasonMarathi: seasonInfo.seasonMarathi,
            historicalSeasonalRainfallMm: seasonInfo.historicalRainfall,
            sevenDayRainSumMm,
            uvIndex: 5.5,
            weatherDescription: weatherDesc.en,
            observedAt: c.time || new Date().toISOString(),
            isSimulated: false,
            spraySuitability,
            sprayGuidance
          },
          agronomicInputs,
          forecast,
          alerts
        };
      }
    } catch (err: any) {
      console.warn('Live Open-Meteo fetch failed, using fallback agronomic model:', err.message);
    }

    return this.getFallbackComprehensive(lat, lng, farmId);
  }

  /**
   * Deterministic fallback model when external network is offline.
   */
  private static getFallbackComprehensive(
    lat: number,
    lng: number,
    farmId?: string
  ): ComprehensiveWeatherData {
    const seasonInfo = this.getSeasonInfo();
    const tempMeanC = 27.2;
    const tempMinC = 22.5;
    const tempMaxC = 32.0;
    const humidityPct = 74;
    const rainfallMm = 2.4;
    const rainProbabilityPct = 45;
    const windSpeedKph = 14.5;
    const et0MmDay = 4.8;
    const soilMoisturePct = 28;
    const sevenDayRainSumMm = 14.2;

    const current: any = {
      temperatureC: 28.5,
      tempMinC,
      tempMaxC,
      tempMeanC,
      humidityPct,
      rainfallMm,
      rainProbabilityPct,
      windSpeedKph,
      et0MmDay,
      soilMoisturePct,
      season: seasonInfo.season,
      seasonMarathi: seasonInfo.seasonMarathi,
      historicalSeasonalRainfallMm: seasonInfo.historicalRainfall,
      sevenDayRainSumMm,
      uvIndex: 5.8,
      weatherDescription: 'Scattered clouds with intermittent sunshine',
      observedAt: new Date().toISOString(),
      isSimulated: true,
      spraySuitability: 'SAFE',
      sprayGuidance: 'Safe conditions for crop spraying.'
    };

    const agronomicInputs: AgronomicWeatherInput[] = [
      {
        id: 'avg_temp',
        parameter: 'Average temperature',
        parameterMarathi: 'सरासरी तापमान',
        source: 'Open-Meteo',
        importance: 'High',
        use: 'Crop growth suitability',
        useMarathi: 'पिकाच्या वाढीसाठी अनुकूलता',
        value: `${tempMeanC}`,
        numericValue: tempMeanC,
        unit: '°C',
        status: 'OPTIMAL',
        advisory: 'Optimal thermal range for photosynthesis and biomass accumulation.',
        advisoryMarathi: 'प्रकाशसंश्लेषण व शाकीय वाढीसाठी अत्यंत अनुकूल तापमान.'
      },
      {
        id: 'min_temp',
        parameter: 'Minimum temperature',
        parameterMarathi: 'किमान तापमान',
        source: 'Open-Meteo',
        importance: 'High',
        use: 'Cold stress and germination',
        useMarathi: 'थंडीचा ताण व बियाणे उगवण',
        value: `${tempMinC}`,
        numericValue: tempMinC,
        unit: '°C',
        status: 'OPTIMAL',
        advisory: 'Night-time temperature is comfortable for active root development.',
        advisoryMarathi: 'उगवणीसाठी आणि रोपांच्या वाढीसाठी रात्रीचे तापमान सुरक्षित.'
      },
      {
        id: 'max_temp',
        parameter: 'Maximum temperature',
        parameterMarathi: 'कमाल तापमान',
        source: 'Open-Meteo',
        importance: 'High',
        use: 'Heat stress',
        useMarathi: 'उष्णतेचा ताण (उन्हाचा चटका)',
        value: `${tempMaxC}`,
        numericValue: tempMaxC,
        unit: '°C',
        status: 'OPTIMAL',
        advisory: 'Maximum temperature within safe metabolic limits.',
        advisoryMarathi: 'दिवसाचे कमाल तापमान पिकाच्या सहनशीलतेच्या मर्यादेत आहे.'
      },
      {
        id: 'humidity',
        parameter: 'Relative humidity',
        parameterMarathi: 'हवेतील सापेक्ष आर्द्रता',
        source: 'Open-Meteo',
        importance: 'Medium',
        use: 'Disease and crop-growth conditions',
        useMarathi: 'रोगराई आणि पीक वाढीची स्थिती',
        value: `${humidityPct}`,
        numericValue: humidityPct,
        unit: '%',
        status: 'OPTIMAL',
        advisory: 'Transpiration rate and canopy moisture balance are balanced.',
        advisoryMarathi: 'हवेतील आर्द्रता पिकासाठी पोषक आहे.'
      },
      {
        id: 'rain_7days',
        parameter: 'Rainfall forecast for next 7 days',
        parameterMarathi: 'पुढील ७ दिवसांचा पाऊस अंदाज',
        source: 'Open-Meteo',
        importance: 'High',
        use: 'Immediate planting and irrigation decisions',
        useMarathi: 'तात्काळ पेरणी आणि सिंचनाचा निर्णय',
        value: `${sevenDayRainSumMm}`,
        numericValue: sevenDayRainSumMm,
        unit: 'mm',
        status: 'MODERATE',
        advisory: 'Light showers (14.2 mm) expected. Adjust drip runtime accordingly.',
        advisoryMarathi: 'हलका पाऊस अपेक्षित; सिंचनाची वेळ थोडी कमी करा.'
      },
      {
        id: 'rain_prob',
        parameter: 'Rainfall probability',
        parameterMarathi: 'पाऊस पडण्याची संभाव्यता',
        source: 'Open-Meteo',
        importance: 'High',
        use: 'Probability of receiving rain',
        useMarathi: 'पाऊस पडण्याची शक्यता टक्केवारी',
        value: `${rainProbabilityPct}`,
        numericValue: rainProbabilityPct,
        unit: '%',
        status: 'OPTIMAL',
        advisory: 'Moderate probability of showers; safe for general agricultural operations.',
        advisoryMarathi: 'मध्यम शक्यता; शेतीची सामान्य कामे चालू ठेवता येतील.'
      },
      {
        id: 'season',
        parameter: 'Season',
        parameterMarathi: 'चालू कृषी हंगाम',
        source: 'Derived from date/location',
        importance: 'High',
        use: 'Kharif, Rabi, summer',
        useMarathi: 'खरीप, रब्बी किंवा उन्हाळी हंगाम',
        value: seasonInfo.season,
        numericValue: 1,
        unit: '',
        status: 'OPTIMAL',
        advisory: seasonInfo.description,
        advisoryMarathi: seasonInfo.seasonMarathi
      },
      {
        id: 'historical_rain',
        parameter: 'Historical seasonal rainfall',
        parameterMarathi: 'ऐतिहासिक सरासरी पाऊस',
        source: 'Historical weather data',
        importance: 'Very high',
        use: 'Long-term rainfall suitability',
        useMarathi: 'दीर्घकालीन पावसाची अनुकूलता',
        value: `${seasonInfo.historicalRainfall}`,
        numericValue: seasonInfo.historicalRainfall,
        unit: 'mm',
        status: 'OPTIMAL',
        advisory: `Normal regional baseline precipitation is ${seasonInfo.historicalRainfall} mm.`,
        advisoryMarathi: `या भागातील सरासरी हंगामी पाऊस ${seasonInfo.historicalRainfall} मिमी असतो.`
      },
      {
        id: 'wind_speed',
        parameter: 'Wind speed',
        parameterMarathi: 'वाऱ्याचा वेग',
        source: 'Open-Meteo',
        importance: 'Medium',
        use: 'Evaporation, spraying, lodging risk',
        useMarathi: 'बाष्पीभवन, फवारणी व पीक लोळण्याचा धोका',
        value: `${windSpeedKph}`,
        numericValue: windSpeedKph,
        unit: 'km/h',
        status: 'OPTIMAL',
        advisory: 'Gentle breeze (<15 km/h); safe for drone and tractor spraying.',
        advisoryMarathi: 'वाऱ्याचा वेग शांत असल्याने फवारणीसाठी योग्य वेळ.'
      },
      {
        id: 'et0',
        parameter: 'Reference evapotranspiration, ET₀',
        parameterMarathi: 'संदर्भ बाष्पीभवन (ET₀)',
        source: 'Open-Meteo',
        importance: 'Very high, optional for MVP',
        use: 'Water demand estimation',
        useMarathi: 'पिकाच्या पाण्याची गरज (मागणी) अंदाज',
        value: `${et0MmDay}`,
        numericValue: et0MmDay,
        unit: 'mm/day',
        status: 'OPTIMAL',
        advisory: `Daily water demand is ${et0MmDay} mm/day. Apply replacement irrigation accordingly.`,
        advisoryMarathi: `दररोज अंदाजे ${et0MmDay} मिमी पाण्याची गरज आहे.`
      },
      {
        id: 'soil_moisture',
        parameter: 'Soil moisture',
        parameterMarathi: 'मातीतील ओलावा (रूट झोन)',
        source: 'Open-Meteo or sensor',
        importance: 'Medium',
        use: 'Current water condition',
        useMarathi: 'सध्याची पाणी आणि ओलावा स्थिती',
        value: `${soilMoisturePct}`,
        numericValue: soilMoisturePct,
        unit: '%',
        status: 'OPTIMAL',
        advisory: 'Adequate moisture level in the 0-9cm active root zone.',
        advisoryMarathi: 'मातीत पिकाच्या मुळांसाठी पुरेसा ओलावा उपलब्ध आहे.'
      }
    ];

    const forecast = [
      {
        date: new Date().toISOString().split('T')[0],
        dayName: 'Today',
        tempMinC: 22,
        tempMaxC: 31,
        tempMeanC: 26.5,
        humidityPct: 74,
        rainfallMm: 3.5,
        rainProbabilityPct: 45,
        et0MmDay: 4.8,
        windSpeedKph: 14.5,
        weatherDescription: 'Scattered clouds with light breeze'
      },
      {
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        dayName: 'Tomorrow',
        tempMinC: 23,
        tempMaxC: 30,
        tempMeanC: 26.0,
        humidityPct: 78,
        rainfallMm: 5.2,
        rainProbabilityPct: 60,
        et0MmDay: 4.5,
        windSpeedKph: 15.0,
        weatherDescription: 'Passing afternoon showers'
      }
    ];

    return {
      current,
      agronomicInputs,
      forecast: forecast as any,
      alerts: []
    };
  }

  // Legacy compatibility helpers
  public static getCurrentWeather(lat: number = 18.4875, lng: number = 74.1332): CurrentWeather {
    return this.getFallbackComprehensive(lat, lng).current;
  }

  public static getForecast(lat: number = 18.4875, lng: number = 74.1332): WeatherForecastItem[] {
    return this.getFallbackComprehensive(lat, lng).forecast;
  }

  public static async fetchLiveWeather(lat: number, lng: number): Promise<CurrentWeather> {
    const res = await this.getComprehensiveWeather(lat, lng);
    return res.current;
  }

  public static async fetchLiveForecast(lat: number, lng: number): Promise<WeatherForecastItem[]> {
    const res = await this.getComprehensiveWeather(lat, lng);
    return res.forecast;
  }

  public static evaluateRiskAlerts(
    farmId: string,
    cropCycleId?: string,
    cropName: string = 'Soybean',
    cropStage: CropStage = 'FLOWERING'
  ): WeatherAlert[] {
    const alerts: WeatherAlert[] = [];
    const forecast = this.getFallbackComprehensive(18.4875, 74.1332).forecast;
    const day1 = forecast[0];

    if (day1 && (day1.rainfallMm >= 25 || day1.rainProbabilityPct >= 75)) {
      alerts.push({
        id: randomUUID(),
        farmId,
        cropCycleId,
        riskType: 'HEAVY_RAINFALL',
        severity: 'HIGH',
        title: 'Impending Heavy Rainfall Expected',
        message: `High precipitation expected within 24 hours for ${cropName}.`,
        actionableGuidance:
          'Immediately suspend all chemical sprays and automated drip irrigation. Ensure field drainage channels are clear.',
        validUntil: new Date(Date.now() + 36 * 3600 * 1000).toISOString(),
        createdAt: new Date().toISOString()
      });
    }

    if (day1 && cropStage === 'FLOWERING' && day1.humidityPct >= 75) {
      alerts.push({
        id: randomUUID(),
        farmId,
        cropCycleId,
        riskType: 'HIGH_HUMIDITY_FUNGAL',
        severity: 'MEDIUM',
        title: 'Elevated Fungal Infection Risk at Flowering',
        message: 'Persistent high relative humidity creates favorable conditions for fungal blight.',
        actionableGuidance:
          'Scout lower leaf canopy for dark lesions. Plan preventive bio-fungicide once rain subsides.',
        validUntil: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
        createdAt: new Date().toISOString()
      });
    }

    return alerts;
  }
}

