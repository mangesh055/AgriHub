import React, { useEffect, useState } from 'react';
import { Farm3DViewer } from '../components/Farm3DViewer';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export const Cadastre3DPage: React.FC = () => {
  const { profile, primaryFarm } = useAuth();
  const [farmData, setFarmData] = useState<any>(primaryFarm || null);

  useEffect(() => {
    async function fetchFarm() {
      try {
        const farms = await api.getFarms();
        if (farms && farms.length > 0) {
          setFarmData(farms[0]);
        }
      } catch (err) {
        console.error('Error fetching farm for 3D cadastre:', err);
      }
    }
    fetchFarm();
  }, []);

  const ownerName = profile?.name || 'Rahul Deshmukh';
  const farmName = farmData?.name || 'Kothrud Agro-Cadastre Complex';

  return (
    <div style={{ width: '100%', height: 'calc(100vh - 72px)', overflow: 'hidden' }}>
      <Farm3DViewer initialOwnerName={ownerName} initialFarmName={farmName} />
    </div>
  );
};
