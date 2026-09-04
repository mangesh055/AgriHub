import React, { useState } from 'react';
import { Sprout, MapPin, FileText, ArrowRight, X, AlertCircle } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

interface FarmRequiredModalProps {
  featureName: string;
  featureDescription: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  isOpen: boolean;
}

export const FarmRequiredModal: React.FC<FarmRequiredModalProps> = ({
  featureName,
  featureDescription,
  onSuccess,
  onCancel,
  isOpen
}) => {
  const { refreshAuth, markFarmCreated } = useAuth();

  const [farmData, setFarmData] = useState({
    name: 'My Primary Farm',
    areaAcres: 4.0,
    irrigationSource: 'DRIP',
    latitude: 18.4875,
    longitude: 74.1332,
    notes: 'Registered via AgriHub feature activation.'
  });

  const [soilData, setSoilData] = useState({
    soilType: 'BLACK_COTTON',
    ph: 7.2,
    nitrogen: 210,
    phosphorus: 28,
    potassium: 320,
    organicCarbon: 0.65,
    testDate: new Date().toISOString().split('T')[0]
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const createdFarm = await api.createFarm({
        ...farmData,
        areaAcres: Number(farmData.areaAcres),
        latitude: Number(farmData.latitude),
        longitude: Number(farmData.longitude)
      });

      await fetch(`http://localhost:4000/api/v1/farms/${createdFarm.id}/soil-records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('agrihub_token')}`
        },
        body: JSON.stringify({
          ...soilData,
          ph: Number(soilData.ph),
          nitrogen: Number(soilData.nitrogen),
          phosphorus: Number(soilData.phosphorus),
          potassium: Number(soilData.potassium),
          organicCarbon: Number(soilData.organicCarbon)
        })
      });

      markFarmCreated();
      await refreshAuth();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Error creating farm:', err);
      setError(err.message || 'Failed to save farm details.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 3000,
        padding: '20px'
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '32px',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          position: 'relative'
        }}
      >
        {onCancel && (
          <button
            onClick={onCancel}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-muted)'
            }}
          >
            <X size={18} />
          </button>
        )}

        {/* Feature Context Banner */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MapPin size={24} color="#10b981" />
          </div>
          <div>
            <span style={{ fontSize: '0.78rem', color: '#34d399', textTransform: 'uppercase', fontWeight: 700 }}>
              Farm & Soil Profile Required
            </span>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
              Unlock {featureName}
            </h3>
          </div>
        </div>

        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '22px', lineHeight: 1.5 }}>
          {featureDescription}
        </p>

        {error && (
          <div style={{ padding: '12px', borderRadius: 'var(--radius-sm)', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '0.86rem', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Farm Details */}
          <div style={{ padding: '16px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)' }}>
            <h4 style={{ fontSize: '0.96rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sprout size={16} color="#10b981" />
              <span>Farm Plot Details</span>
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Farm Name
                </label>
                <input
                  type="text"
                  value={farmData.name}
                  onChange={(e) => setFarmData({ ...farmData, name: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px 12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#ffffff', fontSize: '0.86rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Total Land Area (Acres)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={farmData.areaAcres}
                  onChange={(e) => setFarmData({ ...farmData, areaAcres: parseFloat(e.target.value) || 0 })}
                  required
                  style={{ width: '100%', padding: '8px 12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#ffffff', fontSize: '0.86rem' }}
                />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Primary Irrigation Method
                </label>
                <select
                  value={farmData.irrigationSource}
                  onChange={(e) => setFarmData({ ...farmData, irrigationSource: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#ffffff', fontSize: '0.86rem' }}
                >
                  <option value="DRIP">Drip Irrigation (Automated/Manual)</option>
                  <option value="BOREWELL">Borewell Tube Well</option>
                  <option value="CANAL">Canal Flow</option>
                  <option value="SPRINKLER">Sprinklers</option>
                  <option value="RAINFED">Rainfed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Soil Details */}
          <div style={{ padding: '16px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)' }}>
            <h4 style={{ fontSize: '0.96rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={16} color="#38bdf8" />
              <span>Soil Health Card Parameters</span>
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <div style={{ gridColumn: 'span 3' }}>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Soil Type
                </label>
                <select
                  value={soilData.soilType}
                  onChange={(e) => setSoilData({ ...soilData, soilType: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#ffffff', fontSize: '0.86rem' }}
                >
                  <option value="BLACK_COTTON">Black Cotton Soil (Heavy Clay)</option>
                  <option value="ALLUVIAL">Alluvial Loam</option>
                  <option value="RED_SOIL">Red Soil</option>
                  <option value="CLAY_LOAM">Clay Loam</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>pH</label>
                <input
                  type="number"
                  step="0.1"
                  value={soilData.ph}
                  onChange={(e) => setSoilData({ ...soilData, ph: parseFloat(e.target.value) || 7 })}
                  style={{ width: '100%', padding: '6px 10px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#ffffff', fontSize: '0.84rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Nitrogen (N)</label>
                <input
                  type="number"
                  value={soilData.nitrogen}
                  onChange={(e) => setSoilData({ ...soilData, nitrogen: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '6px 10px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#ffffff', fontSize: '0.84rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Potassium (K)</label>
                <input
                  type="number"
                  value={soilData.potassium}
                  onChange={(e) => setSoilData({ ...soilData, potassium: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '6px 10px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#ffffff', fontSize: '0.84rem' }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            {onCancel && (
              <button type="button" className="btn-secondary" onClick={onCancel}>
                Cancel
              </button>
            )}
            <button type="submit" className="btn-primary" disabled={loading}>
              <span>{loading ? 'Saving Farm Profile...' : `Save & Continue to ${featureName}`}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
