import React from 'react';
import {
  X,
  MapPin,
  Edit3,
  Users,
  Sprout,
  Droplets,
  FileText,
  CheckCircle2,
  Download,
  ExternalLink,
  Calendar,
  Compass,
  ShieldCheck,
  Tag,
  Info,
  Maximize2
} from 'lucide-react';
import { generateDynamicUlpin } from './Farm2DCadastreMap';

interface FarmDetailsModalProps {
  farm: any | null;
  soilRecord?: any | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (farm: any) => void;
  onAdjustBoundary?: (farm: any) => void;
  onExportGeoJson?: (farm: any) => void;
}

export const FarmDetailsModal: React.FC<FarmDetailsModalProps> = ({
  farm,
  soilRecord,
  isOpen,
  onClose,
  onEdit,
  onAdjustBoundary,
  onExportGeoJson
}) => {
  if (!isOpen || !farm) return null;

  const totalAcres = Number(farm.areaAcres) || 0;
  const gunthas = (totalAcres * 40).toFixed(1);
  const hectares = (totalAcres * 0.404686).toFixed(2);

  const coOwners: any[] = farm.coOwners || [];
  const cropAllocations: any[] = farm.cropAllocations || [];
  const ulpin = generateDynamicUlpin(farm);

  const waterSources: string[] = Array.isArray(farm.waterSources)
    ? farm.waterSources
    : farm.irrigationSource
    ? [farm.irrigationSource]
    : [];

  const lat = Number(farm.latitude) || 18.5204;
  const lng = Number(farm.longitude) || 73.8567;
  const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

  const colors = ['#10b981', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4'];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '860px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-card)',
          borderRadius: '16px',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 20px 48px rgba(0, 0, 0, 0.45)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(16, 185, 129, 0.06)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid #10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Sprout size={24} color="#10b981" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-heading)' }}>
                  {farm.name}
                </h2>
                {farm.gatNumber && (
                  <span
                    style={{
                      background: 'rgba(56, 189, 248, 0.12)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: '#38bdf8',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '5px'
                    }}
                  >
                    🏷️ {farm.gatNumber}
                  </span>
                )}
                <span className="badge badge-success" style={{ fontSize: '0.76rem' }}>
                  {totalAcres} Acres
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Registered Agricultural Holding • Plot ID: {farm.id?.slice(0, 16)}…
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-muted)'
            }}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Quick Metrics Bar */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px'
            }}
          >
            <div
              style={{
                padding: '14px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                <Maximize2 size={13} color="#10b981" />
                <span>Total Holding Area</span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981' }}>
                {totalAcres} Acres
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                ≈ {gunthas} Gunthas • {hectares} Ha
              </div>
            </div>

            <div
              style={{
                padding: '14px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                <ShieldCheck size={13} color="#38bdf8" />
                <span>Ownership Structure</span>
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                {farm.ownershipType?.replace(/_/g, ' ') || 'INDIVIDUAL'}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#38bdf8', marginTop: '2px' }}>
                {coOwners.length > 0 ? `${coOwners.length} Co-Khatedars on 7/12` : 'Single Khatedar Holding'}
              </div>
            </div>

            <div
              style={{
                padding: '14px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                <Droplets size={13} color="#0ea5e9" />
                <span>Primary Irrigation</span>
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0ea5e9' }}>
                {farm.irrigationSource || 'CANAL'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {waterSources.length} water source(s) configured
              </div>
            </div>

            <div
              style={{
                padding: '14px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                <Compass size={13} color="#f59e0b" />
                <span>ULPIN & Cadastre</span>
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fbbf24', letterSpacing: '0.5px' }}>
                {ulpin}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                PostGIS ST_Polygon Certified
              </div>
            </div>
          </div>

          {/* Section 1: Geographic Location & Postal Mapping */}
          <div
            style={{
              padding: '18px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <h3 style={{ fontSize: '0.96rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={16} color="#10b981" />
                <span>Location & Cadastral Geography (जमीन पत्ता व स्थान)</span>
              </h3>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: '0.78rem',
                  color: '#38bdf8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  textDecoration: 'none',
                  fontWeight: 600
                }}
              >
                <span>Open in Google Maps</span>
                <ExternalLink size={12} />
              </a>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Village / City</span>
                <p style={{ margin: '2px 0 0', fontWeight: 700, fontSize: '0.9rem' }}>
                  {farm.village || 'Malegaon'}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Taluka / Tehsil</span>
                <p style={{ margin: '2px 0 0', fontWeight: 700, fontSize: '0.9rem' }}>
                  {farm.taluka || 'Baramati'}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>District</span>
                <p style={{ margin: '2px 0 0', fontWeight: 700, fontSize: '0.9rem' }}>
                  {farm.district || 'Pune'}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>State</span>
                <p style={{ margin: '2px 0 0', fontWeight: 700, fontSize: '0.9rem' }}>
                  {farm.state || 'Maharashtra'}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>GPS Centroid</span>
                <p style={{ margin: '2px 0 0', fontWeight: 700, fontSize: '0.86rem', color: '#10b981' }}>
                  {lat.toFixed(5)}°N, {lng.toFixed(5)}°E
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Gat / Survey Number</span>
                <p style={{ margin: '2px 0 0', fontWeight: 700, fontSize: '0.9rem', color: '#38bdf8' }}>
                  {farm.gatNumber || 'Not specified'}
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: 7/12 Co-Khatedar / Land Sharers Breakdown */}
          {coOwners.length > 0 ? (
            <div
              style={{
                padding: '18px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <h3 style={{ fontSize: '0.96rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={16} color="#38bdf8" />
                  <span>7/12 Land Co-Khatedar Partition (सामाईक खातेदार तपशील)</span>
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {coOwners.length} Sharers • Total: <strong>{totalAcres} Acres</strong>
                </span>
              </div>

              {/* Progress bar */}
              <div style={{ height: '8px', width: '100%', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden', display: 'flex', marginBottom: '14px' }}>
                {coOwners.map((owner: any, i: number) => {
                  const acres = Number(owner.shareAcres) || 0;
                  const pct = totalAcres > 0 ? Math.min(100, (acres / totalAcres) * 100) : 0;
                  return (
                    <div
                      key={i}
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        background: colors[i % colors.length]
                      }}
                      title={`${owner.name}: ${acres} Ac (${pct.toFixed(1)}%)`}
                    />
                  );
                })}
              </div>

              {/* Sharers Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '10px' }}>
                {coOwners.map((owner: any, i: number) => {
                  const acres = Number(owner.shareAcres) || 0;
                  const pct = totalAcres > 0 ? ((acres / totalAcres) * 100).toFixed(1) : '0';
                  const rowColor = colors[i % colors.length];

                  return (
                    <div
                      key={i}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-subtle)',
                        borderLeft: `4px solid ${rowColor}`
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <strong style={{ fontSize: '0.92rem', color: 'var(--text-heading)' }}>{owner.name}</strong>
                          {owner.isManagingCultivator && (
                            <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontSize: '0.65rem', fontWeight: 700, padding: '1px 5px', borderRadius: '3px' }}>
                              ★ Cultivator
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.74rem', color: rowColor, fontWeight: 700 }}>
                          {acres} Ac ({pct}%)
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Relation: <strong>{owner.relationship || 'Co-Khatedar'}</strong>
                        {owner.surveyHissaNo && (
                          <span> • Hissa: <strong>{owner.surveyHissaNo}</strong></span>
                        )}
                      </div>
                      {owner.assignedCrop && (
                        <div style={{ marginTop: '5px', fontSize: '0.76rem', color: '#10b981', fontWeight: 600 }}>
                          🌱 Assigned Crop: {owner.assignedCrop}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Section 3: Crops & Irrigation Sources */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '14px'
            }}
          >
            {/* Irrigation Sources */}
            <div
              style={{
                padding: '18px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <h3 style={{ fontSize: '0.96rem', fontWeight: 700, margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Droplets size={16} color="#0ea5e9" />
                <span>Water & Micro-Irrigation Sources</span>
              </h3>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {waterSources.length > 0 ? (
                  waterSources.map((source, i) => (
                    <span
                      key={i}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: 'rgba(14, 165, 233, 0.12)',
                        border: '1px solid rgba(14, 165, 233, 0.28)',
                        color: '#38bdf8',
                        fontSize: '0.78rem',
                        fontWeight: 600
                      }}
                    >
                      💧 {source.replace(/_/g, ' ')}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Standard Canal / Flow</span>
                )}
              </div>
            </div>

            {/* Crop Allocations */}
            <div
              style={{
                padding: '18px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <h3 style={{ fontSize: '0.96rem', fontWeight: 700, margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sprout size={16} color="#10b981" />
                <span>Planned Crop Allocations</span>
              </h3>

              {cropAllocations.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {cropAllocations.map((ca, i) => (
                    <span
                      key={i}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: 'rgba(16, 185, 129, 0.12)',
                        border: '1px solid rgba(16, 185, 129, 0.28)',
                        color: '#34d399',
                        fontSize: '0.78rem',
                        fontWeight: 600
                      }}
                    >
                      🌾 {ca.cropName}: <strong>{ca.allocatedAcres} Ac</strong>
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  No seasonal crop parcels subdivided yet.
                </p>
              )}
            </div>
          </div>

          {/* Section 4: Soil Health Card Metrics (if available) */}
          {soilRecord && (
            <div
              style={{
                padding: '18px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <h3 style={{ fontSize: '0.96rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={16} color="#fbbf24" />
                  <span>Soil Health Card Record ({soilRecord.testDate})</span>
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={13} />
                  <span>Soil Test Verified</span>
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>pH Reaction</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10b981' }}>{soilRecord.ph}</div>
                </div>
                <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Nitrogen (N)</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fbbf24' }}>{soilRecord.nitrogen} kg/ha</div>
                </div>
                <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Phosphorus (P)</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f59e0b' }}>{soilRecord.phosphorus} kg/ha</div>
                </div>
                <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Potassium (K)</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#a78bfa' }}>{soilRecord.potassium} kg/ha</div>
                </div>
                <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Organic Carbon</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#38bdf8' }}>{soilRecord.organicCarbon}%</div>
                </div>
                <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Previous Crop</span>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                    {soilRecord.previousCrop || 'Soybean'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 5: Notes & Timestamps */}
          {farm.notes && (
            <div
              style={{
                padding: '14px 18px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.84rem',
                color: 'var(--text-muted)'
              }}
            >
              <strong style={{ color: 'var(--text-heading)' }}>Agro Notes:</strong> {farm.notes}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            background: 'rgba(255, 255, 255, 0.01)'
          }}
        >
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {onAdjustBoundary && (
              <button
                type="button"
                className="btn-secondary"
                style={{ fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => {
                  onClose();
                  onAdjustBoundary(farm);
                }}
              >
                <Compass size={14} color="#10b981" />
                <span>Adjust Boundary & Partition</span>
              </button>
            )}
            {onExportGeoJson && (
              <button
                type="button"
                className="btn-secondary"
                style={{ fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => onExportGeoJson(farm)}
              >
                <Download size={14} />
                <span>Export GeoJSON</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn-primary"
              style={{ fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => {
                onClose();
                onEdit(farm);
              }}
            >
              <Edit3 size={14} />
              <span>Edit Farm Details</span>
            </button>
            <button
              type="button"
              className="btn-secondary"
              style={{ fontSize: '0.84rem' }}
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
