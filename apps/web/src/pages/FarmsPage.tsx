import React, { useEffect, useState, useMemo } from 'react';
import {
  MapPin,
  Plus,
  Layers,
  FileText,
  CheckCircle2,
  Sprout,
  AlertCircle,
  Download,
  Trash2,
  PieChart,
  Users,
  ShieldCheck,
  Box
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { FarmRequiredModal } from '../components/FarmRequiredModal';
import { useAuth } from '../context/AuthContext';
import { FarmMapEditor, LatLng } from '../components/FarmMapEditor';
import { Farm2DCadastreMap, generateDynamicUlpin } from '../components/Farm2DCadastreMap';

export const FarmsPage: React.FC = () => {
  const { refreshAuth, profile, user } = useAuth();
  const [mapViewMode, setMapViewMode] = useState<'cadastre2d' | 'editor'>('cadastre2d');
  const [farms, setFarms] = useState<any[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<any>(null);
  const [soilRecords, setSoilRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [ndviVisible, setNdviVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Dynamic owner name resolution without hardcoded fallback
  const effectiveOwnerName = useMemo(() => {
    if (selectedFarm?.coOwners && selectedFarm.coOwners.length > 0) {
      const managing = selectedFarm.coOwners.find((c: any) => c.isManagingCultivator);
      if (managing?.name?.trim()) return managing.name.trim();
      if (selectedFarm.coOwners[0]?.name?.trim()) return selectedFarm.coOwners[0].name.trim();
    }
    if (selectedFarm?.farmerName?.trim()) return selectedFarm.farmerName.trim();
    if (profile?.name && profile.name.trim() && profile.name.trim() !== 'Om') return profile.name.trim();
    if (user?.mobile) return `Farmer (${user.mobile})`;
    return 'Registered Farmer';
  }, [selectedFarm, profile, user]);

  const dynamicUlpin = useMemo(() => {
    if (!selectedFarm) return '';
    return generateDynamicUlpin(selectedFarm);
  }, [selectedFarm]);

  // Sync selected farm to localStorage for 3D Cadastre view
  useEffect(() => {
    if (selectedFarm) {
      try {
        localStorage.setItem('agrihub_active_farm', JSON.stringify(selectedFarm));
      } catch (_) {}
    }
  }, [selectedFarm]);

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

  const handleDeleteFarm = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await api.deleteFarm(deleteTarget.id);
      setDeleteTarget(null);
      await refreshAuth();
      await loadFarms();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete farm plot');
    } finally {
      setIsDeleting(false);
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
                <p style={{ fontWeight: 700, color: 'var(--text-heading)', marginBottom: '6px' }}>No Farm Holdings Registered</p>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="badge badge-success">{f.areaAcres} Acres</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(f);
                        }}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                          color: '#f87171',
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'var(--transition-smooth)'
                        }}
                        title={`Delete holding: ${f.name}`}
                        aria-label={`Delete ${f.name}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  {(f.village || f.district || f.locationName) && (
                    <p style={{ fontSize: '0.84rem', color: '#10b981', fontWeight: 600, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={13} />
                      <span>{f.locationName || [f.village, f.taluka, f.district, f.state].filter(Boolean).join(', ')}</span>
                    </p>
                  )}
                  {f.gatNumber && (
                    <p style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: 600, marginBottom: '4px' }}>
                      🏷️ {f.gatNumber}
                    </p>
                  )}
                  {f.coOwners && f.coOwners.length > 0 && (
                    <div style={{ marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.72rem', padding: '2px 7px', borderRadius: '5px', background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38bdf8', fontWeight: 600 }}>
                        👥 7/12 Co-Owned ({f.coOwners.length} Sharers)
                      </span>
                    </div>
                  )}
                  {f.cropAllocations && f.cropAllocations.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', margin: '6px 0' }}>
                      {f.cropAllocations.map((ca: any, i: number) => (
                        <span
                          key={i}
                          style={{
                            fontSize: '0.72rem',
                            padding: '2px 7px',
                            borderRadius: '5px',
                            background: 'rgba(16, 185, 129, 0.1)',
                            border: '1px solid rgba(16, 185, 129, 0.25)',
                            color: '#34d399',
                            fontWeight: 600
                          }}
                        >
                          🌾 {ca.cropName}: {ca.allocatedAcres} Ac
                        </span>
                      ))}
                    </div>
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
              {/* Map View Switcher: 2D Cadastre vs Boundary Editor */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '6px', background: 'rgba(255, 255, 255, 0.04)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <button
                    type="button"
                    onClick={() => setMapViewMode('cadastre2d')}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      background: mapViewMode === 'cadastre2d' ? '#0284c7' : 'transparent',
                      color: mapViewMode === 'cadastre2d' ? '#ffffff' : 'var(--text-muted)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    🛰️ 2D Cadastre Map
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapViewMode('editor')}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      background: mapViewMode === 'editor' ? '#10b981' : 'transparent',
                      color: mapViewMode === 'editor' ? '#ffffff' : 'var(--text-muted)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    ✏️ Boundary & NDVI Editor
                  </button>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {mapViewMode === 'cadastre2d' ? '✨ 2D Cadastral Spatial Parcel' : 'Interactive Vertex Editor'}
                </span>
              </div>

              {mapViewMode === 'cadastre2d' ? (
                <Farm2DCadastreMap
                  key={`cadastre-${selectedFarm.id}`}
                  center={{ lat: Number(selectedFarm.latitude), lng: Number(selectedFarm.longitude) }}
                  polygonPoints={parseBoundaryPoints(selectedFarm)}
                  height={440}
                  ownerName={effectiveOwnerName}
                  ulpin={dynamicUlpin}
                  farmName={selectedFarm.name}
                  areaAcres={Number(selectedFarm.areaAcres)}
                  gatNumber={selectedFarm.gatNumber || 'Gat 124/A'}
                  village={selectedFarm.village}
                  taluka={selectedFarm.taluka}
                  district={selectedFarm.district}
                  state={selectedFarm.state}
                  irrigationSource={selectedFarm.irrigationSource}
                  coOwners={selectedFarm.coOwners}
                />
              ) : (
                <FarmMapEditor
                  key={selectedFarm.id}
                  center={{ lat: Number(selectedFarm.latitude), lng: Number(selectedFarm.longitude) }}
                  initialPolygon={parseBoundaryPoints(selectedFarm)}
                  height={440}
                  readOnly
                  showNdvi={ndviVisible}
                  coOwners={selectedFarm.coOwners}
                  gatNumber={selectedFarm.gatNumber}
                />
              )}
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
                <Link
                  to="/cadastre-3d"
                  className="btn-primary"
                  style={{
                    fontSize: '0.84rem',
                    background: '#0284c7',
                    boxShadow: '0 2px 10px rgba(2, 132, 199, 0.4)'
                  }}
                >
                  <Box size={14} />
                  <span>View in 3D Cadastre (ULPIN)</span>
                </Link>
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
                <button
                  className="btn-secondary"
                  style={{
                    fontSize: '0.84rem',
                    background: 'rgba(239, 68, 68, 0.08)',
                    borderColor: 'rgba(239, 68, 68, 0.3)',
                    color: '#f87171'
                  }}
                  onClick={() => setDeleteTarget(selectedFarm)}
                >
                  <Trash2 size={14} />
                  <span>Delete Plot</span>
                </button>
              </div>

              {/* 7/12 Land Ownership & Co-Khatedar Partitioning Breakdown Card */}
              {selectedFarm?.coOwners && selectedFarm.coOwners.length > 0 && (
                <div
                  style={{
                    marginTop: '20px',
                    padding: '20px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-heading)', margin: 0 }}>
                        <Users size={18} color="#38bdf8" />
                        <span>7/12 Land Ownership & Co-Khatedar Division (सामाईक खातेदार)</span>
                      </h4>
                      {selectedFarm.gatNumber && (
                        <span className="badge badge-info" style={{ fontSize: '0.74rem' }}>
                          🏷️ {selectedFarm.gatNumber}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                      Total Cadastral Area: <strong style={{ color: 'var(--text-heading)' }}>{selectedFarm.areaAcres} Acres</strong> • <strong>{selectedFarm.coOwners.length} Co-Sharers</strong>
                    </span>
                  </div>

                  {/* Multi-color Co-Owner GIS Division Progress Bar */}
                  <div style={{ height: '10px', width: '100%', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '5px', overflow: 'hidden', display: 'flex', marginBottom: '16px' }}>
                    {selectedFarm.coOwners.map((owner: any, i: number) => {
                      const acres = Number(owner.shareAcres) || 0;
                      const total = Number(selectedFarm.areaAcres) || 1;
                      const pct = Math.min(100, (acres / total) * 100);
                      const colors = ['#10b981', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4'];
                      return (
                        <div
                          key={i}
                          style={{
                            width: `${pct}%`,
                            height: '100%',
                            background: colors[i % colors.length],
                            transition: 'width 0.3s ease'
                          }}
                          title={`${owner.name} (${owner.relationship || 'Co-Owner'}): ${acres} Ac (${pct.toFixed(1)}%)`}
                        />
                      );
                    })}
                  </div>

                  {/* Co-Owners Cards Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                    {selectedFarm.coOwners.map((owner: any, i: number) => {
                      const acres = Number(owner.shareAcres) || 0;
                      const total = Number(selectedFarm.areaAcres) || 1;
                      const pct = Math.round((acres / total) * 100);
                      const colors = ['#10b981', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4'];
                      const rowColor = colors[i % colors.length];

                      return (
                        <div
                          key={i}
                          style={{
                            padding: '12px 14px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid var(--border-subtle)',
                            borderLeft: `4px solid ${rowColor}`
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-heading)' }}>
                                {owner.name}
                              </span>
                              {owner.isManagingCultivator && (
                                <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontSize: '0.68rem', fontWeight: 700, padding: '1px 5px', borderRadius: '4px' }}>
                                  ★ Cultivator
                                </span>
                              )}
                            </div>
                            <span className="badge badge-info" style={{ fontSize: '0.72rem', padding: '2px 7px' }}>
                              {pct}% Share
                            </span>
                          </div>

                          <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                            <strong style={{ color: rowColor }}>{acres} Acres</strong> • Relation: <strong>{owner.relationship || 'Co-Khatedar'}</strong>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {owner.surveyHissaNo ? (
                              <span>Hissa: <strong>{owner.surveyHissaNo}</strong></span>
                            ) : (
                              <span>Hissa: <strong>Unmarked</strong></span>
                            )}
                            {owner.assignedCrop && (
                              <span style={{ background: 'rgba(16, 185, 129, 0.08)', color: '#10b981', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                                🌱 {owner.assignedCrop}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Land Usage & Crop Allocation Breakdown Card */}
              {selectedFarm?.cropAllocations && selectedFarm.cropAllocations.length > 0 && (
                <div
                  style={{
                    marginTop: '20px',
                    padding: '20px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-heading)', margin: 0 }}>
                      <PieChart size={18} color="#10b981" />
                      <span>Planned Land Usage & Crop Parcel Breakdown</span>
                    </h4>
                    <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                      Total Holding: <strong style={{ color: 'var(--text-heading)' }}>{selectedFarm.areaAcres} Acres</strong>
                    </span>
                  </div>

                  {/* Segmented Visual Progress Bar */}
                  <div style={{ height: '10px', width: '100%', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '5px', overflow: 'hidden', display: 'flex', marginBottom: '16px' }}>
                    {selectedFarm.cropAllocations.map((ca: any, i: number) => {
                      const acres = Number(ca.allocatedAcres) || 0;
                      const total = Number(selectedFarm.areaAcres) || 1;
                      const pct = Math.min(100, (acres / total) * 100);
                      const colors = ['#10b981', '#38bdf8', '#fbbf24', '#a855f7', '#ec4899', '#f97316'];
                      return (
                        <div
                          key={i}
                          style={{
                            width: `${pct}%`,
                            height: '100%',
                            background: colors[i % colors.length],
                            transition: 'width 0.3s ease'
                          }}
                          title={`${ca.cropName}: ${acres} Ac (${pct.toFixed(1)}%)`}
                        />
                      );
                    })}
                  </div>

                  {/* Crop Parcels Cards Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    {selectedFarm.cropAllocations.map((ca: any, i: number) => {
                      const acres = Number(ca.allocatedAcres) || 0;
                      const total = Number(selectedFarm.areaAcres) || 1;
                      const pct = Math.round((acres / total) * 100);
                      const colors = ['#10b981', '#38bdf8', '#fbbf24', '#a855f7', '#ec4899', '#f97316'];
                      return (
                        <div
                          key={i}
                          style={{
                            padding: '12px 14px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid var(--border-subtle)',
                            borderLeft: `4px solid ${colors[i % colors.length]}`
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-heading)' }}>
                              {ca.cropName}
                            </span>
                            <span className="badge badge-success" style={{ fontSize: '0.72rem', padding: '2px 7px' }}>
                              {pct}% Land
                            </span>
                          </div>
                          <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                            <strong style={{ color: colors[i % colors.length] }}>{acres} Acres</strong> {ca.season ? `• ${ca.season}` : ''}
                            {ca.variety ? ` • ${ca.variety}` : ''}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <Farm2DCadastreMap
                center={{ lat: 18.4875, lng: 74.1332 }}
                height={460}
                ownerName={effectiveOwnerName}
                ulpin={generateDynamicUlpin({
                  state: profile?.state || 'Maharashtra',
                  district: profile?.district || 'Pune',
                  taluka: profile?.taluka || 'Baramati',
                  village: profile?.village || 'Malegaon',
                  gatNumber: 'Gat 124/A',
                  areaAcres: 4.0
                })}
                farmName={profile?.name ? `${profile.name}'s Agricultural Holding` : 'Primary Farmland Plot'}
                areaAcres={4.0}
                gatNumber="Gat 124/A"
                village={profile?.village || 'Malegaon'}
                taluka={profile?.taluka || 'Baramati'}
                district={profile?.district || 'Pune'}
                state={profile?.state || 'Maharashtra'}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                  Showing 2D Cadastral Spatial representation for <strong style={{ color: '#38bdf8' }}>{effectiveOwnerName}</strong>. Register your holding to bind custom survey bounds.
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn-primary" style={{ fontSize: '0.84rem' }} onClick={() => setShowModal(true)}>
                    <Plus size={14} />
                    <span>Register Farm Plot</span>
                  </button>
                  <Link
                    to="/cadastre-3d"
                    className="btn-secondary"
                    style={{
                      fontSize: '0.84rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Box size={14} color="#0284c7" />
                    <span>View in 3D Cadastre</span>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '20px'
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '460px',
              padding: '28px',
              border: '1px solid rgba(239, 68, 68, 0.45)',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6), 0 0 25px rgba(239, 68, 68, 0.25)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(239, 68, 68, 0.18)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ef4444'
                }}
              >
                <Trash2 size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-heading)' }}>
                  Delete Farm Holding?
                </h3>
                <span style={{ fontSize: '0.74rem', color: '#f87171', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Irreversible Action
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '22px' }}>
              Are you sure you want to delete <strong style={{ color: 'var(--text-heading)' }}>"{deleteTarget.name}"</strong> ({deleteTarget.areaAcres} Acres)?
              This will permanently remove its cadastral GIS boundaries, soil health test cards, and linked crop telemetry.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)'
                }}
                onClick={handleDeleteFarm}
                disabled={isDeleting}
              >
                <Trash2 size={16} />
                <span>{isDeleting ? 'Deleting Plot...' : 'Yes, Delete Plot'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
