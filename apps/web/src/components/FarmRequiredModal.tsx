import React, { useState } from 'react';
import {
  Sprout,
  MapPin,
  FileText,
  ArrowRight,
  X,
  Upload,
  CheckCircle2,
  RefreshCw,
  FileCheck,
  Navigation,
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
import { useLanguage } from '../context/LanguageContext';

interface FarmRequiredModalProps {
  featureName: string;
  featureDescription: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  isOpen: boolean;
}

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
  { id: 'CANAL', label: 'Canal (Nira Left Bank Canal Flow)', labelMr: 'कालवा (नीरा डावा कालवा पट्टा)' },
  { id: 'BOREWELL', label: 'Borewell / Tube Well', labelMr: 'बोअरवेल / कूपनलिका' },
  { id: 'OPEN_WELL', label: 'Open Well / Dug Well', labelMr: 'विहीर / बागायत' },
  { id: 'RIVER_LIFT', label: 'River / Lift Irrigation System', labelMr: 'नदी / उपसा सिंचन योजना' },
  { id: 'FARM_POND', label: 'Farm Pond / Rainwater Harvesting', labelMr: 'शेततळे / पावसाचे पाणी साठा' },
  { id: 'RAINFED', label: 'Rainfed (Direct Monsoon / Scarcity)', labelMr: 'कोरडवाहू / पावसावर अवलंबून' },
  { id: 'DRIP', label: 'Drip Irrigation (Micro-irrigation)', labelMr: 'ठिबक सिंचन (Micro-Drip)' },
  { id: 'SPRINKLER', label: 'Sprinkler System', labelMr: 'तुषार सिंचन (Sprinkler)' },
  { id: 'FLOOD', label: 'Flood / Furrow Irrigation', labelMr: 'पाटपाणी / प्रवाह सिंचन' }
];

