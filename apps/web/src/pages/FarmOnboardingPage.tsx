import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Sprout, Droplets, FileText, CheckCircle2, ArrowRight } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export const FarmOnboardingPage: React.FC = () => {
  const { profile, markFarmCreated, refreshAuth } = useAuth();
  const navigate = useNavigate();

  const [farmData, setFarmData] = useState({
    name: 'Shivaji Agri Fields',
    areaAcres: 4.0,
    irrigationSource: 'DRIP',
    latitude: 18.4875,
    longitude: 74.1332,
    notes: 'Primary crop plot with drip line installation.'
  });

  const [soilData, setSoilData] = useState({
    soilType: 'BLACK_COTTON',
    ph: 7.2,
    nitrogen: 220,
    phosphorus: 30,
    potassium: 310,
    organicCarbon: 0.65,
    testDate: new Date().toISOString().split('T')[0]
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Create Farm Plot
      const createdFarm = await api.createFarm({
        ...farmData,
        areaAcres: Number(farmData.areaAcres),
        latitude: Number(farmData.latitude),
        longitude: Number(farmData.longitude)
      });

      // 2. Add Initial Soil Health Card
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

      // 3. Mark farm created and navigate to dashboard
      markFarmCreated();
      await refreshAuth();
      navigate('/', { replace: true });
    } catch (err: any) {
      console.error('Failed to register farm:', err);
      setError(err.message || 'Failed to register farm plot. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', padding: '40px 20px', background: 'var(--bg-app)' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Onboarding Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              marginBottom: '14px',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)'
            }}
          >
            <MapPin size={30} color="#ffffff" />
          </div>
          <span style={{ fontSize: '0.8rem', color: '#34d399', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em' }}>
            First-Time Setup
          </span>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '4px' }}>
            Welcome, {profile?.name || 'Farmer'}! Register Your Farm
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.94rem', maxWidth: '600px', margin: '8px auto 0' }}>
            To generate personalized crop recommendations, irrigation schedules, and weather hazard alerts, please register your first agricultural holding.
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: '14px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '0.9rem',
              marginBottom: '20px'
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Section 1: Farm Characteristics */}
          <div className="glass-panel" style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sprout size={20} color="#10b981" />
              <span>1. Farm Plot Characteristics</span>
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Farm Name / Identifier
                </label>
                <input
                  type="text"
                  value={farmData.name}
                  onChange={(e) => setFarmData({ ...farmData, name: e.target.value })}
                  required
                  placeholder="e.g. Krishna Agri Fields"
                  style={{ width: '100%', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#ffffff' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Total Land Area (in Acres)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={farmData.areaAcres}
                  onChange={(e) => setFarmData({ ...farmData, areaAcres: parseFloat(e.target.value) || 0 })}
                  required
                  placeholder="e.g. 4.5"
                  style={{ width: '100%', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#ffffff' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Primary Irrigation Source
                </label>
                <select
                  value={farmData.irrigationSource}
                  onChange={(e) => setFarmData({ ...farmData, irrigationSource: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#ffffff' }}
                >
                  <option value="DRIP">Drip Irrigation (Precision)</option>
                  <option value="CANAL">Canal Flow</option>
                  <option value="BOREWELL">Borewell / Tube Well</option>
                  <option value="SPRINKLER">Overhead Sprinklers</option>
                  <option value="RAINFED">Rainfed Only</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  GPS Location (Lat, Long)
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="number"
                    step="0.0001"
                    value={farmData.latitude}
                    onChange={(e) => setFarmData({ ...farmData, latitude: parseFloat(e.target.value) || 0 })}
                    placeholder="Latitude"
                    style={{ width: '50%', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#ffffff' }}
                  />
                  <input
                    type="number"
                    step="0.0001"
                    value={farmData.longitude}
                    onChange={(e) => setFarmData({ ...farmData, longitude: parseFloat(e.target.value) || 0 })}
                    placeholder="Longitude"
                    style={{ width: '50%', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#ffffff' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Soil Health Card Parameters */}
          <div className="glass-panel" style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={20} color="#38bdf8" />
              <span>2. Soil Health Card Parameters</span>
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Soil Classification
                </label>
                <select
                  value={soilData.soilType}
                  onChange={(e) => setSoilData({ ...soilData, soilType: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#ffffff' }}
                >
                  <option value="BLACK_COTTON">Black Cotton Soil (Regur)</option>
                  <option value="ALLUVIAL">Alluvial Loam</option>
                  <option value="RED_SOIL">Red Lateritic Soil</option>
                  <option value="CLAY_LOAM">Clay Loam</option>
                  <option value="SANDY_LOAM">Sandy Loam</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Soil pH (Acidity / Alkalinity)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={soilData.ph}
                  onChange={(e) => setSoilData({ ...soilData, ph: parseFloat(e.target.value) || 7 })}
                  placeholder="e.g. 7.4"
                  style={{ width: '100%', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#ffffff' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Nitrogen (N) - kg/ha
                </label>
                <input
                  type="number"
                  value={soilData.nitrogen}
                  onChange={(e) => setSoilData({ ...soilData, nitrogen: parseFloat(e.target.value) || 0 })}
                  placeholder="e.g. 210"
                  style={{ width: '100%', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#ffffff' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Phosphorus (P) - kg/ha
                </label>
                <input
                  type="number"
                  value={soilData.phosphorus}
                  onChange={(e) => setSoilData({ ...soilData, phosphorus: parseFloat(e.target.value) || 0 })}
                  placeholder="e.g. 28"
                  style={{ width: '100%', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#ffffff' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Potassium (K) - kg/ha
                </label>
                <input
                  type="number"
                  value={soilData.potassium}
                  onChange={(e) => setSoilData({ ...soilData, potassium: parseFloat(e.target.value) || 0 })}
                  placeholder="e.g. 340"
                  style={{ width: '100%', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#ffffff' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Organic Carbon (OC) %
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={soilData.organicCarbon}
                  onChange={(e) => setSoilData({ ...soilData, organicCarbon: parseFloat(e.target.value) || 0 })}
                  placeholder="e.g. 0.68"
                  style={{ width: '100%', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#ffffff' }}
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn-primary"
            style={{ padding: '14px', fontSize: '1.05rem', fontWeight: 700 }}
            disabled={loading}
          >
            <span>{loading ? 'Registering Farm and Initializing Dashboard...' : 'Complete Registration & Open Dashboard'}</span>
            <ArrowRight size={20} />
          </button>
        </form>

      </div>
    </div>
  );
};
