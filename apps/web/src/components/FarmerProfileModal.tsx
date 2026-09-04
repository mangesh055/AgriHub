import React, { useState } from 'react';
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
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../api/client';
import { Link } from 'react-router-dom';

interface FarmerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FarmerProfileModal: React.FC<FarmerProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, profile, primaryFarm, logout, refreshAuth } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const isMr = language === 'mr';

  const [isEditing, setIsEditing] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: profile?.name || 'Ramesh Patel',
    village: profile?.village || 'Uruli Kanchan',
    taluka: profile?.taluka || 'Haveli',
    district: profile?.district || 'Pune',
    state: profile?.state || 'Maharashtra'
  });

  if (!isOpen) return null;

  const initials = (formData.name || 'Ramesh Patel')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleCopyId = () => {
    const idToCopy = profile?.id || user?.id || '22222222-2222-2222-2222-222222222222';
    navigator.clipboard.writeText(idToCopy);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.updateProfile(formData);
      await refreshAuth();
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2500,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        overflowY: 'auto',
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        padding: '40px 16px 60px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '540px',
          borderRadius: '16px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          position: 'relative',
          overflow: 'hidden',
          color: 'var(--text-main)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div
          style={{
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-card)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(5, 150, 105, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#059669'
              }}
            >
              <User size={18} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-heading)' }}>
              {isMr ? 'शेतकरी प्रोफाइल' : 'Farmer Profile'}
            </h3>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'var(--transition-smooth)'
            }}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content Body */}
        <div style={{ padding: '20px' }}>
          {/* Farmer Primary Hero Identity */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '16px',
              borderRadius: '12px',
              background: 'var(--color-primary-subtle)',
              border: '1px solid rgba(5, 150, 105, 0.2)',
              marginBottom: '18px'
            }}
          >
            {/* Avatar Circle - Clean Professional No Glow */}
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.35rem',
                fontWeight: 800,
                color: '#ffffff',
                flexShrink: 0
              }}
            >
              {initials}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-heading)' }}>
                  {formData.name}
                </h4>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: '#10b981',
                    color: '#ffffff',
                    fontSize: '0.72rem',
                    fontWeight: 700
                  }}
                >
                  <CheckCircle2 size={12} />
                  {isMr ? 'प्रमाणित' : 'Verified'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                <MapPin size={13} color="#059669" />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {formData.village}, {formData.district}
                </span>
              </div>
            </div>

            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="btn btn-secondary"
                style={{
                  padding: '6px 12px',
                  fontSize: '0.78rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  borderRadius: '8px'
                }}
              >
                <Edit3 size={13} />
                <span>{isMr ? 'संपादन' : 'Edit'}</span>
              </button>
            )}
          </div>

          {/* Body: Editing Form vs Read-Only Details */}
          {isEditing ? (
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
                  {isMr ? 'शेतकऱ्याचे पूर्ण नाव (Full Name)' : 'Full Name'}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  style={{ width: '100%' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
                    {isMr ? 'गाव (Village)' : 'Village'}
                  </label>
                  <input
                    type="text"
                    value={formData.village}
                    onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
                    {isMr ? 'तालुका (Taluka)' : 'Taluka'}
                  </label>
                  <input
                    type="text"
                    value={formData.taluka}
                    onChange={(e) => setFormData({ ...formData, taluka: e.target.value })}
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
                    {isMr ? 'जिल्हा (District)' : 'District'}
                  </label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px' }}>
                    {isMr ? 'राज्य (State)' : 'State'}
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '9px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Check size={15} />
                  <span>{saving ? (isMr ? 'जतन होत आहे...' : 'Saving...') : (isMr ? 'माहिती जतन करा' : 'Save Changes')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="btn btn-secondary"
                  style={{ padding: '9px 16px', fontSize: '0.85rem' }}
                >
                  {isMr ? 'रद्द करा' : 'Cancel'}
                </button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Account & Contact Details Card */}
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: 'var(--bg-card-hover)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {isMr ? 'नोंदणीकृत मोबाईल' : 'Registered Mobile'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-heading)', marginTop: '2px' }}>
                      <Phone size={14} color="#0284c7" />
                      <span>+91 {user?.mobile || '9876543210'}</span>
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {isMr ? 'खाते भूमिका' : 'Account Role'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-heading)', marginTop: '2px' }}>
                      <Shield size={14} color="#059669" />
                      <span>{user?.role || 'FARMER'}</span>
                    </div>
                  </div>
                </div>

                {/* Farmer UID with Clean High-Contrast Copy Box */}
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {isMr ? 'शेतकरी ओळख क्रमांक (Farmer UID)' : 'Farmer Profile UID'}
                  </span>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(0, 0, 0, 0.05)',
                      border: '1px solid var(--border-subtle)',
                      padding: '7px 10px',
                      borderRadius: '8px',
                      marginTop: '4px'
                    }}
                  >
                    <span style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: 'var(--text-heading)', fontWeight: 600 }}>
                      {profile?.id || user?.id || '22222222-2222-2222-2222-222222222222'}
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
                        fontSize: '0.72rem',
                        fontWeight: 700
                      }}
                      title="Copy UID"
                    >
                      {copiedId ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedId ? (isMr ? 'कॉपी झाले' : 'Copied') : (isMr ? 'कॉपी' : 'Copy')}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Location Geography Card */}
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: 'var(--bg-card-hover)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.04em' }}>
                  {isMr ? 'पत्ता व ठिकाण तपशील' : 'Farm Location & Address'}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{isMr ? 'गाव' : 'Village'}</span>
                    <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-heading)' }}>{formData.village}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{isMr ? 'तालुका' : 'Taluka'}</span>
                    <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-heading)' }}>{formData.taluka}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{isMr ? 'जिल्हा' : 'District'}</span>
                    <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-heading)' }}>{formData.district}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{isMr ? 'राज्य' : 'State'}</span>
                    <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-heading)' }}>{formData.state}</div>
                  </div>
                </div>
              </div>

              {/* Farm Land Holdings Summary */}
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: 'var(--bg-card-hover)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {isMr ? 'शेत जमीन व सिंचन' : 'Farm Land Holdings'}
                  </div>
                  <Link
                    to="/farms"
                    onClick={onClose}
                    style={{ fontSize: '0.75rem', color: '#059669', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 700 }}
                  >
                    <span>{isMr ? 'शेती व्यवस्थापन' : 'Manage Farms'}</span>
                    <ChevronRight size={13} />
                  </Link>
                </div>

                {primaryFarm ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(5, 150, 105, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                      <Sprout size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-heading)' }}>{primaryFarm.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {primaryFarm.areaAcres} {isMr ? 'एकर' : 'Acres'} • {primaryFarm.irrigationSource}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                    {isMr ? 'कोणतीही शेती नोंदणीकृत नाही.' : 'No primary farm registered yet.'}{' '}
                    <Link to="/farms" onClick={onClose} style={{ color: '#0284c7', fontWeight: 700 }}>
                      {isMr ? 'शेत जोडा' : 'Add farm'}
                    </Link>
                  </div>
                )}
              </div>

              {/* Language & Theme Preferences */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px'
                }}
              >
                {/* Language Switcher */}
                <button
                  onClick={() => setLanguage(language === 'en' ? 'mr' : 'en')}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: 'var(--bg-card-hover)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    color: 'var(--text-main)',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Languages size={16} color="#059669" />
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{isMr ? 'भाषा' : 'Language'}</div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{language === 'mr' ? 'मराठी' : 'English'}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 700 }}>Switch</span>
                </button>

                {/* Theme Switcher */}
                <button
                  onClick={toggleTheme}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: 'var(--bg-card-hover)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    color: 'var(--text-main)',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {theme === 'dark' ? <Moon size={16} color="#fbbf24" /> : <Sun size={16} color="#d97706" />}
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{isMr ? 'थीम' : 'Theme'}</div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{theme === 'dark' ? 'Dark' : 'Light'}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#d97706', fontWeight: 700 }}>Toggle</span>
                </button>
              </div>

              {/* Log Out Button */}
              <div style={{ paddingTop: '4px' }}>
                <button
                  onClick={() => {
                    onClose();
                    logout();
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '10px',
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    color: '#dc2626',
                    fontWeight: 700,
                    fontSize: '0.86rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  <LogOut size={16} />
                  <span>{isMr ? 'खात्यातून बाहेर पडा (Log Out)' : 'Log Out from Account'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
