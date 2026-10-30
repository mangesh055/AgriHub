import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  MapPin,
  Sprout,
  Droplets,
  Users,
  Plus,
  Trash2,
  Navigation,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  PieChart
} from 'lucide-react';
import { api } from '../api/client';

interface CoOwnerItem {
  id?: string;
  name: string;
  relationship: string;
  shareAcres: number | string;
  surveyHissaNo?: string;
  isManagingCultivator?: boolean;
  assignedCrop?: string;
}

interface CropAllocationItem {
  cropName: string;
  allocatedAcres: number | string;
}

interface FarmEditModalProps {
  farm: any | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedFarm: any) => void;
}

const WATER_SOURCE_OPTIONS = [
  { id: 'CANAL', label: 'Canal (कालवा पट्टा)' },
  { id: 'BOREWELL', label: 'Borewell (बोअरवेल)' },
  { id: 'OPEN_WELL', label: 'Open Well (विहीर)' },
  { id: 'RIVER_LIFT', label: 'River / Lift (उपसा सिंचन)' },
  { id: 'FARM_POND', label: 'Farm Pond (शेततळे)' },
  { id: 'RAINFED', label: 'Rainfed (कोरडवाहू)' },
  { id: 'DRIP', label: 'Drip (ठिबक सिंचन)' },
  { id: 'SPRINKLER', label: 'Sprinkler (तुषार)' },
  { id: 'FLOOD', label: 'Flood (पाटपाणी)' }
];

const POPULAR_CROPS = [
  'Soybean',
  'Bt Cotton',
  'Sugarcane',
  'Onion',
  'Wheat',
  'Gram / Harbara',
  'Maize / Corn',
  'Paddy / Rice',
  'Groundnut',
  'Pigeon Pea / Tur',
  'Tomato & Veg',
  'Pomegranate',
  'Fallow / Grazing',
  'Other'
];

const RELATIONSHIPS = [
  'Self (स्वतः)',
  'Brother (भाऊ)',
  'Father (वडील)',
  'Mother (आई)',
  'Spouse (पती/पत्नी)',
  'Sister (बहीण)',
  'Son (मुलगा)',
  'Daughter (मुलगी)',
  'Uncle (काका)',
  'Partner / Co-Sharer (भागीदार)',
  'Other (इतर)'
];

