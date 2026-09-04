import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowRight, Sparkles, CheckCircle2, CloudRain, Droplets, Info } from 'lucide-react';

interface UnifiedActionProps {
  action: {
    title: string;
    actionCategory: string;
    priority: string;
    headline: string;
    detailedReason: string;
    contributingFactors: {
      weatherSummary?: string;
      soilMoisturePct?: number;
      cropStage?: string;
      activeRisks?: string[];
      marketInsight?: string;
    };
    actionButtonText: string;
    actionNavigationPath: string;
  };
}

export const UnifiedHeroCard: React.FC<UnifiedActionProps> = ({ action }) => {
  const navigate = useNavigate();

  const isHighPriority = action.priority === 'HIGH' || action.priority === 'CRITICAL';

  return (
    <div
      className="glass-panel"
      style={{
        padding: '28px',
        borderRadius: 'var(--radius-lg)',
        border: isHighPriority
          ? '1px solid rgba(239, 68, 68, 0.4)'
          : '1px solid rgba(16, 185, 129, 0.4)',
        background: isHighPriority
          ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(19, 28, 21, 0.95) 100%)'
          : 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(19, 28, 21, 0.95) 100%)',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: isHighPriority ? '0 0 35px -5px rgba(239, 68, 68, 0.25)' : 'var(--shadow-glow)'
      }}
    >
      {/* Background Accent Glow */}
      <div
        style={{
          position: 'absolute',
          top: '-30%',
          right: '-10%',
          width: '350px',
          height: '350px',
          borderRadius: '50%',
          background: isHighPriority ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
          filter: 'blur(70px)',
          pointerEvents: 'none'
        }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: isHighPriority ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'
              }}
            >
              {isHighPriority ? (
                <ShieldAlert size={20} color="#f87171" />
              ) : (
                <Sparkles size={20} color="#34d399" />
              )}
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: isHighPriority ? '#f87171' : '#34d399' }}>
                Unified Agronomic Directive • Today's Highest Priority
              </span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{action.title}</h2>
            </div>
          </div>

          <span
            className={
              isHighPriority ? 'badge badge-danger' : action.priority === 'MEDIUM' ? 'badge badge-warning' : 'badge badge-success'
            }
          >
            {action.priority} PRIORITY
          </span>
        </div>

        {/* Headline */}
        <p style={{ fontSize: '1.15rem', fontWeight: 600, color: '#ffffff', marginBottom: '14px', lineHeight: 1.4 }}>
          {action.headline}
        </p>

        {/* Detailed Agronomic Reason */}
        <p style={{ fontSize: '0.94rem', color: 'var(--text-muted)', marginBottom: '22px', maxWidth: '980px', lineHeight: 1.6 }}>
          {action.detailedReason}
        </p>

        {/* Multi-Stream Contributing Signal Badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '24px' }}>
          {action.contributingFactors.soilMoisturePct !== undefined && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '0.82rem' }}>
              <Droplets size={14} color="#38bdf8" />
              <span>Soil Moisture: <strong>{action.contributingFactors.soilMoisturePct}%</strong></span>
            </div>
          )}
          {action.contributingFactors.weatherSummary && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '0.82rem' }}>
              <CloudRain size={14} color="#38bdf8" />
              <span>Weather: <strong>{action.contributingFactors.weatherSummary}</strong></span>
            </div>
          )}
          {action.contributingFactors.cropStage && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '0.82rem' }}>
              <CheckCircle2 size={14} color="#34d399" />
              <span>Crop Stage: <strong>{action.contributingFactors.cropStage}</strong></span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          className="btn-primary"
          style={{ background: isHighPriority ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : undefined }}
          onClick={() => navigate(action.actionNavigationPath)}
        >
          <span>{action.actionButtonText}</span>
          <ArrowRight size={17} />
        </button>
      </div>
    </div>
  );
};
