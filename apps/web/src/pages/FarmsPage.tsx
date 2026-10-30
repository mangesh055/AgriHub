import React, { useEffect, useState } from 'react';
import { MapPin, Plus, Layers, FileText, CheckCircle2, Sprout, AlertCircle, Download } from 'lucide-react';
import { api } from '../api/client';
import { FarmRequiredModal } from '../components/FarmRequiredModal';
import { useAuth } from '../context/AuthContext';
import { FarmMapEditor, LatLng } from '../components/FarmMapEditor';

export const FarmsPage: React.FC = () => {
  const { refreshAuth } = useAuth();
  const [farms, setFarms] = useState<any[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<any>(null);
  const [soilRecords, setSoilRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [ndviVisible, setNdviVisible] = useState(false);

  async function loadFarms(preferredId?: string) {
    try {
      setLoading(true);
      const data = await api.getFarms();
      setFarms(data);
      if (data.length > 0) {
        const farmToSelect = preferredId
          ? data.find((f) => f.id === preferredId) || data[0]
          : data[0];
        setSelectedFarm(farmToSelect);
        const soils = await api.getSoilRecords(farmToSelect.id);
        setSoilRecords(soils);
      } else {
        setSelectedFarm(null);
        setSoilRecords([]);
      }
    } catch (err) {
      console.error('Error fetching farms:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFarms();
  }, []);

  const handleSelectFarm = async (f: any) => {
    setSelectedFarm(f);
    setNdviVisible(false); // reset NDVI when switching farm
    try {
      const soils = await api.getSoilRecords(f.id);
      setSoilRecords(soils);
    } catch (err) {
      setSoilRecords([]);
    }
  };

  const latestSoil = soilRecords[0];

  // Parse GeoJSON polygon from selected farm into LatLng[] for the map editor
  function parseBoundaryPoints(farm: any): LatLng[] {
    try {
      const geo = farm?.boundaryGeoJson ?? farm?.boundary_geojson;
      if (!geo) return [];
      const parsed = typeof geo === 'string' ? JSON.parse(geo) : geo;

      // coordinates[0] is the outer ring; may be empty if no boundary was drawn
      const ring: number[][] = parsed?.coordinates?.[0] ?? [];
      if (ring.length < 4) return []; // need at least 3 unique + 1 closing point

      // GeoJSON ring is closed (last point == first), so drop the last point
      const open = ring.slice(0, ring.length - 1);
      return open.map(([lng, lat]: number[]) => ({ lat, lng }));
    } catch {
      return [];
    }
  }

  function exportGeoJSON(farm: any) {
    const geo = farm?.boundaryGeoJson ?? farm?.boundary_geojson;
    if (!geo) return;
    const str = JSON.stringify(typeof geo === 'string' ? JSON.parse(geo) : geo, null, 2);
    const blob = new Blob([str], { type: 'application/geo+json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${farm.name?.replace(/\s+/g, '_') || 'farm'}_boundary.geojson`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>My Agricultural Holdings & GIS Mapping</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Manage farm boundaries, cadastral plots, soil test cards, and micro-irrigation systems.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
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

            {farms.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Sprout size={36} color="#34d399" style={{ margin: '0 auto 12px' }} />
                <p style={{ fontWeight: 600, color: '#ffffff', marginBottom: '6px' }}>No Farm Holdings Registered</p>
                <p style={{ fontSize: '0.82rem', marginBottom: '16px', lineHeight: 1.4 }}>
                  Add your agricultural plot with soil health test metrics to unlock custom IoT and AI capabilities.
                </p>
                <button className="btn-primary" style={{ margin: '0 auto', fontSize: '0.85rem' }} onClick={() => setShowModal(true)}>
                  <Plus size={16} />
                  <span>Register Farm Plot</span>
                </button>
              </div>
            ) : (
              farms.map((f) => (
                <div
                  key={f.id}
                  onClick={() => handleSelectFarm(f)}
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
                  {(f.village || f.district || f.locationName) && (
                    <p style={{ fontSize: '0.84rem', color: '#10b981', fontWeight: 600, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={13} />
                      <span>{f.locationName || [f.village, f.taluka, f.district, f.state].filter(Boolean).join(', ')}</span>
                    </p>
                  )}
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Irrigation: <strong>{f.irrigationSource}</strong> • GPS: {Number(f.latitude).toFixed(4)}°N, {Number(f.longitude).toFixed(4)}°E
                  </p>
                </div>
              ))
            )}
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

              <div style={{ marginBottom: '14px' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Classification: <strong>{latestSoil.soilType?.replace(/_/g, ' ') || 'BLACK COTTON'}</strong>
                </p>
                {(latestSoil.previousCrop || latestSoil.previousYieldQuintals) && (
                  <p style={{ fontSize: '0.82rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🌱 Previous: <strong>{latestSoil.previousCrop || 'Standard Crop'}</strong> ({latestSoil.previousYieldQuintals || 0} Qt/Acre - {latestSoil.previousSeason || 'Kharif'})</span>
                  </p>
                )}
                {latestSoil.reportName && (
                  <p style={{ fontSize: '0.78rem', color: '#38bdf8', marginTop: '4px' }}>
                    📄 Lab Report: <strong>{latestSoil.reportName}</strong>
                  </p>
                )}
              </div>

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

          {!latestSoil && selectedFarm && (
            <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
              <FileText size={28} color="#38bdf8" style={{ margin: '0 auto 8px' }} />
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '4px' }}>No Soil Test Record</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Using regional soil benchmarks for this plot.</p>
            </div>
          )}
        </div>

        {/* Right Column: Interactive Map */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                {selectedFarm?.name || 'GIS Cadastral Boundary & Satellite View'}
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                Plot ID: {selectedFarm?.id ? `${selectedFarm.id.slice(0, 13)}…` : 'N/A'} • Centroid: {Number(selectedFarm?.latitude || 18.4875).toFixed(4)}°N, {Number(selectedFarm?.longitude || 74.1332).toFixed(4)}°E
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span className="badge badge-info">PostGIS ST_Polygon</span>
              <span className="badge badge-success">
                {selectedFarm ? `${selectedFarm.areaAcres} Acres` : 'No Plot Selected'}
              </span>
            </div>
          </div>

          {/* Real Leaflet Map */}
          {selectedFarm ? (
            <>
              <FarmMapEditor
                key={selectedFarm.id}
                center={{ lat: Number(selectedFarm.latitude), lng: Number(selectedFarm.longitude) }}
                initialPolygon={parseBoundaryPoints(selectedFarm)}
                height={440}
                readOnly
                showNdvi={ndviVisible}
              />
              {/* Action buttons */}
              <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
                {(selectedFarm?.boundaryGeoJson || selectedFarm?.boundary_geojson) && (
                  <button
                    className="btn-secondary"
                    style={{ fontSize: '0.84rem' }}
                    onClick={() => exportGeoJSON(selectedFarm)}
                  >
                    <Download size={14} />
                    <span>Export Boundary GeoJSON</span>
                  </button>
                )}
                <button
                    className="btn-secondary"
                    style={{
                      fontSize: '0.84rem',
                      background: ndviVisible ? 'rgba(16,185,129,0.18)' : undefined,
                      borderColor: ndviVisible ? '#10b981' : undefined,
                      color: ndviVisible ? '#10b981' : undefined,
                    }}
                    onClick={() => setNdviVisible((v) => !v)}
                  >
                    <Layers size={14} />
                    <span>{ndviVisible ? '✅ NDVI Layer ON' : 'Toggle NDVI Layer'}</span>
                  </button>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, minHeight: '440px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px', color: 'var(--text-muted)' }}>
              <MapPin size={40} color="#10b981" style={{ opacity: 0.4 }} />
              <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>Select a farm to view its boundary</p>
              <p style={{ fontSize: '0.82rem' }}>Register a farm plot first to see the GIS map.</p>
            </div>
          )}
        </div>
      </div>

      {/* Just-In-Time Farm Registration Modal */}
      <FarmRequiredModal
        isOpen={showModal}
        featureName="Farm Registration"
        featureDescription="Register a new agricultural plot to track cadastral boundaries, soil NPK profiles, and automated irrigation schedules."
        onCancel={() => setShowModal(false)}
        onSuccess={() => {
          setShowModal(false);
          refreshAuth();
          loadFarms();
        }}
      />
    </div>
  );
};
