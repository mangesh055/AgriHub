import React, { useState, useRef, useEffect } from 'react';
import {
  ScanLine,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Pill,
  Sparkles,
  RefreshCw,
  Image as ImageIcon,
  History,
  Activity,
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';
import { api } from '../api/client';
import { DEMO_SAMPLES, DemoSample } from './demoSamples';

interface DifferentialCandidate {
  class_name: string;
  raw_class: string;
  probability_pct: number;
}

interface DiagnosisResult {
  id: string;
  cropCycleId?: string;
  farmId: string;
  imageUrl: string;
  cropDetected: string;
  diseaseName: string;
  isHealthy: boolean;
  confidencePct: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'CONFIRMED' | 'UNCERTAIN' | 'LOW_QUALITY_IMAGE';
  clinicalSymptoms: string[];
  organicTreatments: string[];
  chemicalControls: string[];
  preventionTips: string[];
  disclaimer: string;
  topCandidates?: DifferentialCandidate[];
  modelSource?: string;
  createdAt: string;
}

const SUPPORTED_CROPS = [
  { value: 'auto', label: '✨ Auto-Detect Crop (ConvNeXt Vision)' },
  { value: 'Soybean', label: 'Soybean (Glycine max)' },
  { value: 'Tomato', label: 'Tomato (Solanum lycopersicum)' },
  { value: 'Rice', label: 'Rice / Paddy (Oryza sativa)' },
  { value: 'Maize', label: 'Maize / Corn (Zea mays)' },
  { value: 'Potato', label: 'Potato (Solanum tuberosum)' },
  { value: 'Sugarcane', label: 'Sugarcane (Saccharum officinarum)' },
  { value: 'Grape', label: 'Grape (Vitis vinifera)' },
  { value: 'Mango', label: 'Mango (Mangifera indica)' },
  { value: 'Cotton', label: 'Bt Cotton (Gossypium)' },
  { value: 'okra', label: 'Okra / Bhindi (Abelmoschus esculentus)' },
  { value: 'Brinjal', label: 'Brinjal / Eggplant (Solanum melongena)' },
  { value: 'pomrgranet', label: 'Pomegranate / Dalimb (Punica granatum)' },
  { value: 'Cucumber', label: 'Cucumber (Cucumis sativus)' },
  { value: 'Bitter_gourd', label: 'Bitter Gourd / Karela (Momordica charantia)' },
  { value: 'Bottle_gourd', label: 'Bottle Gourd / Lauki (Lagenaria siceraria)' },
  { value: 'Apple', label: 'Apple (Malus domestica)' },
  { value: 'Banana', label: 'Banana (Musa acuminata)' },
  { value: 'Citrus', label: 'Citrus / Sweet Lime (Citrus sinensis)' },
  { value: 'Papaya', label: 'Papaya (Carica papaya)' },
  { value: 'Strawberry', label: 'Strawberry (Fragaria × ananassa)' },
  { value: 'Watermelon', label: 'Watermelon (Citrullus lanatus)' },
];

export const CropHealthPage: React.FC = () => {
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState('Soybean');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string>('sample_leaf.jpg');
  const [dragActive, setDragActive] = useState(false);
  const [history, setHistory] = useState<DiagnosisResult[]>([]);
  const [activeSampleId, setActiveSampleId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const demoCycleId = '55555555-5555-5555-5555-555555555555';
  const demoFarmId = '33333333-3333-3333-3333-333333333333';

  // Load history on mount
  useEffect(() => {
    loadDiagnosesHistory();
  }, []);

  async function loadDiagnosesHistory() {
    try {
      const records = await api.getDiagnoses(demoCycleId);
      if (Array.isArray(records)) {
        setHistory(records);
      }
    } catch (err) {
      console.warn('Could not load diagnoses history:', err);
    }
  }

  function handleFileSelect(file: File) {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (JPEG, PNG, WebP).');
      return;
    }
    setImageFileName(file.name);
    setActiveSampleId(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImagePreview(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }

  function handleSelectDemo(sample: DemoSample) {
    setActiveSampleId(sample.id);
    setImagePreview(sample.dataUrl);
    setImageFileName(`${sample.id}.svg`);
    if (sample.crop !== 'auto') {
      setSelectedCrop(sample.crop);
    }
  }

  async function handleDiagnose() {
    try {
      setAnalyzing(true);

      // If no image uploaded yet, default to first demo sample (Soybean Rust)
      const base64ToSend = imagePreview || DEMO_SAMPLES[0].dataUrl;
      const fileNameToSend = imageFileName || 'soybean_rust_specimen.jpg';

      if (!imagePreview) {
        setImagePreview(DEMO_SAMPLES[0].dataUrl);
        setImageFileName('soybean_rust_specimen.jpg');
      }

      const result = await api.diagnoseDisease(demoCycleId, {
        farmId: demoFarmId,
        imageFileName: fileNameToSend,
        imageBase64: base64ToSend,
        crop: selectedCrop
      });

      setDiagnosis(result);
      loadDiagnosesHistory();
    } catch (err) {
      console.error('Error running disease detection:', err);
      alert('Diagnostic inference failed. Ensure ML service or Python environment is running.');
    } finally {
      setAnalyzing(false);
    }
  }

  function getSeverityColor(sev: string) {
    switch (sev) {
      case 'CRITICAL':
      case 'HIGH':
        return '#ef4444';
      case 'MEDIUM':
        return '#f59e0b';
      case 'LOW':
      case 'HEALTHY':
      default:
        return '#10b981';
    }
  }

  function getStatusBadge(status: string, isHealthy: boolean) {
    if (isHealthy) {
      return (
        <span style={{ fontSize: '0.78rem', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '4px 10px', borderRadius: '12px', fontWeight: 700, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
          ✓ HEALTHY SPECIMEN
        </span>
      );
    }
    if (status === 'CONFIRMED') {
      return (
        <span style={{ fontSize: '0.78rem', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '4px 10px', borderRadius: '12px', fontWeight: 700, border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          ● CONFIRMED DIAGNOSIS
        </span>
      );
    }
    if (status === 'UNCERTAIN') {
      return (
        <span style={{ fontSize: '0.78rem', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', padding: '4px 10px', borderRadius: '12px', fontWeight: 700, border: '1px solid rgba(245, 158, 11, 0.3)' }}>
          ⚠ UNCERTAIN • VERIFY WITH KVK
        </span>
      );
    }
    return (
      <span style={{ fontSize: '0.78rem', background: 'rgba(234, 179, 8, 0.15)', color: '#facc15', padding: '4px 10px', borderRadius: '12px', fontWeight: 700, border: '1px solid rgba(234, 179, 8, 0.3)' }}>
        ◐ LOW QUALITY SPECIMEN
      </span>
    );
  }

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '28px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Computer Vision Crop Health & Disease Diagnostics</h2>
            <span style={{ fontSize: '0.75rem', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', padding: '3px 8px', borderRadius: '6px', fontWeight: 600, border: '1px solid rgba(59, 130, 246, 0.3)' }}>
              ConvNeXt 42-Crops Vision AI
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Hugging Face deep neural leaf analysis with multi-crop classification, certainty calibration, and CIBRC-compliant integrated disease management.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <a
            href="https://huggingface.co/ixrbhii/multicrop-disease-models"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '0.82rem',
              color: 'var(--text-muted)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              textDecoration: 'none',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              background: 'rgba(255, 255, 255, 0.03)'
            }}
          >
            <span>🤗 HuggingFace Models</span>
            <ChevronRight size={14} />
          </a>
        </div>
      </div>

      {/* Main Grid: Upload & Inspection Card vs Diagnostic Prescriptions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(330px, 460px) 1fr', gap: '28px', alignItems: 'start' }}>

        {/* LEFT COLUMN: Upload, Crop Picker & Quick Samples */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ImageIcon size={20} color="#10b981" />
              <span>Capture or Upload Leaf Specimen</span>
            </h3>

            {/* Crop Selector */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                Target Crop Species
              </label>
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="form-input"
                style={{ width: '100%', cursor: 'pointer' }}
              >
                {SUPPORTED_CROPS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
            />

            {/* Drop Zone Area with Live Preview */}
            <div
              style={{
                border: dragActive
                  ? '2px dashed #10b981'
                  : '2px dashed rgba(16, 185, 129, 0.4)',
                borderRadius: 'var(--radius-md)',
                padding: imagePreview ? '12px' : '32px 18px',
                textAlign: 'center',
                background: dragActive
                  ? 'rgba(16, 185, 129, 0.1)'
                  : 'rgba(16, 185, 129, 0.03)',
                cursor: 'pointer',
                marginBottom: '16px',
                transition: 'var(--transition-smooth)',
                position: 'relative'
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <div style={{ position: 'relative' }}>
                  <img
                    src={imagePreview}
                    alt="Leaf specimen preview"
                    style={{
                      width: '100%',
                      maxHeight: '260px',
                      objectFit: 'contain',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(0, 0, 0, 0.4)',
                      display: 'block'
                    }}
                  />
                  <div
                    style={{
                      marginTop: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.8rem',
                      color: 'var(--text-muted)'
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>
                      📄 {imageFileName}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-main)',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.75rem'
                      }}
                    >
                      Change Photo
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div
                    style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '50%',
                      background: 'rgba(16, 185, 129, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px'
                    }}
                  >
                    <UploadCloud size={28} color="#10b981" />
                  </div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '4px' }}>
                    Click or Drag Leaf Photo Here
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Supports JPEG, PNG up to 10MB • Auto-calibrates lighting & shadows
                  </p>
                </>
              )}
            </div>

            {/* Quick Demo Samples Picker */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Or Choose a Instant Demo Specimen:
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {DEMO_SAMPLES.map((sample) => {
                  const isSelected = activeSampleId === sample.id;
                  return (
                    <button
                      key={sample.id}
                      type="button"
                      onClick={() => handleSelectDemo(sample)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        textAlign: 'left',
                        cursor: 'pointer',
                        border: isSelected
                          ? '1px solid #10b981'
                          : '1px solid var(--border-subtle)',
                        background: isSelected
                          ? 'rgba(16, 185, 129, 0.15)'
                          : 'rgba(255, 255, 255, 0.02)',
                        color: isSelected ? '#34d399' : 'var(--text-main)',
                        transition: 'var(--transition-smooth)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isSelected ? '#10b981' : 'var(--text-muted)' }} />
                        <span>{sample.name}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Run Button */}
            <button
              className="btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: '1rem', fontWeight: 700 }}
              onClick={handleDiagnose}
              disabled={analyzing}
            >
              {analyzing ? (
                <>
                  <RefreshCw size={18} className="spin-slow" />
                  <span>Analyzing ConvNeXt Leaf Lamina...</span>
                </>
              ) : (
                <>
                  <ScanLine size={18} />
                  <span>Run Vision Diagnostic</span>
                </>
              )}
            </button>
          </div>

          {/* Diagnostic Guidelines Card */}
          <div className="glass-panel" style={{ padding: '20px', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            <h4 style={{ color: 'var(--text-heading)', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Info size={16} color="#3b82f6" />
              <span>Field Photography Instructions:</span>
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li>• Fill at least 70% of the frame with a single affected leaf lamina.</li>
              <li>• Focus cleanly on lesions, discoloration margins, or pustules.</li>
              <li>• Avoid intense flash glare, excessive blur, and dark background shadows.</li>
              <li>• Inspect both upper and lower surface of the leaf blade for fungal sporulation.</li>
            </ul>
          </div>
        </div>

        {/* RIGHT COLUMN: Diagnostic Results & Prescriptions */}
        <div>
          {diagnosis ? (
            <div
              className="glass-panel"
              style={{
                padding: '28px',
                border: `1px solid ${diagnosis.isHealthy ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`
              }}
            >
              {/* Result Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
                <div style={{ flex: 1, minWidth: '260px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    {getStatusBadge(diagnosis.status, diagnosis.isHealthy)}
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Host: <strong style={{ color: 'var(--text-heading)' }}>{diagnosis.cropDetected}</strong>
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-heading)', lineHeight: 1.2 }}>
                    {diagnosis.diseaseName}
                  </h3>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {diagnosis.modelSource || 'HuggingFace: ixrbhii/multicrop-disease-models (ConvNeXt-Small)'}
                  </div>
                </div>

                {/* Confidence & Severity Box */}
                <div style={{ textAlign: 'right', minWidth: '140px' }}>
                  <div style={{ fontSize: '2.4rem', fontWeight: 800, color: getSeverityColor(diagnosis.severity), lineHeight: 1 }}>
                    {diagnosis.confidencePct}%
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Certainty Calibration
                  </div>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontWeight: 800,
                      fontSize: '0.78rem',
                      letterSpacing: '0.5px',
                      background: getSeverityColor(diagnosis.severity) + '22',
                      color: getSeverityColor(diagnosis.severity),
                      border: `1px solid ${getSeverityColor(diagnosis.severity)}44`
                    }}
                  >
                    {diagnosis.isHealthy ? 'HEALTHY LEAF' : `${diagnosis.severity} SEVERITY`}
                  </span>
                </div>
              </div>

              {/* Confidence Meter Bar */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ height: '8px', width: '100%', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${diagnosis.confidencePct}%`,
                      background: `linear-gradient(90deg, #10b981 0%, ${getSeverityColor(diagnosis.severity)} 100%)`,
                      borderRadius: '4px',
                      transition: 'width 0.8s ease'
                    }}
                  />
                </div>
              </div>

              {/* Differential Diagnostic Candidates (Neural Softmax breakdown) */}
              {diagnosis.topCandidates && diagnosis.topCandidates.length > 0 && (
                <div style={{ marginBottom: '24px', padding: '16px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)' }}>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Layers size={16} color="#3b82f6" />
                    <span>Neural Probability Distribution (Differential Diagnosis)</span>
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {diagnosis.topCandidates.map((cand, idx) => (
                      <div key={idx} style={{ fontSize: '0.82rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                          <span style={{ color: idx === 0 ? 'var(--text-heading)' : 'var(--text-muted)', fontWeight: idx === 0 ? 700 : 500 }}>
                            {idx === 0 ? '● ' : '○ '} {cand.class_name}
                          </span>
                          <span style={{ fontWeight: 700, color: idx === 0 ? '#10b981' : 'var(--text-muted)' }}>
                            {cand.probability_pct}%
                          </span>
                        </div>
                        <div style={{ height: '5px', width: '100%', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${cand.probability_pct}%`,
                              background: idx === 0 ? '#10b981' : 'rgba(255, 255, 255, 0.3)',
                              borderRadius: '3px'
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Observed Clinical Symptoms */}
              <div style={{ marginBottom: '22px' }}>
                <h4 style={{ fontSize: '0.96rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={16} color="#fbbf24" />
                  <span>Observed Clinical Symptoms</span>
                </h4>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {diagnosis.clinicalSymptoms.map((s: string, idx: number) => (
                    <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.86rem', color: 'var(--text-main)' }}>
                      <AlertTriangle size={15} color="#fbbf24" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Organic Remedial Measures */}
              <div style={{ marginBottom: '22px', padding: '16px', borderRadius: 'var(--radius-sm)', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                <h4 style={{ fontSize: '0.96rem', fontWeight: 700, marginBottom: '8px', color: '#34d399', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={16} />
                  <span>Organic Bio-Control Recommendations</span>
                </h4>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {diagnosis.organicTreatments.map((t: string, idx: number) => (
                    <li key={idx} style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                      • {t}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Chemical Fungicide Controls (CIBRC Approved) */}
              <div style={{ marginBottom: '22px', padding: '16px', borderRadius: 'var(--radius-sm)', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                <h4 style={{ fontSize: '0.96rem', fontWeight: 700, marginBottom: '8px', color: '#f87171', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Pill size={16} />
                  <span>Chemical Fungicide Protocol (CIBRC Certified)</span>
                </h4>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {diagnosis.chemicalControls.map((c: string, idx: number) => (
                    <li key={idx} style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                      • {c}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Preventative Cultural Practices */}
              {diagnosis.preventionTips && diagnosis.preventionTips.length > 0 && (
                <div style={{ marginBottom: '22px', padding: '16px', borderRadius: 'var(--radius-sm)', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
                  <h4 style={{ fontSize: '0.96rem', fontWeight: 700, marginBottom: '8px', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={16} />
                    <span>Preventative Agronomic Cultural Practices</span>
                  </h4>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {diagnosis.preventionTips.map((tip: string, idx: number) => (
                      <li key={idx} style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                        • {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Official Disclaimer */}
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                {diagnosis.disclaimer}
              </p>
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '70px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <ScanLine size={52} color="#10b981" style={{ margin: '0 auto 16px', opacity: 0.6 }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '8px' }}>
                No Active Leaf Specimen Analyzed Yet
              </h3>
              <p style={{ fontSize: '0.92rem', maxWidth: '480px', margin: '0 auto 20px', lineHeight: 1.5 }}>
                Upload an affected leaf photo on the left or click one of the pre-loaded demo specimens to trigger the Hugging Face ConvNeXt deep learning diagnostic engine.
              </p>
              <button
                className="btn-primary"
                style={{ padding: '10px 20px', margin: '0 auto' }}
                onClick={() => handleSelectDemo(DEMO_SAMPLES[0])}
              >
                Load Soybean Rust Specimen
              </button>
            </div>
          )}
        </div>

      </div>

      {/* BOTTOM SECTION: Monitoring History & Past Scans */}
      {history.length > 0 && (
        <div style={{ marginTop: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <History size={20} color="#10b981" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Recent Diagnostic Scans & Crop Health Log</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {history.slice(0, 4).map((item, idx) => (
              <div
                key={idx}
                className="glass-panel"
                style={{
                  padding: '16px',
                  cursor: 'pointer',
                  border: '1px solid var(--border-subtle)',
                  transition: 'var(--transition-smooth)'
                }}
                onClick={() => setDiagnosis(item)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.diseaseName}
                      style={{
                        width: '46px',
                        height: '46px',
                        objectFit: 'cover',
                        borderRadius: '6px',
                        border: '1px solid var(--border-subtle)',
                        background: 'rgba(0,0,0,0.3)'
                      }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {item.cropDetected}
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-heading)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.diseaseName}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  <span style={{ fontWeight: 700, color: getSeverityColor(item.severity) }}>
                    {item.confidencePct}% Certainty
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
