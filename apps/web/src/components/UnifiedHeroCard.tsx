import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  CloudRain,
  Droplets,
  TrendingUp,
  AlertOctagon
} from 'lucide-react';

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
  const isMediumPriority = action.priority === 'MEDIUM';

  const accentColor = isHighPriority ? '#ef4444' : isMediumPriority ? '#f59e0b' : '#10b981';
  const glowBg = isHighPriority
    ? 'rgba(239, 68, 68, 0.12)'
    : isMediumPriority
    ? 'rgba(245, 158, 11, 0.12)'
    : 'rgba(16, 185, 129, 0.12)';

  return (
    <div
      className="glass-panel"
      style={{
        padding: '30px',
        borderRadius: 'var(--radius-lg)',
        border: `1.5px solid ${isHighPriority ? 'rgba(239, 68, 68, 0.45)' : isMediumPriority ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.45)'}`,
        background: `linear-gradient(135deg, ${glowBg} 0%, var(--bg-card) 60%)`,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: isHighPriority
          ? '0 12px 36px -8px rgba(239, 68, 68, 0.3)'
          : isMediumPriority
          ? '0 12px 36px -8px rgba(245, 158, 11, 0.25)'
          : 'var(--shadow-glow)'
      }}
    >
      {/* Ambient Radial Spotlight */}
      <div
        style={{
          position: 'absolute',
          top: '-40%',
          right: '-10%',
          width: '420px',
          height: '420px',
          borderRadius: '50%',
          background: isHighPriority
            ? 'rgba(239, 68, 68, 0.18)'
            : isMediumPriority
            ? 'rgba(245, 158, 11, 0.16)'
            : 'rgba(16, 185, 129, 0.18)',
          filter: 'blur(80px)',
          pointerEvents: 'none'
        }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header Ribbon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '18px',
            flexWrap: 'wrap',
            gap: '14px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: isHighPriority
                  ? 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)'
                  : isMediumPriority
                  ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                  : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                boxShadow: `0 4px 14px ${isHighPriority ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`
              }}
            >
              {isHighPriority ? (
                <ShieldAlert size={22} color="#ffffff" />
              ) : isMediumPriority ? (
                <AlertOctagon size={22} color="#ffffff" />
              ) : (
                <Sparkles size={22} color="#ffffff" />
              )}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '0.74rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    fontWeight: 800,
                    color: accentColor
                  }}
                >
                  Unified Agronomic Directive • Today's Highest Priority
                </span>
                <span className="live-pulse-dot" style={{ backgroundColor: accentColor }} />
              </div>
              <h2
                style={{
                  fontSize: '1.45rem',
                  fontWeight: 800,
                  marginTop: '2px',
                  letterSpacing: '-0.02em',
                  color: 'var(--text-heading)'
                }}
              >
                {action.title}
              </h2>
            </div>
          </div>

          <span
            className={
              isHighPriority
                ? 'badge badge-danger'
                : isMediumPriority
                ? 'badge badge-warning'
                : 'badge badge-success'
            }
            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
          >
            {action.priority} PRIORITY
          </span>
        </div>

        {/* Headline */}
        <p
          style={{
            fontSize: '1.18rem',
            fontWeight: 700,
            color: 'var(--text-heading)',
            marginBottom: '12px',
            lineHeight: 1.45
          }}
        >
          {action.headline}
        </p>

        {/* Detailed Agronomic Reason */}
        <p
          style={{
            fontSize: '0.94rem',
            color: 'var(--text-muted)',
            marginBottom: '22px',
            maxWidth: '1050px',
            lineHeight: 1.6
          }}
        >
          {action.detailedReason}
        </p>

        {/* Contributing Signal Badges */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            marginBottom: '26px'
          }}
        >
          {action.contributingFactors.soilMoisturePct !== undefined && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 14px',
                background: 'rgba(14, 165, 233, 0.08)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(14, 165, 233, 0.25)',
                fontSize: '0.84rem'
              }}
            >
              <Droplets size={16} color="#38bdf8" />
              <span>
                Soil Moisture: <strong style={{ color: '#38bdf8' }}>{action.contributingFactors.soilMoisturePct}%</strong>
              </span>
            </div>
          )}

          {action.contributingFactors.weatherSummary && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 14px',
                background: 'rgba(245, 158, 11, 0.08)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                fontSize: '0.84rem'
              }}
            >
              <CloudRain size={16} color="#fbbf24" />
              <span>
                Weather: <strong style={{ color: '#fbbf24' }}>{action.contributingFactors.weatherSummary}</strong>
              </span>
            </div>
          )}

          {action.contributingFactors.cropStage && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 14px',
                background: 'rgba(16, 185, 129, 0.08)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                fontSize: '0.84rem'
              }}
            >
              <CheckCircle2 size={16} color="#34d399" />
              <span>
                Crop Stage: <strong style={{ color: '#34d399' }}>{action.contributingFactors.cropStage}</strong>
              </span>
            </div>
          )}

          {action.contributingFactors.marketInsight && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 14px',
                background: 'rgba(168, 85, 247, 0.08)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(168, 85, 247, 0.25)',
                fontSize: '0.84rem'
              }}
            >
              <TrendingUp size={16} color="#c084fc" />
              <span>
                Mandi Signal: <strong style={{ color: '#c084fc' }}>{action.contributingFactors.marketInsight}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          className="btn-primary"
          style={{
            background: isHighPriority
              ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
              : isMediumPriority
              ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
              : undefined,
            padding: '12px 24px',
            fontSize: '0.96rem'
          }}
          onClick={() => navigate(action.actionNavigationPath)}
        >
          <span>{action.actionButtonText}</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};
