import React, { useEffect, useState } from 'react';
import { Compass, CheckCircle2, Droplets, Calendar, TrendingUp, ArrowRight, Sparkles } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { FarmRequiredModal } from '../components/FarmRequiredModal';

export const CropPlanPage: React.FC = () => {
  const { hasFarm, refreshAuth } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'KHARIF' | 'RABI' | 'ZAID'>('KHARIF');

  useEffect(() => {
    async function loadRecommendations() {
      if (!hasFarm) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await api.getCropRecommendations('33333333-3333-3333-3333-333333333333', activeTab);
        setRecommendations(data);
      } catch (err) {
        console.error('Error fetching crop recommendations:', err);
      } finally {
        setLoading(false);
      }
    }
    loadRecommendations();
  }, [activeTab, hasFarm]);

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Sparkles size={18} color="#10b981" />
            <span style={{ fontSize: '0.8rem', color: '#34d399', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em' }}>
              Multi-Factor Agronomic AI Model
            </span>
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Pre-Sowing Crop Intelligence & Recommendations</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Ranked crops synthesized from your Black Cotton soil tests, drip irrigation capacity, and regional APMC market margins.
          </p>
        </div>

        {/* Season Selector */}
        <div style={{ display: 'flex', gap: '6px', background: 'rgba(255, 255, 255, 0.05)', padding: '4px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          {(['KHARIF', 'RABI', 'ZAID'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setActiveTab(s)}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                background: activeTab === s ? '#10b981' : 'transparent',
                color: activeTab === s ? '#ffffff' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'var(--transition-smooth)'
              }}
            >
              {s} Season
            </button>
          ))}
        </div>
      </div>

      {!hasFarm ? (
        <div className="glass-panel" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Compass size={30} color="#10b981" />
          </div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>
            Farm & Soil Data Required for Crop Planning
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: '560px', margin: '0 auto 24px', lineHeight: 1.6 }}>
            Our multi-factor agronomic algorithm calculates suitability scores by cross-referencing your soil pH, NPK nutrients, and irrigation infrastructure. Please register your farm details to view tailored recommendations.
          </p>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <span>Enter Farm & Soil Parameters</span>
            <ArrowRight size={16} />
          </button>
        </div>
      ) : loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Evaluating soil chemistry, agro-climatic zone, and market projections...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
          {recommendations?.recommendations?.map((item: any, idx: number) => {
            const isTopMatch = idx === 0;
            return (
              <div
                key={item.cropName}
                className="glass-panel"
                style={{
                  padding: '24px',
                  borderRadius: 'var(--radius-md)',
                  border: isTopMatch ? '1px solid rgba(16, 185, 129, 0.45)' : '1px solid var(--border-subtle)',
                  background: isTopMatch
                    ? 'linear-gradient(180deg, rgba(16, 185, 129, 0.08) 0%, rgba(19, 28, 21, 0.95) 100%)'
                    : 'var(--bg-glass)',
                  position: 'relative'
                }}
              >
                {isTopMatch && (
                  <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
                    <span className="badge badge-success">Top Agronomic Match</span>
                  </div>
                )}

                <div style={{ marginBottom: '16px' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Rank #{idx + 1} Recommendation
                  </span>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '2px' }}>{item.cropName}</h3>
                </div>

                {/* Suitability Score Gauge */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '14px' }}>
                  <span style={{ fontSize: '2.4rem', fontWeight: 800, color: '#10b981' }}>
                    {item.suitabilityScore}%
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Overall Compatibility Index</span>
                </div>

                <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden', marginBottom: '20px' }}>
                  <div
                    style={{
                      width: `${item.suitabilityScore}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #10b981, #34d399)',
                      borderRadius: '4px'
                    }}
                  />
                </div>

                {/* Vital Statistics Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
                  <div style={{ padding: '10px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      <Calendar size={13} />
                      <span>Crop Duration</span>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>{item.durationDays} Days</span>
                  </div>

                  <div style={{ padding: '10px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      <Droplets size={13} color="#38bdf8" />
                      <span>Water Need</span>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#38bdf8' }}>{item.waterRequirement}</span>
                  </div>

                  <div style={{ padding: '10px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      <TrendingUp size={13} color="#10b981" />
                      <span>Est. Yield</span>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.86rem' }}>{item.estimatedYieldRange}</span>
                  </div>

                  <div style={{ padding: '10px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      <Compass size={13} color="#fbbf24" />
                      <span>Projected ROI</span>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#fbbf24' }}>+{item.projectedRoiPct}%</span>
                  </div>
                </div>

                {/* Agronomic Reasons */}
                <div style={{ marginBottom: '22px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Why this crop matches your farm:
                  </span>
                  <ul style={{ listStyle: 'none', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {item.matchReasons.map((reason: string, rIdx: number) => (
                      <li key={rIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.84rem', color: 'var(--text-main)' }}>
                        <CheckCircle2 size={15} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button className="btn-primary" style={{ width: '100%', fontSize: '0.88rem' }}>
                  <span>Initiate {item.cropName} Crop Cycle</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Just-In-Time Farm Modal */}
      <FarmRequiredModal
        isOpen={showModal}
        featureName="AI Crop Recommendation"
        featureDescription="Enter your farm acreage, irrigation method, and soil health card parameters to generate personalized crop rankings."
        onCancel={() => setShowModal(false)}
        onSuccess={() => {
          setShowModal(false);
          refreshAuth();
        }}
      />
    </div>
  );
};
