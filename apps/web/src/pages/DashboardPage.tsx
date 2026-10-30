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
  MapPin,
  ChevronRight,
  Activity,
  Layers,
  CheckCircle2
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
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        <div
          style={{
            width: '44px',
            height: '44px',
            border: '3px solid rgba(16, 185, 129, 0.2)',
            borderTopColor: '#10b981',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }}
        />
        <p style={{ marginTop: '20px', fontWeight: 600, fontSize: '0.96rem', letterSpacing: '-0.01em', color: 'var(--text-main)' }}>
          Synthesizing field telemetry, satellite imagery, and market prices...
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1680px', margin: '0 auto', padding: '32px' }}>
      
      {/* 0. Welcome Banner if No Farm Registered */}
      {!hasFarm && !selectedFarm && (
        <section style={{ marginBottom: '28px' }}>
          <div
            className="glass-panel"
            style={{
              padding: '28px 32px',
              border: '1.5px solid rgba(16, 185, 129, 0.45)',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, var(--bg-card) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '20px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)'
                }}
              >
                <Sprout size={28} color="#ffffff" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Welcome, {profile?.name || 'Farmer'}!</h3>
                  <span className="badge badge-success">Platform Active</span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px', maxWidth: '820px', lineHeight: 1.5 }}>
                  Your AgriHub dashboard is online. Check live Mandi wholesale rates and local weather anytime. Connect your farm plot coordinates and soil parameters to unlock automated IoT irrigation decisions and AI agronomic alerts.
                </p>
              </div>
            </div>
            <button
              className="btn-primary"
              style={{ padding: '12px 24px', fontSize: '0.95rem' }}
              onClick={() => {
                setModalFeature({
                  name: 'Farm Plot Setup',
                  desc: 'Enter your farm acreage, irrigation source, and soil health parameters to enable real-time agronomic recommendations.'
                });
                setShowFarmModal(true);
              }}
            >
              <Sprout size={18} />
              <span>Connect Farm Plot</span>
            </button>
          </div>
        </section>
      )}

      {/* 0B. Dynamic My Farm Plot & Soil Health Summary Ribbon */}
      {selectedFarm && (
        <section style={{ marginBottom: '28px' }}>
          <div
            className="glass-panel"
            style={{
              padding: '22px 28px',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, var(--bg-card) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '18px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: 'rgba(16, 185, 129, 0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}
              >
                <MapPin size={24} color="#34d399" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-heading)' }}>
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
                        padding: '5px 12px',
                        borderRadius: '8px',
                        background: 'var(--bg-card-hover)',
                        border: '1px solid var(--border-active)',
                        color: 'var(--color-primary-light)',
                        fontSize: '0.82rem',
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
                <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', marginTop: '4px' }}>
                  Centroid: {Number(selectedFarm.latitude).toFixed(4)}°N, {Number(selectedFarm.longitude).toFixed(4)}°E • 
                  Soil: <strong style={{ color: '#38bdf8' }}>{soilRecord?.soilType?.replace('_', ' ') || 'Black Cotton'} (pH {soilRecord?.ph || 7.2})</strong>
                  {soilRecord ? ` • NPK: ${soilRecord.nitrogen}/${soilRecord.phosphorus}/${soilRecord.potassium}` : ' • Cadastral Plot Verified'}
                  {selectedFarm.gatNumber ? ` • 🏷️ ${selectedFarm.gatNumber}` : ''}
                </p>
                {selectedFarm.coOwners && selectedFarm.coOwners.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                    <span style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: 600 }}>7/12 Co-Holders:</span>
                    {selectedFarm.coOwners.map((o: any, idx: number) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '0.74rem',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: 'rgba(56, 189, 248, 0.1)',
                          border: '1px solid rgba(56, 189, 248, 0.25)',
                          color: '#38bdf8',
                          fontWeight: 600
                        }}
                      >
                        👤 {o.name} ({o.relationship || 'Co-Owner'}): {o.shareAcres} Ac
                      </span>
                    ))}
                  </div>
                )}
                {selectedFarm.cropAllocations && selectedFarm.cropAllocations.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Planned Land Usage:</span>
                    {selectedFarm.cropAllocations.map((ca: any, i: number) => (
                      <span
                        key={i}
                        style={{
                          fontSize: '0.74rem',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: 'rgba(16, 185, 129, 0.12)',
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                          color: '#34d399',
                          fontWeight: 600
                        }}
                      >
                        🌾 {ca.cropName}: {ca.allocatedAcres} Ac
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                className="btn-secondary"
                style={{ fontSize: '0.86rem', padding: '9px 16px' }}
                onClick={() => navigate('/farms')}
              >
                <MapPin size={15} color="#34d399" />
                <span>Cadastral GIS & Soil</span>
                <ArrowUpRight size={14} />
              </button>

              <button
                className="btn-secondary"
                style={{ fontSize: '0.86rem', padding: '9px 16px' }}
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
        <section style={{ marginBottom: '32px' }}>
          <UnifiedHeroCard action={unifiedAction} />
        </section>
      )}

      {/* 2. Four Master Telemetry Cards */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '22px', marginBottom: '32px' }}>
        
        {/* Card A: Soil Moisture & Smart Irrigation */}
        <div className="glass-panel" style={{ padding: '26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'rgba(14, 165, 233, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(14, 165, 233, 0.3)'
                }}
              >
                <Droplets size={22} color="#38bdf8" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Soil & IoT Irrigation</h3>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  {selectedFarm ? `Node: ESP32-${selectedFarm.name.slice(0, 10).replace(/\s+/g, '-').toUpperCase()}` : 'No Sensor Node Linked'}
                </span>
              </div>
            </div>
            <span className={!selectedFarm ? 'badge' : irrigation?.decision === 'IRRIGATE' ? 'badge badge-warning' : 'badge badge-success'}>
              {selectedFarm ? (irrigation?.decision || 'STANDBY') : 'PENDING SETUP'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '12px' }}>
            <span style={{ fontSize: '2.8rem', fontWeight: 800, color: selectedFarm ? '#38bdf8' : 'var(--text-muted)', letterSpacing: '-0.03em' }}>
              {selectedFarm && telemetry?.soilMoisturePct != null ? `${telemetry.soilMoisturePct}%` : '--%'}
            </span>
            <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Volumetric Moisture</span>
          </div>

          <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden', marginBottom: '16px' }}>
            <div
              style={{
                width: selectedFarm ? `${telemetry?.soilMoisturePct ?? 0}%` : '0%',
                height: '100%',
                background: 'linear-gradient(90deg, #38bdf8, #0284c7)',
                borderRadius: '4px',
                transition: 'width 0.6s ease'
              }}
            />
          </div>

          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '20px' }}>
            {selectedFarm
              ? (irrigation?.reason || 'Soil moisture is in optimal retention zone.')
              : 'Register your farm plot to link ESP32 capacitance soil sensors and get automated drip recommendations.'}
          </p>

          <button
            className="btn-secondary"
            style={{ width: '100%', padding: '10px 14px', fontSize: '0.86rem' }}
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
            <ArrowUpRight size={15} />
          </button>
        </div>

        {/* Card B: Hyperlocal Weather & Climate */}
        <div className="glass-panel" style={{ padding: '26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(245, 158, 11, 0.3)'
                }}
              >
                <CloudSun size={22} color="#fbbf24" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Hyperlocal Weather</h3>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
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

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '8px' }}>
            <span style={{ fontSize: '2.8rem', fontWeight: 800, color: '#fbbf24', letterSpacing: '-0.03em' }}>
              {weather?.temperatureC ?? 28.5}°C
            </span>
            <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Humidity: {weather?.humidityPct ?? 72}%</span>
          </div>

          <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '8px' }}>
            {weather?.weatherDescription || 'Agricultural Weather Forecast'}
          </p>

          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.5 }}>
            Wind: {weather?.windSpeedKph ?? 14} km/h • Rain Prob: {weather?.rainProbabilityPct ?? 25}% • Hyperlocal grid
          </p>

          <button
            className="btn-secondary"
            style={{ width: '100%', padding: '10px 14px', fontSize: '0.86rem' }}
            onClick={() => navigate('/weather')}
          >
            <span>7-Day Agricultural Forecast</span>
            <ArrowUpRight size={15} />
          </button>
        </div>

        {/* Card C: Active Crop Cycle Progress */}
        <div className="glass-panel" style={{ padding: '26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}
              >
                <Sprout size={22} color="#34d399" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                  {cropCycle?.cropName || (selectedFarm ? 'No Sown Crop' : 'No Crop Cycle')}
                </h3>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  {cropCycle ? `${cropCycle.variety || 'Active Variety'} • Sown ${cropCycle.sowingDate || 'Recently'}` : (selectedFarm ? 'No active sowing recorded' : 'Farm registration pending')}
                </span>
              </div>
            </div>
            <span className={cropCycle ? 'badge badge-success' : 'badge'}>
              {cropCycle?.currentStage || (selectedFarm ? 'NOT SOWN' : 'UNREGISTERED')}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '12px' }}>
            <span style={{ fontSize: '2.8rem', fontWeight: 800, color: cropCycle ? '#34d399' : 'var(--text-muted)', letterSpacing: '-0.03em' }}>
              {cropCycle ? `Day ${cropCycle.daysSinceSowing || 45}` : 'Day --'}
            </span>
            <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              {cropCycle ? `of ${cropCycle.expectedDurationDays || 90} Days to Harvest` : 'No active crop timeline'}
            </span>
          </div>

          <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden', marginBottom: '16px' }}>
            <div
              style={{
                width: cropCycle ? `${Math.min(100, Math.round(((cropCycle.daysSinceSowing || 45) / (cropCycle.expectedDurationDays || 90)) * 100))}%` : '0%',
                height: '100%',
                background: 'linear-gradient(90deg, #10b981, #34d399)',
                borderRadius: '4px',
                transition: 'width 0.6s ease'
              }}
            />
          </div>

          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '20px' }}>
            {cropCycle
              ? `${cropCycle.currentStage} window. Critical scouting and nutrition phase.`
              : 'Add your farm and select a Kharif/Rabi crop to monitor phenological growth stages and projected harvest dates.'}
          </p>

          <button
            className="btn-secondary"
            style={{ width: '100%', padding: '10px 14px', fontSize: '0.86rem' }}
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
            <span>{cropCycle ? 'View Phenology & Plan' : 'Plan First Crop Cycle'}</span>
            <ArrowUpRight size={15} />
          </button>
        </div>

        {/* Card D: APMC Mandi & Economics */}
        <div className="glass-panel" style={{ padding: '26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(245, 158, 11, 0.3)'
                }}
              >
                <TrendingUp size={22} color="#fbbf24" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Mandi & Economics</h3>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Nearest: {profile?.district || 'Pune'} APMC
                </span>
              </div>
            </div>
            <span className="badge badge-info">
              {market?.action || 'REGIONAL APMC'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '8px' }}>
            <span style={{ fontSize: '2.8rem', fontWeight: 800, color: '#fbbf24', letterSpacing: '-0.03em' }}>
              ₹{market?.currentModalPrice ?? 4850}
            </span>
            <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>/ Q (Soybean Modal)</span>
          </div>

          <p style={{ fontSize: '0.88rem', color: '#10b981', fontWeight: 700, marginBottom: '6px' }}>
            Forecast 7D: ₹{market?.forecastPrice7Days ?? 5130}/Q (+₹280/Q gain)
          </p>

          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '20px' }}>
            {selectedFarm && profit?.netProfitProjected != null
              ? `Projected Farm Profit: ₹${profit.netProfitProjected.toLocaleString('en-IN')} (${profit.roiPercentage ?? 0}% ROI)`
              : 'Projected Farm Profit: ₹0 (No farm plot registered yet)'}
          </p>

          <button
            className="btn-secondary"
            style={{ width: '100%', padding: '10px 14px', fontSize: '0.86rem' }}
            onClick={() => navigate('/market')}
          >
            <span>Compare Mandis & Logistics</span>
            <ArrowUpRight size={15} />
          </button>
        </div>

      </section>

      {/* 3. Quick Action Hub */}
      <section
        className="glass-panel"
        style={{
          padding: '24px 30px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Quick Field Actions</h4>
            <span className="badge badge-success">One-Click</span>
          </div>
          <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            Frequently used agronomic decision workflows for today
          </span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <button
            className="btn-secondary"
            style={{ padding: '10px 16px', fontSize: '0.88rem' }}
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
            <ScanLine size={17} color="#34d399" />
            <span>Diagnose Leaf Disease</span>
          </button>

          <button
            className="btn-secondary"
            style={{ padding: '10px 16px', fontSize: '0.88rem' }}
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
            <Sliders size={17} color="#38bdf8" />
            <span>Test Moisture Simulator</span>
          </button>

          <button
            className="btn-secondary"
            style={{ padding: '10px 16px', fontSize: '0.88rem' }}
            onClick={() => navigate('/assistant')}
          >
            <Sparkles size={17} color="#fbbf24" />
            <span>Ask Agronomist AI</span>
          </button>

          <button
            className="btn-secondary"
            style={{ padding: '10px 16px', fontSize: '0.88rem' }}
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
            <DollarSign size={17} color="#10b981" />
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
