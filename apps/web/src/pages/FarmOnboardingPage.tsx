import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Sprout, FileText, ArrowRight, Upload, CheckCircle2, RefreshCw, FileCheck, Navigation } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const WATER_SOURCE_OPTIONS = [
  { id: 'DRIP', label: 'Drip Irrigation (Micro-drip)' },
  { id: 'BOREWELL', label: 'Borewell / Tube Well' },
  { id: 'CANAL', label: 'Canal Flow Water' },
  { id: 'SPRINKLER', label: 'Sprinkler System' },
  { id: 'OPEN_WELL', label: 'Open Well / Dug Well' },
  { id: 'RIVER_LIFT', label: 'River / Lift Irrigation' },
  { id: 'FARM_POND', label: 'Farm Pond / Rainwater Harvesting' },
  { id: 'RAINFED', label: 'Rainfed (Direct Monsoon)' }
];

const SOIL_TYPE_OPTIONS = [
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
    village: 'Baramati',
    taluka: 'Baramati',
    district: 'Pune',
    state: 'Maharashtra',
    latitude: '18.4875',
    longitude: '74.1332',
    waterSources: ['DRIP', 'BOREWELL'],
    notes: 'Primary crop plot with micro-irrigation.'
  });

  const [soilData, setSoilData] = useState({
    soilType: 'BLACK_COTTON',
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

      // 1. Create Farm Plot
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

      // 2. Add Initial Soil Health Card - Nutrients are optional with defaults
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

          {/* Section 2: Farm Location & Regional Geography */}
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
