import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Sprout,
  FileText,
  ArrowRight,
  Upload,
  CheckCircle2,
  RefreshCw,
  FileCheck,
  Navigation,
  Map,
  PieChart,
  Plus,
  Trash2,
  AlertTriangle,
  Users,
  ShieldCheck,
  Divide
} from 'lucide-react';
import { api, API_BASE_URL } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { FarmMapEditor, LatLng } from '../components/FarmMapEditor';

const POPULAR_CROPS = [
  { id: 'CUSTOM', label: '✍️ Custom Crop (स्वतःचे पीक प्रविष्ट करा)' },
  { id: 'Soybean', label: 'Soybean (सोयाबीन)' },
  { id: 'Cotton', label: 'Bt Cotton (कापूस)' },
  { id: 'Sugarcane', label: 'Sugarcane (ऊस)' },
  { id: 'Onion', label: 'Onion (कांदा)' },
  { id: 'Wheat', label: 'Wheat (गहू)' },
  { id: 'Gram', label: 'Gram / Harbara (हरभरा)' },
  { id: 'Maize', label: 'Maize / Fodder (मका / चारा)' },
  { id: 'Paddy', label: 'Paddy / Rice (भात)' },
  { id: 'Groundnut', label: 'Groundnut (भुईमूग)' },
  { id: 'Tur', label: 'Pigeon Pea / Tur (तूर)' },
  { id: 'Tomato', label: 'Tomato & Veg (भाजीपाला)' },
  { id: 'Pomegranate', label: 'Pomegranate (डाळिंब)' },
  { id: 'Fallow', label: 'Fallow / Grazing (पडिक जमीन)' },
  { id: 'Other', label: 'Other Crop (इतर पीक)' }
];

const WATER_SOURCE_OPTIONS = [
  { id: 'CANAL', label: 'Canal (Nira Left Bank Canal Flow)' },
  { id: 'BOREWELL', label: 'Borewell / Tube Well' },
  { id: 'OPEN_WELL', label: 'Open Well / Dug Well' },
  { id: 'RIVER_LIFT', label: 'River / Lift Irrigation System' },
  { id: 'FARM_POND', label: 'Farm Pond / Rainwater Harvesting' },
  { id: 'RAINFED', label: 'Rainfed (Direct Monsoon / Scarcity)' },
  { id: 'DRIP', label: 'Drip Irrigation (Micro-irrigation)' },
  { id: 'SPRINKLER', label: 'Sprinkler System' },
  { id: 'FLOOD', label: 'Flood / Furrow Irrigation' }
];

const SOIL_TYPE_OPTIONS = [
  { id: 'DEEP_BLACK_VERTISOL', label: 'Deep Black Vertisol (Heavy Black / Canal Belt)' },
  { id: 'MEDIUM_CLAY_LOAM', label: 'Medium Clay Loam (Well-Drained Loam / Shardanagar Belt)' },
  { id: 'SHALLOW_MURRUM', label: 'Shallow Basaltic Murrum (Light / Supa Scarcity Belt)' },
  { id: 'BLACK_COTTON', label: 'Black Cotton Soil (Regur / Heavy Clay)' },
  { id: 'ALLUVIAL', label: 'Alluvial Loam (Fertile River Plains)' },
  { id: 'RED_SOIL', label: 'Red Sandy / Lateritic Soil' },
  { id: 'CLAY_LOAM', label: 'Clay Loam (Moderate Drainage)' },
  { id: 'SANDY_LOAM', label: 'Sandy Loam (High Drainage)' },
  { id: 'SILTY_CLAY', label: 'Silty Clay' }
];

const PREVIOUS_CROPS = [
  'Soybean',
  'Wheat',
  'Cotton',
  'Sugarcane',
  'Gram / Chana',
  'Maize / Corn',
  'Paddy / Rice',
  'Groundnut',
  'Pigeon Pea / Tur',
  'Mustard',
  'Onion',
  'Tomato',
  'Other'
];

