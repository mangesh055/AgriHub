import { z } from 'zod';

// ==========================================
// 1. Common Enums and Value Types
// ==========================================

export const UserRoleEnum = z.enum(['FARMER', 'ADMIN']);
export type UserRole = z.infer<typeof UserRoleEnum>;

export const IrrigationSourceEnum = z.enum([
  'BOREWELL',
  'CANAL',
  'DRIP',
  'SPRINKLER',
  'RAINFED',
  'RIVER_PUMP',
  'OTHER'
]);
export type IrrigationSource = z.infer<typeof IrrigationSourceEnum>;

export const SoilTypeEnum = z.enum([
  'BLACK_COTTON',
  'ALLUVIAL',
  'RED_SOIL',
  'LATERITE',
  'SANDY_LOAM',
  'CLAY_LOAM',
  'SILT'
]);
export type SoilType = z.infer<typeof SoilTypeEnum>;

export const CropStageEnum = z.enum([
  'SOWING',
  'GERMINATION',
  'VEGETATIVE',
  'FLOWERING',
  'FRUIT_DEVELOPMENT',
  'RIPENING',
  'HARVEST_READY',
  'HARVESTED'
]);
export type CropStage = z.infer<typeof CropStageEnum>;

export const CropCycleStatusEnum = z.enum(['ACTIVE', 'HARVESTED', 'ABANDONED']);
export type CropCycleStatus = z.infer<typeof CropCycleStatusEnum>;

export const AlertSeverityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export type AlertSeverity = z.infer<typeof AlertSeverityEnum>;

export const RiskTypeEnum = z.enum([
  'HEAVY_RAINFALL',
  'HEATWAVE',
  'STRONG_WIND',
  'HIGH_HUMIDITY_FUNGAL',
  'PEST_OUTBREAK',
  'FROST',
  'DROUGHT_STRESS'
]);
export type RiskType = z.infer<typeof RiskTypeEnum>;

export const IrrigationDecisionEnum = z.enum(['IRRIGATE', 'WAIT', 'REDUCE_OR_DRAIN']);
export type IrrigationDecision = z.infer<typeof IrrigationDecisionEnum>;

export const MarketActionEnum = z.enum(['SELL_NOW', 'HOLD_FOR_TARGET', 'MONITOR_TREND']);
export type MarketAction = z.infer<typeof MarketActionEnum>;

export const ExpenseCategoryEnum = z.enum([
  'SEEDS',
  'FERTILIZERS',
  'PESTICIDES',
  'IRRIGATION_ELECTRICITY',
  'LABOR',
  'MACHINERY_FUEL',
  'TRANSPORT',
  'STORAGE',
  'OTHER'
]);
export type ExpenseCategory = z.infer<typeof ExpenseCategoryEnum>;

// ==========================================
// 2. Authentication & Farmer Profile Schemas
// ==========================================

export const RegisterRequestSchema = z.object({
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian 10-digit mobile number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  preferredLanguage: z.string().default('en'),
  state: z.string().optional().default('Maharashtra'),
  district: z.string().optional().default('Pune'),
  taluka: z.string().optional(),
  village: z.string().optional()
});
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const LoginRequestSchema = z.object({
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian 10-digit mobile number'),
  password: z.string().min(1, 'Password is required')
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const FarmerProfileSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  mobile: z.string(),
  name: z.string(),
  preferredLanguage: z.string(),
  state: z.string(),
  district: z.string(),
  taluka: z.string().nullable().optional(),
  village: z.string().nullable().optional(),
  createdAt: z.string().datetime()
});
export type FarmerProfile = z.infer<typeof FarmerProfileSchema>;

// ==========================================
// 3. Farm & GIS Boundaries Schemas
// ==========================================

export const LatLngSchema = z.object({
  lat: z.number(),
  lng: z.number()
});
export type LatLng = z.infer<typeof LatLngSchema>;

export const GeoPolygonSchema = z.object({
  type: z.literal('Polygon'),
  coordinates: z.array(z.array(z.tuple([z.number(), z.number()])))
});
export type GeoPolygon = z.infer<typeof GeoPolygonSchema>;

export const CreateFarmRequestSchema = z.object({
  name: z.string().min(2, 'Farm name is required'),
  areaAcres: z.number().positive('Area must be greater than 0'),
  irrigationSource: z.string().min(1, 'At least one water source is required'),
  waterSources: z.array(z.string()).optional(),
  village: z.string().optional(),
  taluka: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  locationName: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  boundaryGeoJson: GeoPolygonSchema.optional(),
  notes: z.string().optional()
});
export type CreateFarmRequest = z.infer<typeof CreateFarmRequestSchema>;

