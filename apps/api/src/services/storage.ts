import {
  FarmerProfile,
  Farm,
  SoilRecord,
  CropCycle,
  WeatherAlert,
  IrrigationRecommendation,
  DiseaseDetectionResult,
  MandiPriceRecord,
  ExpenseRecord
} from '@agrihub/contracts';

export interface UserRecord {
  id: string;
  mobile: string;
  passwordHash: string;
  role: 'FARMER' | 'ADMIN';
  createdAt: string;
}

export interface SensorTelemetryRecord {
  id: string;
  farmId: string;
  deviceUid: string;
  soilMoisturePct: number;
  temperatureC: number;
  humidityPct: number;
  batteryPct: number;
  timestamp: string;
}

export interface GovernmentScheme {
  id: string;
  name: string;
  category: string;
  state: string;
  eligibility: string[];
  benefits: string;
  documents: string[];
  sourceUrl: string;
  validUntil: string;
}

export interface SeedVariety {
  id: string;
  cropName: string;
  varietyName: string;
  maturationDays: number;
  suitableRegions: string[];
  waterRequirement: 'LOW' | 'MEDIUM' | 'HIGH';
  characteristics: string[];
  supplier: string;
}

class InMemoryStore {
  public users: Map<string, UserRecord> = new Map();
  public profiles: Map<string, FarmerProfile> = new Map();
  public farms: Map<string, Farm> = new Map();
  public soilRecords: Map<string, SoilRecord[]> = new Map(); // farmId -> SoilRecord[]
  public cropCycles: Map<string, CropCycle[]> = new Map(); // farmId -> CropCycle[]
  public weatherAlerts: Map<string, WeatherAlert[]> = new Map(); // farmId -> WeatherAlert[]
  public telemetry: Map<string, SensorTelemetryRecord[]> = new Map(); // farmId -> SensorTelemetryRecord[]
  public irrigationRecommendations: Map<string, IrrigationRecommendation[]> = new Map();
  public diseaseDiagnoses: Map<string, DiseaseDetectionResult[]> = new Map(); // cropCycleId -> DiseaseDetectionResult[]
  public mandis: MandiPriceRecord[] = [];
  public expenses: Map<string, ExpenseRecord[]> = new Map(); // farmId -> ExpenseRecord[]
  public schemes: GovernmentScheme[] = [];
  public seeds: SeedVariety[] = [];

  constructor() {
    this.seedDefaultData();
  }

