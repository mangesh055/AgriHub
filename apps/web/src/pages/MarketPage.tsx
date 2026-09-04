import React, { useEffect, useState } from 'react';
import { TrendingUp, Truck, Store, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { api } from '../api/client';

export const MarketPage: React.FC = () => {
  const [decision, setDecision] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMarket() {
      try {
        setLoading(true);
        const data = await api.getMarketDecision('Soybean');
        setDecision(data);
      } catch (err) {
        console.error('Error loading market decision:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMarket();
  }, []);

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '28px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Mandi Price Intelligence & Sell/Hold Optimization</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
          Real-time APMC mandi modal prices, time-series forecasting, and freight-optimized net profit rankings.
        </p>
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Fetching Agmarknet mandi arrivals, freight distances, and price projections...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* 1. Sell vs Hold Decision Advisor */}
          <div
            className="glass-panel"
            style={{
              padding: '24px',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(19, 28, 21, 0.95) 100%)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={22} color="#fbbf24" />
                </div>
                <div>
                  <span style={{ fontSize: '0.78rem', color: '#fbbf24', textTransform: 'uppercase', fontWeight: 700 }}>
                    Strategic Sell/Hold Recommendation
                  </span>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                    Strategy: {decision?.action.replace('_', ' ')}
                  </h3>
                </div>
              </div>
              <span className="badge badge-warning">RISING 7-DAY OUTLOOK</span>
            </div>

            <p style={{ fontSize: '0.96rem', color: '#ffffff', lineHeight: 1.5, marginBottom: '16px' }}>
              {decision?.rationale}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.86rem' }}>
              <div style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-subtle)' }}>
                Current Modal: <strong>₹{decision?.currentModalPrice}/Q</strong>
              </div>
              <div style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-subtle)' }}>
                Forecast 7D: <strong style={{ color: '#34d399' }}>₹{decision?.forecastPrice7Days}/Q</strong>
              </div>
              <div style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-subtle)' }}>
                Holding Cost: <strong>₹{decision?.holdingCostPerQuintalPerWeek}/Q/Week</strong>
              </div>
              <div style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                Net Gain from Holding: <strong style={{ color: '#10b981' }}>+₹{decision?.netHoldingGainProjected}/Quintal</strong>
              </div>
            </div>
          </div>

          {/* 2. Multi-Mandi Freight & Profit Comparison Matrix */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '6px' }}>
              Nearby APMC Mandi Comparison & Logistics Deductions
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Shows raw APMC modal prices versus actual in-hand profit after subtracting freight costs (based on ₹3.20/km per quintal from your Uruli Kanchan farm).
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
              {decision?.nearbyMandis?.map((m: any) => (
                <div
                  key={m.mandiId}
                  style={{
                    padding: '20px',
                    borderRadius: 'var(--radius-sm)',
                    border: m.isRecommended ? '1px solid #10b981' : '1px solid var(--border-subtle)',
                    background: m.isRecommended ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                    position: 'relative'
                  }}
                >
                  {m.isRecommended && (
                    <div style={{ position: 'absolute', top: '14px', right: '14px' }}>
                      <span className="badge badge-success">Recommended Destination</span>
                    </div>
                  )}

                  <h4 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '4px' }}>{m.mandiName}</h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Distance: {m.distanceKm} km from farm</span>

                  <div style={{ margin: '16px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Mandi Modal Price:</span>
                      <span style={{ fontWeight: 600 }}>₹{m.modalPrice} / Q</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Freight / Transport Deduction:</span>
                      <span style={{ color: '#f87171' }}>- ₹{m.transportCostPerQuintal} / Q</span>
                    </div>
                    <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 800 }}>
                      <span>Net Realized Price:</span>
                      <span style={{ color: '#10b981' }}>₹{m.netRealizedPricePerQuintal} / Q</span>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    For a 45-quintal load, this yields a total in-hand sum of <strong>₹{(m.netRealizedPricePerQuintal * 45).toLocaleString('en-IN')}</strong>.
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
