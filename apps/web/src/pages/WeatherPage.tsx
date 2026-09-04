import React, { useEffect, useState } from 'react';
import { CloudRain, Wind, Droplets, Sun, AlertTriangle, ShieldCheck, Thermometer } from 'lucide-react';
import { api } from '../api/client';

export const WeatherPage: React.FC = () => {
  const [current, setCurrent] = useState<any>(null);
  const [forecast, setForecast] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWeather() {
      try {
        setLoading(true);
        const [curr, fc, al] = await Promise.all([
          api.getCurrentWeather(),
          api.getWeatherForecast(),
          api.getWeatherAlerts()
        ]);
        setCurrent(curr);
        setForecast(fc);
        setAlerts(al);
      } catch (err) {
        console.error('Error fetching weather:', err);
      } finally {
        setLoading(false);
      }
    }
    loadWeather();
  }, []);

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '28px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Hyperlocal Weather Intelligence & Climate Risks</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
          Real-time weather station metrics and crop-stage-specific early warning triggers for Uruli Kanchan, Haveli.
        </p>
      </div>

      {/* 1. Active Climate Risk Warning Banners */}
      {alerts.length > 0 && (
        <section style={{ marginBottom: '28px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="glass-panel"
              style={{
                padding: '20px 24px',
                borderRadius: 'var(--radius-md)',
                border: alert.severity === 'HIGH' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)',
                background: alert.severity === 'HIGH' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px'
              }}
            >
              <div style={{ padding: '8px', borderRadius: '8px', background: alert.severity === 'HIGH' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)', color: alert.severity === 'HIGH' ? '#f87171' : '#fbbf24' }}>
                <AlertTriangle size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{alert.title}</h4>
                  <span className={alert.severity === 'HIGH' ? 'badge badge-danger' : 'badge badge-warning'}>
                    {alert.severity} RISK
                  </span>
                </div>
                <p style={{ fontSize: '0.9rem', color: '#ffffff', marginBottom: '8px' }}>{alert.message}</p>
                <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(0, 0, 0, 0.25)', borderLeft: '3px solid #10b981' }}>
                  <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 700, textTransform: 'uppercase' }}>Agronomist Action Required: </span>
                  <span style={{ fontSize: '0.86rem', color: 'var(--text-main)' }}>{alert.actionableGuidance}</span>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* 2. Current Conditions Hero Grid */}
      <section className="glass-panel" style={{ padding: '28px', marginBottom: '28px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '20px' }}>Current Weather Station Observations</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Thermometer size={26} color="#fbbf24" />
            </div>
            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Ambient Temperature</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{current?.temperatureC ?? 29.4}°C</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Droplets size={26} color="#38bdf8" />
            </div>
            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Relative Humidity</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{current?.humidityPct ?? 76}%</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CloudRain size={26} color="#34d399" />
            </div>
            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Precipitation Rate</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{current?.rainfallMm ?? 4.2} mm/h</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(167, 139, 250, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wind size={26} color="#a78bfa" />
            </div>
            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Wind Velocity</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{current?.windSpeedKph ?? 16.5} km/h</div>
            </div>
          </div>

        </div>
      </section>

      {/* 3. 7-Day Agricultural Forecast Cards */}
      <section>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>7-Day Agricultural Micro-Forecast</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '16px' }}>
          {forecast.map((f, i) => (
            <div
              key={f.date}
              className="glass-panel"
              style={{
                padding: '18px',
                textAlign: 'center',
                border: i === 0 ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-subtle)',
                background: i === 0 ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-glass)'
              }}
            >
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {i === 0 ? 'Tomorrow (Alert)' : f.date}
              </span>
              <div style={{ margin: '14px 0', display: 'flex', justifyContent: 'center' }}>
                {f.rainfallMm > 20 ? (
                  <CloudRain size={36} color="#38bdf8" />
                ) : f.rainfallMm > 0 ? (
                  <CloudRain size={36} color="#93c5fd" />
                ) : (
                  <Sun size={36} color="#fbbf24" />
                )}
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '4px' }}>
                {f.tempMaxC}° <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ {f.tempMinC}°</span>
              </div>
              <div style={{ fontSize: '0.82rem', color: f.rainfallMm > 20 ? '#f87171' : '#34d399', fontWeight: 700, marginBottom: '4px' }}>
                {f.rainfallMm} mm Rain ({f.rainProbabilityPct}%)
              </div>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{f.weatherDescription}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
