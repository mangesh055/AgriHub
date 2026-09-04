import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  MapPin,
  Phone,
  Shield,
  Sprout,
  Edit3,
  Check,
  X,
  Languages,
  Sun,
  Moon,
  LogOut,
  CheckCircle2,
  Copy,
  ChevronRight,
  ArrowLeft,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../api/client';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, primaryFarm, logout, refreshAuth } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const isMr = language === 'mr';

  const [isEditing, setIsEditing] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    name: profile?.name || 'Ramesh Patel',
    village: profile?.village || 'Uruli Kanchan',
    taluka: profile?.taluka || 'Haveli',
    district: profile?.district || 'Pune',
    state: profile?.state || 'Maharashtra'
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        village: profile.village || '',
        taluka: profile.taluka || '',
        district: profile.district || '',
        state: profile.state || ''
      });
    }
  }, [profile]);

  const initials = (formData.name || 'Ramesh Patel')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'RP';

  const handleCopyId = () => {
    const idToCopy = profile?.id || user?.id || '22222222-2222-2222-2222-222222222222';
    navigator.clipboard.writeText(idToCopy);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      setSaving(true);
      await api.updateProfile(formData);
      await refreshAuth();
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setErrorMessage(err?.response?.data?.error || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px 64px' }}>
      {/* Back to Dashboard Navigation Link */}
      <div style={{ marginBottom: '20px' }}>
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--text-muted)',
            textDecoration: 'none',
            fontSize: '0.88rem',
            fontWeight: 600,
            padding: '6px 12px',
            borderRadius: '8px',
            background: 'var(--bg-card-hover)',
            border: '1px solid var(--border-subtle)',
            transition: 'var(--transition-smooth)'
          }}
        >
          <ArrowLeft size={16} />
          <span>{t('backToDashboard', 'Back to Dashboard')}</span>
        </Link>
      </div>

      {/* Page Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-heading)', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
          {t('profilePageTitle', 'Farmer Profile & Account')}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>
          {t('profilePageSubtitle', 'Manage verified farmer identity, farm holding records, location, and account settings')}
        </p>
      </div>

      {/* Success Notification Alert */}
      {saveSuccess && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 18px',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#059669',
            marginBottom: '20px',
            fontSize: '0.92rem',
            fontWeight: 600
          }}
        >
          <CheckCircle2 size={18} color="#059669" />
          <span>{t('profileUpdated', 'Profile successfully updated!')}</span>
        </div>
      )}

      {/* Error Notification Alert */}
      {errorMessage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 18px',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#dc2626',
            marginBottom: '20px',
            fontSize: '0.92rem',
            fontWeight: 600
          }}
        >
          <AlertCircle size={18} color="#dc2626" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Responsive Layout Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Left Column: Identity, Details, and Location */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Identity Card */}
          <div
            style={{
              padding: '24px',
              borderRadius: '16px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                {/* Avatar Circle */}
                <div
                  style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '50%',
                    background: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.75rem',
                    fontWeight: 800,
                    color: '#ffffff',
                    flexShrink: 0
                  }}
                >
                  {initials}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                    <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-heading)', margin: 0 }}>
                      {formData.name}
                    </h2>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 10px',
                        borderRadius: '999px',
                        background: '#059669',
                        color: '#ffffff',
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}
                    >
                      <CheckCircle2 size={13} />
                      {t('verifiedFarmer', 'Verified Farmer')}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={14} color="#059669" />
                      {formData.village || 'Uruli Kanchan'}, {formData.district || 'Pune'}
                    </span>
                    <span>•</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Shield size={14} color="#0284c7" />
                      {user?.role || 'FARMER'}
                    </span>
                  </div>
                </div>
              </div>

              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn btn-secondary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    fontSize: '0.85rem',
                    borderRadius: '8px',
                    fontWeight: 700
                  }}
                >
                  <Edit3 size={15} />
                  <span>{t('editProfile', 'Edit Information')}</span>
                </button>
              )}
            </div>
          </div>

          {/* Edit Form or Read-Only Identity Card */}
          <div
            style={{
              padding: '24px',
              borderRadius: '16px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            {isEditing ? (
              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-heading)', margin: 0 }}>
                  {isMr ? 'वैयक्तिक माहिती संपादन' : 'Edit Personal & Location Details'}
                </h3>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    {isMr ? 'शेतकऱ्याचे पूर्ण नाव (Full Name)' : 'Full Name'}
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                    style={{ width: '100%', padding: '10px 12px', fontSize: '0.92rem' }}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                      {isMr ? 'गाव (Village)' : 'Village'}
                    </label>
                    <input
                      type="text"
                      value={formData.village}
                      onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                      className="input-field"
                      style={{ width: '100%', padding: '10px 12px', fontSize: '0.92rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                      {isMr ? 'तालुका (Taluka)' : 'Taluka'}
                    </label>
                    <input
                      type="text"
                      value={formData.taluka}
                      onChange={(e) => setFormData({ ...formData, taluka: e.target.value })}
                      className="input-field"
                      style={{ width: '100%', padding: '10px 12px', fontSize: '0.92rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                      {isMr ? 'जिल्हा (District)' : 'District'}
                    </label>
                    <input
                      type="text"
                      value={formData.district}
                      onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                      className="input-field"
                      style={{ width: '100%', padding: '10px 12px', fontSize: '0.92rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                      {isMr ? 'राज्य (State)' : 'State'}
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="input-field"
                      style={{ width: '100%', padding: '10px 12px', fontSize: '0.92rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn btn-primary"
                    style={{
                      padding: '10px 20px',
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: 700
                    }}
                  >
                    <Check size={16} />
                    <span>{saving ? t('savingChanges', 'Saving...') : t('saveChanges', 'Save Changes')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="btn btn-secondary"
                    style={{ padding: '10px 18px', fontSize: '0.9rem', fontWeight: 600 }}
                  >
                    {t('cancel', 'Cancel')}
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-heading)', margin: 0 }}>
                  {isMr ? 'खाते व संपर्क माहिती' : 'Account & Verification Details'}
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div style={{ padding: '14px', borderRadius: '10px', background: 'var(--bg-card-hover)', border: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {t('registeredPhone', 'Registered Mobile')}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: 700, color: 'var(--text-heading)', marginTop: '4px' }}>
                      <Phone size={16} color="#0284c7" />
                      <span>+91 {user?.mobile || '9876543210'}</span>
                    </div>
                  </div>

                  <div style={{ padding: '14px', borderRadius: '10px', background: 'var(--bg-card-hover)', border: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {t('accountRole', 'Account Role')}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: 700, color: 'var(--text-heading)', marginTop: '4px' }}>
                      <Shield size={16} color="#059669" />
                      <span>{user?.role || 'FARMER'}</span>
                    </div>
                  </div>
                </div>

                {/* Farmer UID Card */}
                <div style={{ padding: '14px', borderRadius: '10px', background: 'var(--bg-card-hover)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {t('farmerUid', 'Farmer Profile UID')}
                    </span>
                    <button
                      onClick={handleCopyId}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: copiedId ? '#059669' : 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}
                      title="Copy UID"
                    >
                      {copiedId ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedId ? (isMr ? 'कॉपी झाले' : 'Copied') : (isMr ? 'कॉपी' : 'Copy')}</span>
                    </button>
                  </div>
                  <div
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: 'var(--text-heading)',
                      padding: '8px 12px',
                      background: 'rgba(0, 0, 0, 0.06)',
                      borderRadius: '8px',
                      wordBreak: 'break-all'
                    }}
                  >
                    {profile?.id || user?.id || '22222222-2222-2222-2222-222222222222'}
                  </div>
                </div>

                {/* Location Details Summary */}
                <div>
                  <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
                    {t('locationDetails', 'Farm Location & Address')}
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                    <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-card-hover)', border: '1px solid var(--border-subtle)' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{isMr ? 'गाव' : 'Village'}</span>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-heading)' }}>{formData.village}</div>
                    </div>
                    <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-card-hover)', border: '1px solid var(--border-subtle)' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{isMr ? 'तालुका' : 'Taluka'}</span>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-heading)' }}>{formData.taluka}</div>
                    </div>
                    <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-card-hover)', border: '1px solid var(--border-subtle)' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{isMr ? 'जिल्हा' : 'District'}</span>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-heading)' }}>{formData.district}</div>
                    </div>
                    <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-card-hover)', border: '1px solid var(--border-subtle)' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{isMr ? 'राज्य' : 'State'}</span>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-heading)' }}>{formData.state}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Agricultural Holdings & Preferences */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Farm Land Holdings Card */}
          <div
            style={{
              padding: '24px',
              borderRadius: '16px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sprout size={18} color="#059669" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-heading)', margin: 0 }}>
                  {t('farmHoldings', 'Registered Land Holdings')}
                </h3>
              </div>
              <Link
                to="/farms"
                style={{
                  fontSize: '0.82rem',
                  color: '#059669',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 700
                }}
              >
                <span>{t('manageFarms', 'Manage Farms')}</span>
                <ChevronRight size={14} />
              </Link>
            </div>

            {primaryFarm ? (
              <div
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'var(--bg-card-hover)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px'
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    background: 'rgba(5, 150, 105, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#059669',
                    flexShrink: 0
                  }}
                >
                  <Sprout size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-heading)' }}>
                    {primaryFarm.name}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {primaryFarm.areaAcres} {isMr ? 'एकर' : 'Acres'} • {primaryFarm.irrigationSource}
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'var(--bg-card-hover)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.88rem',
                  color: 'var(--text-muted)'
                }}
              >
                {isMr ? 'कोणतीही शेती नोंदणीकृत नाही.' : 'No primary farm registered yet.'}{' '}
                <Link to="/farms" style={{ color: '#0284c7', fontWeight: 700 }}>
                  {isMr ? 'येथे क्लिक करून जोडा' : 'Click here to add one'}
                </Link>
              </div>
            )}
          </div>

          {/* System Preferences Card */}
          <div
            style={{
              padding: '24px',
              borderRadius: '16px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-heading)', margin: '0 0 16px 0' }}>
              {t('preferences', 'System Preferences')}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Language Selection */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '10px', background: 'var(--bg-card-hover)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Languages size={18} color="#059669" />
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                      {isMr ? 'भाषा निवडा' : 'Display Language'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {language === 'mr' ? 'मराठी (Marathi)' : 'English'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => setLanguage('en')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: language === 'en' ? '1px solid #059669' : '1px solid var(--border-subtle)',
                      background: language === 'en' ? '#059669' : 'transparent',
                      color: language === 'en' ? '#ffffff' : 'var(--text-main)',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    English
                  </button>
                  <button
                    onClick={() => setLanguage('mr')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: language === 'mr' ? '1px solid #059669' : '1px solid var(--border-subtle)',
                      background: language === 'mr' ? '#059669' : 'transparent',
                      color: language === 'mr' ? '#ffffff' : 'var(--text-main)',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    मराठी
                  </button>
                </div>
              </div>

              {/* Theme Selection */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '10px', background: 'var(--bg-card-hover)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {theme === 'dark' ? <Moon size={18} color="#fbbf24" /> : <Sun size={18} color="#d97706" />}
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                      {isMr ? 'थीम मोड' : 'Interface Theme'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {theme === 'dark' ? 'Dark (Night)' : 'Light (Day)'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={toggleTheme}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                    background: 'transparent',
                    color: 'var(--text-main)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
                </button>
              </div>
            </div>
          </div>

          {/* Account Logout Card */}
          <div
            style={{
              padding: '24px',
              borderRadius: '16px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-heading)', margin: '0 0 8px 0' }}>
              {isMr ? 'खाते सुरक्षा व निर्गमन' : 'Session & Account Security'}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '0 0 16px 0' }}>
              {isMr
                ? 'तुमचे सत्र सुरक्षित ठेवण्यासाठी वापर संपल्यानंतर खात्यातून बाहेर पडा.'
                : 'Sign out of your account on this device to protect your farm data.'}
            </p>
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#dc2626',
                fontWeight: 700,
                fontSize: '0.92rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'var(--transition-smooth)'
              }}
            >
              <LogOut size={17} />
              <span>{isMr ? 'खात्यातून बाहेर पडा (Log Out)' : 'Sign Out of Account'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
