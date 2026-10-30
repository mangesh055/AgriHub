import { getSupabaseClient, isSupabaseConfigured } from '../config/supabase.js';
import { store } from './storage.js';
import { Farm, SoilRecord, CropCycle, ExpenseRecord } from '@agrihub/contracts';

export const db = {
  isCloudConnected(): boolean {
    return isSupabaseConfigured();
  },



  // Helper to ensure farmer profile exists in Supabase to avoid foreign key errors
  async ensureFarmerExists(farmerId?: string): Promise<string> {
    const supabase = getSupabaseClient();
    if (!supabase) return farmerId || '';

    // If a farmerId is provided, check if it already exists in Supabase
    if (farmerId) {
      const { data: existing } = await supabase
        .from('farmer_profiles')
        .select('id')
        .eq('id', farmerId)
        .maybeSingle();
      if (existing) return existing.id;
    }

    // Try finding profile in memory
    const memProfile = farmerId ? store.profiles.get(farmerId) : Array.from(store.profiles.values())[0];
    if (memProfile) {
      // Ensure user exists first
      const memUser = store.users.get(memProfile.userId);
      if (memUser) {
        await supabase.from('users').upsert(
          {
            id: memUser.id,
            mobile: memUser.mobile,
            password_hash: memUser.passwordHash,
            role: memUser.role
          },
          { onConflict: 'id' }
        );
      }
      const { data: upsertedProfile, error: pErr } = await supabase.from('farmer_profiles').upsert(
        {
          id: memProfile.id,
          user_id: memProfile.userId,
          name: memProfile.name,
          preferred_language: memProfile.preferredLanguage || 'en',
          state: memProfile.state || 'Maharashtra',
          district: memProfile.district || 'Pune',
          taluka: memProfile.taluka || '',
          village: memProfile.village || ''
        },
        { onConflict: 'id' }
      ).select('id').single();

      if (!pErr && upsertedProfile) return upsertedProfile.id;
    }

    // Fallback: pick any existing profile in Supabase
    const { data: fallback } = await supabase.from('farmer_profiles').select('id').limit(1).maybeSingle();
    if (fallback) return fallback.id;

    return farmerId || '';
  },

  // Helper to ensure farm exists in Supabase before child records are added
  async ensureFarmExists(farmId: string): Promise<string> {
    const supabase = getSupabaseClient();
    if (!supabase) return farmId;

    const { data: existing } = await supabase.from('farms').select('id').eq('id', farmId).maybeSingle();
    if (existing) return existing.id;

    const memFarm = store.farms.get(farmId);
    if (memFarm) {
      await this.createFarm(memFarm);
    }
    return farmId;
  },

  // 1. Farms
  async getFarms(farmerId?: string): Promise<any[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      let query = supabase.from('farms').select('*');
      if (farmerId) query = query.eq('farmer_id', farmerId);
      const { data, error } = await query;
      if (error) {
        console.error('❌ Supabase getFarms error:', error.message);
      } else if (data && data.length > 0) {
        return data.map((f) => {
          const locMeta = f.boundary_geojson?.locationMeta || {};
          const splitWater = f.irrigation_source ? f.irrigation_source.split(',').map((s: string) => s.trim()) : ['CANAL', 'DRIP'];
          return {
            id: f.id,
            farmerId: f.farmer_id,
            name: f.name,
            areaAcres: Number(f.area_acres),
            irrigationSource: f.irrigation_source,
            waterSources: locMeta.waterSources || splitWater,
            latitude: Number(f.latitude),
            longitude: Number(f.longitude),
            village: locMeta.village || f.village || '',
            taluka: locMeta.taluka || f.taluka || '',
            district: locMeta.district || f.district || '',
            state: locMeta.state || f.state || 'Maharashtra',
            locationName: locMeta.locationName || f.location_name || '',
            boundaryGeoJson: f.boundary_geojson,
            cropAllocations: locMeta.cropAllocations || f.crop_allocations || [],
            ownershipType: locMeta.ownershipType || f.ownership_type || 'INDIVIDUAL',
            gatNumber: locMeta.gatNumber || f.gat_number || '',
            coOwners: locMeta.coOwners || f.co_owners || [],
            splitOrientation: locMeta.splitOrientation || (f as any).split_orientation || 'auto',
            notes: f.notes,
            createdAt: f.created_at,
            updatedAt: f.updated_at
          };
        });
      } else if (farmerId) {
        // Fallback: If no farms found specifically for this farmer_id, query all farms
        const { data: allSupabaseFarms } = await supabase.from('farms').select('*');
        if (allSupabaseFarms && allSupabaseFarms.length > 0) {
          return allSupabaseFarms.map((f) => {
            const locMeta = f.boundary_geojson?.locationMeta || {};
            const splitWater = f.irrigation_source ? f.irrigation_source.split(',').map((s: string) => s.trim()) : ['CANAL', 'DRIP'];
            return {
              id: f.id,
              farmerId: f.farmer_id,
              name: f.name,
              areaAcres: Number(f.area_acres),
              irrigationSource: f.irrigation_source,
              waterSources: locMeta.waterSources || splitWater,
              latitude: Number(f.latitude),
              longitude: Number(f.longitude),
              village: locMeta.village || f.village || '',
              taluka: locMeta.taluka || f.taluka || '',
              district: locMeta.district || f.district || '',
              state: locMeta.state || f.state || 'Maharashtra',
              locationName: locMeta.locationName || f.location_name || '',
              boundaryGeoJson: f.boundary_geojson,
              cropAllocations: locMeta.cropAllocations || f.crop_allocations || [],
              ownershipType: locMeta.ownershipType || f.ownership_type || 'INDIVIDUAL',
              gatNumber: locMeta.gatNumber || f.gat_number || '',
              coOwners: locMeta.coOwners || f.co_owners || [],
              splitOrientation: locMeta.splitOrientation || (f as any).split_orientation || 'auto',
              notes: f.notes,
              createdAt: f.created_at,
              updatedAt: f.updated_at
            };
          });
        }
      }
    }
    const all = Array.from(store.farms.values());
    if (farmerId) {
      const filtered = all.filter((f) => f.farmerId === farmerId);
      if (filtered.length > 0) return filtered;
    }
    return all;
  },

  async createFarm(farm: any): Promise<any> {
    const supabase = getSupabaseClient();
    if (supabase) {
      const effectiveFarmerId = await this.ensureFarmerExists(farm.farmerId);

      const baseGeo = farm.boundaryGeoJson || { type: 'Polygon', coordinates: [] };
      const boundaryWithMeta = {
        ...baseGeo,
        locationMeta: {
          village: farm.village || '',
          taluka: farm.taluka || '',
          district: farm.district || '',
          state: farm.state || 'Maharashtra',
          locationName: farm.locationName || '',
          cropAllocations: farm.cropAllocations || [],
          ownershipType: farm.ownershipType || 'INDIVIDUAL',
          gatNumber: farm.gatNumber || '',
          coOwners: farm.coOwners || [],
          waterSources: farm.waterSources || (farm.irrigationSource ? farm.irrigationSource.split(',').map((s: string) => s.trim()) : ['CANAL', 'DRIP']),
          splitOrientation: farm.splitOrientation || 'auto'
        }
      };

      const { data, error } = await supabase
        .from('farms')
        .insert([
          {
            id: farm.id,
            farmer_id: effectiveFarmerId,
            name: farm.name,
            area_acres: farm.areaAcres,
            irrigation_source: farm.irrigationSource,
            latitude: farm.latitude,
            longitude: farm.longitude,
            boundary_geojson: boundaryWithMeta,
            notes: farm.notes
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase createFarm error:', error.message, error.details);
      } else if (data) {
        console.log('✅ Farm successfully saved to Supabase:', data.id);
        const locMeta = data.boundary_geojson?.locationMeta || {};
        const splitWater = data.irrigation_source ? data.irrigation_source.split(',').map((s: string) => s.trim()) : ['CANAL', 'DRIP'];
        const result = {
          id: data.id,
          farmerId: data.farmer_id,
          name: data.name,
          areaAcres: Number(data.area_acres),
          irrigationSource: data.irrigation_source,
          waterSources: locMeta.waterSources || splitWater,
          latitude: Number(data.latitude),
          longitude: Number(data.longitude),
          village: locMeta.village || farm.village || '',
          taluka: locMeta.taluka || farm.taluka || '',
          district: locMeta.district || farm.district || '',
          state: locMeta.state || farm.state || 'Maharashtra',
          locationName: locMeta.locationName || farm.locationName || '',
          boundaryGeoJson: data.boundary_geojson,
          cropAllocations: locMeta.cropAllocations || farm.cropAllocations || [],
          ownershipType: locMeta.ownershipType || farm.ownershipType || 'INDIVIDUAL',
          gatNumber: locMeta.gatNumber || farm.gatNumber || '',
          coOwners: locMeta.coOwners || farm.coOwners || [],
          splitOrientation: locMeta.splitOrientation || farm.splitOrientation || 'auto',
          notes: data.notes,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };
        store.farms.set(farm.id, result);
        return result;
      }
    }
    store.farms.set(farm.id, farm);
    return farm;
  },

  async updateFarm(farmId: string, updates: any): Promise<any> {
    const supabase = getSupabaseClient();
    let existing: any = store.farms.get(farmId) || {};

    if (supabase) {
      // If existing farm is not completely in memory (or server restarted), fetch from Supabase
      if (!existing.id || !existing.boundaryGeoJson) {
        try {
          const { data: currentData } = await supabase
            .from('farms')
            .select('*')
            .eq('id', farmId)
            .maybeSingle();
          if (currentData) {
            const currentMeta = currentData.boundary_geojson?.locationMeta || {};
            const splitWater = currentData.irrigation_source ? currentData.irrigation_source.split(',').map((s: string) => s.trim()) : ['CANAL', 'DRIP'];
            existing = {
              id: currentData.id,
              farmerId: currentData.farmer_id,
              name: currentData.name,
              areaAcres: Number(currentData.area_acres),
              irrigationSource: currentData.irrigation_source,
              waterSources: currentMeta.waterSources || splitWater,
              latitude: Number(currentData.latitude),
              longitude: Number(currentData.longitude),
              village: currentMeta.village || currentData.village || '',
              taluka: currentMeta.taluka || currentData.taluka || '',
              district: currentMeta.district || currentData.district || '',
              state: currentMeta.state || currentData.state || 'Maharashtra',
              locationName: currentMeta.locationName || currentData.location_name || '',
              boundaryGeoJson: currentData.boundary_geojson,
              cropAllocations: currentMeta.cropAllocations || [],
              ownershipType: currentMeta.ownershipType || 'INDIVIDUAL',
              gatNumber: currentMeta.gatNumber || '',
              coOwners: currentMeta.coOwners || [],
              splitOrientation: currentMeta.splitOrientation || 'auto',
              notes: currentData.notes
            };
            store.farms.set(farmId, existing);
          }
        } catch (fetchErr) {
          console.error('Error fetching existing farm from Supabase:', fetchErr);
        }
      }
    }

    const baseGeo = updates.boundaryGeoJson !== undefined ? updates.boundaryGeoJson : (existing.boundaryGeoJson || { type: 'Polygon', coordinates: [] });
    const locMeta = (baseGeo && baseGeo.locationMeta) || (existing.boundaryGeoJson && existing.boundaryGeoJson.locationMeta) || {};

    const updatedLocMeta = {
      ...locMeta,
      ...(updates.village !== undefined ? { village: updates.village } : {}),
      ...(updates.taluka !== undefined ? { taluka: updates.taluka } : {}),
      ...(updates.district !== undefined ? { district: updates.district } : {}),
      ...(updates.state !== undefined ? { state: updates.state } : {}),
      ...(updates.locationName !== undefined ? { locationName: updates.locationName } : {}),
      ...(updates.cropAllocations !== undefined ? { cropAllocations: updates.cropAllocations } : {}),
      ...(updates.ownershipType !== undefined ? { ownershipType: updates.ownershipType } : {}),
      ...(updates.gatNumber !== undefined ? { gatNumber: updates.gatNumber } : {}),
      ...(updates.coOwners !== undefined ? { coOwners: updates.coOwners } : {}),
      ...(updates.splitOrientation !== undefined ? { splitOrientation: updates.splitOrientation } : {}),
      ...(updates.waterSources !== undefined ? { waterSources: updates.waterSources } : {})
    };

    const finalBoundary = {
      ...baseGeo,
      locationMeta: updatedLocMeta
    };

    if (supabase) {
      const updatePayload: any = {
        updated_at: new Date().toISOString()
      };
      if (updates.name !== undefined) updatePayload.name = updates.name;
      if (updates.areaAcres !== undefined) updatePayload.area_acres = Number(updates.areaAcres);
      if (updates.irrigationSource !== undefined) {
        updatePayload.irrigation_source = updates.irrigationSource;
      } else if (Array.isArray(updates.waterSources) && updates.waterSources.length > 0) {
        updatePayload.irrigation_source = updates.waterSources.join(', ');
      }
      if (updates.latitude !== undefined) updatePayload.latitude = Number(updates.latitude);
      if (updates.longitude !== undefined) updatePayload.longitude = Number(updates.longitude);
      
      // CRITICAL: Always persist boundary_geojson so locationMeta fields are saved to Supabase!
      updatePayload.boundary_geojson = finalBoundary;
      if (updates.notes !== undefined) updatePayload.notes = updates.notes;

      const { data, error } = await supabase
        .from('farms')
        .update(updatePayload)
        .eq('id', farmId)
        .select()
        .maybeSingle();

      if (error) {
        console.error('❌ Supabase updateFarm error:', error.message);
      } else if (data) {
        console.log('✅ Farm successfully updated in Supabase:', farmId);
        const meta = data.boundary_geojson?.locationMeta || {};
        const splitWater = data.irrigation_source ? data.irrigation_source.split(',').map((s: string) => s.trim()) : ['CANAL', 'DRIP'];
        const result = {
          id: data.id,
          farmerId: data.farmer_id,
          name: data.name,
          areaAcres: Number(data.area_acres),
          irrigationSource: data.irrigation_source,
          waterSources: meta.waterSources || splitWater,
          latitude: Number(data.latitude),
          longitude: Number(data.longitude),
          village: meta.village || updates.village || existing.village || '',
          taluka: meta.taluka || updates.taluka || existing.taluka || '',
          district: meta.district || updates.district || existing.district || '',
          state: meta.state || updates.state || existing.state || 'Maharashtra',
          locationName: meta.locationName || updates.locationName || existing.locationName || '',
          boundaryGeoJson: data.boundary_geojson,
          cropAllocations: meta.cropAllocations || updates.cropAllocations || existing.cropAllocations || [],
          ownershipType: meta.ownershipType || updates.ownershipType || existing.ownershipType || 'INDIVIDUAL',
          gatNumber: meta.gatNumber || updates.gatNumber || existing.gatNumber || '',
          coOwners: meta.coOwners || updates.coOwners || existing.coOwners || [],
          splitOrientation: meta.splitOrientation || updates.splitOrientation || existing.splitOrientation || 'auto',
          notes: data.notes || updates.notes || '',
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };
        store.farms.set(farmId, result);
        return result;
      }
    }

    const merged = {
      ...existing,
      ...updates,
      id: farmId,
      boundaryGeoJson: finalBoundary,
      village: updatedLocMeta.village || updates.village || existing.village || '',
      taluka: updatedLocMeta.taluka || updates.taluka || existing.taluka || '',
      district: updatedLocMeta.district || updates.district || existing.district || '',
      state: updatedLocMeta.state || updates.state || existing.state || 'Maharashtra',
      gatNumber: updatedLocMeta.gatNumber || updates.gatNumber || existing.gatNumber || '',
      ownershipType: updatedLocMeta.ownershipType || updates.ownershipType || existing.ownershipType || 'INDIVIDUAL',
      coOwners: updatedLocMeta.coOwners || updates.coOwners || existing.coOwners || [],
      cropAllocations: updatedLocMeta.cropAllocations || updates.cropAllocations || existing.cropAllocations || [],
      waterSources: updatedLocMeta.waterSources || updates.waterSources || existing.waterSources || ['CANAL', 'DRIP'],
      updatedAt: new Date().toISOString()
    };
    store.farms.set(farmId, merged);
    return merged;
  },

  async deleteFarm(farmId: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('soil_records').delete().eq('farm_id', farmId);
        await supabase.from('crop_cycles').delete().eq('farm_id', farmId);
        await supabase.from('farm_expenses').delete().eq('farm_id', farmId);
        await supabase.from('sensor_readings').delete().eq('farm_id', farmId);
        const { error } = await supabase.from('farms').delete().eq('id', farmId);
        if (error) {
          console.error('❌ Supabase deleteFarm error:', error.message);
        }
      } catch (err) {
        console.error('❌ Error during Supabase farm deletion:', err);
      }
    }
    store.farms.delete(farmId);
    store.soilRecords.delete(farmId);
    store.cropCycles.delete(farmId);
    store.expenses.delete(farmId);
    store.telemetry.delete(farmId);
    return true;
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

      if (error) {
        console.error('❌ Supabase getSoilRecords error:', error.message);
      } else if (data && data.length > 0) {
        return data.map((s) => {
          let reportUrl = s.report_url;
          let reportName = s.report_name;
          let previousCrop = s.previous_crop;
          let previousYieldQuintals = s.previous_yield_quintals ? Number(s.previous_yield_quintals) : undefined;
          let previousSeason = s.previous_season;

          // Attempt to decode JSON metadata stored in report_url
          if (s.report_url && s.report_url.startsWith('{')) {
            try {
              const meta = JSON.parse(s.report_url);
              reportUrl = meta.reportUrl || meta.url || reportUrl;
              reportName = reportName || meta.reportName;
              previousCrop = previousCrop || meta.previousCrop;
              previousYieldQuintals = previousYieldQuintals || (meta.previousYieldQuintals ? Number(meta.previousYieldQuintals) : undefined);
              previousSeason = previousSeason || meta.previousSeason;
            } catch (e) {}
          }

          return {
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
            reportUrl,
            reportName,
            previousCrop,
            previousYieldQuintals,
            previousSeason,
            createdAt: s.created_at
          };
        });
      }
    }
    return store.soilRecords.get(farmId) || [];
  },

  async createSoilRecord(record: any): Promise<any> {
    const supabase = getSupabaseClient();
    if (supabase) {
      await this.ensureFarmExists(record.farmId);

      // Package metadata safely into report_url if extended columns are absent
      const reportPayload = JSON.stringify({
        reportUrl: record.reportUrl,
        reportName: record.reportName,
        previousCrop: record.previousCrop,
        previousYieldQuintals: record.previousYieldQuintals,
        previousSeason: record.previousSeason
      });

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
            report_url: reportPayload,
            test_date: record.testDate
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase createSoilRecord error:', error.message, error.details);
      } else if (data) {
        console.log('✅ Soil record successfully saved to Supabase:', data.id);
        const result = {
          id: data.id,
          farmId: data.farm_id,
          soilType: data.soil_type,
          ph: Number(data.ph),
          nitrogen: Number(data.nitrogen),
          phosphorus: Number(data.phosphorus),
          potassium: Number(data.potassium),
          organicCarbon: Number(data.organic_carbon),
          electricalConductivity: data.electrical_conductivity ? Number(data.electrical_conductivity) : undefined,
          reportUrl: record.reportUrl,
          reportName: record.reportName,
          previousCrop: record.previousCrop,
          previousYieldQuintals: record.previousYieldQuintals,
          previousSeason: record.previousSeason,
          testDate: data.test_date,
          createdAt: data.created_at
        };
        const existing = store.soilRecords.get(record.farmId) || [];
        existing.unshift(result);
        store.soilRecords.set(record.farmId, existing);
        return result;
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
      if (error) {
        console.error('❌ Supabase getCropCycles error:', error.message);
      } else if (data && data.length > 0) {
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

  async createCropCycle(cycle: any): Promise<any> {
    const supabase = getSupabaseClient();
    if (supabase) {
      await this.ensureFarmExists(cycle.farmId);
      const { data, error } = await supabase
        .from('crop_cycles')
        .insert([
          {
            id: cycle.id,
            farm_id: cycle.farmId,
            crop_name: cycle.cropName,
            variety: cycle.variety,
            sowing_date: cycle.sowingDate,
            expected_harvest_date: cycle.expectedHarvestDate,
            current_stage: cycle.currentStage || 'SOWING',
            status: cycle.status || 'ACTIVE'
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase createCropCycle error:', error.message);
      } else if (data) {
        console.log('✅ Crop cycle saved to Supabase:', data.id);
        const result = {
          id: data.id,
          farmId: data.farm_id,
          cropName: data.crop_name,
          variety: data.variety,
          sowingDate: data.sowing_date,
          expectedHarvestDate: data.expected_harvest_date,
          currentStage: data.current_stage,
          status: data.status,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };
        const existing = store.cropCycles.get(cycle.farmId) || [];
        existing.unshift(result);
        store.cropCycles.set(cycle.farmId, existing);
        return result;
      }
    }
    const existing = store.cropCycles.get(cycle.farmId) || [];
    existing.unshift(cycle);
    store.cropCycles.set(cycle.farmId, existing);
    return cycle;
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
      if (error) {
        console.error('❌ Supabase getExpenses error:', error.message);
      } else if (data && data.length > 0) {
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
      await this.ensureFarmExists(expense.farmId);
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
      if (error) {
        console.error('❌ Supabase createExpense error:', error.message);
      } else if (data) {
        console.log('✅ Expense saved to Supabase:', data.id);
        const result = {
          id: data.id,
          farmId: data.farm_id,
          category: data.category,
          amount: Number(data.amount),
          date: data.expense_date,
          notes: data.notes
        };
        const existing = store.expenses.get(expense.farmId) || [];
        existing.unshift(result);
        store.expenses.set(expense.farmId, existing);
        return result;
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