export const FarmOnboardingPage: React.FC = () => {
  const { profile, markFarmCreated, refreshAuth } = useAuth();
  const navigate = useNavigate();

  // Strings in state prevent zero-lock and stepper spinner issues
  const [farmData, setFarmData] = useState({
    name: 'Shivaji Agri Fields',
    areaAcres: '4.0',
    ownershipType: 'INDIVIDUAL' as 'INDIVIDUAL' | 'JOINT_FAMILY' | 'CO_OWNED' | 'LEASED',
    gatNumber: 'Gat No. 124/A (गट क्र. १२४/अ)',
    village: 'Malegaon',
    taluka: 'Baramati',
    district: 'Pune',
    state: 'Maharashtra',
    latitude: '18.1519',
    longitude: '74.5771',
    waterSources: ['CANAL', 'DRIP'],
    notes: 'Primary crop plot with Nira Left Bank Canal & micro-irrigation.'
  });

  const [soilData, setSoilData] = useState({
    soilType: 'DEEP_BLACK_VERTISOL',
    ph: '7.2',
    nitrogen: '220',
    phosphorus: '30',
    potassium: '310',
    organicCarbon: '0.65',
    electricalConductivity: '0.45',
    previousCrop: 'Soybean',
    previousYieldQuintals: '11.5',
    previousSeason: 'KHARIF',
    reportName: '',
    testDate: new Date().toISOString().split('T')[0]
  });

  const [uploadingReport, setUploadingReport] = useState(false);
  const [extractedStatus, setExtractedStatus] = useState<string | null>(null);
  const [locatingGps, setLocatingGps] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [boundaryPoints, setBoundaryPoints] = useState<LatLng[]>([]);
  const [boundaryGeoJSON, setBoundaryGeoJSON] = useState<object | null>(null);

  // Crop Land Allocation (Planned land usage breakdown)
  const [cropAllocations, setCropAllocations] = useState<Array<{
    cropName: string;
    customCropName?: string;
    isCustom?: boolean;
    allocatedAcres: string;
    season: string;
    variety?: string;
  }>>([
    { cropName: 'Soybean', customCropName: '', isCustom: false, allocatedAcres: '4.0', season: 'KHARIF', variety: 'JS-335' }
  ]);

  // 7/12 Co-Owners & Land Sharers
  const [coOwners, setCoOwners] = useState<Array<{
    id: string;
    name: string;
    relationship: string;
    shareAcres: string;
    surveyHissaNo: string;
    isManagingCultivator: boolean;
    assignedCrop: string;
  }>>([
    {
      id: 'co-self',
      name: 'Ramesh Patel',
      relationship: 'Self',
      shareAcres: '4.0',
      surveyHissaNo: '124/1',
      isManagingCultivator: true,
      assignedCrop: 'Soybean'
    }
  ]);

  const totalAcres = parseFloat(farmData.areaAcres) || 0;
  const allocatedTotal = cropAllocations.reduce((sum, c) => sum + (parseFloat(c.allocatedAcres) || 0), 0);
  const remainingAcres = Number((totalAcres - allocatedTotal).toFixed(2));
  const isOverAllocated = allocatedTotal > totalAcres;

  const coOwnerTotalAcres = coOwners.reduce((sum, o) => sum + (parseFloat(o.shareAcres) || 0), 0);
  const isCoOwnerOverAllocated = coOwnerTotalAcres > totalAcres;
  const remainingCoOwnerAcres = Number((totalAcres - coOwnerTotalAcres).toFixed(2));

  function addCropAllocation() {
    const remaining = Math.max(0, Number((totalAcres - allocatedTotal).toFixed(2)));
    setCropAllocations((prev) => [
      ...prev,
      { cropName: 'Cotton', customCropName: '', isCustom: false, allocatedAcres: remaining > 0 ? String(remaining) : '1.0', season: 'KHARIF', variety: '' }
    ]);
  }

  function removeCropAllocation(index: number) {
    if (cropAllocations.length <= 1) return;
    setCropAllocations((prev) => prev.filter((_, i) => i !== index));
  }

  function updateCropAllocation(index: number, field: string, value: any) {
    setCropAllocations((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function addCoOwner() {
    const remaining = Math.max(0, Number((totalAcres - coOwnerTotalAcres).toFixed(2)));
    const brotherIndex = coOwners.length;
    setCoOwners((prev) => [
      ...prev,
      {
        id: `co-${Date.now()}-${brotherIndex}`,
        name: `Brother ${brotherIndex}`,
        relationship: 'Brother',
        shareAcres: remaining > 0 ? String(remaining) : '1.0',
        surveyHissaNo: `124/${brotherIndex + 1}`,
        isManagingCultivator: false,
        assignedCrop: cropAllocations[0]?.cropName || 'Soybean'
      }
    ]);
  }

  function removeCoOwner(index: number) {
    if (coOwners.length <= 1) return;
    setCoOwners((prev) => prev.filter((_, i) => i !== index));
  }

  function updateCoOwner(index: number, field: string, value: any) {
    setCoOwners((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function handleEqualSplit() {
    if (coOwners.length === 0 || totalAcres <= 0) return;
    const split = (totalAcres / coOwners.length).toFixed(2);
    setCoOwners((prev) =>
      prev.map((o) => ({
        ...o,
        shareAcres: split
      }))
    );
  }

  function toggleWaterSource(id: string) {
    setFarmData((prev) => {
      const exists = prev.waterSources.includes(id);
      const updated = exists
        ? prev.waterSources.filter((s) => s !== id)
        : [...prev.waterSources, id];
      return {
        ...prev,
        waterSources: updated.length > 0 ? updated : [id]
      };
    });
  }

  function handleAutoDetectGps() {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFarmData((prev) => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(4),
          longitude: pos.coords.longitude.toFixed(4)
        }));
        setLocatingGps(false);
      },
      (err) => {
        setLocatingGps(false);
        setError(`Unable to detect GPS position: ${err.message}. Please enter coordinates manually.`);
      },
      { timeout: 8000 }
    );
  }

  async function handleReportFileUpload(file: File) {
    setError('');
    setUploadingReport(true);
    setExtractedStatus(null);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const content = (event.target?.result as string) || '';
          const res = await api.extractSoilReport({
            fileName: file.name,
            fileContent: content
          });

          if (res && res.extracted) {
            const ext = res.extracted;
            setSoilData((prev) => ({
              ...prev,
              ph: ext.ph != null ? String(ext.ph) : prev.ph,
              nitrogen: ext.nitrogen != null ? String(ext.nitrogen) : prev.nitrogen,
              phosphorus: ext.phosphorus != null ? String(ext.phosphorus) : prev.phosphorus,
              potassium: ext.potassium != null ? String(ext.potassium) : prev.potassium,
              organicCarbon: ext.organicCarbon != null ? String(ext.organicCarbon) : prev.organicCarbon,
              electricalConductivity: ext.electricalConductivity != null ? String(ext.electricalConductivity) : prev.electricalConductivity,
              soilType: ext.soilType ?? prev.soilType,
              previousCrop: ext.previousCrop ?? prev.previousCrop,
              previousYieldQuintals: ext.previousYieldQuintals != null ? String(ext.previousYieldQuintals) : prev.previousYieldQuintals,
              reportName: file.name
            }));
            setExtractedStatus(
              `Extracted parameters from "${file.name}": pH ${ext.ph}, N ${ext.nitrogen}, P ${ext.phosphorus}, K ${ext.potassium}, OC ${ext.organicCarbon}%`
            );
          }
        } catch (err: any) {
          setError(`Failed to parse soil report: ${err.message}`);
        } finally {
          setUploadingReport(false);
        }
      };

      if (file.type.includes('text') || file.name.endsWith('.txt')) {
        reader.readAsText(file);
      } else {
        reader.readAsDataURL(file);
      }
    } catch (err: any) {
      setError(`Failed to upload report: ${err.message}`);
      setUploadingReport(false);
    }
  }

  async function handleDemoReportExtraction() {
    setError('');
    setUploadingReport(true);
    setExtractedStatus(null);

    try {
      const demoText = `
        GOVERNMENT OF INDIA - SOIL HEALTH CARD
        District Agricultural Research & Soil Testing Lab
        Sample No: SHC-2026-98124
        Soil Classification: Black Cotton Soil (Regur)
        pH: 7.3 (Normal)
        Electrical Conductivity (EC): 0.52 dS/m (Safe)
        Organic Carbon (OC): 0.72 % (Medium)
        Available Nitrogen (N): 230 kg/ha (Medium)
        Available Phosphorus (P): 32 kg/ha (Medium-High)
        Available Potassium (K): 340 kg/ha (High)
        Previous Crop History: Soybean
        Previous Harvest Yield: 12.4 Quintals / acre
      `;

      const res = await api.extractSoilReport({
        fileName: 'Govt_Soil_Health_Card_SHC-2026.pdf',
        rawText: demoText
      });

      if (res && res.extracted) {
        const ext = res.extracted;
        setSoilData((prev) => ({
          ...prev,
          ph: ext.ph != null ? String(ext.ph) : '7.3',
          nitrogen: ext.nitrogen != null ? String(ext.nitrogen) : '230',
          phosphorus: ext.phosphorus != null ? String(ext.phosphorus) : '32',
          potassium: ext.potassium != null ? String(ext.potassium) : '340',
          organicCarbon: ext.organicCarbon != null ? String(ext.organicCarbon) : '0.72',
          electricalConductivity: ext.electricalConductivity != null ? String(ext.electricalConductivity) : '0.52',
          soilType: ext.soilType ?? 'BLACK_COTTON',
          previousCrop: ext.previousCrop ?? 'Soybean',
          previousYieldQuintals: ext.previousYieldQuintals != null ? String(ext.previousYieldQuintals) : '12.4',
          reportName: 'Govt_Soil_Health_Card_SHC-2026.pdf'
        }));
        setExtractedStatus(
          `Extracted from Govt Soil Health Card: pH ${ext.ph}, N ${ext.nitrogen} kg/ha, P ${ext.phosphorus} kg/ha, K ${ext.potassium} kg/ha, OC ${ext.organicCarbon}%`
        );
      }
    } catch (err: any) {
      setError(`Extraction error: ${err.message}`);
    } finally {
      setUploadingReport(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const irrigationJoined = farmData.waterSources.join(', ') || 'DRIP';
      const locationFull = [farmData.village, farmData.taluka, farmData.district, farmData.state].filter(Boolean).join(', ');

      const parsedAllocations = cropAllocations.map((c) => {
        const effectiveCrop = (c.isCustom || c.cropName === 'CUSTOM') && c.customCropName?.trim()
          ? c.customCropName.trim()
          : (c.cropName === 'CUSTOM' ? 'Custom Crop' : c.cropName);
        return {
          cropName: effectiveCrop,
          allocatedAcres: parseFloat(c.allocatedAcres) || 0,
          season: c.season || 'KHARIF',
          variety: c.variety?.trim() || undefined
        };
      });

      const isCoOwned = farmData.ownershipType === 'JOINT_FAMILY' || farmData.ownershipType === 'CO_OWNED';
      const parsedCoOwners = isCoOwned
        ? coOwners.map((o) => {
            const acres = parseFloat(o.shareAcres) || 0;
            const pct = totalAcres > 0 ? Number(((acres / totalAcres) * 100).toFixed(1)) : 0;
            return {
              id: o.id,
              name: o.name.trim() || 'Co-Owner',
              relationship: o.relationship,
              shareAcres: acres,
              percentage: pct,
              surveyHissaNo: o.surveyHissaNo?.trim() || undefined,
              isManagingCultivator: o.isManagingCultivator,
              assignedCrop: o.assignedCrop || undefined
            };
          })
        : undefined;

      // 1. Create Farm Plot
      const createdFarm = await api.createFarm({
        name: farmData.name.trim() || 'My Farm Plot',
        areaAcres: parseFloat(farmData.areaAcres) || 1.0,
        ownershipType: farmData.ownershipType,
        gatNumber: farmData.gatNumber.trim() || undefined,
        coOwners: parsedCoOwners,
        irrigationSource: irrigationJoined,
        waterSources: farmData.waterSources,
        cropAllocations: parsedAllocations,
        village: farmData.village.trim(),
        taluka: farmData.taluka.trim(),
        district: farmData.district.trim(),
        state: farmData.state.trim(),
        locationName: locationFull,
        latitude: parseFloat(farmData.latitude) || 18.4875,
        longitude: parseFloat(farmData.longitude) || 74.1332,
        boundaryGeoJson: boundaryGeoJSON ?? undefined,
        notes: farmData.notes
      });

      // 2. Add Initial Soil Health Card - Nutrients are optional with defaults
      await fetch(`${API_BASE_URL}/farms/${createdFarm.id}/soil-records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('agrihub_token')}`
        },
        body: JSON.stringify({
          soilType: soilData.soilType || 'BLACK_COTTON',
          ph: soilData.ph.trim() ? parseFloat(soilData.ph) : 7.2,
          nitrogen: soilData.nitrogen.trim() ? parseFloat(soilData.nitrogen) : 210,
          phosphorus: soilData.phosphorus.trim() ? parseFloat(soilData.phosphorus) : 28,
          potassium: soilData.potassium.trim() ? parseFloat(soilData.potassium) : 320,
          organicCarbon: soilData.organicCarbon.trim() ? parseFloat(soilData.organicCarbon) : 0.65,
          electricalConductivity: soilData.electricalConductivity.trim() ? parseFloat(soilData.electricalConductivity) : 0.45,
          previousCrop: soilData.previousCrop || 'Soybean',
          previousYieldQuintals: soilData.previousYieldQuintals.trim() ? parseFloat(soilData.previousYieldQuintals) : 0,
          previousSeason: soilData.previousSeason || 'KHARIF',
          reportName: soilData.reportName || undefined,
          testDate: soilData.testDate
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
      <div style={{ maxWidth: '840px', margin: '0 auto' }}>
        
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
          <span style={{ fontSize: '0.82rem', color: '#10b981', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.08em' }}>
            First-Time Agricultural Setup
          </span>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-heading)' }}>
            Welcome, {profile?.name || 'Farmer'}! Register Your Farm
          </h2>
          <p style={{ color: 'var(--text-main)', fontSize: '0.94rem', maxWidth: '640px', margin: '8px auto 0' }}>
            Enter your farm location, water sources, soil classification, and previous yield history to activate high-accuracy AI predictions.
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: '14px 18px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#f87171',
              fontSize: '0.9rem',
              fontWeight: 600,
              marginBottom: '20px'
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Section 1: Farm Identification */}
          <div style={{ padding: '24px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-heading)' }}>
              <Sprout size={20} color="#10b981" />
              <span>1. Farm Plot Identification</span>
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div>
                <label className="form-label">
                  Farm Name / Identifier <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={farmData.name}
                  onChange={(e) => setFarmData({ ...farmData, name: e.target.value })}
                  required
                  placeholder="e.g. Krishna Agri Fields"
                />
              </div>

              <div>
                <label className="form-label">
                  Total Land Area (in Acres) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  className="form-input"
                  value={farmData.areaAcres}
                  onChange={(e) => setFarmData({ ...farmData, areaAcres: e.target.value })}
                  required
                  placeholder="e.g. 4.5"
                />
              </div>
            </div>
          </div>

          {/* Section 1B: Planned Land Usage & Crop Allocation */}
          <div style={{ padding: '24px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-heading)', margin: 0 }}>
                  <PieChart size={20} color="#10b981" />
                  <span>2. Planned Land Usage & Crop Allocation</span>
                </h3>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Specify how many acres out of your total land will be used for each crop.
                </p>
              </div>
              <button
                type="button"
                className="btn-secondary"
                style={{ fontSize: '0.84rem', padding: '6px 14px' }}
                onClick={addCropAllocation}
              >
                <Plus size={15} color="#10b981" />
                <span>+ Add Crop Parcel</span>
              </button>
            </div>

            {/* Real-time Visual Allocation Progress Meter */}
            <div style={{ marginBottom: '18px', padding: '14px 18px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.86rem' }}>
                <span>
                  Total Farm Land: <strong>{totalAcres} Acres</strong>
                </span>
                <span>
                  Allocated: <strong style={{ color: isOverAllocated ? '#ef4444' : '#10b981' }}>{allocatedTotal.toFixed(2)} Ac</strong>
                  {remainingAcres > 0 && <span style={{ color: 'var(--text-muted)' }}> ({remainingAcres.toFixed(2)} Ac unallocated)</span>}
                </span>
              </div>

              {/* Segmented multi-color allocation progress bar */}
              <div style={{ height: '8px', width: '100%', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
                {cropAllocations.map((c, i) => {
                  const acres = parseFloat(c.allocatedAcres) || 0;
                  const pct = totalAcres > 0 ? (acres / totalAcres) * 100 : 0;
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
                      title={`${c.cropName}: ${acres} Ac (${pct.toFixed(1)}%)`}
                    />
                  );
                })}
              </div>

              {isOverAllocated && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f87171', fontSize: '0.82rem', marginTop: '8px', fontWeight: 600 }}>
                  <AlertTriangle size={15} />
                  <span>Warning: Allocated crop land ({allocatedTotal.toFixed(2)} Ac) exceeds total farm area ({totalAcres} Ac)!</span>
                </div>
              )}
            </div>

            {/* Crop Allocation Row Inputs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {cropAllocations.map((c, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(140px, 1.4fr) minmax(100px, 1fr) minmax(110px, 1fr) minmax(110px, 1.2fr) 36px',
                    gap: '12px',
                    alignItems: 'center',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div>
                    <label className="form-label-muted">Crop Name</label>
                    <select
                      className="form-input"
                      value={c.isCustom ? 'CUSTOM' : c.cropName}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'CUSTOM') {
                          updateCropAllocation(idx, 'isCustom', true);
                          updateCropAllocation(idx, 'cropName', 'CUSTOM');
                        } else {
                          updateCropAllocation(idx, 'isCustom', false);
                          updateCropAllocation(idx, 'cropName', val);
                        }
                      }}
                    >
                      {POPULAR_CROPS.map((crop) => (
                        <option key={crop.id} value={crop.id}>
                          {crop.label}
                        </option>
                      ))}
                    </select>
                    {(c.isCustom || c.cropName === 'CUSTOM') && (
                      <input
                        type="text"
                        className="form-input"
                        style={{ marginTop: '6px', borderColor: '#10b981', background: 'rgba(16, 185, 129, 0.08)' }}
                        placeholder="Type custom crop name (e.g. Turmeric, Dragonfruit, Saffron)"
                        value={c.customCropName || ''}
                        onChange={(e) => updateCropAllocation(idx, 'customCropName', e.target.value)}
                        required
                      />
                    )}
                  </div>

                  <div>
                    <label className="form-label-muted">Allocated Land (Ac)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      className="form-input"
                      placeholder="e.g. 2.5"
                      value={c.allocatedAcres}
                      onChange={(e) => updateCropAllocation(idx, 'allocatedAcres', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label-muted">Season</label>
                    <select
                      className="form-input"
                      value={c.season}
                      onChange={(e) => updateCropAllocation(idx, 'season', e.target.value)}
                    >
                      <option value="KHARIF">Kharif (पावसाळी)</option>
                      <option value="RABI">Rabi (हिवाळी)</option>
                      <option value="ZAID">Summer / Zaid (उन्हाळी)</option>
                      <option value="ANNUAL">Annual / Cash (वार्षिक)</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label-muted">Variety / Hybrid (Opt)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. JS-335 / Phule"
                      value={c.variety || ''}
                      onChange={(e) => updateCropAllocation(idx, 'variety', e.target.value)}
                    />
                  </div>

                  <div style={{ paddingTop: '18px' }}>
                    {cropAllocations.length > 1 && (
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
                        title="Remove crop parcel"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 1C: Land Ownership & 7/12 Co-Sharers Partitioning */}
          <div style={{ padding: '24px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-heading)', margin: 0 }}>
                  <Users size={20} color="#10b981" />
                  <span>3. Land Ownership & 7/12 Co-Sharers (Hissa Partitioning)</span>
                </h3>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Choose individual ownership or specify joint family co-sharers (e.g. Ramesh & brothers) to display sub-plots on the GIS satellite map.
                </p>
              </div>
            </div>

            {/* Ownership Type & Gat / Survey Number Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label className="form-label">Ownership Type</label>
                <select
                  className="form-input"
                  value={farmData.ownershipType}
                  onChange={(e) => setFarmData({ ...farmData, ownershipType: e.target.value as any })}
                >
                  <option value="INDIVIDUAL">Individual Owner (स्वमालकी / एकल खातेदार)</option>
                  <option value="JOINT_FAMILY">Joint Family / Co-Owned (सामाईक खातेदार / बंधू हिस्सा - 7/12)</option>
                  <option value="LEASED">Leased / Tenant Farm (खंड / भाडेतत्वावर जमीन)</option>
                </select>
              </div>

              <div>
                <label className="form-label">Cadastral Gat / Survey Number (7/12)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Gat No. 124/A (गट क्र. १२४/अ)"
                  value={farmData.gatNumber}
                  onChange={(e) => setFarmData({ ...farmData, gatNumber: e.target.value })}
                />
              </div>
            </div>

            {/* Joint Family / Co-Owners Manager */}
            {(farmData.ownershipType === 'JOINT_FAMILY' || farmData.ownershipType === 'CO_OWNED') && (
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontSize: '0.94rem', fontWeight: 700, color: '#38bdf8' }}>
                    Co-Owners & 7/12 Land Share Division (GIS Satellite Sub-Plots)
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ fontSize: '0.8rem', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}
                      onClick={handleEqualSplit}
                      title="Divide total farm acreage equally among all co-owners"
                    >
                      <Divide size={14} color="#38bdf8" />
                      <span>Equal Split (समान वाटप)</span>
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ fontSize: '0.8rem', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}
                      onClick={addCoOwner}
                    >
                      <Plus size={14} color="#10b981" />
                      <span>+ Add Co-Owner</span>
                    </button>
                  </div>
                </div>

                {/* Co-Owner Share Visual Progress Meter */}
                <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.84rem' }}>
                    <span>Total Land: <strong>{totalAcres} Acres</strong></span>
                    <span>
                      Sharers Total: <strong style={{ color: isCoOwnerOverAllocated ? '#ef4444' : '#38bdf8' }}>{coOwnerTotalAcres.toFixed(2)} Ac</strong>
                      {remainingCoOwnerAcres > 0 && <span style={{ color: 'var(--text-muted)' }}> ({remainingCoOwnerAcres.toFixed(2)} Ac unassigned)</span>}
                    </span>
                  </div>

                  {/* Multi-color co-owner share bar */}
                  <div style={{ height: '8px', width: '100%', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
                    {coOwners.map((o, idx) => {
                      const acres = parseFloat(o.shareAcres) || 0;
                      const pct = totalAcres > 0 ? (acres / totalAcres) * 100 : 0;
                      const colors = ['#10b981', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
                      return (
                        <div
                          key={idx}
                          style={{
                            width: `${pct}%`,
                            height: '100%',
                            background: colors[idx % colors.length],
                            transition: 'width 0.3s ease'
                          }}
                          title={`${o.name}: ${acres} Ac (${pct.toFixed(1)}%)`}
                        />
                      );
                    })}
                  </div>

                  {isCoOwnerOverAllocated && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f87171', fontSize: '0.82rem', marginTop: '8px', fontWeight: 600 }}>
                      <AlertTriangle size={15} />
                      <span>Warning: Co-owners shares ({coOwnerTotalAcres.toFixed(2)} Ac) exceed total farm area ({totalAcres} Ac)!</span>
                    </div>
                  )}
                </div>

                {/* Co-Owner Rows */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {coOwners.map((owner, oIdx) => {
                    const colors = ['#10b981', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
                    const rowColor = colors[oIdx % colors.length];
                    const ownerPct = totalAcres > 0 ? (((parseFloat(owner.shareAcres) || 0) / totalAcres) * 100).toFixed(1) : '0';

                    return (
                      <div
                        key={owner.id || oIdx}
                        style={{
                          padding: '12px 14px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid var(--border-subtle)',
                          borderLeft: `4px solid ${rowColor}`,
                          display: 'grid',
                          gridTemplateColumns: 'minmax(140px, 1.4fr) minmax(110px, 1fr) minmax(90px, 0.9fr) minmax(100px, 1fr) minmax(120px, 1.2fr) minmax(130px, 1fr) 36px',
                          gap: '10px',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <label className="form-label-muted">Owner Name</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. Ramesh / Suresh Patel"
                            value={owner.name}
                            onChange={(e) => updateCoOwner(oIdx, 'name', e.target.value)}
                            required
                          />
                        </div>

                        <div>
                          <label className="form-label-muted">Relationship</label>
                          <select
                            className="form-input"
                            value={owner.relationship}
                            onChange={(e) => updateCoOwner(oIdx, 'relationship', e.target.value)}
                          >
                            <option value="Self">Self (स्वतः)</option>
                            <option value="Brother">Brother (बंधू)</option>
                            <option value="Father">Father (वडील)</option>
                            <option value="Mother">Mother (आई)</option>
                            <option value="Sister">Sister (बहीण)</option>
                            <option value="Co-Khatedar">Co-Khatedar (सामाईक खातेदार)</option>
                          </select>
                        </div>

                        <div>
                          <label className="form-label-muted">Share (Acres)</label>
                          <input
                            type="text"
                            inputMode="decimal"
                            className="form-input"
                            placeholder="e.g. 2.5"
                            value={owner.shareAcres}
                            onChange={(e) => updateCoOwner(oIdx, 'shareAcres', e.target.value)}
                            required
                          />
                          <span style={{ fontSize: '0.72rem', color: rowColor, fontWeight: 700, marginTop: '2px', display: 'block' }}>
                            {ownerPct}% Land
                          </span>
                        </div>

                        <div>
                          <label className="form-label-muted">7/12 Hissa No.</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. 124/1"
                            value={owner.surveyHissaNo}
                            onChange={(e) => updateCoOwner(oIdx, 'surveyHissaNo', e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="form-label-muted">Assigned Crop</label>
                          <select
                            className="form-input"
                            value={owner.assignedCrop}
                            onChange={(e) => updateCoOwner(oIdx, 'assignedCrop', e.target.value)}
                          >
                            {cropAllocations.map((ca, cIdx) => (
                              <option key={cIdx} value={ca.isCustom && ca.customCropName ? ca.customCropName : ca.cropName}>
                                {ca.isCustom && ca.customCropName ? ca.customCropName : ca.cropName} ({ca.allocatedAcres} Ac)
                              </option>
                            ))}
                          </select>
                        </div>

                        <div style={{ paddingTop: '16px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={owner.isManagingCultivator}
                              onChange={(e) => updateCoOwner(oIdx, 'isManagingCultivator', e.target.checked)}
                            />
                            <span>Cultivator</span>
                          </label>
                        </div>

                        <div style={{ paddingTop: '16px' }}>
                          {coOwners.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeCoOwner(oIdx)}
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
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Farm Location & Regional Geography */}
          <div style={{ padding: '24px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-heading)', margin: 0 }}>
                <MapPin size={20} color="#10b981" />
                <span>2. Farm Location & Regional Geography</span>
              </h3>
              <button
                type="button"
                onClick={handleAutoDetectGps}
                disabled={locatingGps}
                className="btn-secondary"
                style={{ fontSize: '0.82rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Navigation size={14} className={locatingGps ? 'animate-spin' : ''} />
                <span>{locatingGps ? 'Detecting GPS...' : 'Auto-Detect Current GPS'}</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '18px' }}>
              <div>
                <label className="form-label">
                  Village / Town <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={farmData.village}
                  onChange={(e) => setFarmData({ ...farmData, village: e.target.value })}
                  required
                  placeholder="e.g. Baramati"
                />
              </div>
              <div>
                <label className="form-label">
                  Taluka / Tehsil <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={farmData.taluka}
                  onChange={(e) => setFarmData({ ...farmData, taluka: e.target.value })}
                  required
                  placeholder="e.g. Baramati"
                />
              </div>
              <div>
                <label className="form-label">
                  District <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={farmData.district}
                  onChange={(e) => setFarmData({ ...farmData, district: e.target.value })}
                  required
                  placeholder="e.g. Pune"
                />
              </div>
              <div>
                <label className="form-label">
                  State <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={farmData.state}
                  onChange={(e) => setFarmData({ ...farmData, state: e.target.value })}
                  required
                  placeholder="e.g. Maharashtra"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label className="form-label-muted">GPS Latitude</label>
                <input
                  type="text"
                  inputMode="decimal"
                  className="form-input"
                  value={farmData.latitude}
                  onChange={(e) => setFarmData({ ...farmData, latitude: e.target.value })}
                  placeholder="Latitude (e.g. 18.4875)"
                />
              </div>
              <div>
                <label className="form-label-muted">GPS Longitude</label>
                <input
                  type="text"
                  inputMode="decimal"
                  className="form-input"
                  value={farmData.longitude}
                  onChange={(e) => setFarmData({ ...farmData, longitude: e.target.value })}
                  placeholder="Longitude (e.g. 74.1332)"
                />
              </div>
            </div>
          </div>

          {/* Section 2b: Interactive Farm Boundary Map */}
          <div style={{ padding: '24px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-card)', border: '1.5px solid rgba(16, 185, 129, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '10px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-heading)', margin: 0 }}>
                <Map size={20} color="#10b981" />
                <span>Draw Your Farm Boundary on the Map</span>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '2px 8px', borderRadius: '20px', background: 'rgba(16,185,129,0.15)', color: '#10b981', marginLeft: '4px' }}>Optional but Recommended</span>
              </h3>
              {boundaryPoints.length >= 3 && (
                <span style={{ fontSize: '0.82rem', color: '#34d399', fontWeight: 700 }}>
                  ✅ {boundaryPoints.length} boundary points saved
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.5 }}>
              Click on the map to mark the corners of your farm land. Drag the green dots to adjust. The GPS coordinates above will auto-update to the boundary centre.
              Use <strong>Street Map</strong> or switch to <strong>🛰️ Satellite View</strong> using the layer control (top-right of map) to see your actual field from above.
            </p>
            <FarmMapEditor
              center={{
                lat: parseFloat(farmData.latitude) || 20.5937,
                lng: parseFloat(farmData.longitude) || 78.9629
              }}
              height={460}
              coOwners={
                (farmData.ownershipType === 'JOINT_FAMILY' || farmData.ownershipType === 'CO_OWNED')
                  ? coOwners.map((o) => ({
                      name: o.name,
                      relationship: o.relationship,
                      shareAcres: parseFloat(o.shareAcres) || 0,
                      surveyHissaNo: o.surveyHissaNo,
                      isManagingCultivator: o.isManagingCultivator,
                      assignedCrop: o.assignedCrop
                    }))
                  : undefined
              }
              gatNumber={farmData.gatNumber}
              onChange={(pts, geo) => {
                setBoundaryPoints(pts);
                setBoundaryGeoJSON(geo);
                // Auto-update lat/lng to boundary centroid
                if (pts.length >= 1) {
                  const cLat = pts.reduce((s, p) => s + p.lat, 0) / pts.length;
                  const cLng = pts.reduce((s, p) => s + p.lng, 0) / pts.length;
                  setFarmData((prev) => ({
                    ...prev,
                    latitude: cLat.toFixed(5),
                    longitude: cLng.toFixed(5),
                  }));
                }
              }}
            />
          </div>

          {/* Section 3: Water Sources */}
          <div style={{ padding: '24px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-heading)', margin: 0 }}>
                <Sprout size={20} color="#10b981" />
                <span>3. Irrigation & Water Sources</span>
              </h3>
              <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 700 }}>
                {farmData.waterSources.length} selected
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '10px' }}>
              {WATER_SOURCE_OPTIONS.map((source) => {
                const isChecked = farmData.waterSources.includes(source.id);
                return (
                  <label
                    key={source.id}
                    onClick={() => toggleWaterSource(source.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background: isChecked ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-app)',
                      border: isChecked ? '1px solid #10b981' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      fontSize: '0.86rem',
                      fontWeight: isChecked ? 600 : 500,
                      color: isChecked ? '#10b981' : 'var(--text-main)',
                      transition: 'var(--transition-smooth)'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      style={{ accentColor: '#10b981', width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <span>{source.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Section 4: Soil Report Upload & Extraction */}
          <div style={{ padding: '24px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(2, 132, 199, 0.25)', background: 'rgba(2, 132, 199, 0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: '#0284c7' }}>
                <Upload size={20} />
                <span>4. Soil Health Card / Lab Test Report Upload</span>
              </h3>
              <button
                type="button"
                onClick={handleDemoReportExtraction}
                disabled={uploadingReport}
                className="btn-secondary"
                style={{ fontSize: '0.82rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', color: '#0284c7', borderColor: 'rgba(2, 132, 199, 0.4)' }}
              >
                {uploadingReport ? <RefreshCw size={14} className="animate-spin" /> : <FileCheck size={16} />}
                <span>Auto-Fill from Demo Govt Card</span>
              </button>
            </div>

            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: 1.4 }}>
              Upload your official Government Soil Health Card or laboratory test certificate (PDF, JPG, PNG, or TXT) to automatically parse metrics for AI models.
            </p>

            <div
              style={{
                border: '2px dashed rgba(2, 132, 199, 0.35)',
                borderRadius: 'var(--radius-sm)',
                padding: '20px',
                textAlign: 'center',
                background: 'var(--bg-card)',
                position: 'relative',
                cursor: 'pointer'
              }}
            >
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.txt"
                disabled={uploadingReport}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleReportFileUpload(e.target.files[0]);
                  }
                }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: 0,
                  cursor: 'pointer',
                  width: '100%'
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <Upload size={28} color="#0284c7" />
                <span style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                  {uploadingReport ? 'Parsing & Extracting Lab Data...' : 'Click or Drag & Drop Soil Test Report'}
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Supports PDF, PNG, JPG, or TXT documents
                </span>
              </div>
            </div>

            {extractedStatus && (
              <div style={{ marginTop: '14px', padding: '12px 16px', borderRadius: 'var(--radius-sm)', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.35)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.86rem', color: '#10b981', fontWeight: 600 }}>
                <CheckCircle2 size={18} />
                <span>{extractedStatus}</span>
              </div>
            )}
          </div>

          {/* Section 5: Soil Classification, Previous Yield, and Optional Nutrients */}
          <div style={{ padding: '24px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-heading)' }}>
              <FileText size={20} color="#10b981" />
              <span>5. Soil Type & Crop Yield History</span>
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label className="form-label">
                  Soil Classification / Type <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  className="form-input"
                  value={soilData.soilType}
                  onChange={(e) => setSoilData({ ...soilData, soilType: e.target.value })}
                >
                  {SOIL_TYPE_OPTIONS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">
                  Previous Crop Grown
                </label>
                <select
                  className="form-input"
                  value={soilData.previousCrop}
                  onChange={(e) => setSoilData({ ...soilData, previousCrop: e.target.value })}
                >
                  {PREVIOUS_CROPS.map((crop) => (
                    <option key={crop} value={crop}>
                      {crop}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">
                  Previous Harvest Yield (Quintals/Acre)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  className="form-input"
                  value={soilData.previousYieldQuintals}
                  onChange={(e) => setSoilData({ ...soilData, previousYieldQuintals: e.target.value })}
                  placeholder="e.g. 11.5"
                />
              </div>

              <div>
                <label className="form-label">
                  Previous Crop Season
                </label>
                <select
                  className="form-input"
                  value={soilData.previousSeason}
                  onChange={(e) => setSoilData({ ...soilData, previousSeason: e.target.value })}
                >
                  <option value="KHARIF">Kharif (Monsoon Season)</option>
                  <option value="RABI">Rabi (Winter Season)</option>
                  <option value="ZAID">Zaid (Summer Season)</option>
                </select>
              </div>
            </div>

            {/* Optional Nutrients */}
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
              <label className="form-label" style={{ marginBottom: '10px' }}>
                Soil Nutrients & Chemical Metrics <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>(Optional - will use regional benchmarks if left empty)</span>
              </label>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                <div>
                  <label className="form-label-muted">pH (Acidity)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    className="form-input"
                    value={soilData.ph}
                    onChange={(e) => setSoilData({ ...soilData, ph: e.target.value })}
                    placeholder="e.g. 7.2"
                  />
                </div>
                <div>
                  <label className="form-label-muted">Nitrogen (N) kg/ha</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="form-input"
                    value={soilData.nitrogen}
                    onChange={(e) => setSoilData({ ...soilData, nitrogen: e.target.value })}
                    placeholder="e.g. 210"
                  />
                </div>
                <div>
                  <label className="form-label-muted">Phosphorus (P) kg/ha</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="form-input"
                    value={soilData.phosphorus}
                    onChange={(e) => setSoilData({ ...soilData, phosphorus: e.target.value })}
                    placeholder="e.g. 28"
                  />
                </div>
                <div>
                  <label className="form-label-muted">Potassium (K) kg/ha</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="form-input"
                    value={soilData.potassium}
                    onChange={(e) => setSoilData({ ...soilData, potassium: e.target.value })}
                    placeholder="e.g. 320"
                  />
                </div>
                <div>
                  <label className="form-label-muted">Organic Carbon %</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    className="form-input"
                    value={soilData.organicCarbon}
                    onChange={(e) => setSoilData({ ...soilData, organicCarbon: e.target.value })}
                    placeholder="e.g. 0.65"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn-primary"
            style={{ padding: '15px', fontSize: '1.05rem', fontWeight: 700 }}
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
