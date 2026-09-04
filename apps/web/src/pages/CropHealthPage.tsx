import React, { useState } from 'react';
import { ScanLine, UploadCloud, CheckCircle2, AlertTriangle, ShieldCheck, ArrowRight, Pill, Sparkles } from 'lucide-react';
import { api } from '../api/client';

export const CropHealthPage: React.FC = () => {
  const [diagnosis, setDiagnosis] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState('Soybean');

  async function handleDiagnose() {
    try {
      setAnalyzing(true);
      const result = await api.diagnoseDisease('55555555-5555-5555-5555-555555555555', {
        farmId: '33333333-3333-3333-3333-333333333333',
        imageFileName: 'soybean_leaf_blight.jpg'
      });
      setDiagnosis(result);
    } catch (err) {
      console.error('Error running disease detection:', err);
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '28px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Computer Vision Crop Health & Disease Diagnostics</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
          Deep learning leaf pattern analysis with certainty calibration and CIBRC-compliant integrated disease management.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 440px) 1fr', gap: '28px' }}>
        
        {/* Left Column: Image Upload & Crop Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '14px' }}>Capture or Upload Leaf Specimen</h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Select Crop Species
              </label>
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#ffffff', fontSize: '0.9rem' }}
              >
                <option value="Soybean">Soybean (Glycine max)</option>
                <option value="Cotton">Bt Cotton (Gossypium)</option>
                <option value="Onion">Onion (Allium cepa)</option>
                <option value="Tomato">Tomato (Solanum lycopersicum)</option>
              </select>
            </div>

            {/* Drop Zone Area */}
            <div
              style={{
                border: '2px dashed rgba(16, 185, 129, 0.4)',
                borderRadius: 'var(--radius-md)',
                padding: '36px 20px',
                textAlign: 'center',
                background: 'rgba(16, 185, 129, 0.03)',
                cursor: 'pointer',
                marginBottom: '18px',
                transition: 'var(--transition-smooth)'
              }}
              onClick={handleDiagnose}
            >
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <UploadCloud size={28} color="#10b981" />
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '4px' }}>
                Upload Leaf Photo or Click Demo Sample
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Supports JPEG, PNG up to 10MB • Auto-calibrates lighting & shadows
              </p>
            </div>

            <button
              className="btn-primary"
              style={{ width: '100%' }}
              onClick={handleDiagnose}
              disabled={analyzing}
            >
              <ScanLine size={18} />
              <span>{analyzing ? 'Analyzing Leaf Lamina...' : 'Run Vision Diagnostic'}</span>
            </button>
          </div>

          {/* Diagnostic Guidelines Card */}
          <div className="glass-panel" style={{ padding: '20px', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            <h4 style={{ color: '#ffffff', fontWeight: 700, marginBottom: '8px' }}>Photography Tips for Accurate Results:</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li>• Focus closely on the boundary between green leaf and dark lesions.</li>
              <li>• Avoid intense direct flash or harsh sunlight glare.</li>
              <li>• Inspect both upper and lower surface of the leaf blade.</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Diagnostic Results & Prescriptions */}
        <div>
          {diagnosis ? (
            <div className="glass-panel" style={{ padding: '28px', border: '1px solid rgba(239, 68, 68, 0.35)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <span style={{ fontSize: '0.78rem', color: '#f87171', textTransform: 'uppercase', fontWeight: 700 }}>
                    Vision Detection Result • {diagnosis.status}
                  </span>
                  <h3 style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '2px' }}>
                    {diagnosis.diseaseName}
                  </h3>
                  <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>Host Crop: {diagnosis.cropDetected}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981' }}>
                    {diagnosis.confidencePct}%
                  </div>
                  <span className="badge badge-danger">HIGH SEVERITY</span>
                </div>
              </div>

              {/* Clinical Symptoms */}
              <div style={{ marginBottom: '22px' }}>
                <h4 style={{ fontSize: '0.96rem', fontWeight: 700, marginBottom: '8px', color: '#ffffff' }}>Observed Clinical Symptoms</h4>
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

              {/* Disclaimer */}
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                {diagnosis.disclaimer}
              </p>
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <ScanLine size={48} color="#10b981" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff', marginBottom: '6px' }}>
                No Active Leaf Specimen Analyzed Yet
              </h3>
              <p style={{ fontSize: '0.9rem', maxWidth: '460px', margin: '0 auto' }}>
                Upload an affected plant leaf or click "Run Vision Diagnostic" on the left to trigger the transfer-learning inference engine.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
