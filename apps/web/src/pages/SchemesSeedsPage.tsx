import React, { useEffect, useState } from 'react';
import { BookOpen, ExternalLink, ShieldCheck, CheckCircle2, Sprout } from 'lucide-react';
import { api } from '../api/client';

export const SchemesSeedsPage: React.FC = () => {
  const [schemes, setSchemes] = useState<any[]>([]);
  const [seeds, setSeeds] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'SCHEMES' | 'SEEDS'>('SCHEMES');

  useEffect(() => {
    async function loadData() {
      try {
        const [sc, sd] = await Promise.all([api.getSchemes(), api.getSeeds('Soybean')]);
        setSchemes(sc);
        setSeeds(sd);
      } catch (err) {
        console.error('Error loading knowledge data:', err);
      }
    }
    loadData();
  }, []);

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Government Schemes & Certified Seed Varieties</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Curated subsidies, crop insurance, direct income support, and foundation seed varieties for Maharashtra.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '6px', background: 'rgba(255, 255, 255, 0.05)', padding: '4px', borderRadius: 'var(--radius-sm)' }}>
          <button
            onClick={() => setActiveTab('SCHEMES')}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              background: activeTab === 'SCHEMES' ? '#10b981' : 'transparent',
              color: activeTab === 'SCHEMES' ? '#ffffff' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            Government Subsidies & Schemes
          </button>
          <button
            onClick={() => setActiveTab('SEEDS')}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              background: activeTab === 'SEEDS' ? '#10b981' : 'transparent',
              color: activeTab === 'SEEDS' ? '#ffffff' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            Certified Seed Directory
          </button>
        </div>
      </div>

      {activeTab === 'SCHEMES' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '22px' }}>
          {schemes.map((s) => (
            <div key={s.id} className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span className="badge badge-info">{s.category}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Valid: {s.validUntil}</span>
              </div>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px' }}>{s.name}</h3>
              <p style={{ fontSize: '0.88rem', color: '#34d399', fontWeight: 600, marginBottom: '14px' }}>
                Benefits: {s.benefits}
              </p>

              <div style={{ marginBottom: '14px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Eligibility Requirements:
                </span>
                <ul style={{ listStyle: 'none', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.84rem' }}>
                  {s.eligibility.map((e: string, i: number) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={13} color="#10b981" />
                      <span>{e}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Required Documents:
                </span>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {s.documents.join(' • ')}
                </p>
              </div>

              <a
                href={s.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
                style={{ width: '100%', fontSize: '0.84rem' }}
              >
                <span>Apply on Official Portal</span>
                <ExternalLink size={14} />
              </a>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '22px' }}>
          {seeds.map((s) => (
            <div key={s.id} className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span className="badge badge-success">{s.cropName}</span>
                <span style={{ fontSize: '0.82rem', color: '#38bdf8', fontWeight: 600 }}>{s.maturationDays} Days Maturity</span>
              </div>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '6px' }}>{s.varietyName}</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                Certified Supplier: <strong>{s.supplier}</strong>
              </p>

              <div style={{ marginBottom: '14px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Agronomic Characteristics:
                </span>
                <ul style={{ listStyle: 'none', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.84rem' }}>
                  {s.characteristics.map((c: string, i: number) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sprout size={13} color="#10b981" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Suitable for: {s.suitableRegions.join(', ')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
