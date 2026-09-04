import React, { useEffect, useState } from 'react';
import { MapPin, Plus, Layers, FileText, CheckCircle2 } from 'lucide-react';
import { api } from '../api/client';

export const FarmsPage: React.FC = () => {
  const [farms, setFarms] = useState<any[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<any>(null);
  const [soilRecords, setSoilRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFarms() {
      try {
        setLoading(true);
        const data = await api.getFarms();
        setFarms(data);
        if (data.length > 0) {
          setSelectedFarm(data[0]);
          const soils = await api.getSoilRecords(data[0].id);
          setSoilRecords(soils);
        }
      } catch (err) {
        console.error('Error fetching farms:', err);
      } finally {
        setLoading(false);
      }
    }
    loadFarms();
  }, []);

  const latestSoil = soilRecords[0];

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>My Agricultural Holdings & GIS Mapping</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Manage farm boundaries, cadastral plots, soil test cards, and micro-irrigation systems.
          </p>
        </div>
        <button className="btn-primary">
          <Plus size={18} />
          <span>Register New Farm Plot</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 380px) 1fr', gap: '24px' }}>
        {/* Left Column: Farm Selector & Soil Health Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Farm Card */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={18} color="#10b981" />
              <span>Registered Holdings ({farms.length})</span>
            </h3>

            {farms.map((f) => (
              <div
                key={f.id}
                onClick={() => setSelectedFarm(f)}
                style={{
                  padding: '14px',
                  borderRadius: 'var(--radius-sm)',
                  border: selectedFarm?.id === f.id ? '1px solid #10b981' : '1px solid var(--border-subtle)',
                  background: selectedFarm?.id === f.id ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                  cursor: 'pointer',
                  marginBottom: '10px',
                  transition: 'var(--transition-smooth)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <h4 style={{ fontSize: '0.98rem', fontWeight: 700 }}>{f.name}</h4>
                  <span className="badge badge-success">{f.areaAcres} Acres</span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Irrigation: <strong>{f.irrigationSource}</strong> • GPS: {f.latitude.toFixed(4)}°N, {f.longitude.toFixed(4)}°E
                </p>
              </div>
            ))}
          </div>

          {/* Soil Health Card */}
          {latestSoil && (
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={18} color="#38bdf8" />
                  <span>Soil Health Card</span>
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tested: {latestSoil.testDate}</span>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                Type: <strong>{latestSoil.soilType.replace('_', ' ')}</strong> (High water retention capacity)
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '14px' }}>
                <div style={{ padding: '10px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Soil pH</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981' }}>{latestSoil.ph}</div>
                  <span style={{ fontSize: '0.7rem', color: '#34d399' }}>Slightly Alkaline</span>
                </div>

                <div style={{ padding: '10px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Organic Carbon (OC)</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#38bdf8' }}>{latestSoil.organicCarbon}%</div>
                  <span style={{ fontSize: '0.7rem', color: '#38bdf8' }}>Medium</span>
                </div>

                <div style={{ padding: '10px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Nitrogen (N)</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fbbf24' }}>{latestSoil.nitrogen} kg/ha</div>
                  <span style={{ fontSize: '0.7rem', color: '#fbbf24' }}>Medium-Low</span>
                </div>

                <div style={{ padding: '10px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Potassium (K)</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#a78bfa' }}>{latestSoil.potassium} kg/ha</div>
                  <span style={{ fontSize: '0.7rem', color: '#a78bfa' }}>High (Optimal)</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <CheckCircle2 size={14} color="#10b981" />
                <span>Verified by Soil Testing Laboratory, Pune</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Interactive Map & Boundary GeoJSON Visualizer */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>GIS Cadastral Boundary & Satellite View</h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                Plot ID: {selectedFarm?.id || 'N/A'} • Centroid: {selectedFarm?.latitude}°N, {selectedFarm?.longitude}°E
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span className="badge badge-info">PostGIS ST_Polygon</span>
              <span className="badge badge-success">4.50 Hectares Verified</span>
            </div>
          </div>

          {/* Interactive Simulated Leaflet Satellite Canvas */}
          <div
            style={{
              flex: 1,
              minHeight: '420px',
              borderRadius: 'var(--radius-sm)',
              position: 'relative',
              overflow: 'hidden',
              background: '#131e15',
              border: '1px solid var(--border-subtle)',
              backgroundImage: 'radial-gradient(#1f3322 1px, transparent 1px)',
              backgroundSize: '24px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {/* SVG Polygon Representation of Farm Boundaries */}
            <svg viewBox="0 0 600 400" style={{ width: '100%', height: '100%', maxWidth: '600px' }}>
              <defs>
                <linearGradient id="fieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(16, 185, 129, 0.4)" />
                  <stop offset="100%" stopColor="rgba(5, 150, 105, 0.15)" />
                </linearGradient>
              </defs>
              {/* Field boundary polygon */}
              <polygon
                points="120,80 480,95 440,320 150,300"
                fill="url(#fieldGrad)"
                stroke="#10b981"
                strokeWidth="3"
                strokeDasharray="6,4"
              />
              {/* Corner Pin Markers */}
              <circle cx="120" cy="80" r="6" fill="#34d399" />
              <circle cx="480" cy="95" r="6" fill="#34d399" />
              <circle cx="440" cy="320" r="6" fill="#34d399" />
              <circle cx="150" cy="300" r="6" fill="#34d399" />
              {/* Centroid Tag */}
              <circle cx="295" cy="198" r="8" fill="#38bdf8" />
              <text x="310" y="202" fill="#ffffff" fontSize="12" fontWeight="700">
                IoT Gateway Node #01 (34% Moist)
              </text>
            </svg>

            {/* Map Overlay Badge */}
            <div
              style={{
                position: 'absolute',
                bottom: '16px',
                left: '16px',
                padding: '8px 14px',
                background: 'rgba(12, 18, 12, 0.9)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.8rem',
                color: 'var(--text-muted)'
              }}
            >
              EPSG:4326 PostGIS Geometry • 4 Boundary Vertices
            </div>
          </div>

          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button className="btn-secondary" style={{ fontSize: '0.84rem' }}>
              <Layers size={14} />
              <span>Toggle NDVI Vegetation Layer</span>
            </button>
            <button className="btn-secondary" style={{ fontSize: '0.84rem' }}>
              <span>Export Cadastral KML/GeoJSON</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
