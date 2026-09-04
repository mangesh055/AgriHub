const API_BASE_URL = 'http://localhost:4000/api/v1';

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('agrihub_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {})
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  // Auth & Farmer
  getMe: () => apiRequest<any>('/auth/me'),
  getProfile: () => apiRequest<any>('/auth/profile'),
  login: (credentials: any) =>
    apiRequest<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),
  register: (data: any) =>
    apiRequest<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Farms
  getFarms: () => apiRequest<any[]>('/farms'),
  getFarm: (id: string) => apiRequest<any>(`/farms/${id}`),
  createFarm: (farm: any) =>
    apiRequest<any>('/farms', {
      method: 'POST',
      body: JSON.stringify(farm)
    }),

  // Soil & Crops
  getSoilRecords: (farmId: string) => apiRequest<any[]>(`/farms/${farmId}/soil-records`),
  getCropCycles: (farmId: string) => apiRequest<any[]>(`/farms/${farmId}/crop-cycles`),
  getCropRecommendations: (farmId: string, season: string = 'KHARIF') =>
    apiRequest<any>('/crops/recommendations', {
      method: 'POST',
      body: JSON.stringify({ farmId, season })
    }),

  // Weather & Risk
  getCurrentWeather: (farmId?: string) =>
    apiRequest<any>(`/weather/current${farmId ? `?farmId=${farmId}` : ''}`),
  getWeatherForecast: (farmId?: string) =>
    apiRequest<any>(`/weather/forecast${farmId ? `?farmId=${farmId}` : ''}`),
  getWeatherAlerts: (farmId?: string) =>
    apiRequest<any>(`/weather/alerts${farmId ? `?farmId=${farmId}` : ''}`),

  // IoT & Irrigation
  getLatestTelemetry: (farmId?: string) =>
    apiRequest<any>(`/iot/latest${farmId ? `?farmId=${farmId}` : ''}`),
  getTelemetryHistory: (farmId?: string) =>
    apiRequest<any>(`/iot/history${farmId ? `?farmId=${farmId}` : ''}`),
  simulateTelemetry: (payload: any) =>
    apiRequest<any>('/iot/simulate', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  getIrrigationRecommendation: (farmId?: string) =>
    apiRequest<any>(`/iot/irrigation-recommendation${farmId ? `?farmId=${farmId}` : ''}`),

  // Crop Disease Detection
  diagnoseDisease: (cropCycleId: string, payload: any) =>
    apiRequest<any>(`/crops/${cropCycleId}/diagnose`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  getDiagnoses: (cropCycleId: string) =>
    apiRequest<any[]>(`/crops/${cropCycleId}/diagnoses`),

  // Market & Mandis
  getMandiPrices: (crop: string = 'Soybean') =>
    apiRequest<any[]>(`/market/prices?crop=${crop}`),
  getMandiComparison: (crop: string = 'Soybean', quantity: number = 45) =>
    apiRequest<any[]>(`/market/comparison?crop=${crop}&quantity=${quantity}`),
  getMarketDecision: (crop: string = 'Soybean') =>
    apiRequest<any>(`/market/decision-support?crop=${crop}`),

  // Expenses & Profit
  getExpenses: (farmId: string) => apiRequest<any[]>(`/farms/${farmId}/expenses`),
  addExpense: (farmId: string, expense: any) =>
    apiRequest<any>(`/farms/${farmId}/expenses`, {
      method: 'POST',
      body: JSON.stringify(expense)
    }),
  getProfitSummary: (farmId: string) =>
    apiRequest<any>(`/farms/${farmId}/profit-summary`),

  // Knowledge: Schemes & Seeds
  getSchemes: () => apiRequest<any[]>('/knowledge/schemes'),
  getSeeds: (crop?: string) =>
    apiRequest<any[]>(`/knowledge/seeds${crop ? `?crop=${crop}` : ''}`),

  // AI Assistant Chat
  askAssistant: (farmId: string, message: string) =>
    apiRequest<{ reply: string; timestamp: string }>('/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ farmId, message })
    }),

  // Unified Decision Engine Master Directive
  getUnifiedAction: (farmId?: string) =>
    apiRequest<any>(`/unified/action${farmId ? `?farmId=${farmId}` : ''}`)
};
