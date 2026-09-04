import React, { useEffect, useState } from 'react';
import { Droplets, Cpu, Sliders, CheckCircle2, AlertTriangle, ArrowRight, Activity } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { FarmRequiredModal } from '../components/FarmRequiredModal';

export const IrrigationPage: React.FC = () => {
  const { hasFarm, refreshAuth } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [latest, setLatest] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [sliderMoisture, setSliderMoisture] = useState<number>(24);
  const [simulating, setSimulating] = useState(false);

  async function loadData() {
    try {
      const [lat, hist, rec] = await Promise.all([
        api.getLatestTelemetry(),
        api.getTelemetryHistory(),
        api.getIrrigationRecommendation()
      ]);
      setLatest(lat);
      setHistory(hist);
      setRecommendation(rec);
      if (lat?.soilMoisturePct) setSliderMoisture(lat.soilMoisturePct);
    } catch (err) {
      console.error('Error fetching irrigation telemetry:', err);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSimulate() {
    try {
      setSimulating(true);
      await api.simulateTelemetry({
        soilMoisturePct: sliderMoisture,
        temperatureC: 31,
        humidityPct: 65
      });
      await loadData();
    } catch (err) {
      console.error('Error simulating telemetry:', err);
    } finally {
      setSimulating(false);
    }
  }

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '28px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>IoT Smart Irrigation & Telemetry Engine</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
          Autonomous water management synthesizing capacitive soil sensors, crop growth stage, and rainfall forecasts.
        </p>
      </div>

      {!hasFarm ? (
        <div className="glass-panel" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Droplets size={30} color="#38bdf8" />
          </div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>
            Farm & Soil Setup Required for IoT Irrigation
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: '560px', margin: '0 auto 24px', lineHeight: 1.6 }}>
            Smart irrigation recommendations depend on your soil type's water-holding capacity and primary irrigation method (Drip, Sprinkler, Canal). Please register your farm details to activate telemetry controls.
          </p>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <span>Enter Farm & Irrigation Details</span>
            <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr minmax(320px, 420px)', gap: '24px' }}>
        
        {/* Left Column: Decision & History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Decision Hero Card */}
          <div
            className="glass-panel"
            style={{
              padding: '24px',
              borderRadius: 'var(--radius-md)',
              border: recommendation?.decision === 'IRRIGATE'
                ? '1px solid rgba(245, 158, 11, 0.4)'
                : '1px solid rgba(16, 185, 129, 0.4)',
              background: recommendation?.decision === 'IRRIGATE'
                ? 'rgba(245, 158, 11, 0.08)'
                : 'rgba(16, 185, 129, 0.08)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Droplets size={22} color="#38bdf8" />
                </div>
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Automated Agronomic Decision
                  </span>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>
                    Action Directive: {recommendation?.decision || 'WAIT'}
                  </h3>
                </div>
              </div>
              <span className={recommendation?.decision === 'IRRIGATE' ? 'badge badge-warning' : 'badge badge-success'}>
                {recommendation?.urgency || 'MEDIUM'} URGENCY
              </span>
            </div>

            <p style={{ fontSize: '0.96rem', color: '#ffffff', lineHeight: 1.5, marginBottom: '16px' }}>
              {recommendation?.reason}
            </p>

            {recommendation?.decision === 'IRRIGATE' && (
              <div style={{ padding: '14px', borderRadius: 'var(--radius-sm)', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', marginBottom: '16px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#fbbf24', marginBottom: '4px' }}>
                  Recommended Irrigation Dosage:
                </div>
                <div style={{ fontSize: '0.86rem' }}>
                  • Volume: <strong>{recommendation.waterLitersRecommended?.toLocaleString()} Liters / Acre</strong>
                  <br />
                  • Drip System Runtime: <strong>{recommendation.runTimeMinutesRecommended} Minutes</strong>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '16px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              <span>Wilting Point: &lt;30%</span>
              <span>•</span>
              <span>Target Range: 40% - 60%</span>
              <span>•</span>
              <span>Field Capacity: &gt;65%</span>
            </div>
          </div>

          {/* Historical Telemetry Stream Table */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} color="#10b981" />
              <span>Telemetry History (Last 12 Readings)</span>
            </h3>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left' }}>
                    <th style={{ padding: '10px 8px' }}>Timestamp</th>
                    <th style={{ padding: '10px 8px' }}>Soil Moisture</th>
                    <th style={{ padding: '10px 8px' }}>Temperature</th>
                    <th style={{ padding: '10px 8px' }}>Humidity</th>
                    <th style={{ padding: '10px 8px' }}>Battery</th>
                  </tr>
                </thead>
                <tbody>
                  {history.slice(-8).reverse().map((h) => (
                    <tr key={h.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <td style={{ padding: '10px 8px', color: 'var(--text-muted)' }}>
                        {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '10px 8px', fontWeight: 700, color: h.soilMoisturePct < 30 ? '#f87171' : '#38bdf8' }}>
                        {h.soilMoisturePct}%
                      </td>
                      <td style={{ padding: '10px 8px' }}>{h.temperatureC}°C</td>
                      <td style={{ padding: '10px 8px' }}>{h.humidityPct}%</td>
                      <td style={{ padding: '10px 8px', color: '#10b981' }}>{h.batteryPct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Column: Interactive Hardware Telemetry & Simulator */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Active Sensor Node Card */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu size={20} color="#10b981" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Field Node Status</h3>
              </div>
              <span className="badge badge-success">ONLINE (MQTT/HTTP)</span>
            </div>

            <div style={{ padding: '16px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Device Identifier:</span>
                <span style={{ fontWeight: 600 }}>{latest?.deviceUid || 'ESP32-AGRI-PUNE-01'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Firmware Protocol:</span>
                <span style={{ fontWeight: 600 }}>ESP-IDF v5.1 / MQTT QoS 1</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Solar Battery:</span>
                <span style={{ fontWeight: 600, color: '#10b981' }}>92% (Charging)</span>
              </div>
            </div>

            {/* Current Moisture Gauge */}
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Live Volumetric Water Content
              </span>
              <div style={{ fontSize: '3.5rem', fontWeight: 800, color: '#38bdf8', letterSpacing: '-0.04em' }}>
                {latest?.soilMoisturePct ?? 34}%
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Capacitive Sensor Calibrated</span>
            </div>
          </div>

          {/* Interactive Hardware Simulator */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Sliders size={20} color="#fbbf24" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Telemetry Simulator</h3>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Adjust moisture to simulate dry soil or saturated rainfall, and watch the decision engine adapt instantly.
            </p>

            <div style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.88rem' }}>
                <span>Simulate Soil Moisture:</span>
                <strong style={{ color: '#38bdf8' }}>{sliderMoisture}%</strong>
              </div>
              <input
                type="range"
                min="10"
                max="85"
                value={sliderMoisture}
                onChange={(e) => setSliderMoisture(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#10b981', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                <span>10% (Severe Drought)</span>
                <span>40% (Optimal)</span>
                <span>85% (Flooded)</span>
              </div>
            </div>

            <button
              className="btn-primary"
              style={{ width: '100%', fontSize: '0.88rem' }}
              onClick={handleSimulate}
              disabled={simulating}
            >
              <span>{simulating ? 'Injecting Telemetry...' : 'Inject Simulated Reading'}</span>
              <ArrowRight size={16} />
            </button>
          </div>

        </div>

      </div>
      )}

      {/* Just-In-Time Farm Modal */}
      <FarmRequiredModal
        isOpen={showModal}
        featureName="IoT Smart Irrigation"
        featureDescription="Enter your farm acreage, soil type, and primary irrigation infrastructure to enable live sensor telemetry and automated irrigation decisions."
        onCancel={() => setShowModal(false)}
        onSuccess={() => {
          setShowModal(false);
          refreshAuth();
        }}
      />
    </div>
  );
};