  private seedDefaultData() {
    // 1. Demo User: Ramesh Patel
    const demoUserId = '11111111-1111-1111-1111-111111111111';
    const demoFarmerId = '22222222-2222-2222-2222-222222222222';
    const demoFarmId = '33333333-3333-3333-3333-333333333333';
    const demoCropCycleId = '55555555-5555-5555-5555-555555555555';

    // Hash for 'agrihub123'
    this.users.set(demoUserId, {
      id: demoUserId,
      mobile: '9876543210',
      passwordHash: '$2a$10$wTfZ456Hk09kX.O8hW8nQehYV4PjIe4sQ8Yg4a5QG4J9tW1Z4Yt7G', // pre-hashed demo
      role: 'FARMER',
      createdAt: '2026-01-15T08:00:00.000Z'
    });

    this.profiles.set(demoFarmerId, {
      id: demoFarmerId,
      userId: demoUserId,
      mobile: '9876543210',
      name: 'Ramesh Patel',
      preferredLanguage: 'en',
      state: 'Maharashtra',
      district: 'Pune',
      taluka: 'Haveli',
      village: 'Uruli Kanchan',
      createdAt: '2026-01-15T08:00:00.000Z'
    });

    // 2. Demo Farm: 4.5 Acres with Drip Irrigation & Leaflet Boundary
    this.farms.set(demoFarmId, {
      id: demoFarmId,
      farmerId: demoFarmerId,
      name: 'Krishna Agri Fields (East Sector)',
      areaAcres: 4.5,
      irrigationSource: 'DRIP',
      latitude: 18.4875,
      longitude: 74.1332,
      boundaryGeoJson: {
        type: 'Polygon',
        coordinates: [
          [
            [74.1325, 18.4868],
            [74.1342, 18.4869],
            [74.1339, 18.4883],
            [74.1321, 18.4881],
            [74.1325, 18.4868]
          ]
        ]
      },
      notes: 'Deep Black Cotton Soil, equipped with Netafim automated drip line.',
      createdAt: '2026-01-16T10:30:00.000Z',
      updatedAt: '2026-01-16T10:30:00.000Z'
    });

    // 3. Soil Record
    this.soilRecords.set(demoFarmId, [
      {
        id: '44444444-4444-4444-4444-444444444444',
        farmId: demoFarmId,
        soilType: 'BLACK_COTTON',
        ph: 7.4,
        nitrogen: 210, // kg/ha (Medium-Low)
        phosphorus: 28, // kg/ha (Medium)
        potassium: 340, // kg/ha (High)
        organicCarbon: 0.68, // %
        electricalConductivity: 0.42, // dS/m
        testDate: '2026-01-10',
        createdAt: '2026-01-16T11:00:00.000Z'
      }
    ]);

    // 4. Active Crop Cycle: Soybean (Variety JS-335)
    this.cropCycles.set(demoFarmId, [
      {
        id: demoCropCycleId,
        farmId: demoFarmId,
        cropName: 'Soybean',
        variety: 'JS-335 (High Pod Count)',
        sowingDate: '2026-06-20',
        expectedHarvestDate: '2026-10-05',
        currentStage: 'FLOWERING',
        status: 'ACTIVE',
        createdAt: '2026-06-20T07:00:00.000Z',
        updatedAt: '2026-08-28T09:00:00.000Z'
      }
    ]);

    // 5. Initial IoT Telemetry: Moisture currently at 34%
    const now = new Date();
    const telemetryItems: SensorTelemetryRecord[] = [];
    for (let i = 12; i >= 0; i--) {
      const pastTime = new Date(now.getTime() - i * 2 * 3600 * 1000);
      telemetryItems.push({
        id: `tel-${i}`,
        farmId: demoFarmId,
        deviceUid: 'ESP32-AGRI-PUNE-01',
        soilMoisturePct: Math.round(38 - i * 0.4 + Math.sin(i) * 1.5),
        temperatureC: Math.round(28 + Math.cos(i) * 3),
        humidityPct: Math.round(72 + Math.sin(i) * 5),
        batteryPct: 92,
        timestamp: pastTime.toISOString()
      });
    }
    this.telemetry.set(demoFarmId, telemetryItems);

    // 6. Mandis Data
    this.mandis = [
      {
        id: 'mandi-pune',
        mandiName: 'Pune APMC (Gultekdi)',
        district: 'Pune',
        state: 'Maharashtra',
        cropName: 'Soybean',
        minPrice: 4650,
        modalPrice: 4850,
        maxPrice: 5020,
        unit: '₹/Quintal',
        arrivalsTonnes: 420,
        priceDate: '2026-09-03'
      },
      {
        id: 'mandi-baramati',
        mandiName: 'Baramati APMC',
        district: 'Pune',
        state: 'Maharashtra',
        cropName: 'Soybean',
        minPrice: 4800,
        modalPrice: 5120,
        maxPrice: 5280,
        unit: '₹/Quintal',
        arrivalsTonnes: 280,
        priceDate: '2026-09-03'
      },
      {
        id: 'mandi-shirur',
        mandiName: 'Shirur APMC',
        district: 'Pune',
        state: 'Maharashtra',
        cropName: 'Soybean',
        minPrice: 4600,
        modalPrice: 4790,
        maxPrice: 4910,
        unit: '₹/Quintal',
        arrivalsTonnes: 190,
        priceDate: '2026-09-03'
      }
    ];

    // 7. Initial Expenses
    this.expenses.set(demoFarmId, [
      {
        id: 'exp-1',
        farmId: demoFarmId,
        cropCycleId: demoCropCycleId,
        category: 'SEEDS',
        amount: 8500,
        date: '2026-06-18',
        notes: 'Certified JS-335 foundation seed bags (75kg)'
      },
      {
        id: 'exp-2',
        farmId: demoFarmId,
        cropCycleId: demoCropCycleId,
        category: 'FERTILIZERS',
        amount: 14200,
        date: '2026-06-25',
        notes: 'Single Super Phosphate (SSP) & Muriate of Potash basal application'
      },
      {
        id: 'exp-3',
        farmId: demoFarmId,
        cropCycleId: demoCropCycleId,
        category: 'IRRIGATION_ELECTRICITY',
        amount: 3800,
        date: '2026-07-20',
        notes: 'MSEDCL Agricultural power tariff and drip filter maintenance'
      },
      {
        id: 'exp-4',
        farmId: demoFarmId,
        cropCycleId: demoCropCycleId,
        category: 'LABOR',
        amount: 9600,
        date: '2026-08-05',
        notes: 'First intercultural weeding & earthing up'
      }
    ]);

    // 8. Government Schemes
    this.schemes = [
      {
        id: 'scheme-pm-kisan',
        name: 'PM-KISAN Samman Nidhi',
        category: 'Direct Income Support',
        state: 'All India',
        eligibility: ['Landholding farmer families', 'Valid Aadhaar & land ownership records'],
        benefits: '₹6,000 annually paid in three equal installments of ₹2,000.',
        documents: ['Aadhaar Card', 'Land Ownership Records (7/12 extract)', 'Bank Account Passbook'],
        sourceUrl: 'https://pmkisan.gov.in',
        validUntil: '2030-03-31'
      },
      {
        id: 'scheme-drip-subsidy',
        name: 'Mahadbt Micro-Irrigation Drip Subsidy (PDMC)',
        category: 'Irrigation & Water Conservation',
        state: 'Maharashtra',
        eligibility: ['Small and marginal farmers holding agricultural land', 'Functional water source'],
        benefits: 'Up to 55% subsidy on installation of automated drip & sprinkler systems.',
        documents: ['7/12 & 8-A extracts', 'Water & electricity bill', 'Quotation from authorized dealer'],
        sourceUrl: 'https://mahadbt.maharashtra.gov.in',
        validUntil: '2027-12-31'
      },
      {
        id: 'scheme-pmfby',
        name: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
        category: 'Crop Insurance',
        state: 'All India',
        eligibility: ['All farmers growing notified Kharif/Rabi crops in notified areas'],
        benefits: 'Comprehensive risk coverage against drought, flood, pests, and unseasonal rains at 2% premium.',
        documents: ['Sowing certificate', 'Land possession certificate', 'Aadhaar Card', 'Bank details'],
        sourceUrl: 'https://pmfby.gov.in',
        validUntil: '2028-06-30'
      }
    ];

    // 9. Certified Seed Varieties
    this.seeds = [
      {
        id: 'seed-js-335',
        cropName: 'Soybean',
        varietyName: 'JS-335',
        maturationDays: 95,
        suitableRegions: ['Maharashtra', 'Madhya Pradesh', 'Karnataka'],
        waterRequirement: 'MEDIUM',
        characteristics: ['Resistant to pod shattering', 'High oil content (20%)', 'Tolerant to girdler beetle'],
        supplier: 'Mahabeej (Maharashtra State Seeds Corporation)'
      },
      {
        id: 'seed-kds-726',
        cropName: 'Soybean',
        varietyName: 'Phule Sangam (KDS-726)',
        maturationDays: 105,
        suitableRegions: ['Western Maharashtra', 'Vidarbha', 'Marathwada'],
        waterRequirement: 'MEDIUM',
        characteristics: ['Yield potential 25-30 quintals/ha', 'High resistance to Rust & Stem Fly'],
        supplier: 'MPKV Rahuri Certified Seeds'
      },
      {
        id: 'seed-bhima-shakti',
        cropName: 'Onion',
        varietyName: 'Bhima Shakti',
        maturationDays: 125,
        suitableRegions: ['Maharashtra', 'Gujarat', 'Karnataka'],
        waterRequirement: 'MEDIUM',
        characteristics: ['Suitable for Late Kharif and Rabi', 'High storability up to 5 months', 'Attractive red bulbs'],
        supplier: 'ICAR-DOGR Rajgurunagar'
      }
    ];
  }
}

export const store = new InMemoryStore();