const SOIL_TYPE_OPTIONS = [
  { id: 'DEEP_BLACK_VERTISOL', label: 'Deep Black Vertisol (Heavy Black / Canal Belt)', labelMr: 'भारी काळी कसदार रेगूर जमीन (कॅनॉल पट्टा)' },
  { id: 'MEDIUM_CLAY_LOAM', label: 'Medium Clay Loam (Well-Drained Loam / Shardanagar Belt)', labelMr: 'मध्यम काळी व पोयटा जमीन (बागायत पट्टा)' },
  { id: 'SHALLOW_MURRUM', label: 'Shallow Basaltic Murrum (Light / Supa Scarcity Belt)', labelMr: 'उथळ मुरमाड जमीन (सुपा दुष्काळी पट्टा)' },
  { id: 'BLACK_COTTON', label: 'Black Cotton Soil (Regur / Heavy Clay)', labelMr: 'काळी कसदार माती (रेगूर)' },
  { id: 'ALLUVIAL', label: 'Alluvial Loam (Fertile River Plains)', labelMr: 'गाळाची जमीन (सुपीक)' },
  { id: 'RED_SOIL', label: 'Red Sandy / Lateritic Soil', labelMr: 'तांबडी / जांभी माती' },
  { id: 'CLAY_LOAM', label: 'Clay Loam (Moderate Drainage)', labelMr: 'चिकण माती (मध्यम निचरा)' },
  { id: 'SANDY_LOAM', label: 'Sandy Loam (High Drainage)', labelMr: 'वालुकामय पोयटा माती' },
  { id: 'SILTY_CLAY', label: 'Silty Clay', labelMr: 'गाळाची चिकण माती' }
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

export const FarmRequiredModal: React.FC<FarmRequiredModalProps> = ({
  featureName,
  featureDescription,
  onSuccess,
  onCancel,
  isOpen
}) => {
  const { refreshAuth, markFarmCreated } = useAuth();
  const { language, t } = useLanguage();

  // Keep numerical/coordinate inputs as strings in state so users can freely edit, clear, and type decimals
  const [farmData, setFarmData] = useState({
    name: 'My Primary Farm Plot',
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
    notes: 'Registered in Baramati agro-climatic zone (Canal Command / KVK Baramati).'
  });

  const [soilData, setSoilData] = useState({
    soilType: 'DEEP_BLACK_VERTISOL',
    ph: '7.2',
    nitrogen: '210',
    phosphorus: '28',
    potassium: '320',
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

  // 7/12 Farm Ownership & Co-Owners (e.g. Ramesh + brothers)
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

  // Co-Owner calculations
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

  if (!isOpen) return null;

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

  async function handleRegister(e: React.FormEvent) {
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
        notes: farmData.notes
      });

      // Soil nutrients are optional - fallback to regional agronomic defaults if cleared/empty
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
        background: 'rgba(10, 15, 10, 0.82)',
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
          maxWidth: '820px',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '32px',
          border: '1px solid var(--border-active)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
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
              background: 'var(--border-subtle)',
              border: 'none',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-main)'
            }}
          >
            <X size={18} />
          </button>
        )}

        {/* Feature Context Banner */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MapPin size={26} color="#10b981" />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#10b981', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.06em' }}>
              {t('farmSetupTitle', 'Farm Plot & Soil Profile Setup')}
            </span>
            <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-heading)', margin: '2px 0 0' }}>
              Unlock {featureName}
            </h3>
          </div>
        </div>

        <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '20px', lineHeight: 1.5 }}>
          {featureDescription} Configure your farm location, water sources, soil classification, and previous yield history.
        </p>

        {error && (
          <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-sm)', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.35)', color: '#f87171', fontSize: '0.88rem', fontWeight: 600, marginBottom: '18px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          
          {/* Section 1: Farm Identification */}
          <div style={{ padding: '20px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-heading)' }}>
              <Sprout size={19} color="#10b981" />
              <span>{language === 'mr' ? '१. शेत जमीन ओळख' : '1. Farm Plot Identification'}</span>
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div>
                <label className="form-label">
                  {t('farmNameLabel', 'Farm Name / Title')} <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={farmData.name}
                  onChange={(e) => setFarmData({ ...farmData, name: e.target.value })}
                  required
                  placeholder="e.g. Shivaji Agri Fields"
                />
              </div>
              <div>
                <label className="form-label">
                  {t('areaAcresLabel', 'Total Land Area (Acres)')} <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  className="form-input"
                  value={farmData.areaAcres}
                  onChange={(e) => setFarmData({ ...farmData, areaAcres: e.target.value })}
                  required
                  placeholder="e.g. 4.0"
                />
              </div>
            </div>
          </div>

          {/* Section 1B: Planned Land Usage & Crop Allocation */}
          <div style={{ padding: '20px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-heading)' }}>
                  <PieChart size={19} color="#10b981" />
                  <span>{language === 'mr' ? '२. जमीन वापर व पीk वाटप (Planned Land Usage)' : '2. Planned Land Usage & Crop Allocation'}</span>
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {language === 'mr'
                    ? 'एकूण जमिनीपैकी कोणत्या पिकासाठी किती एकर जमीन वापरायची आहे ते नोंदवा.'
                    : 'Specify how many acres out of your total land will be used for each crop.'}
                </p>
              </div>
              <button
                type="button"
                className="btn-secondary"
                style={{ fontSize: '0.82rem', padding: '6px 14px' }}
                onClick={addCropAllocation}
              >
                <Plus size={14} color="#10b981" />
                <span>{language === 'mr' ? '+ पीक जोडा' : '+ Add Crop Parcel'}</span>
              </button>
            </div>

            {/* Real-time Visual Allocation Progress Meter */}
            <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.84rem' }}>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {cropAllocations.map((c, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(140px, 1.4fr) minmax(100px, 1fr) minmax(110px, 1fr) minmax(110px, 1.2fr) 36px',
                    gap: '10px',
                    alignItems: 'center',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div>
                    <label className="form-label-muted">{language === 'mr' ? 'पीक (Crop)' : 'Crop Name'}</label>
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
                        placeholder={language === 'mr' ? 'पिकाचे नाव टाईप करा (उदा. हळद, आंबा)' : 'Type custom crop name (e.g. Turmeric, Dragonfruit)'}
                        value={c.customCropName || ''}
                        onChange={(e) => updateCropAllocation(idx, 'customCropName', e.target.value)}
                        required
                      />
                    )}
                  </div>

                  <div>
                    <label className="form-label-muted">{language === 'mr' ? 'वापर (Acres)' : 'Allocated Land (Ac)'}</label>
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
                    <label className="form-label-muted">{language === 'mr' ? 'हंगाम (Season)' : 'Season'}</label>
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
                    <label className="form-label-muted">{language === 'mr' ? 'वाण (Variety)' : 'Variety / Hybrid (Opt)'}</label>
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
          <div style={{ padding: '20px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-heading)' }}>
                  <Users size={19} color="#10b981" />
                  <span>{language === 'mr' ? '३. जमीन मालकी व ७/१२ सामाईक खातेदार (Ownership & Co-Sharers)' : '3. Land Ownership & 7/12 Co-Sharers (Hissa Partitioning)'}</span>
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {language === 'mr'
                    ? 'शेत स्वतःच्या मालकीचे आहे की भावांमध्ये सामाईक हिस्सा (Joint Family / 7/12 Hissa) आहे ते निवडा.'
                    : 'Specify individual ownership or joint family co-sharers (e.g. Ramesh & brothers) for GIS sub-plot partitioning.'}
                </p>
              </div>
            </div>

            {/* Ownership Type & Gat / Survey Number Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label className="form-label">{language === 'mr' ? 'मालकी प्रकार (Ownership Type)' : 'Ownership Type'}</label>
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
                <label className="form-label">{language === 'mr' ? 'गट / सर्व्हे नंबर (Gat / Survey No)' : 'Cadastral Gat / Survey Number (7/12)'}</label>
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
              <div style={{ marginTop: '14px', paddingTop: '16px', borderTop: '1px dashed var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#38bdf8' }}>
                    {language === 'mr' ? 'खातेदारांची नावे व जमीन हिस्सा वाटप' : 'Co-Owners & Land Share Allocation (GIS Sub-Plots)'}
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ fontSize: '0.78rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={handleEqualSplit}
                      title="Divide total farm acreage equally among all co-owners"
                    >
                      <Divide size={13} color="#38bdf8" />
                      <span>{language === 'mr' ? 'समान वाटप (Equal Split)' : 'Equal Split'}</span>
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ fontSize: '0.78rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={addCoOwner}
                    >
                      <Plus size={13} color="#10b981" />
                      <span>{language === 'mr' ? '+ खातेदार जोडा' : '+ Add Co-Owner'}</span>
                    </button>
                  </div>
                </div>

                {/* Co-Owner Share Visual Progress Meter */}
                <div style={{ marginBottom: '14px', padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.82rem' }}>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f87171', fontSize: '0.8rem', marginTop: '6px', fontWeight: 600 }}>
                      <AlertTriangle size={14} />
                      <span>Co-owners shares ({coOwnerTotalAcres.toFixed(2)} Ac) exceed farm area ({totalAcres} Ac)!</span>
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
                          padding: '12px',
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
                          <label className="form-label-muted">{language === 'mr' ? 'खातेदाराचे नाव' : 'Owner Name'}</label>
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
                          <label className="form-label-muted">{language === 'mr' ? 'नाते (Relation)' : 'Relationship'}</label>
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
                          <label className="form-label-muted">{language === 'mr' ? 'हिस्सा (Acres)' : 'Share (Acres)'}</label>
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
                          <label className="form-label-muted">{language === 'mr' ? '७/१२ हिस्सा क्र.' : '7/12 Hissa No.'}</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. 124/1"
                            value={owner.surveyHissaNo}
                            onChange={(e) => updateCoOwner(oIdx, 'surveyHissaNo', e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="form-label-muted">{language === 'mr' ? 'पिक वाटप (Crop)' : 'Assigned Crop'}</label>
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
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={owner.isManagingCultivator}
                              onChange={(e) => updateCoOwner(oIdx, 'isManagingCultivator', e.target.checked)}
                            />
                            <span>{language === 'mr' ? 'प्रमुख शेतकरी' : 'Cultivator'}</span>
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
          <div style={{ padding: '20px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-heading)' }}>
                <MapPin size={19} color="#10b981" />
                <span>{t('locationSection', '2. Farm Location & Geography')}</span>
              </h4>
              <button
                type="button"
                onClick={handleAutoDetectGps}
                disabled={locatingGps}
                className="btn-secondary"
                style={{ fontSize: '0.8rem', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Navigation size={14} className={locatingGps ? 'animate-spin' : ''} />
                <span>{locatingGps ? '...' : t('autoDetectGps', 'Auto-Detect Current GPS')}</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '14px', marginBottom: '16px' }}>
              <div>
                <label className="form-label">
                  {t('villageLabel', 'Village / Town')} <span style={{ color: '#ef4444' }}>*</span>
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
                  {t('talukaLabel', 'Taluka / Tehsil')} <span style={{ color: '#ef4444' }}>*</span>
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
                  {t('districtLabel', 'District')} <span style={{ color: '#ef4444' }}>*</span>
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
                  {t('stateLabel', 'State')} <span style={{ color: '#ef4444' }}>*</span>
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

            {/* GPS Coordinates */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label className="form-label-muted">{t('gpsLatLabel', 'GPS Latitude')}</label>
                <input
                  type="text"
                  inputMode="decimal"
                  className="form-input"
                  value={farmData.latitude}
                  onChange={(e) => setFarmData({ ...farmData, latitude: e.target.value })}
                  placeholder="e.g. 18.4875"
                />
              </div>
              <div>
                <label className="form-label-muted">{t('gpsLngLabel', 'GPS Longitude')}</label>
                <input
                  type="text"
                  inputMode="decimal"
                  className="form-input"
                  value={farmData.longitude}
                  onChange={(e) => setFarmData({ ...farmData, longitude: e.target.value })}
                  placeholder="e.g. 74.1332"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Water Sources Multi-select */}
          <div style={{ padding: '20px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-heading)', margin: 0 }}>
                <Sprout size={19} color="#10b981" />
                <span>{t('irrigationSection', '3. Irrigation & Water Sources')}</span>
              </h4>
              <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 700 }}>
                {farmData.waterSources.length} {language === 'mr' ? 'निवडले' : 'selected'}
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
                    <span>{language === 'mr' && source.labelMr ? source.labelMr : source.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Section 4: Soil Test Report Upload & OCR Extraction */}
          <div style={{ padding: '20px', borderRadius: 'var(--radius-sm)', background: 'rgba(2, 132, 199, 0.05)', border: '1px solid rgba(2, 132, 199, 0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: '#0284c7' }}>
                <Upload size={19} />
                <span>{t('soilReportSection', '4. Soil Health Card / Test Report Upload')}</span>
              </h4>
              <button
                type="button"
                onClick={handleDemoReportExtraction}
                disabled={uploadingReport}
                className="btn-secondary"
                style={{ fontSize: '0.82rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', color: '#0284c7', borderColor: 'rgba(2, 132, 199, 0.4)' }}
              >
                {uploadingReport ? <RefreshCw size={14} className="animate-spin" /> : <FileCheck size={15} />}
                <span>{t('autoFillDemoReport', 'Auto-Fill from Demo Govt Card')}</span>
              </button>
            </div>

            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: 1.4 }}>
              {language === 'mr'
                ? 'अधिकृत मृदा आरोग्य पत्रिका किंवा चाचणी अहवाल (PDF/PNG/JPG/TXT) अपलोड करून स्वयंचलित माहिती भरा.'
                : 'Upload your official Soil Health Card (PDF, PNG, JPG, or TXT) to automatically extract lab test metrics for future predictions.'}
            </p>

            <div
              style={{
                border: '2px dashed rgba(2, 132, 199, 0.35)',
                borderRadius: 'var(--radius-sm)',
                padding: '18px',
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
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <Upload size={26} color="#0284c7" />
                <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                  {uploadingReport ? (language === 'mr' ? 'माहिती काढली जात आहे...' : 'Extracting Lab Metrics...') : (language === 'mr' ? 'माती चाचणी अहवाल येथे अपलोड करा' : 'Click or Drag & Drop Soil Test Report Here')}
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  PDF, PNG, JPG, किंवा TXT फाईल स्वीकारली जाते
                </span>
              </div>
            </div>

            {extractedStatus && (
              <div style={{ marginTop: '14px', padding: '12px 16px', borderRadius: 'var(--radius-sm)', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.35)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem', color: '#10b981', fontWeight: 600 }}>
                <CheckCircle2 size={18} />
                <span>{extractedStatus}</span>
              </div>
            )}
          </div>

          {/* Section 5: Soil Type & Crop Yield History */}
          <div style={{ padding: '20px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-heading)' }}>
              <FileText size={19} color="#10b981" />
              <span>{t('soilTypeSection', '5. Soil Type & Previous Yield History')}</span>
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label className="form-label">
                  {t('soilTypeLabel', 'Soil Classification / Type')} <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  className="form-input"
                  value={soilData.soilType}
                  onChange={(e) => setSoilData({ ...soilData, soilType: e.target.value })}
                >
                  {SOIL_TYPE_OPTIONS.map((tOpt) => (
                    <option key={tOpt.id} value={tOpt.id}>
                      {language === 'mr' && tOpt.labelMr ? tOpt.labelMr : tOpt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">
                  {t('previousCropLabel', 'Previous Crop Grown')}
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
                  {t('previousYieldLabel', 'Previous Harvest Yield (Quintals/Acre)')}
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
                  {t('previousSeasonLabel', 'Previous Season')}
                </label>
                <select
                  className="form-input"
                  value={soilData.previousSeason}
                  onChange={(e) => setSoilData({ ...soilData, previousSeason: e.target.value })}
                >
                  <option value="KHARIF">{language === 'mr' ? 'खरीप (पावसाळी हंगाम)' : 'Kharif (Monsoon Season)'}</option>
                  <option value="RABI">{language === 'mr' ? 'रब्बी (हिवाळी हंगाम)' : 'Rabi (Winter Season)'}</option>
                  <option value="ZAID">{language === 'mr' ? 'उन्हाळी हंगाम' : 'Zaid (Summer Season)'}</option>
                </select>
              </div>
            </div>

            {/* Optional Chemical Metrics */}
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
              <label className="form-label" style={{ marginBottom: '10px' }}>
                {t('soilNutrientsOptional', 'Soil Nutrients & Chemical Metrics (Optional)')}
              </label>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
                <div>
                  <label className="form-label-muted">pH ({language === 'mr' ? 'सामू' : 'Acidity'})</label>
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
                  <label className="form-label-muted">{language === 'mr' ? 'नत्र (N) किलो/हे.' : 'Nitrogen (N) kg/ha'}</label>
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
                  <label className="form-label-muted">{language === 'mr' ? 'स्फुरद (P) किलो/हे.' : 'Phosphorus (P) kg/ha'}</label>
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
                  <label className="form-label-muted">{language === 'mr' ? 'पालाश (K) किलो/हे.' : 'Potassium (K) kg/ha'}</label>
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
                  <label className="form-label-muted">{language === 'mr' ? 'सेंद्रिय कर्ब %' : 'Organic Carbon %'}</label>
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '6px' }}>
            {onCancel && (
              <button type="button" className="btn-secondary" onClick={onCancel} style={{ padding: '12px 20px', fontSize: '0.92rem' }}>
                {t('cancelButton', 'Cancel')}
              </button>
            )}
            <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '12px 24px', fontSize: '0.95rem' }}>
              <span>{loading ? (language === 'mr' ? 'जतन करत आहे...' : 'Saving Farm Profile...') : (language === 'mr' ? 'माहिती जतन करा व पुढे जा' : `Save & Continue to ${featureName}`)}</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
