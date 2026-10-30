import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Sprout,
  Lock,
  Phone,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Droplets,
  TrendingUp,
  Bot
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ mobile, password });
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Invalid mobile number or password');
    } finally {
      setLoading(false);
    }
  }

  async function handleDemoLogin() {
    setError('');
    setLoading(true);
    try {
      await login({ mobile: '9876543210', password: 'agrihub123' });
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'var(--bg-app)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background Ambient Radial Halos */}
      <div
        style={{
          position: 'absolute',
          top: '15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '600px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.16) 0%, transparent 70%)',
          filter: 'blur(80px)',
          pointerEvents: 'none'
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          right: '15%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(14, 165, 233, 0.1) 0%, transparent 70%)',
          filter: 'blur(90px)',
          pointerEvents: 'none'
        }}
      />

      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '40px',
          position: 'relative',
          zIndex: 1,
          border: '1px solid var(--border-active)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 30px -5px var(--color-primary-glow)'
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '58px',
              height: '58px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              boxShadow: '0 6px 24px rgba(16, 185, 129, 0.45)',
              marginBottom: '16px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <Sprout size={32} color="#ffffff" />
          </div>
          <h2 style={{ fontSize: '1.95rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-heading)' }}>
            Welcome to AgriHub
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Smart Agricultural Decision-Support System
          </p>
        </div>

        {/* Feature Badges Showcase */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            marginBottom: '24px'
          }}
        >
          <span className="badge badge-success" style={{ textTransform: 'none', fontSize: '0.76rem' }}>
            <Droplets size={12} /> IoT Irrigation
          </span>
          <span className="badge badge-info" style={{ textTransform: 'none', fontSize: '0.76rem' }}>
            <TrendingUp size={12} /> Live Mandi Rates
          </span>
          <span className="badge badge-warning" style={{ textTransform: 'none', fontSize: '0.76rem' }}>
            <Bot size={12} /> AI Agronomist
          </span>
        </div>

        {error && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(239, 68, 68, 0.14)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#f87171',
              fontSize: '0.88rem',
              fontWeight: 600,
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label className="form-label">
              Mobile Number
            </label>
            <div style={{ position: 'relative' }}>
              <Phone
                size={18}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '14px', top: '14px', pointerEvents: 'none' }}
              />
              <input
                type="tel"
                placeholder="10-digit mobile (e.g. 9876543210)"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
                maxLength={10}
                className="form-input"
                style={{ paddingLeft: '44px' }}
              />
            </div>
          </div>

          <div>
            <label className="form-label">
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={18}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '14px', top: '14px', pointerEvents: 'none' }}
              />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="form-input"
                style={{ paddingLeft: '44px' }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', marginTop: '6px', padding: '13px', fontSize: '1rem', fontWeight: 700 }}
            disabled={loading}
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            margin: '24px 0',
            color: 'var(--text-muted)',
            fontSize: '0.82rem',
            fontWeight: 600
          }}
        >
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
          <span>FAST ACCESS</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
        </div>

        {/* 1-Click Demo Login */}
        <button
          type="button"
          onClick={handleDemoLogin}
          className="btn-secondary"
          style={{
            width: '100%',
            borderColor: 'rgba(16, 185, 129, 0.45)',
            background: 'rgba(16, 185, 129, 0.08)',
            fontSize: '0.92rem',
            padding: '12px'
          }}
          disabled={loading}
        >
          <Sparkles size={17} color="#34d399" />
          <span>1-Click Demo Login (Ramesh Patel)</span>
        </button>

        {/* Sign Up Link */}
        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Don't have an account yet?{' '}
          <Link to="/register" style={{ color: 'var(--color-primary-light)', fontWeight: 700 }}>
            Register as a Farmer
          </Link>
        </div>
      </div>
    </div>
  );
};
