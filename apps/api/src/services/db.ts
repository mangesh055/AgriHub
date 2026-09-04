import { getSupabaseClient, isSupabaseConfigured } from '../config/supabase.js';
import { store } from './storage.js';
import { Farm, SoilRecord, CropCycle, ExpenseRecord } from '@agrihub/contracts';

export const db = {
  isCloudConnected(): boolean {
    return isSupabaseConfigured();
  },

  // 1. Farms
  async getFarms(farmerId?: string): Promise<any[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      const query = supabase.from('farms').select('*');
      if (farmerId) query.eq('farmer_id', farmerId);
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data.map((f) => ({
          id: f.id,
          farmerId: f.farmer_id,
          name: f.name,
          areaAcres: Number(f.area_acres),
          irrigationSource: f.irrigation_source,
          latitude: Number(f.latitude),
          longitude: Number(f.longitude),
          boundaryGeoJson: f.boundary_geojson,
          notes: f.notes,
          createdAt: f.created_at,
          updatedAt: f.updated_at
        }));
      }
    }
    return Array.from(store.farms.values());
  },

  async createFarm(farm: any): Promise<any> {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('farms')
        .insert([
          {
            id: farm.id,
            farmer_id: farm.farmerId,
            name: farm.name,
            area_acres: farm.areaAcres,
            irrigation_source: farm.irrigationSource,
            latitude: farm.latitude,
            longitude: farm.longitude,
            boundary_geojson: farm.boundaryGeoJson,
            notes: farm.notes
          }
        ])
        .select()
        .single();
      if (!error && data) {
        return {
          id: data.id,
          farmerId: data.farmer_id,
          name: data.name,
          areaAcres: Number(data.area_acres),
          irrigationSource: data.irrigation_source,
          latitude: Number(data.latitude),
          longitude: Number(data.longitude),
          boundaryGeoJson: data.boundary_geojson,
          notes: data.notes,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };
      }
    }
    store.farms.set(farm.id, farm);
    return farm;
  },

  // 2. Soil Records
  async getSoilRecords(farmId: string): Promise<any[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('soil_records')
        .select('*')
        .eq('farm_id', farmId)
        .order('test_date', { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map((s) => ({
          id: s.id,
          farmId: s.farm_id,
          soilType: s.soil_type,
          ph: Number(s.ph),
          nitrogen: Number(s.nitrogen),
          phosphorus: Number(s.phosphorus),
          potassium: Number(s.potassium),
          organicCarbon: Number(s.organic_carbon),
          electricalConductivity: s.electrical_conductivity ? Number(s.electrical_conductivity) : undefined,
          testDate: s.test_date,
          createdAt: s.created_at
        }));
      }
    }
    return store.soilRecords.get(farmId) || [];
  },

  async createSoilRecord(record: any): Promise<any> {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('soil_records')
        .insert([
          {
            id: record.id,
            farm_id: record.farmId,
            soil_type: record.soilType,
            ph: record.ph,
            nitrogen: record.nitrogen,
            phosphorus: record.phosphorus,
            potassium: record.potassium,
            organic_carbon: record.organicCarbon,
            electrical_conductivity: record.electricalConductivity,
            test_date: record.testDate
          }
        ])
        .select()
        .single();
      if (!error && data) {
        return {
          id: data.id,
          farmId: data.farm_id,
          soilType: data.soil_type,
          ph: Number(data.ph),
          nitrogen: Number(data.nitrogen),
          phosphorus: Number(data.phosphorus),
          potassium: Number(data.potassium),
          organicCarbon: Number(data.organic_carbon),
          testDate: data.test_date,
          createdAt: data.created_at
        };
      }
    }
    const existing = store.soilRecords.get(record.farmId) || [];
    existing.unshift(record);
    store.soilRecords.set(record.farmId, existing);
    return record;
  },

  // 3. Crop Cycles
  async getCropCycles(farmId: string): Promise<any[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('crop_cycles')
        .select('*')
        .eq('farm_id', farmId)
        .order('sowing_date', { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map((c) => ({
          id: c.id,
          farmId: c.farm_id,
          cropName: c.crop_name,
          variety: c.variety,
          sowingDate: c.sowing_date,
          expectedHarvestDate: c.expected_harvest_date,
          currentStage: c.current_stage,
          status: c.status,
          createdAt: c.created_at,
          updatedAt: c.updated_at
        }));
      }
    }
    return store.cropCycles.get(farmId) || [];
  },

  // 4. Expenses
  async getExpenses(farmId: string): Promise<any[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('farm_expenses')
        .select('*')
        .eq('farm_id', farmId)
        .order('expense_date', { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map((e) => ({
          id: e.id,
          farmId: e.farm_id,
          category: e.category,
          amount: Number(e.amount),
          date: e.expense_date,
          notes: e.notes,
          createdAt: e.created_at
        }));
      }
    }
    return store.expenses.get(farmId) || [];
  },

  async createExpense(expense: any): Promise<any> {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('farm_expenses')
        .insert([
          {
            id: expense.id,
            farm_id: expense.farmId,
            crop_cycle_id: expense.cropCycleId,
            category: expense.category,
            amount: expense.amount,
            expense_date: expense.date,
            notes: expense.notes
          }
        ])
        .select()
        .single();
      if (!error && data) {
        return {
          id: data.id,
          farmId: data.farm_id,
          category: data.category,
          amount: Number(data.amount),
          date: data.expense_date,
          notes: data.notes
        };
      }
    }
    const existing = store.expenses.get(expense.farmId) || [];
    existing.unshift(expense);
    store.expenses.set(expense.farmId, existing);
    return expense;
  },

  // 5. IoT Sensor Telemetry
  async getLatestTelemetry(farmId: string): Promise<any> {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('sensor_readings')
        .select('*')
        .eq('farm_id', farmId)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single();
      if (!error && data) {
        return {
          id: data.id,
          farmId: data.farm_id,
          deviceUid: 'ESP32-AGRI-PUNE-01',
          soilMoisturePct: Number(data.soil_moisture_pct),
          temperatureC: Number(data.temperature_c),
          humidityPct: Number(data.humidity_pct),
          batteryPct: data.battery_pct ? Number(data.battery_pct) : 95,
          timestamp: data.recorded_at
        };
      }
    }
    const list = store.telemetry.get(farmId) || [];
    return list[list.length - 1];
  },

  async recordTelemetry(reading: any): Promise<any> {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('sensor_readings').insert([
        {
          id: reading.id,
          farm_id: reading.farmId,
          soil_moisture_pct: reading.soilMoisturePct,
          temperature_c: reading.temperatureC,
          humidity_pct: reading.humidityPct,
          battery_pct: reading.batteryPct,
          recorded_at: reading.timestamp
        }
      ]);
    }
    const existing = store.telemetry.get(reading.farmId) || [];
    existing.push(reading);
    if (existing.length > 100) existing.shift();
    store.telemetry.set(reading.farmId, existing);
    return reading;
  }
};
