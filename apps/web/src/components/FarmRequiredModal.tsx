import React, { useState } from 'react';
import { Sprout, MapPin, FileText, ArrowRight, X, Upload, CheckCircle2, RefreshCw, FileCheck, Navigation } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface FarmRequiredModalProps {
  featureName: string;
  featureDescription: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  isOpen: boolean;
}

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

      const createdFarm = await api.createFarm({
        name: farmData.name.trim() || 'My Farm Plot',
        areaAcres: parseFloat(farmData.areaAcres) || 1.0,
        irrigationSource: irrigationJoined,
        waterSources: farmData.waterSources,
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
      await fetch(`http://localhost:4000/api/v1/farms/${createdFarm.id}/soil-records`, {
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

          {/* Section 2: Farm Location & Regional Geography */}
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