export const FarmEditModal: React.FC<FarmEditModalProps> = ({
  farm,
  isOpen,
  onClose,
  onSuccess
}) => {
  if (!isOpen || !farm) return null;

  const [name, setName] = useState(farm.name || '');
  const [areaAcres, setAreaAcres] = useState(String(farm.areaAcres || ''));
  const [ownershipType, setOwnershipType] = useState(farm.ownershipType || 'INDIVIDUAL');
  const [gatNumber, setGatNumber] = useState(farm.gatNumber || '');

  const [village, setVillage] = useState(farm.village || '');
  const [taluka, setTaluka] = useState(farm.taluka || '');
  const [district, setDistrict] = useState(farm.district || '');
  const [state, setState] = useState(farm.state || 'Maharashtra');

  const [latitude, setLatitude] = useState(String(farm.latitude || '18.1519'));
  const [longitude, setLongitude] = useState(String(farm.longitude || '74.5771'));

  const [selectedWaterSources, setSelectedWaterSources] = useState<string[]>(() => {
    if (Array.isArray(farm.waterSources) && farm.waterSources.length > 0) return farm.waterSources;
    if (farm.irrigationSource && typeof farm.irrigationSource === 'string') {
      return farm.irrigationSource.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    return ['CANAL', 'DRIP'];
  });

  const [coOwners, setCoOwners] = useState<CoOwnerItem[]>(() => {
    if (Array.isArray(farm.coOwners) && farm.coOwners.length > 0) {
      return JSON.parse(JSON.stringify(farm.coOwners));
    }
    return [];
  });

  const [cropAllocations, setCropAllocations] = useState<CropAllocationItem[]>(() => {
    if (Array.isArray(farm.cropAllocations) && farm.cropAllocations.length > 0) {
      return JSON.parse(JSON.stringify(farm.cropAllocations));
    }
    return [];
  });

  const [notes, setNotes] = useState(farm.notes || '');

  const [locatingGps, setLocatingGps] = useState(false);
  const [resolvingAddress, setResolvingAddress] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state if farm changes
  useEffect(() => {
    if (farm) {
      setName(farm.name || '');
      setAreaAcres(String(farm.areaAcres || ''));
      setOwnershipType(farm.ownershipType || 'INDIVIDUAL');
      setGatNumber(farm.gatNumber || '');
      setVillage(farm.village || '');
      setTaluka(farm.taluka || '');
      setDistrict(farm.district || '');
      setState(farm.state || 'Maharashtra');
      setLatitude(String(farm.latitude || '18.1519'));
      setLongitude(String(farm.longitude || '74.5771'));
      setSelectedWaterSources(
        Array.isArray(farm.waterSources) && farm.waterSources.length > 0
          ? farm.waterSources
          : farm.irrigationSource && typeof farm.irrigationSource === 'string'
          ? farm.irrigationSource.split(',').map((s: string) => s.trim()).filter(Boolean)
          : ['CANAL', 'DRIP']
      );
      setCoOwners(
        Array.isArray(farm.coOwners) && farm.coOwners.length > 0
          ? JSON.parse(JSON.stringify(farm.coOwners))
          : []
      );
      setCropAllocations(
        Array.isArray(farm.cropAllocations) && farm.cropAllocations.length > 0
          ? JSON.parse(JSON.stringify(farm.cropAllocations))
          : []
      );
      setNotes(farm.notes || '');
      setError(null);
    }
  }, [farm]);

  // GPS auto-locate
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLatitude(lat.toFixed(6));
        setLongitude(lng.toFixed(6));
        setLocatingGps(false);
        // Auto reverse geocode
        try {
          setResolvingAddress(true);
          const geo = await api.reverseGeocode(lat, lng);
          if (geo.success) {
            if (geo.village) setVillage(geo.village);
            if (geo.taluka) setTaluka(geo.taluka);
            if (geo.district) setDistrict(geo.district);
            if (geo.state) setState(geo.state);
          }
        } catch (_) {} finally {
          setResolvingAddress(false);
        }
      },
      () => {
        setLocatingGps(false);
        alert('Could not retrieve GPS coordinates. Please check location permissions.');
      },
      { timeout: 8000 }
    );
  };

  // Reverse geocode from current inputs
  const handleReverseGeocode = async () => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lng)) {
      alert('Please enter valid numeric latitude and longitude first.');
      return;
    }
    setResolvingAddress(true);
    try {
      const geo = await api.reverseGeocode(lat, lng);
      if (geo.success) {
        if (geo.village) setVillage(geo.village);
        if (geo.taluka) setTaluka(geo.taluka);
        if (geo.district) setDistrict(geo.district);
        if (geo.state) setState(geo.state);
      } else {
        alert('Address details could not be resolved for these coordinates.');
      }
    } catch (err: any) {
      alert('Geocoding error: ' + (err.message || 'Failed to resolve address'));
    } finally {
      setResolvingAddress(false);
    }
  };

  // Toggle water source
  const toggleWaterSource = (id: string) => {
    setSelectedWaterSources((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  // Co-Owners management
  const addCoOwner = () => {
    const total = parseFloat(areaAcres) || 4.0;
    const currentSum = coOwners.reduce((s, o) => s + (parseFloat(String(o.shareAcres)) || 0), 0);
    const remaining = Math.max(0, Number((total - currentSum).toFixed(2)));

    setCoOwners([
      ...coOwners,
      {
        name: `Co-Owner ${coOwners.length + 1}`,
        relationship: 'Brother (भाऊ)',
        shareAcres: remaining > 0 ? remaining : 1.0,
        surveyHissaNo: '',
        isManagingCultivator: false,
        assignedCrop: ''
      }
    ]);
  };

  const removeCoOwner = (idx: number) => {
    setCoOwners(coOwners.filter((_, i) => i !== idx));
  };

  const updateCoOwner = (idx: number, updates: Partial<CoOwnerItem>) => {
    setCoOwners(
      coOwners.map((o, i) => (i === idx ? { ...o, ...updates } : o))
    );
  };

  const divideCoOwnersEqually = () => {
    if (coOwners.length === 0) return;
    const total = parseFloat(areaAcres) || 4.0;
    const shareEach = Number((total / coOwners.length).toFixed(2));
    setCoOwners(
      coOwners.map((o) => ({ ...o, shareAcres: shareEach }))
    );
  };

  // Crop Allocations
  const addCropAllocation = () => {
    setCropAllocations([
      ...cropAllocations,
      { cropName: 'Soybean', allocatedAcres: '2.0' }
    ]);
  };

  const removeCropAllocation = (idx: number) => {
    setCropAllocations(cropAllocations.filter((_, i) => i !== idx));
  };

  const updateCropAllocation = (idx: number, updates: Partial<CropAllocationItem>) => {
    setCropAllocations(
      cropAllocations.map((c, i) => (i === idx ? { ...c, ...updates } : c))
    );
  };

  // Submit Update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Farm name is required.');
      return;
    }
    const parsedArea = parseFloat(areaAcres);
    if (isNaN(parsedArea) || parsedArea <= 0) {
      setError('Please provide a valid farm area greater than 0 acres.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      // Clean coOwners data
      const cleanedCoOwners = coOwners.map((o) => ({
        ...o,
        shareAcres: Number(parseFloat(String(o.shareAcres)) || 0)
      }));

      // Clean cropAllocations data
      const cleanedCrops = cropAllocations.map((c) => ({
        cropName: c.cropName.trim(),
        allocatedAcres: Number(parseFloat(String(c.allocatedAcres)) || 0)
      }));

      const payload = {
        name: name.trim(),
        areaAcres: parsedArea,
        ownershipType,
        gatNumber: gatNumber.trim(),
        village: village.trim(),
        taluka: taluka.trim(),
        district: district.trim(),
        state: state.trim(),
        latitude: parseFloat(latitude) || Number(farm.latitude) || 18.1519,
        longitude: parseFloat(longitude) || Number(farm.longitude) || 74.5771,
        irrigationSource: selectedWaterSources[0] || 'CANAL',
        waterSources: selectedWaterSources,
        coOwners: cleanedCoOwners,
        cropAllocations: cleanedCrops,
        notes: notes.trim()
      };

      const updated = await api.updateFarm(farm.id, payload);
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to update farm holding details.');
    } finally {
      setIsSaving(false);
    }
  };

  const totalFarmAcres = parseFloat(areaAcres) || 0;
  const currentCoOwnerSum = coOwners.reduce(
    (s, o) => s + (parseFloat(String(o.shareAcres)) || 0),
    0
  );

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
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSaving) onClose();
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '880px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-card)',
          borderRadius: '16px',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 24px 54px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(16, 185, 129, 0.08)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff'
              }}
            >
              <Sprout size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-heading)' }}>
                Edit Registered Farm Details
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Update cadastral identity, co-khatedars, irrigation, and crop parcel allocation
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-muted)'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {error && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid #ef4444',
                  color: '#f87171',
                  fontSize: '0.84rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Block 1: Cadastral Identification */}
            <div
              style={{
                padding: '16px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <h3 style={{ fontSize: '0.94rem', fontWeight: 700, margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981' }}>
                <Sprout size={16} />
                <span>Cadastral Identification & Area (जमीन तपशील व क्षेत्र)</span>
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={labelStyle}>Farm Plot Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. My Primary Farm Plot"
                    className="form-input"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Total Area (Acres) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={areaAcres}
                    onChange={(e) => setAreaAcres(e.target.value)}
                    placeholder="e.g. 12.12"
                    className="form-input"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Gat / Survey Number (गट क्र.)</label>
                  <input
                    type="text"
                    value={gatNumber}
                    onChange={(e) => setGatNumber(e.target.value)}
                    placeholder="e.g. Gat No. 124/A (गट क्र. १२४/अ)"
                    className="form-input"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Ownership Type (मालकी प्रकार)</label>
                  <select
                    value={ownershipType}
                    onChange={(e) => setOwnershipType(e.target.value)}
                    className="form-input"
                    style={inputStyle}
                  >
                    <option value="INDIVIDUAL">Individual (वैयक्तिक खातेदार)</option>
                    <option value="JOINT_FAMILY">Joint Family (एकत्र कुटुंब खातेदार)</option>
                    <option value="CO_OWNED">Co-Owned / 7/12 Partition (सामाईक खातेदार)</option>
                    <option value="LEASED">Leased / Tenant (खंडाने / भाडेपट्टीने)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Block 2: Location & GPS Coordinates */}
            <div
              style={{
                padding: '16px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <h3 style={{ fontSize: '0.94rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8' }}>
                  <MapPin size={16} />
                  <span>Geographic Location & GPS Mapping (स्थान व जीपीएस)</span>
                </h3>

                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleLocateMe}
                    disabled={locatingGps}
                    style={secondaryBtnStyle}
                  >
                    <Navigation size={13} />
                    <span>{locatingGps ? 'Locating…' : '📍 Use Current GPS'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleReverseGeocode}
                    disabled={resolvingAddress}
                    style={secondaryBtnStyle}
                  >
                    <RefreshCw size={13} className={resolvingAddress ? 'spin' : ''} />
                    <span>{resolvingAddress ? 'Resolving…' : '🔄 Auto-Resolve Address'}</span>
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={labelStyle}>Village / City (गाव / शहर)</label>
                  <input
                    type="text"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    placeholder="e.g. Malegaon"
                    className="form-input"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Taluka / Tehsil (तालुका)</label>
                  <input
                    type="text"
                    value={taluka}
                    onChange={(e) => setTaluka(e.target.value)}
                    placeholder="e.g. Baramati"
                    className="form-input"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>District (जिल्हा)</label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="e.g. Pune"
                    className="form-input"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>State (राज्य)</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="e.g. Maharashtra"
                    className="form-input"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>GPS Latitude (°N)</label>
                  <input
                    type="text"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="18.1519"
                    className="form-input"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>GPS Longitude (°E)</label>
                  <input
                    type="text"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="74.5771"
                    className="form-input"
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            {/* Block 3: Water Sources & Irrigation */}
            <div
              style={{
                padding: '16px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <h3 style={{ fontSize: '0.94rem', fontWeight: 700, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '8px', color: '#0ea5e9' }}>
                <Droplets size={16} />
                <span>Water & Irrigation Sources (पाणी व सिंचन व्यवस्था)</span>
              </h3>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {WATER_SOURCE_OPTIONS.map((opt) => {
                  const active = selectedWaterSources.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleWaterSource(opt.id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        background: active ? '#0284c7' : 'rgba(255, 255, 255, 0.04)',
                        color: active ? '#ffffff' : 'var(--text-main)',
                        border: `1px solid ${active ? '#0284c7' : 'var(--border-subtle)'}`
                      }}
                    >
                      {active ? '✓ ' : '+ '}
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Block 4: 7/12 Co-Khatedar / Land Sharers */}
            <div
              style={{
                padding: '16px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h3 style={{ fontSize: '0.94rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8' }}>
                    <Users size={16} />
                    <span>7/12 Co-Khatedar Partition (सामाईक खातेदार नोंदणी)</span>
                  </h3>
                  <p style={{ margin: '3px 0 0', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    Assigned: <strong>{currentCoOwnerSum.toFixed(2)} Ac</strong> of {totalFarmAcres} Ac{' '}
                    {Math.abs(totalFarmAcres - currentCoOwnerSum) < 0.05 ? (
                      <span style={{ color: '#10b981', fontWeight: 700 }}>✓ Balanced</span>
                    ) : (
                      <span style={{ color: '#f59e0b' }}>
                        (Difference: {(totalFarmAcres - currentCoOwnerSum).toFixed(2)} Ac)
                      </span>
                    )}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  {coOwners.length > 1 && (
                    <button
                      type="button"
                      onClick={divideCoOwnersEqually}
                      style={secondaryBtnStyle}
                      title="Divide total acres equally among all listed co-owners"
                    >
                      ⚖️ Divide Equally
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={addCoOwner}
                    style={{
                      ...secondaryBtnStyle,
                      background: 'rgba(56, 189, 248, 0.12)',
                      borderColor: 'rgba(56, 189, 248, 0.35)',
                      color: '#38bdf8'
                    }}
                  >
                    <Plus size={13} />
                    <span>Add Co-Khatedar</span>
                  </button>
                </div>
              </div>

              {coOwners.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  No co-khatedars listed. Click <strong>+ Add Co-Khatedar</strong> if this plot has multiple 7/12 land sharers.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {coOwners.map((owner, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-subtle)',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr)) 34px',
                        gap: '10px',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <label style={labelStyle}>Full Name *</label>
                        <input
                          type="text"
                          required
                          value={owner.name}
                          onChange={(e) => updateCoOwner(idx, { name: e.target.value })}
                          placeholder="e.g. Ramesh Patil"
                          className="form-input"
                          style={inputStyle}
                        />
                      </div>

                      <div>
                        <label style={labelStyle}>Relationship</label>
                        <select
                          value={owner.relationship}
                          onChange={(e) => updateCoOwner(idx, { relationship: e.target.value })}
                          className="form-input"
                          style={inputStyle}
                        >
                          {RELATIONSHIPS.map((rel) => (
                            <option key={rel} value={rel}>{rel}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={labelStyle}>Land Share (Acres) *</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          required
                          value={owner.shareAcres}
                          onChange={(e) => updateCoOwner(idx, { shareAcres: e.target.value })}
                          placeholder="6.06"
                          className="form-input"
                          style={inputStyle}
                        />
                      </div>

                      <div>
                        <label style={labelStyle}>7/12 Hissa No</label>
                        <input
                          type="text"
                          value={owner.surveyHissaNo || ''}
                          onChange={(e) => updateCoOwner(idx, { surveyHissaNo: e.target.value })}
                          placeholder="e.g. 124/1"
                          className="form-input"
                          style={inputStyle}
                        />
                      </div>

                      <div>
                        <label style={labelStyle}>Assigned Crop</label>
                        <input
                          type="text"
                          value={owner.assignedCrop || ''}
                          onChange={(e) => updateCoOwner(idx, { assignedCrop: e.target.value })}
                          placeholder="e.g. Sugarcane"
                          className="form-input"
                          style={inputStyle}
                        />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <button
                          type="button"
                          onClick={() => removeCoOwner(idx)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            color: '#f87171',
                            width: '32px',
                            height: '32px',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                          title="Remove co-owner"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Block 5: Crop Parcels */}
            <div
              style={{
                padding: '16px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '0.94rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981' }}>
                  <PieChart size={16} />
                  <span>Planned Crop Allocation (पीक वाटप)</span>
                </h3>
                <button
                  type="button"
                  onClick={addCropAllocation}
                  style={{
                    ...secondaryBtnStyle,
                    background: 'rgba(16, 185, 129, 0.12)',
                    borderColor: 'rgba(16, 185, 129, 0.35)',
                    color: '#34d399'
                  }}
                >
                  <Plus size={13} />
                  <span>Add Crop Parcel</span>
                </button>
              </div>

              {cropAllocations.length === 0 ? (
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  No seasonal crops added yet. Click <strong>+ Add Crop Parcel</strong> to specify active field crops.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {cropAllocations.map((ca, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '6px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}
                    >
                      <div style={{ flex: 2 }}>
                        <select
                          value={ca.cropName}
                          onChange={(e) => updateCropAllocation(idx, { cropName: e.target.value })}
                          className="form-input"
                          style={inputStyle}
                        >
                          {POPULAR_CROPS.map((crop) => (
                            <option key={crop} value={crop}>{crop}</option>
                          ))}
                        </select>
                      </div>

                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={ca.allocatedAcres}
                          onChange={(e) => updateCropAllocation(idx, { allocatedAcres: e.target.value })}
                          placeholder="Acres"
                          className="form-input"
                          style={inputStyle}
                        />
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          Acres
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeCropAllocation(idx)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                          color: '#f87171',
                          width: '32px',
                          height: '32px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Block 6: Notes */}
            <div
              style={{
                padding: '16px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <label style={labelStyle}>Additional Agro Notes / Remark</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add soil notes, access road notes, canal rotation timing, etc."
                rows={2}
                className="form-input"
                style={{ ...inputStyle, width: '100%', resize: 'vertical' }}
              />
            </div>
          </div>

          {/* Footer Controls */}
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px',
              background: 'rgba(255, 255, 255, 0.01)'
            }}
          >
            <button
              type="button"
              className="btn-secondary"
              style={{ fontSize: '0.84rem' }}
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              style={{
                fontSize: '0.84rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: '#10b981',
                boxShadow: '0 2px 10px rgba(16, 185, 129, 0.4)'
              }}
              disabled={isSaving}
            >
              <Save size={15} />
              <span>{isSaving ? 'Saving Changes…' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.74rem',
  fontWeight: 600,
  color: 'var(--text-muted)',
  marginBottom: '5px'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: '6px',
  fontSize: '0.85rem',
  border: '1px solid var(--border-subtle)',
  background: 'rgba(0, 0, 0, 0.25)',
  color: 'var(--text-heading)'
};

const secondaryBtnStyle: React.CSSProperties = {
  padding: '5px 10px',
  borderRadius: '6px',
  fontSize: '0.76rem',
  fontWeight: 600,
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid var(--border-subtle)',
  color: 'var(--text-main)',
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
  cursor: 'pointer'
};
