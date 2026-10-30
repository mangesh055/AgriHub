import React, { useEffect, useState, useMemo } from 'react';
import { Farm3DViewer } from '../components/Farm3DViewer';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { generateDynamicUlpin } from '../components/Farm2DCadastreMap';

export const Cadastre3DPage: React.FC = () => {
  const { profile, user, primaryFarm } = useAuth();
  const [farmData, setFarmData] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('agrihub_active_farm');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return primaryFarm || null;
  });

  useEffect(() => {
    async function fetchFarm() {
      try {
        const farms = await api.getFarms();
        if (farms && farms.length > 0) {
          setFarmData((prev: any) => {
            if (prev?.id) {
              const matched = farms.find((f: any) => f.id === prev.id);
              if (matched) return matched;
            }
            return farms[0];
          });
        }
      } catch (err) {
        console.error('Error fetching farm for 3D cadastre:', err);
      }
    }
    fetchFarm();
  }, []);

  const ownerName = useMemo(() => {
    if (farmData?.coOwners && farmData.coOwners.length > 0) {
      const managing = farmData.coOwners.find((c: any) => c.isManagingCultivator);
      if (managing?.name?.trim()) return managing.name.trim();
      if (farmData.coOwners[0]?.name?.trim()) return farmData.coOwners[0].name.trim();
    }
    if (farmData?.farmerName?.trim()) return farmData.farmerName.trim();
    if (profile?.name && profile.name.trim() && profile.name.trim() !== 'Om' && profile.name.trim() !== 'Rahul Deshmukh') {
      return profile.name.trim();
    }
    if (user?.mobile) return `Farmer (${user.mobile})`;
    return 'Registered Farmer';
  }, [farmData, profile, user]);

  const farmName = farmData?.name || (profile?.name ? `${profile.name}'s Agricultural Estate` : 'Precision Farmland Parcel');
  const dynamicUlpin = generateDynamicUlpin(farmData || {
    state: profile?.state || 'Maharashtra',
    district: profile?.district || 'Pune',
    taluka: profile?.taluka || 'Baramati',
    village: profile?.village || 'Malegaon',
    gatNumber: farmData?.gatNumber || 'Gat 124/A',
    areaAcres: farmData?.areaAcres || 4.0
  });

  return (
    <div style={{ width: '100%', height: 'calc(100vh - 72px)', overflow: 'hidden' }}>
      <Farm3DViewer
        farm={farmData}
        initialOwnerName={ownerName}
        initialFarmName={farmName}
        initialGatNo={farmData?.gatNumber || 'Gat 124/A'}
        initialUlpin={dynamicUlpin}
      />
    </div>
  );
};