export const FarmSchema = CreateFarmRequestSchema.extend({
  id: z.string().uuid(),
  farmerId: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type Farm = z.infer<typeof FarmSchema>;

// ==========================================
// 4. Soil Records Schemas
// ==========================================

export const CreateSoilRecordSchema = z.object({
  soilType: z.string().min(1, 'Soil type is required'),
  ph: z.number().min(0).max(14),
  nitrogen: z.number().min(0).describe('kg/ha or ppm'),
  phosphorus: z.number().min(0).describe('kg/ha or ppm'),
  potassium: z.number().min(0).describe('kg/ha or ppm'),
  organicCarbon: z.number().min(0).max(10).describe('percentage'),
  electricalConductivity: z.number().optional().describe('dS/m'),
  testDate: z.string(),
  reportUrl: z.string().optional(),
  reportName: z.string().optional(),
  previousCrop: z.string().optional(),
  previousYieldQuintals: z.number().optional(),
  previousSeason: z.string().optional()
});
export type CreateSoilRecord = z.infer<typeof CreateSoilRecordSchema>;

export const SoilRecordSchema = CreateSoilRecordSchema.extend({
  id: z.string().uuid(),
  farmId: z.string().uuid(),
  createdAt: z.string().datetime()
});
export type SoilRecord = z.infer<typeof SoilRecordSchema>;

// ==========================================
// 5. Crop Recommendation Schemas
// ==========================================

export const CropRecommendationItemSchema = z.object({
  cropName: z.string(),
  suitabilityScore: z.number().min(0).max(100),
  matchReasons: z.array(z.string()),
  waterRequirement: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  durationDays: z.number(),
  estimatedYieldRange: z.string(),
  projectedRoiPct: z.number()
});
export type CropRecommendationItem = z.infer<typeof CropRecommendationItemSchema>;

export const CropRecommendationResultSchema = z.object({
  id: z.string().uuid(),
  farmId: z.string().uuid(),
  recommendations: z.array(CropRecommendationItemSchema),
  inputSnapshot: z.record(z.any()),
  modelVersion: z.string(),
  createdAt: z.string().datetime()
});
export type CropRecommendationResult = z.infer<typeof CropRecommendationResultSchema>;

// ==========================================
// 6. Crop Cycles Schemas
// ==========================================

export const CreateCropCycleSchema = z.object({
  cropName: z.string().min(2),
  variety: z.string().min(1),
  sowingDate: z.string(),
  expectedHarvestDate: z.string(),
  currentStage: CropStageEnum.default('SOWING')
});
export type CreateCropCycle = z.infer<typeof CreateCropCycleSchema>;

export const CropCycleSchema = CreateCropCycleSchema.extend({
  id: z.string().uuid(),
  farmId: z.string().uuid(),
  status: CropCycleStatusEnum,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type CropCycle = z.infer<typeof CropCycleSchema>;

// ==========================================
// 7. Weather & Agricultural Risk Schemas
// ==========================================

export const CurrentWeatherSchema = z.object({
  temperatureC: z.number(),
  humidityPct: z.number(),
  rainfallMm: z.number(),
  rainProbabilityPct: z.number(),
  windSpeedKph: z.number(),
  uvIndex: z.number().optional(),
  weatherDescription: z.string(),
  observedAt: z.string().datetime(),
  isSimulated: z.boolean().default(false)
});
export type CurrentWeather = z.infer<typeof CurrentWeatherSchema>;

export const WeatherForecastItemSchema = z.object({
  date: z.string(),
  tempMinC: z.number(),
  tempMaxC: z.number(),
  humidityPct: z.number(),
  rainfallMm: z.number(),
  rainProbabilityPct: z.number(),
  weatherDescription: z.string()
});
export type WeatherForecastItem = z.infer<typeof WeatherForecastItemSchema>;

export const WeatherAlertSchema = z.object({
  id: z.string().uuid(),
  farmId: z.string().uuid(),
  cropCycleId: z.string().uuid().nullable().optional(),
  riskType: RiskTypeEnum,
  severity: AlertSeverityEnum,
  title: z.string(),
  message: z.string(),
  actionableGuidance: z.string(),
  validUntil: z.string().datetime(),
  createdAt: z.string().datetime()
});
export type WeatherAlert = z.infer<typeof WeatherAlertSchema>;

// ==========================================
// 8. IoT & Smart Irrigation Schemas
// ==========================================

export const IngestTelemetrySchema = z.object({
  deviceUid: z.string(),
  soilMoisturePct: z.number().min(0).max(100),
  temperatureC: z.number(),
  humidityPct: z.number().min(0).max(100),
  batteryPct: z.number().optional(),
  timestamp: z.string().datetime().optional()
});
export type IngestTelemetry = z.infer<typeof IngestTelemetrySchema>;

export const IrrigationRecommendationSchema = z.object({
  id: z.string().uuid(),
  farmId: z.string().uuid(),
  cropCycleId: z.string().uuid().nullable().optional(),
  decision: IrrigationDecisionEnum,
  urgency: AlertSeverityEnum,
  reason: z.string(),
  waterLitersRecommended: z.number().optional(),
  runTimeMinutesRecommended: z.number().optional(),
  metricsSnapshot: z.object({
    soilMoisturePct: z.number(),
    forecastRainfallMm: z.number(),
    cropStage: CropStageEnum.optional()
  }),
  createdAt: z.string().datetime()
});
export type IrrigationRecommendation = z.infer<typeof IrrigationRecommendationSchema>;

// ==========================================
// 9. Crop Disease Detection Schemas
// ==========================================

export const DiseaseDetectionResultSchema = z.object({
  id: z.string().uuid(),
  cropCycleId: z.string().uuid().nullable().optional(),
  farmId: z.string().uuid(),
  imageUrl: z.string(),
  cropDetected: z.string(),
  diseaseName: z.string(),
  isHealthy: z.boolean(),
  confidencePct: z.number().min(0).max(100),
  severity: AlertSeverityEnum,
  status: z.enum(['CONFIRMED', 'UNCERTAIN', 'LOW_QUALITY_IMAGE']),
  clinicalSymptoms: z.array(z.string()),
  organicTreatments: z.array(z.string()),
  chemicalControls: z.array(z.string()),
  preventionTips: z.array(z.string()),
  disclaimer: z.string(),
  createdAt: z.string().datetime()
});
export type DiseaseDetectionResult = z.infer<typeof DiseaseDetectionResultSchema>;

// ==========================================
// 10. Market, Mandis & Economics Schemas
// ==========================================

export const MandiPriceRecordSchema = z.object({
  id: z.string().uuid(),
  mandiName: z.string(),
  district: z.string(),
  state: z.string(),
  cropName: z.string(),
  minPrice: z.number(),
  modalPrice: z.number(),
  maxPrice: z.number(),
  unit: z.string().default('₹/Quintal'),
  arrivalsTonnes: z.number().optional(),
  priceDate: z.string()
});
export type MandiPriceRecord = z.infer<typeof MandiPriceRecordSchema>;

export const MandiComparisonSchema = z.object({
  mandiId: z.string(),
  mandiName: z.string(),
  distanceKm: z.number(),
  modalPrice: z.number(),
  transportCostPerQuintal: z.number(),
  netRealizedPricePerQuintal: z.number(),
  isRecommended: z.boolean()
});
export type MandiComparison = z.infer<typeof MandiComparisonSchema>;

export const MarketDecisionSupportSchema = z.object({
  cropName: z.string(),
  currentModalPrice: z.number(),
  forecastPrice7Days: z.number(),
  priceTrend: z.enum(['RISING', 'STABLE', 'FALLING']),
  action: MarketActionEnum,
  rationale: z.string(),
  holdingCostPerQuintalPerWeek: z.number(),
  netHoldingGainProjected: z.number(),
  nearbyMandis: z.array(MandiComparisonSchema)
});
export type MarketDecisionSupport = z.infer<typeof MarketDecisionSupportSchema>;

export const ExpenseRecordSchema = z.object({
  id: z.string().uuid(),
  farmId: z.string().uuid(),
  cropCycleId: z.string().uuid().nullable().optional(),
  category: ExpenseCategoryEnum,
  amount: z.number().positive(),
  date: z.string(),
  notes: z.string().optional()
});
export type ExpenseRecord = z.infer<typeof ExpenseRecordSchema>;

export const ProfitSummarySchema = z.object({
  totalExpenses: z.number(),
  expensesByCategory: z.record(ExpenseCategoryEnum, z.number()),
  estimatedYieldQuintals: z.number(),
  estimatedRevenue: z.number(),
  netProfitProjected: z.number(),
  roiPercentage: z.number()
});
export type ProfitSummary = z.infer<typeof ProfitSummarySchema>;

// ==========================================
// 11. Unified Decision Engine & Master Directive
// ==========================================

export const UnifiedDailyActionSchema = z.object({
  title: z.string(),
  actionCategory: z.enum([
    'IRRIGATION',
    'WEATHER_PROTECTION',
    'DISEASE_MANAGEMENT',
    'MARKET_ACTION',
    'ROUTINE_MONITORING'
  ]),
  priority: AlertSeverityEnum,
  headline: z.string(),
  detailedReason: z.string(),
  contributingFactors: z.object({
    weatherSummary: z.string(),
    soilMoisturePct: z.number().optional(),
    cropStage: CropStageEnum.optional(),
    activeRisks: z.array(z.string()),
    marketInsight: z.string().optional()
  }),
  actionButtonText: z.string(),
  actionNavigationPath: z.string(),
  generatedAt: z.string().datetime()
});
export type UnifiedDailyAction = z.infer<typeof UnifiedDailyActionSchema>;
