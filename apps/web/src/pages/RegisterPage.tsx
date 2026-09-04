import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sprout, Phone, Lock, User, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (formData.mobile.length !== 10 || !/^[6-9]\d{9}$/.test(formData.mobile)) {
      setError('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await register({
        name: formData.name.trim(),
        mobile: formData.mobile.trim(),
        password: formData.password
      });
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your inputs.');
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
        position: 'relative'
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '36px',
          border: '1px solid var(--border-active)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              marginBottom: '12px',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.35)'
            }}
          >
            <Sprout size={30} color="#ffffff" />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-heading)' }}>
            Farmer Signup
          </h2>
          <p style={{ color: 'var(--text-main)', fontSize: '0.88rem', marginTop: '4px' }}>
            Create your account with your name, mobile, and password.
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#f87171',
              fontSize: '0.88rem',
              fontWeight: 600,
              marginBottom: '18px'
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label className="form-label">
              Full Name <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <User size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '13px' }} />
              <input
                type="text"
                placeholder="e.g. Ramesh Patel"
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                style={{ paddingLeft: '40px' }}
              />
            </div>
          </div>

          <div>
            <label className="form-label">
              Mobile Number (10 Digits) <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <Phone size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '13px' }} />
              <input
                type="text"
                inputMode="numeric"
                placeholder="e.g. 9876543210"
                className="form-input"
                value={formData.mobile}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setFormData({ ...formData, mobile: cleaned });
                }}
                required
                maxLength={10}
                style={{ paddingLeft: '40px' }}
              />
            </div>
          </div>

          <div>
            <label className="form-label">
              Password <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '13px' }} />
              <input
                type="password"
                placeholder="Min 6 characters"
                className="form-input"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
                style={{ paddingLeft: '40px' }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', marginTop: '8px', padding: '13px', fontSize: '1rem', fontWeight: 700 }}
            disabled={loading}
          >
            <span>{loading ? 'Creating Account...' : 'Create Farmer Account'}</span>
            <ArrowRight size={18} />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '22px', fontSize: '0.9rem', color: 'var(--text-main)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#10b981', fontWeight: 700 }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
