import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Droplets,
  CloudSun,
  Sprout,
  TrendingUp,
  ScanLine,
  ArrowUpRight,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Sliders,
  DollarSign
} from 'lucide-react';
import { api } from '../api/client';
import { UnifiedHeroCard } from '../components/UnifiedHeroCard';
import { FarmRequiredModal } from '../components/FarmRequiredModal';
import { useAuth } from '../context/AuthContext';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, hasFarm, refreshAuth } = useAuth();
  const [showFarmModal, setShowFarmModal] = useState(false);
  const [modalFeature, setModalFeature] = useState({ name: 'Farm Intelligence', desc: 'Please register your farm details.' });
  const [loading, setLoading] = useState(true);
  const [unifiedAction, setUnifiedAction] = useState<any>(null);
  const [weather, setWeather] = useState<any>(null);
  const [telemetry, setTelemetry] = useState<any>(null);
  const [irrigation, setIrrigation] = useState<any>(null);
  const [market, setMarket] = useState<any>(null);
  const [cropCycle, setCropCycle] = useState<any>(null);
  const [profit, setProfit] = useState<any>(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [
          actionData,
          weatherData,
          telemetryData,
          irrigationData,
          marketData,
          cyclesData,
          profitData
        ] = await Promise.all([
          api.getUnifiedAction().catch(() => null),
          api.getCurrentWeather().catch(() => null),
          api.getLatestTelemetry().catch(() => null),
          api.getIrrigationRecommendation().catch(() => null),
          api.getMarketDecision('Soybean').catch(() => null),
          api.getCropCycles('33333333-3333-3333-3333-333333333333').catch(() => []),
          api.getProfitSummary('33333333-3333-3333-3333-333333333333').catch(() => null)
        ]);

        setUnifiedAction(actionData);
        setWeather(weatherData);
        setTelemetry(telemetryData);
        setIrrigation(irrigationData);
        setMarket(marketData);
        setCropCycle(cyclesData[0] || null);
        setProfit(profitData);
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid rgba(16, 185, 129, 0.2)', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ marginTop: '16px', fontWeight: 600 }}>Synthesizing field sensors, weather forecasts, and market trends...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '28px' }}>
      {/* 0. Welcome Banner if No Farm Registered */}
      {!hasFarm && (
        <section style={{ marginBottom: '24px' }}>
          <div
            className="glass-panel"
            style={{
              padding: '24px',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(19, 28, 21, 0.95) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sprout size={26} color="#34d399" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Welcome, {profile?.name || 'Farmer'}!</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '2px', maxWidth: '750px' }}>
                  Your dashboard is ready! You can check Mandi prices and weather forecasts anytime. When you are ready, enter your farm and soil details to unlock automated IoT irrigation decisions and AI crop planning.
                </p>
              </div>
            </div>
            <button
              className="btn-primary"
              onClick={() => {
                setModalFeature({
                  name: 'Farm Plot Setup',
                  desc: 'Enter your farm acreage, irrigation source, and soil health parameters to enable real-time agronomic recommendations.'
                });
                setShowFarmModal(true);
              }}
            >
              <Sprout size={18} />
              <span>Enter Farm Details</span>
            </button>
          </div>
        </section>
      )}

      {/* 1. Unified Directive Hero Banner */}
      {unifiedAction && (
        <section style={{ marginBottom: '28px' }}>
          <UnifiedHeroCard action={unifiedAction} />
        </section>
      )}

      {/* 2. Four Master Telemetry Cards */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        
        {/* Card A: Soil Moisture & Smart Irrigation */}
        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Droplets size={20} color="#38bdf8" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Soil & IoT Irrigation</h3>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Node: ESP32-AGRI-PUNE-01</span>
              </div>
            </div>
            <span className={irrigation?.decision === 'IRRIGATE' ? 'badge badge-warning' : 'badge badge-success'}>
              {irrigation?.decision || 'WAIT'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '10px' }}>
            <span style={{ fontSize: '2.6rem', fontWeight: 800, color: '#38bdf8', letterSpacing: '-0.03em' }}>
              {telemetry?.soilMoisturePct ?? 34}%
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Volumetric Moisture</span>
          </div>

          <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden', marginBottom: '14px' }}>
            <div
              style={{
                width: `${telemetry?.soilMoisturePct ?? 34}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #38bdf8, #0284c7)',
                borderRadius: '4px'
              }}
            />
          </div>

          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '16px' }}>
            {irrigation?.reason || 'Soil moisture is in optimal retention zone. Rain override in effect.'}
          </p>

          <button
            className="btn-secondary"
            style={{ width: '100%', padding: '8px 12px', fontSize: '0.82rem' }}
            onClick={() => navigate('/irrigation')}
          >
            <span>Telemetry & Drip Controls</span>
            <ArrowUpRight size={14} />
          </button>
        </div>

        {/* Card B: Hyperlocal Weather & Hazards */}
        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CloudSun size={20} color="#fbbf24" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Hyperlocal Weather</h3>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Haveli, Pune (18.48°N, 74.13°E)</span>
              </div>
            </div>
            <span className="badge badge-danger">35mm RAIN ALERT</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '2.6rem', fontWeight: 800, color: '#fbbf24', letterSpacing: '-0.03em' }}>
              {weather?.temperatureC ?? 29.4}°C
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Humidity: {weather?.humidityPct ?? 76}%</span>
          </div>

          <p style={{ fontSize: '0.88rem', fontWeight: 600, color: '#ffffff', marginBottom: '8px' }}>
            {weather?.weatherDescription || 'Monsoon conditions'}
          </p>

          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.4 }}>
            Wind: {weather?.windSpeedKph ?? 16} km/h • Rain Prob: {weather?.rainProbabilityPct ?? 65}% (Heavy showers within 24h)
          </p>

          <button
            className="btn-secondary"
            style={{ width: '100%', padding: '8px 12px', fontSize: '0.82rem' }}
            onClick={() => navigate('/weather')}
          >
            <span>7-Day Agricultural Forecast</span>
            <ArrowUpRight size={14} />
          </button>
        </div>

        {/* Card C: Active Crop Cycle Progress */}
        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sprout size={20} color="#34d399" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{cropCycle?.cropName || 'Soybean'}</h3>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{cropCycle?.variety || 'JS-335'} • Sown June 20</span>
              </div>
            </div>
            <span className="badge badge-success">
              {cropCycle?.currentStage || 'FLOWERING'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '10px' }}>
            <span style={{ fontSize: '2.6rem', fontWeight: 800, color: '#34d399', letterSpacing: '-0.03em' }}>
              Day 76
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>of 95 Days to Harvest</span>
          </div>

          <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden', marginBottom: '14px' }}>
            <div
              style={{
                width: '80%',
                height: '100%',
                background: 'linear-gradient(90deg, #10b981, #34d399)',
                borderRadius: '4px'
              }}
            />
          </div>

          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '16px' }}>
            Pod formation starting. Critical moisture and pest scouting window. Projected harvest: Oct 5, 2026.
          </p>

          <button
            className="btn-secondary"
            style={{ width: '100%', padding: '8px 12px', fontSize: '0.82rem' }}
            onClick={() => navigate('/crop-health')}
          >
            <span>Scan Leaf for Disease</span>
            <ArrowUpRight size={14} />
          </button>
        </div>

        {/* Card D: APMC Mandi & Economics */}
        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={20} color="#fbbf24" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Mandi & Economics</h3>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Nearest: Pune & Baramati APMC</span>
              </div>
            </div>
            <span className="badge badge-info">
              {market?.action || 'HOLD FOR TARGET'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '2.6rem', fontWeight: 800, color: '#fbbf24', letterSpacing: '-0.03em' }}>
              ₹{market?.currentModalPrice ?? 4850}
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ Quintal (Modal)</span>
          </div>

          <p style={{ fontSize: '0.86rem', color: '#34d399', fontWeight: 600, marginBottom: '6px' }}>
            Forecast 7D: ₹{market?.forecastPrice7Days ?? 5130}/Q (+₹280/Q gain)
          </p>

          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '16px' }}>
            Projected Farm Profit: ₹{profit?.netProfitProjected?.toLocaleString('en-IN') ?? '1,28,000'} ({profit?.roiPercentage ?? 48}% ROI)
          </p>

          <button
            className="btn-secondary"
            style={{ width: '100%', padding: '8px 12px', fontSize: '0.82rem' }}
            onClick={() => navigate('/market')}
          >
            <span>Compare Mandis & Logistics</span>
            <ArrowUpRight size={14} />
          </button>
        </div>

      </section>

      {/* 3. Quick Action Ribbon */}
      <section className="glass-panel" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Quick Field Actions</h4>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Frequently used decision workflows for today</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <button
            className="btn-secondary"
            onClick={() => {
              if (!hasFarm) {
                setModalFeature({
                  name: 'Leaf Disease Diagnostics',
                  desc: 'Computer vision diagnostics requires an active crop cycle on your farm to record symptoms and treatment history.'
                });
                setShowFarmModal(true);
              } else {
                navigate('/crop-health');
              }
            }}
          >
            <ScanLine size={16} color="#34d399" />
            <span>Diagnose Leaf Disease</span>
          </button>

          <button
            className="btn-secondary"
            onClick={() => {
              if (!hasFarm) {
                setModalFeature({
                  name: 'IoT Smart Irrigation',
                  desc: 'Automated irrigation decisions are calibrated against your soil moisture, farm acreage, and crop growth stage.'
                });
                setShowFarmModal(true);
              } else {
                navigate('/irrigation');
              }
            }}
          >
            <Sliders size={16} color="#38bdf8" />
            <span>Test Moisture Simulator</span>
          </button>

          <button className="btn-secondary" onClick={() => navigate('/assistant')}>
            <Sparkles size={16} color="#fbbf24" />
            <span>Ask Agronomist AI</span>
          </button>

          <button
            className="btn-secondary"
            onClick={() => {
              if (!hasFarm) {
                setModalFeature({
                  name: 'Farm Expense & Profit Tracking',
                  desc: 'Cost and ROI calculations require your farm acreage and active crop plot details.'
                });
                setShowFarmModal(true);
              } else {
                navigate('/economics');
              }
            }}
          >
            <DollarSign size={16} color="#10b981" />
            <span>Log Input Expense</span>
          </button>
        </div>
      </section>

      {/* Just-In-Time Farm & Soil Modal */}
      <FarmRequiredModal
        isOpen={showFarmModal}
        featureName={modalFeature.name}
        featureDescription={modalFeature.desc}
        onCancel={() => setShowFarmModal(false)}
        onSuccess={() => {
          setShowFarmModal(false);
          refreshAuth();
        }}
      />
    </div>
  );
};
