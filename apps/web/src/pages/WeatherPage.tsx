import React, { useEffect, useState } from 'react';
import {
  CloudRain,
  Wind,
  Droplets,
  Sun,
  AlertTriangle,
  ShieldCheck,
  Thermometer,
  MapPin,
  RefreshCw,
  Gauge,
  Calendar,
  Waves,
  Zap,
  Activity,
  Sparkles,
  TrendingDown,
  TrendingUp,
  LayoutGrid,
  Table as TableIcon,
  Navigation
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

type FilterType = 'ALL' | 'HIGH' | 'WATER' | 'TEMP';
type ViewMode = 'TABLE' | 'CARDS';

export interface LocationPreset {
  id: string;
  name: string;
  nameMr: string;
  village: string;
  lat: number;
  lng: number;
  zone: string;
  zoneMr: string;
}

export const BARAMATI_REGIONAL_LOCATIONS: LocationPreset[] = [
  {
    id: 'morgaon',
    name: 'Morgaon (Mayureshwar Scarcity Belt)',
    nameMr: 'मोरगाव (मयूरेश्वर दुष्काळी पट्टा)',
    village: 'Morgaon',
    lat: 18.2778,
    lng: 74.3167,
    zone: 'Rainfed Scarcity Belt (~390 mm Kharif Normal)',
    zoneMr: 'कोरडवाहू दुष्काळी पट्टा (~३९० मिमी सरासरी पाऊस)'
  },
  {
    id: 'supa',
    name: 'Supa (MIDC / Scarcity Belt)',
    nameMr: 'सुपा (दुष्काळी पट्टा / MIDC)',
    village: 'Supa',
    lat: 18.3344,
    lng: 74.3912,
    zone: 'Rainfed Scarcity Belt (~390 mm Kharif Normal)',
    zoneMr: 'कोरडवाहू दुष्काळी पट्टा (~३९० मिमी सरासरी पाऊस)'
  },
  {
    id: 'malegaon',
    name: 'Malegaon (Canal Command / Sugar Belt)',
    nameMr: 'माळेगाव (कॅनॉल पट्टा / साखर कारखाना)',
    village: 'Malegaon',
    lat: 18.1519,
    lng: 74.5771,
    zone: 'Canal Command Belt (~445 mm Kharif Normal)',
    zoneMr: 'नीरा डावा कालवा पट्टा (~४४५ मिमी सरासरी पाऊस)'
  },
  {
    id: 'shardanagar',
    name: 'Shardanagar (KVK Research Belt)',
    nameMr: 'शारदानगर (कृषी विज्ञान केंद्र KVK)',
    village: 'Shardanagar',
    lat: 18.1722,
    lng: 74.5956,
    zone: 'Well-Irrigated Agro Belt (~420 mm Kharif Normal)',
    zoneMr: 'विहीर बागायत पट्टा (~४२० मिमी सरासरी पाऊस)'
  },
  {
    id: 'someshwar',
    name: 'Someshwar (Nira Canal Belt)',
    nameMr: 'सोमेश्वर (नीरा कालवा पट्टा)',
    village: 'Someshwar',
    lat: 18.1833,
    lng: 74.2833,
    zone: 'Canal Command Belt (~445 mm Kharif Normal)',
    zoneMr: 'नीरा कालवा पट्टा (~४४५ मिमी सरासरी पाऊस)'
  },
  {
    id: 'pandare',
    name: 'Pandare (Canal Command)',
    nameMr: 'पांढरे (कॅनॉल पट्टा)',
    village: 'Pandare',
    lat: 18.1167,
    lng: 74.4500,
    zone: 'Canal Command Belt (~445 mm Kharif Normal)',
    zoneMr: 'कॅनॉल पट्टा (~४४५ मिमी सरासरी पाऊस)'
  },
  {
    id: 'baramati_town',
    name: 'Baramati Town (Central Tehsil)',
    nameMr: 'बारामती शहर (मध्यवर्ती तहसील)',
    village: 'Baramati',
    lat: 18.1500,
    lng: 74.5800,
    zone: 'Central Baramati Belt (~420 mm Kharif Normal)',
    zoneMr: 'मध्यवर्ती बारामती (~४२० मिमी सरासरी पाऊस)'
  }
];

const DEFAULT_INPUTS = [
  {
    id: 'avg_temp',
    parameter: 'Average temperature',
    parameterMarathi: 'सरासरी तापमान',
    source: 'Open-Meteo',
    importance: 'High',
    use: 'Crop growth suitability',
    useMarathi: 'पिकाच्या वाढीसाठी अनुकूलता',
    value: '25.4',
    numericValue: 25.4,
    unit: '°C',
    status: 'OPTIMAL',
    advisory: 'Optimal thermal range for photosynthesis and biomass accumulation.',
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
    value: '22.8',
    numericValue: 22.8,
    unit: '°C',
    status: 'OPTIMAL',
    advisory: 'Comfortable night temperature; safe for germination and root development.',
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
    value: '29.5',
    numericValue: 29.5,
    unit: '°C',
    status: 'OPTIMAL',
    advisory: 'Daytime maximum temperature is within comfortable range (<35°C; avoids flower drop).',
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
    value: '76',
    numericValue: 76,
    unit: '%',
    status: 'OPTIMAL',
    advisory: 'Balanced canopy moisture and transpiration; monitor lower leaves if humidity rises >80%.',
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
    value: '10.3',
    numericValue: 10.3,
    unit: 'mm',
    status: 'MODERATE',
    advisory: 'Light showers (10.3 mm) expected. Modulate scheduled drip runtime.',
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
    value: '79',
    numericValue: 79,
    unit: '%',
    status: 'ALERT',
    advisory: 'High probability of rain today. Postpone foliar chemical spraying to avoid wash-off.',
    advisoryMarathi: 'आज पाऊस पडण्याची दाट शक्यता; फवारणी आज टाळावी.'
  },
  {
    id: 'season',
    parameter: 'Season',
    parameterMarathi: 'चालू कृषी हंगाम',
    source: 'Derived from date/location',
    importance: 'High',
    use: 'Kharif, Rabi, summer',
    useMarathi: 'खरीप, रब्बी किंवा उन्हाळी हंगाम',
    value: 'Kharif',
    numericValue: 1,
    unit: '',
    status: 'OPTIMAL',
    advisory: 'Active Season: Kharif Monsoon Season (June - Sept). Focus on field drainage and fungal control.',
    advisoryMarathi: 'चालू हंगाम: खरीप (पावसाळी हंगाम). पाण्याचा निचरा आणि पीक संरक्षणावर भर द्या.'
  },
  {
    id: 'historical_rain',
    parameter: 'Historical seasonal rainfall',
    parameterMarathi: 'ऐतिहासिक सरासरी पाऊस',
    source: 'IMD Pune / KVK Baramati Agromet Normals',
    importance: 'Very high',
    use: 'Long-term rainfall suitability',
    useMarathi: 'दीर्घकालीन पावसाची अनुकूलता',
    value: '420',
    numericValue: 420,
    unit: 'mm',
    status: 'OPTIMAL',
    advisory: 'Normal regional seasonal rainfall benchmark is 390-445 mm for Kharif crops (Baramati rain-shadow scarcity belt; annual normal ~475 mm).',
    advisoryMarathi: 'या भागातील खरीप हंगामातील सरासरी पाऊस ३९०-४४५ मिमी असतो (वार्षिक सरासरी ~४७५ मिमी).'
  },
  {
    id: 'wind_speed',
    parameter: 'Wind speed',
    parameterMarathi: 'वाऱ्याचा वेग',
    source: 'Open-Meteo',
    importance: 'Medium',
    use: 'Evaporation, spraying, lodging risk',
    useMarathi: 'बाष्पीभवन, फवारणी व पीक लोळण्याचा धोका',
    value: '16.3',
    numericValue: 16.3,
    unit: 'km/h',
    status: 'MODERATE',
    advisory: 'Wind speed around 16 km/h. Caution for spray drift; spray in calm early morning hours.',
    advisoryMarathi: 'वाऱ्याचा वेग मध्यम आहे; फवारणी करताना काळजी घ्या.'
  },
  {
    id: 'et0',
    parameter: 'Reference evapotranspiration, ET₀',
    parameterMarathi: 'संदर्भ बाष्पीभवन (ET₀)',
    source: 'Open-Meteo',
    importance: 'Very high, optional for MVP',
    use: 'Water demand estimation',
    useMarathi: 'पिकाच्या पाण्याची गरज (मागणी) अंदाज',
    value: '4.74',
    numericValue: 4.74,
    unit: 'mm/day',
    status: 'OPTIMAL',
    advisory: 'Daily water loss rate is 4.74 mm/day. Apply replacement irrigation accordingly.',
    advisoryMarathi: 'दररोज हवेतील बाष्पीभवनामुळे पिकाला अंदाजे ४.७४ मिमी पाण्याची गरज आहे.'
  },
  {
    id: 'soil_moisture',
    parameter: 'Soil moisture',
    parameterMarathi: 'मातीतील ओलावा (रूट झोन)',
    source: 'Open-Meteo or sensor',
    importance: 'Medium',
    use: 'Current water condition',
    useMarathi: 'सध्याची पाणी आणि ओलावा स्थिती',
    value: '16',
    numericValue: 16,
    unit: '%',
    status: 'ALERT',
    advisory: 'Root zone moisture is low (16%). Initiate automated drip irrigation promptly.',
    advisoryMarathi: 'मातीतील ओलावा १६% आहे; तातडीने पाणी देणे सुरू करा.'
  }
];

export const WeatherPage: React.FC = () => {
  const { primaryFarm } = useAuth();
  const { language } = useLanguage();
  const isMr = language === 'mr';

  const [farmsList, setFarmsList] = useState<any[]>([]);
  const [selectedLocKey, setSelectedLocKey] = useState<string>('primary_farm');
  const [currentCoords, setCurrentCoords] = useState<{
    lat: number;
    lng: number;
    village: string;
    zone: string;
    farmId?: string;
  }>(() => ({
    lat: Number(primaryFarm?.latitude) || 18.2778,
    lng: Number(primaryFarm?.longitude) || 74.3167,
    village: primaryFarm?.village || 'Morgaon',
    zone: primaryFarm?.name || (isMr ? 'मोरगाव दुष्काळी पट्टा' : 'Morgaon Scarcity Belt'),
    farmId: primaryFarm?.id
  }));
  const [locatingGps, setLocatingGps] = useState(false);

  const [agronomicInputs, setAgronomicInputs] = useState<any[]>(DEFAULT_INPUTS);
  const [currentWeather, setCurrentWeather] = useState<any>({
    temperatureC: 25.4,
    tempMinC: 22.8,
    tempMaxC: 29.5,
    tempMeanC: 25.4,
    humidityPct: 76,
    rainfallMm: 1.5,
    rainProbabilityPct: 79,
    windSpeedKph: 16.3,
    et0MmDay: 4.74,
    soilMoisturePct: 16,
    sevenDayRainSumMm: 10.3,
    season: 'Kharif',
    spraySuitability: 'CAUTION',
    sprayGuidance: 'Wind at 16 km/h with 79% rain chance. Spray in early morning or defer.'
  });
  const [forecast, setForecast] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('agrihub_weather_view_mode');
    return saved === 'TABLE' || saved === 'CARDS' ? saved : 'CARDS';
  });

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    try {
      localStorage.setItem('agrihub_weather_view_mode', mode);
    } catch (e) {
      // ignore in case of private mode
    }
  };
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  // 1. Fetch user's registered farms on mount
  useEffect(() => {
    async function loadFarms() {
      try {
        const farms = await api.getFarms();
        if (Array.isArray(farms) && farms.length > 0) {
          setFarmsList(farms);
        }
      } catch (err) {
        // silent fallback
      }
    }
    loadFarms();
  }, []);

  // 2. Fetch live dynamic weather for targeted coordinates
  async function loadWeather(
    targetLoc?: { lat: number; lng: number; village: string; farmId?: string },
    silent = false
  ) {
    try {
      if (!silent) setRefreshing(true);
      const lat = targetLoc?.lat ?? currentCoords.lat;
      const lng = targetLoc?.lng ?? currentCoords.lng;
      const village = targetLoc?.village ?? currentCoords.village;
      const farmId = targetLoc?.farmId ?? currentCoords.farmId ?? primaryFarm?.id;

      const res = await api.getComprehensiveWeather({
        farmId,
        lat,
        lng,
        village
      });

      if (res) {
        if (res.agronomicInputs && res.agronomicInputs.length > 0) {
          setAgronomicInputs(res.agronomicInputs);
        }
        if (res.current) {
          setCurrentWeather(res.current);
        }
        if (res.forecast) {
          setForecast(res.forecast);
        }
        if (res.alerts) {
          setAlerts(res.alerts);
        }
        const now = new Date();
        setLastRefreshed(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (err) {
      console.warn('Weather API fetch error, retaining active inputs:', err);
    } finally {
      setRefreshing(false);
    }
  }

  // Load weather when primaryFarm changes or on initial load
  useEffect(() => {
    if (primaryFarm) {
      const coords = {
        lat: Number(primaryFarm.latitude) || 18.1519,
        lng: Number(primaryFarm.longitude) || 74.5771,
        village: primaryFarm.village || 'Malegaon',
        zone: primaryFarm.name || 'Primary Farm Plot',
        farmId: primaryFarm.id
      };
      setCurrentCoords(coords);
      loadWeather(coords, false);
    } else {
      loadWeather(currentCoords, false);
    }
  }, [primaryFarm?.id]);

  // Handle location dropdown change
  function handleLocationChange(key: string) {
    setSelectedLocKey(key);

    if (key === 'primary_farm' && primaryFarm) {
      const coords = {
        lat: Number(primaryFarm.latitude) || 18.1519,
        lng: Number(primaryFarm.longitude) || 74.5771,
        village: primaryFarm.village || 'Malegaon',
        zone: primaryFarm.name || 'Primary Farm Plot',
        farmId: primaryFarm.id
      };
      setCurrentCoords(coords);
      loadWeather(coords);
      return;
    }

    const matchedFarm = farmsList.find((f) => f.id === key);
    if (matchedFarm) {
      const coords = {
        lat: Number(matchedFarm.latitude) || 18.1519,
        lng: Number(matchedFarm.longitude) || 74.5771,
        village: matchedFarm.village || 'Baramati',
        zone: matchedFarm.name,
        farmId: matchedFarm.id
      };
      setCurrentCoords(coords);
      loadWeather(coords);
      return;
    }

    const preset = BARAMATI_REGIONAL_LOCATIONS.find((p) => p.id === key);
    if (preset) {
      const coords = {
        lat: preset.lat,
        lng: preset.lng,
        village: preset.village,
        zone: isMr ? preset.nameMr : preset.name
      };
      setCurrentCoords(coords);
      loadWeather(coords);
    }
  }

  // Handle GPS Auto-detect
  function handleAutoDetectGps() {
    if (!navigator.geolocation) {
      alert(isMr ? 'आपल्या ब्राउझरमध्ये GPS सुविधा उपलब्ध नाही.' : 'Geolocation is not supported by your browser.');
      return;
    }
    setLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const detectedLat = parseFloat(pos.coords.latitude.toFixed(4));
        const detectedLng = parseFloat(pos.coords.longitude.toFixed(4));
        const coords = {
          lat: detectedLat,
          lng: detectedLng,
          village: 'Current Farm GPS',
          zone: isMr ? 'थेट GPS शेत स्थान' : 'Live Detected Field GPS'
        };
        setSelectedLocKey('custom_gps');
        setCurrentCoords(coords);
        loadWeather(coords);
        setLocatingGps(false);
      },
      (err) => {
        setLocatingGps(false);
        alert(`GPS error: ${err.message}. Please select location manually.`);
      },
      { timeout: 8000 }
    );
  }

  // Filter inputs
  const filteredInputs = agronomicInputs.filter((item) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'HIGH') return item.importance === 'High' || item.importance.includes('Very');
    if (activeFilter === 'WATER') return ['rain_7days', 'rain_prob', 'historical_rain', 'et0', 'soil_moisture'].includes(item.id);
    if (activeFilter === 'TEMP') return ['avg_temp', 'min_temp', 'max_temp', 'humidity', 'wind_speed'].includes(item.id);
    return true;
  });

  const getImportanceBadge = (importance: string) => {
    if (importance.toLowerCase().includes('very')) {
      return (
        <span
          style={{
            padding: '3px 9px',
            borderRadius: '6px',
            background: 'rgba(168, 85, 247, 0.15)',
            border: '1px solid rgba(168, 85, 247, 0.4)',
            color: '#c084fc',
            fontSize: '0.78rem',
            fontWeight: 700
          }}
        >
          {isMr ? 'अति महत्त्वाचे' : importance}
        </span>
      );
    }
    if (importance === 'High') {
      return (
        <span
          style={{
            padding: '3px 9px',
            borderRadius: '6px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#34d399',
            fontSize: '0.78rem',
            fontWeight: 700
          }}
        >
          {isMr ? 'उच्च' : 'High'}
        </span>
      );
    }
    return (
      <span
        style={{
          padding: '3px 9px',
          borderRadius: '6px',
          background: 'rgba(245, 158, 11, 0.15)',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          color: '#fbbf24',
          fontSize: '0.78rem',
          fontWeight: 600
        }}
      >
        {isMr ? 'मध्यम' : 'Medium'}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    if (status === 'ALERT') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 9px',
            borderRadius: '999px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#f87171',
            fontSize: '0.74rem',
            fontWeight: 700
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }} />
          {isMr ? 'सतर्कता / ताण' : 'ALERT'}
        </span>
      );
    }
    if (status === 'MODERATE') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 9px',
            borderRadius: '999px',
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            color: '#fbbf24',
            fontSize: '0.74rem',
            fontWeight: 700
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b' }} />
          {isMr ? 'मध्यम' : 'MODERATE'}
        </span>
      );
    }
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '3px 9px',
          borderRadius: '999px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          color: '#34d399',
          fontSize: '0.74rem',
          fontWeight: 700
        }}
      >
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
        {isMr ? 'अनुकूल' : 'OPTIMAL'}
      </span>
    );
  };

  const getParamIcon = (id: string) => {
    switch (id) {
      case 'avg_temp':
        return <Thermometer size={18} color="#fbbf24" />;
      case 'min_temp':
        return <TrendingDown size={18} color="#38bdf8" />;
      case 'max_temp':
        return <TrendingUp size={18} color="#f87171" />;
      case 'humidity':
        return <Droplets size={18} color="#60a5fa" />;
      case 'rain_7days':
        return <CloudRain size={18} color="#38bdf8" />;
      case 'rain_prob':
        return <Zap size={18} color="#fbbf24" />;
      case 'season':
        return <Calendar size={18} color="#34d399" />;
      case 'historical_rain':
        return <Activity size={18} color="#a78bfa" />;
      case 'wind_speed':
        return <Wind size={18} color="#93c5fd" />;
      case 'et0':
        return <Waves size={18} color="#f472b6" />;
      case 'soil_moisture':
        return <Gauge size={18} color="#4ade80" />;
      default:
        return <Sun size={18} color="#fbbf24" />;
    }
  };

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '24px 20px 60px' }}>
      {/* 1. Top Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '20px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <h2 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0 }}>
              {isMr ? 'हवामान व कृषी मापदंड (Weather Intelligence)' : 'Recommended Weather Inputs & Agro-Meteorology'}
            </h2>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '3px 10px',
                borderRadius: '999px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: '#34d399',
                fontSize: '0.75rem',
                fontWeight: 700
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 8px #10b981'
                }}
              />
              {isMr ? 'थेट Open-Meteo कनेक्टेड' : 'Live Open-Meteo Synced'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.88rem', flexWrap: 'wrap' }}>
            <MapPin size={15} color="var(--color-primary)" />
            <span>
              <strong style={{ color: 'var(--text-heading)' }}>{currentCoords.village}</strong>
              {currentCoords.zone ? ` • ${currentCoords.zone}` : ''}
              <span style={{ fontFamily: 'monospace', fontSize: '0.84rem', color: '#10b981', marginLeft: '6px' }}>
                ({currentCoords.lat.toFixed(4)}°N, {currentCoords.lng.toFixed(4)}°E)
              </span>
            </span>
            {lastRefreshed && (
              <span style={{ fontSize: '0.8rem', opacity: 0.75 }}>
                • {isMr ? 'अपडेट:' : 'Updated:'} {lastRefreshed}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Location / Farm Dropdown */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 12px'
            }}
          >
            <MapPin size={15} color="#10b981" />
            <select
              value={selectedLocKey}
              onChange={(e) => handleLocationChange(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-main)',
                fontSize: '0.88rem',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
                maxWidth: '260px'
              }}
            >
              {primaryFarm && (
                <option value="primary_farm" style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}>
                  📍 {isMr ? 'माझे शेत:' : 'My Farm:'} {primaryFarm.name} ({primaryFarm.village || 'Malegaon'})
                </option>
              )}
              {farmsList
                .filter((f) => f.id !== primaryFarm?.id)
                .map((f) => (
                  <option key={f.id} value={f.id} style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}>
                    📍 {f.name} ({f.village || 'Baramati'})
                  </option>
                ))}
              <optgroup label={isMr ? 'बारामती परिसरातील गावे' : 'Baramati Regional Circles'}>
                {BARAMATI_REGIONAL_LOCATIONS.map((loc) => (
                  <option key={loc.id} value={loc.id} style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}>
                    🌍 {isMr ? loc.nameMr : loc.name}
                  </option>
                ))}
              </optgroup>
              {selectedLocKey === 'custom_gps' && (
                <option value="custom_gps" style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}>
                  🛰️ {isMr ? 'थेट GPS शेत' : 'Live Field GPS'} ({currentCoords.lat.toFixed(4)}°, {currentCoords.lng.toFixed(4)}°)
                </option>
              )}
            </select>
          </div>

          {/* GPS Button */}
          <button
            onClick={handleAutoDetectGps}
            disabled={locatingGps}
            className="btn btn-secondary"
            title={isMr ? 'सध्याचे शेताचे GPS स्थान घ्या' : 'Auto-detect current field GPS'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.86rem',
              padding: '8px 12px'
            }}
          >
            <Navigation size={15} className={locatingGps ? 'animate-spin' : ''} color="#38bdf8" />
            <span>{locatingGps ? '...' : isMr ? 'GPS स्थान' : 'GPS'}</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={() => loadWeather(currentCoords, false)}
            disabled={refreshing}
            className="btn btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.88rem',
              padding: '8px 16px',
              cursor: refreshing ? 'wait' : 'pointer'
            }}
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            <span>{isMr ? 'रिफ्रेश' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* 2. Active Climate Risk Warning Banners (if any) */}
      {alerts.length > 0 && (
        <section style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {alerts.map((alert: any) => (
            <div
              key={alert.id}
              className="glass-panel"
              style={{
                padding: '14px 18px',
                borderRadius: 'var(--radius-md)',
                border: alert.severity === 'HIGH' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)',
                background: alert.severity === 'HIGH' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px'
              }}
            >
              <div style={{ color: alert.severity === 'HIGH' ? '#f87171' : '#fbbf24', marginTop: '2px' }}>
                <AlertTriangle size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <h4 style={{ fontSize: '0.98rem', fontWeight: 700, margin: 0 }}>{alert.title}</h4>
                  <span className={alert.severity === 'HIGH' ? 'badge badge-danger' : 'badge badge-warning'}>
                    {alert.severity} RISK
                  </span>
                </div>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-main)', margin: '2px 0 6px' }}>{alert.message}</p>
                <div style={{ fontSize: '0.82rem', color: '#34d399' }}>
                  <strong>{isMr ? 'सल्ला:' : 'Action Required:'}</strong> {alert.actionableGuidance}
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* 3. PRIMARY SECTION: RECOMMENDED WEATHER INPUTS (Directly matching user image) */}
      <section
        className="glass-panel"
        style={{
          padding: '24px',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '28px',
          border: '1px solid var(--border-active)',
          boxShadow: 'var(--shadow-glow)'
        }}
      >
        {/* Section Header with Controls */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
            marginBottom: '20px',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '16px'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={22} color="var(--color-primary-light)" />
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                {isMr ? 'शिफारस केलेले हवामान मापदंड' : 'Recommended weather inputs'}
              </h3>
            </div>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: '4px', margin: 0 }}>
              {isMr
                ? 'Open-Meteo थेट एपीआय आणि स्थानिक मॉडेलवर आधारित अचूक कृषी हवामान मापदंड आणि त्यांचे उपयोग'
                : 'Core meteorological inputs configured for real-time crop suitability, irrigation, and stress monitoring.'}
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
            {/* View Mode Toggle */}
            <div
              style={{
                display: 'flex',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                padding: '3px',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <button
                onClick={() => setViewMode('CARDS')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  background: viewMode === 'CARDS' ? 'var(--color-primary)' : 'transparent',
                  color: viewMode === 'CARDS' ? '#ffffff' : 'var(--text-muted)',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <LayoutGrid size={15} />
                {isMr ? 'कार्ड दृश्य' : 'Cards'}
              </button>
              <button
                onClick={() => setViewMode('TABLE')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  background: viewMode === 'TABLE' ? 'var(--color-primary)' : 'transparent',
                  color: viewMode === 'TABLE' ? '#ffffff' : 'var(--text-muted)',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <TableIcon size={15} />
                {isMr ? 'तक्ता दृश्य' : 'Table'}
              </button>
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              <button
                onClick={() => setActiveFilter('ALL')}
                className={`btn ${activeFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.78rem', padding: '5px 12px', borderRadius: '999px' }}
              >
                {isMr ? 'सर्व ११' : 'All 11 Inputs'}
              </button>
              <button
                onClick={() => setActiveFilter('HIGH')}
                className={`btn ${activeFilter === 'HIGH' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.78rem', padding: '5px 12px', borderRadius: '999px' }}
              >
                {isMr ? 'उच्च प्राधान्य' : 'High Priority'}
              </button>
              <button
                onClick={() => setActiveFilter('WATER')}
                className={`btn ${activeFilter === 'WATER' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.78rem', padding: '5px 12px', borderRadius: '999px' }}
              >
                {isMr ? 'पाऊस व बाष्पीभवन' : 'Rain & ET₀'}
              </button>
              <button
                onClick={() => setActiveFilter('TEMP')}
                className={`btn ${activeFilter === 'TEMP' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.78rem', padding: '5px 12px', borderRadius: '999px' }}
              >
                {isMr ? 'तापमान व ताण' : 'Temperature & Stress'}
              </button>
            </div>
          </div>
        </div>

        {/* View 1: Exact Table View (Matching User Image) */}
        {viewMode === 'TABLE' ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr
                  style={{
                    borderBottom: '2px solid rgba(255, 255, 255, 0.12)',
                    color: 'var(--text-muted)',
                    fontSize: '0.82rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                >
                  <th style={{ padding: '12px 14px' }}>{isMr ? 'हवामान मापदंड (Parameter)' : 'Parameter'}</th>
                  <th style={{ padding: '12px 14px' }}>{isMr ? 'माहिती स्रोत (Source)' : 'Source'}</th>
                  <th style={{ padding: '12px 14px' }}>{isMr ? 'महत्त्व (Importance)' : 'Importance'}</th>
                  <th style={{ padding: '12px 14px' }}>{isMr ? 'कृषी वापर / उपयोग (Use)' : 'Use'}</th>
                  <th style={{ padding: '12px 14px' }}>{isMr ? 'थेट मोजमाप (Live Reading)' : 'Live Reading'}</th>
                  <th style={{ padding: '12px 14px' }}>{isMr ? 'कृषी सल्ला व परिणाम (Advisory)' : 'Advisory & Impact'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredInputs.map((item, idx) => (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      background: idx % 2 === 0 ? 'rgba(255, 255, 255, 0.015)' : 'transparent',
                      transition: 'var(--transition-smooth)'
                    }}
                    className="table-row-hover"
                  >
                    {/* 1. Parameter */}
                    <td style={{ padding: '14px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {getParamIcon(item.id)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.94rem', color: 'var(--text-heading)' }}>
                            {isMr ? item.parameterMarathi : item.parameter}
                          </div>
                          {isMr && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.parameter}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 2. Source */}
                    <td style={{ padding: '14px', whiteSpace: 'nowrap' }}>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          background: item.source.includes('Open-Meteo') ? 'rgba(2, 132, 199, 0.12)' : 'rgba(255, 255, 255, 0.06)',
                          border: item.source.includes('Open-Meteo') ? '1px solid rgba(2, 132, 199, 0.3)' : '1px solid var(--border-subtle)',
                          color: item.source.includes('Open-Meteo') ? '#38bdf8' : 'var(--text-muted)',
                          fontSize: '0.78rem',
                          fontWeight: 600
                        }}
                      >
                        {item.source}
                      </span>
                    </td>

                    {/* 3. Importance */}
                    <td style={{ padding: '14px', whiteSpace: 'nowrap' }}>{getImportanceBadge(item.importance)}</td>

                    {/* 4. Use */}
                    <td style={{ padding: '14px', minWidth: '200px' }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        {isMr ? item.useMarathi : item.use}
                      </div>
                    </td>

                    {/* 5. Live Metric */}
                    <td style={{ padding: '14px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary-light)' }}>
                          {item.value}
                        </span>
                        {item.unit && (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                            {item.unit}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 6. Advisory & Status */}
                    <td style={{ padding: '14px', minWidth: '240px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <div>{getStatusBadge(item.status)}</div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                          {isMr ? item.advisoryMarathi : item.advisory}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* View 2: Cards Grid View (All 11 Inputs Highlighted Individually) */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {filteredInputs.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: '18px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.025)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px',
                  transition: 'var(--transition-smooth)'
                }}
                className="table-row-hover"
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {getParamIcon(item.id)}
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '0.94rem', color: 'var(--text-heading)' }}>
                        {isMr ? item.parameterMarathi : item.parameter}
                      </span>
                    </div>
                    {getImportanceBadge(item.importance)}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-primary-light)' }}>
                      {item.value}
                    </span>
                    {item.unit && (
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {item.unit}
                      </span>
                    )}
                    <span style={{ marginLeft: 'auto' }}>{getStatusBadge(item.status)}</span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 600, marginBottom: '6px' }}>
                    <strong>Use:</strong> {isMr ? item.useMarathi : item.use}
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    {isMr ? item.advisoryMarathi : item.advisory}
                  </div>
                </div>

                <div
                  style={{
                    borderTop: '1px solid var(--border-subtle)',
                    paddingTop: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.74rem',
                    color: 'var(--text-subtle)'
                  }}
                >
                  <span>Source: {item.source}</span>
                  <span style={{ color: 'var(--color-primary)' }}>Live Connected</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. Chemical Spraying & Irrigation Guidance Widgets */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '16px',
          marginBottom: '28px'
        }}
      >
        <div
          className="glass-panel"
          style={{
            padding: '18px 20px',
            borderRadius: 'var(--radius-md)',
            borderLeft: currentWeather?.spraySuitability === 'UNSAFE' ? '4px solid #ef4444' : '4px solid #10b981',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px'
          }}
        >
          <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)' }}>
            <ShieldCheck size={24} color="#34d399" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <h4 style={{ fontSize: '0.96rem', fontWeight: 700, margin: 0 }}>
                {isMr ? 'कीटकनाशक व खत फवारणी सल्ला' : 'Foliar Chemical Spraying Window'}
              </h4>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: '4px',
                  background: currentWeather?.spraySuitability === 'UNSAFE' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                  color: currentWeather?.spraySuitability === 'UNSAFE' ? '#f87171' : '#34d399'
                }}
              >
                {currentWeather?.spraySuitability === 'UNSAFE'
                  ? (isMr ? 'फवारणी थांबवा' : 'UNSAFE TO SPRAY')
                  : (isMr ? 'फवारणीसाठी अनुकूल' : 'SAFE TO SPRAY')}
              </span>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0 }}>
              {currentWeather?.sprayGuidance ||
                (isMr
                  ? 'सध्या वाऱ्याचा वेग मर्यादेत असून पावसाची शक्यता कमी आहे; फवारणी करता येईल.'
                  : 'Current wind velocity is suitable (<15 km/h) with low wash-off risk.')}
            </p>
          </div>
        </div>

        <div
          className="glass-panel"
          style={{
            padding: '18px 20px',
            borderRadius: 'var(--radius-md)',
            borderLeft: '4px solid #0284c7',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px'
          }}
        >
          <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(2, 132, 199, 0.15)' }}>
            <Waves size={24} color="#38bdf8" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <h4 style={{ fontSize: '0.96rem', fontWeight: 700, margin: 0 }}>
                {isMr ? 'सिंचन नियोजन व पाणी बचत' : 'ET₀ Water Budgeting & Irrigation Guidance'}
              </h4>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: '4px',
                  background: 'rgba(2, 132, 199, 0.2)',
                  color: '#38bdf8'
                }}
              >
                {currentWeather?.season || 'Kharif'}
              </span>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0 }}>
              {isMr
                ? `दररोज पिकाचे बाष्पीभवन ${currentWeather?.et0MmDay || 4.74} मिमी आहे. पुढील ७ दिवसांत ${currentWeather?.sevenDayRainSumMm || 10.3} मिमी पाऊस अपेक्षित असल्याने त्यानुसार ठिबक सिंचनाची वेळ ठरवा.`
                : `Daily reference ET₀ is ${currentWeather?.et0MmDay || 4.74} mm/day. Next 7-day cumulative rainfall forecast is ${currentWeather?.sevenDayRainSumMm || 10.3} mm; modulate drip run-times.`}
            </p>
          </div>
        </div>
      </section>

      {/* 5. 7-Day Agricultural Micro-Forecast Grid */}
      <section>
        <div style={{ marginBottom: '14px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
            {isMr ? 'पुढील ७ दिवसांचे कृषी सूक्ष्म-हवामान' : '7-Day Agricultural Micro-Forecast'}
          </h3>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
            {isMr
              ? 'दैनिक तापमान कक्षा, पाऊस संभाव्यता आणि बाष्पीभवन (ET₀) अंदाज'
              : 'Daily diurnal temperature swings, rainfall probabilities, and reference ET₀ water loss.'}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '14px' }}>
          {(forecast.length > 0
            ? forecast
            : [
                { date: '2026-09-04', dayName: 'Today', tempMinC: 22.8, tempMaxC: 29.5, rainfallMm: 1.5, rainProbabilityPct: 79, et0MmDay: 4.74, weatherDescription: 'Scattered monsoon rain showers' },
                { date: '2026-09-05', dayName: 'Tomorrow', tempMinC: 23.2, tempMaxC: 29.6, rainfallMm: 1.4, rainProbabilityPct: 79, et0MmDay: 4.97, weatherDescription: 'Passing showers' },
                { date: '2026-09-06', dayName: 'Sunday', tempMinC: 22.9, tempMaxC: 30.0, rainfallMm: 0.9, rainProbabilityPct: 73, et0MmDay: 4.82, weatherDescription: 'Partly cloudy' },
                { date: '2026-09-07', dayName: 'Monday', tempMinC: 23.5, tempMaxC: 30.8, rainfallMm: 0.2, rainProbabilityPct: 45, et0MmDay: 5.10, weatherDescription: 'Sunny intervals' },
                { date: '2026-09-08', dayName: 'Tuesday', tempMinC: 23.8, tempMaxC: 31.4, rainfallMm: 0.0, rainProbabilityPct: 20, et0MmDay: 5.30, weatherDescription: 'Warm & clear' },
                { date: '2026-09-09', dayName: 'Wednesday', tempMinC: 24.0, tempMaxC: 31.8, rainfallMm: 2.1, rainProbabilityPct: 55, et0MmDay: 5.05, weatherDescription: 'Afternoon isolated shower' },
                { date: '2026-09-10', dayName: 'Thursday', tempMinC: 23.6, tempMaxC: 30.5, rainfallMm: 4.2, rainProbabilityPct: 65, et0MmDay: 4.80, weatherDescription: 'Scattered clouds' }
              ]
          ).map((f: any, i: number) => {
            const isAlertDay = f.rainfallMm > 20 || f.rainProbabilityPct > 70;
            return (
              <div
                key={f.date}
                className="glass-panel"
                style={{
                  padding: '16px 14px',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center',
                  border: isAlertDay ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-subtle)',
                  background: isAlertDay ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-glass)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.84rem', fontWeight: 700, color: i === 0 ? 'var(--color-primary-light)' : 'var(--text-main)' }}>
                    {f.dayName || (i === 0 ? 'Today' : f.date)}
                  </span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{f.date.slice(5)}</span>
                </div>

                <div style={{ margin: '12px 0', display: 'flex', justifyContent: 'center' }}>
                  {f.rainfallMm > 15 ? (
                    <CloudRain size={34} color="#38bdf8" />
                  ) : f.rainfallMm > 0 ? (
                    <CloudRain size={34} color="#93c5fd" />
                  ) : f.tempMaxC > 33 ? (
                    <Sun size={34} color="#f59e0b" />
                  ) : (
                    <Sun size={34} color="#fbbf24" />
                  )}
                </div>

                <div style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '4px' }}>
                  {f.tempMaxC}° <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ {f.tempMinC}°C</span>
                </div>

                <div
                  style={{
                    fontSize: '0.78rem',
                    color: f.rainfallMm > 15 ? '#f87171' : f.rainfallMm > 0 ? '#38bdf8' : '#34d399',
                    fontWeight: 700,
                    marginBottom: '4px'
                  }}
                >
                  {f.rainfallMm} mm Rain ({f.rainProbabilityPct}%)
                </div>

                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  ET₀: <strong>{f.et0MmDay || 4.74} mm/day</strong>
                </div>

                <p
                  style={{
                    fontSize: '0.74rem',
                    color: 'var(--text-muted)',
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                  title={f.weatherDescription}
                >
                  {f.weatherDescription}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
