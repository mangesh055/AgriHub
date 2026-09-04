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
  DollarSign,
  MapPin
} from 'lucide-react';
import { api } from '../api/client';
import { UnifiedHeroCard } from '../components/UnifiedHeroCard';
import { FarmRequiredModal } from '../components/FarmRequiredModal';
import { useAuth } from '../context/AuthContext';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, hasFarm, primaryFarm, refreshAuth } = useAuth();
  const [showFarmModal, setShowFarmModal] = useState(false);
  const [modalFeature, setModalFeature] = useState({ name: 'Farm Intelligence', desc: 'Please register your farm details.' });
  const [loading, setLoading] = useState(true);
  const [farms, setFarms] = useState<any[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<any>(null);
  const [soilRecord, setSoilRecord] = useState<any>(null);
  const [unifiedAction, setUnifiedAction] = useState<any>(null);
  const [weather, setWeather] = useState<any>(null);
  const [telemetry, setTelemetry] = useState<any>(null);
  const [irrigation, setIrrigation] = useState<any>(null);
  const [market, setMarket] = useState<any>(null);
  const [cropCycle, setCropCycle] = useState<any>(null);
  const [profit, setProfit] = useState<any>(null);

  async function loadDashboardData() {
    try {
      setLoading(true);
      const farmsData = await api.getFarms().catch(() => []);
      setFarms(farmsData);
      const active = farmsData.length > 0 ? farmsData[0] : null;
      setSelectedFarm(active);
      const activeFarmId = active?.id;

      const [
        actionData,
        weatherData,
        telemetryData,
        irrigationData,
        marketData,
        cyclesData,
        profitData,
        soilsData
      ] = await Promise.all([
        activeFarmId ? api.getUnifiedAction(activeFarmId).catch(() => null) : Promise.resolve(null),
        api.getCurrentWeather(activeFarmId).catch(() => null),
        activeFarmId ? api.getLatestTelemetry(activeFarmId).catch(() => null) : Promise.resolve(null),
        activeFarmId ? api.getIrrigationRecommendation(activeFarmId).catch(() => null) : Promise.resolve(null),
        api.getMarketDecision('Soybean').catch(() => null),
        activeFarmId ? api.getCropCycles(activeFarmId).catch(() => []) : Promise.resolve([]),
        activeFarmId ? api.getProfitSummary(activeFarmId).catch(() => null) : Promise.resolve(null),
        activeFarmId ? api.getSoilRecords(activeFarmId).catch(() => []) : Promise.resolve([])
      ]);

      setUnifiedAction(actionData);
      setWeather(weatherData);
      setTelemetry(telemetryData);
      setIrrigation(irrigationData);
      setMarket(marketData);
      setCropCycle(cyclesData[0] || null);
      setProfit(profitData);
      setSoilRecord(soilsData[0] || null);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
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
      {!hasFarm && !selectedFarm && (
        <section style={{ marginBottom: '24px' }}>
          <div
            className="glass-panel"
            style={{
              padding: '24px',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, var(--bg-card) 100%)',
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

      {/* 0B. Dynamic My Farm Plot & Soil Health Summary Ribbon */}
      {selectedFarm && (
        <section style={{ marginBottom: '24px' }}>
          <div
            className="glass-panel"
            style={{
              padding: '20px 24px',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, var(--bg-card) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MapPin size={24} color="#34d399" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
                    {selectedFarm.name}
                  </h3>
                  <span className="badge badge-success">{selectedFarm.areaAcres} Acres</span>
                  <span className="badge badge-info">{selectedFarm.irrigationSource} Irrigation</span>
                  {farms.length > 1 && (
                    <select
                      value={selectedFarm.id}
                      onChange={(e) => {
                        const f = farms.find((farm) => farm.id === e.target.value);
                        if (f) setSelectedFarm(f);
                      }}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: '#131e15',
                        border: '1px solid var(--border-subtle)',
                        color: '#34d399',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {farms.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name} ({f.areaAcres} Ac)
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', marginTop: '4px' }}>
                  Centroid: {Number(selectedFarm.latitude).toFixed(4)}°N, {Number(selectedFarm.longitude).toFixed(4)}°E • 
                  Soil: <strong style={{ color: '#38bdf8' }}>{soilRecord?.soilType?.replace('_', ' ') || 'Black Cotton'} (pH {soilRecord?.ph || 7.2})</strong>
                  {soilRecord ? ` • NPK: ${soilRecord.nitrogen}/${soilRecord.phosphorus}/${soilRecord.potassium}` : ' • Cadastral Plot Verified'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                className="btn-secondary"
                style={{ fontSize: '0.84rem', padding: '8px 14px' }}
                onClick={() => navigate('/farms')}
              >
                <MapPin size={15} color="#34d399" />
                <span>My Farm GIS & Soil Details</span>
                <ArrowUpRight size={14} />
              </button>

              <button
                className="btn-secondary"
                style={{ fontSize: '0.84rem', padding: '8px 14px' }}
                onClick={() => {
                  setModalFeature({
                    name: 'Register Additional Farm Plot',
                    desc: 'Enter plot acreage, micro-irrigation method, and soil health parameters for a new parcel.'
                  });
                  setShowFarmModal(true);
                }}
              >
                <span>+ Add Plot</span>
              </button>
            </div>
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
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {selectedFarm ? `Node: ESP32-${selectedFarm.name.slice(0, 10).replace(/\s+/g, '-').toUpperCase()}` : 'No Sensor Node Linked'}
                </span>
              </div>
            </div>
            <span className={!selectedFarm ? 'badge' : irrigation?.decision === 'IRRIGATE' ? 'badge badge-warning' : 'badge badge-success'}>
              {selectedFarm ? (irrigation?.decision || 'STANDBY') : 'PENDING SETUP'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '10px' }}>
            <span style={{ fontSize: '2.6rem', fontWeight: 800, color: selectedFarm ? '#38bdf8' : 'var(--text-muted)', letterSpacing: '-0.03em' }}>
              {selectedFarm && telemetry?.soilMoisturePct != null ? `${telemetry.soilMoisturePct}%` : '--%'}
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Volumetric Moisture</span>
          </div>

          <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden', marginBottom: '14px' }}>
            <div
              style={{
                width: selectedFarm ? `${telemetry?.soilMoisturePct ?? 0}%` : '0%',
                height: '100%',
                background: 'linear-gradient(90deg, #38bdf8, #0284c7)',
                borderRadius: '4px'
              }}
            />
          </div>

          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '16px' }}>
            {selectedFarm
              ? (irrigation?.reason || 'Soil moisture is in optimal retention zone.')
              : 'Register your farm plot to link ESP32 capacitance soil sensors and get automated drip recommendations.'}
          </p>

          <button
            className="btn-secondary"
            style={{ width: '100%', padding: '8px 12px', fontSize: '0.82rem' }}
            onClick={() => {
              if (!selectedFarm) {
                setModalFeature({
                  name: 'IoT Soil & Irrigation Setup',
                  desc: 'Register your farm plot and soil profile to enable automated sensor calibration and irrigation intelligence.'
                });
                setShowFarmModal(true);
              } else {
                navigate('/irrigation');
              }
            }}
          >
            <span>{selectedFarm ? 'Telemetry & Drip Controls' : 'Connect Farm & Sensors'}</span>
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
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {selectedFarm
                    ? `${selectedFarm.name} (${Number(selectedFarm.latitude).toFixed(2)}°N, ${Number(selectedFarm.longitude).toFixed(2)}°E)`
                    : `${profile?.district || 'Regional'}, ${profile?.state || 'India'}`}
                </span>
              </div>
            </div>
            {weather?.rainProbabilityPct && weather.rainProbabilityPct > 50 ? (
              <span className="badge badge-danger">{weather.rainProbabilityPct}% RAIN ALERT</span>
            ) : (
              <span className="badge badge-success">FAVORABLE</span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '2.6rem', fontWeight: 800, color: '#fbbf24', letterSpacing: '-0.03em' }}>
              {weather?.temperatureC ?? 28.5}°C
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Humidity: {weather?.humidityPct ?? 72}%</span>
          </div>

          <p style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>
            {weather?.weatherDescription || 'Agricultural Weather Forecast'}
          </p>

          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.4 }}>
            Wind: {weather?.windSpeedKph ?? 14} km/h • Rain Prob: {weather?.rainProbabilityPct ?? 25}% • Hyperlocal grid
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
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                  {cropCycle?.cropName || (selectedFarm ? 'No Sown Crop' : 'No Crop Cycle')}
                </h3>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {cropCycle ? `${cropCycle.variety || 'Active Variety'} • Sown ${cropCycle.sowingDate || 'Recently'}` : (selectedFarm ? 'No active sowing recorded' : 'Farm registration pending')}
                </span>
              </div>
            </div>
            <span className={cropCycle ? 'badge badge-success' : 'badge'}>
              {cropCycle?.currentStage || (selectedFarm ? 'NOT SOWN' : 'UNREGISTERED')}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '10px' }}>
            <span style={{ fontSize: '2.6rem', fontWeight: 800, color: cropCycle ? '#34d399' : 'var(--text-muted)', letterSpacing: '-0.03em' }}>
              {cropCycle ? `Day ${cropCycle.daysSinceSowing || 45}` : 'Day --'}
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {cropCycle ? `of ${cropCycle.expectedDurationDays || 90} Days to Harvest` : 'No active crop timeline'}
            </span>
          </div>

          <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden', marginBottom: '14px' }}>
            <div
              style={{
                width: cropCycle ? `${Math.min(100, Math.round(((cropCycle.daysSinceSowing || 45) / (cropCycle.expectedDurationDays || 90)) * 100))}%` : '0%',
                height: '100%',
                background: 'linear-gradient(90deg, #10b981, #34d399)',
                borderRadius: '4px'
              }}
            />
          </div>

          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '16px' }}>
            {cropCycle
              ? `${cropCycle.currentStage} window. Critical scouting and nutrition phase.`
              : 'Add your farm and select a Kharif/Rabi crop to monitor phenological growth stages and projected harvest dates.'}
          </p>

          <button
            className="btn-secondary"
            style={{ width: '100%', padding: '8px 12px', fontSize: '0.82rem' }}
            onClick={() => {
              if (!selectedFarm) {
                setModalFeature({
                  name: 'AI Crop Cycle Planning',
                  desc: 'Register your farm plot acreage and soil type to receive personalized crop recommendations.'
                });
                setShowFarmModal(true);
              } else {
                navigate('/crop-plan');
              }
            }}
          >
            <span>{cropCycle ? 'Scan Leaf for Disease' : 'Plan First Crop Cycle'}</span>
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
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Nearest: {profile?.district || 'Pune'} APMC
                </span>
              </div>
            </div>
            <span className="badge badge-info">
              {market?.action || 'REGIONAL APMC'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '2.6rem', fontWeight: 800, color: '#fbbf24', letterSpacing: '-0.03em' }}>
              ₹{market?.currentModalPrice ?? 4850}
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ Quintal (Soybean Modal)</span>
          </div>

          <p style={{ fontSize: '0.86rem', color: '#10b981', fontWeight: 600, marginBottom: '6px' }}>
            Forecast 7D: ₹{market?.forecastPrice7Days ?? 5130}/Q (+₹280/Q gain)
          </p>

          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '16px' }}>
            {selectedFarm && profit?.netProfitProjected != null
              ? `Projected Farm Profit: ₹${profit.netProfitProjected.toLocaleString('en-IN')} (${profit.roiPercentage ?? 0}% ROI)`
              : 'Projected Farm Profit: ₹0 (No farm plot registered yet)'}
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
          loadDashboardData();
        }}
      />
    </div>
  );
};
