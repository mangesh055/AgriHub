import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Sprout,
  LayoutDashboard,
  MapPin,
  Compass,
  CloudRain,
  Droplets,
  ScanLine,
  TrendingUp,
  Coins,
  BookOpen,
  Bot,
  Bell,
  LogOut,
  Sun,
  Moon,
  Languages
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

interface NavbarProps {
  currentFarmName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ currentFarmName = 'Krishna Agri Fields' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, primaryFarm, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const navItems = [
    { path: '/', label: t('navDashboard', 'Dashboard'), icon: LayoutDashboard },
    { path: '/farms', label: t('navFarms', 'My Farms'), icon: MapPin },
    { path: '/crop-plan', label: t('navCropPlan', 'Crop Plan'), icon: Compass },
    { path: '/weather', label: t('navWeather', 'Weather'), icon: CloudRain },
    { path: '/irrigation', label: t('navIrrigation', 'IoT Irrigation'), icon: Droplets },
    { path: '/crop-health', label: t('navCropHealth', 'Crop Health'), icon: ScanLine },
    { path: '/market', label: t('navMarket', 'Mandi & Market'), icon: TrendingUp },
    { path: '/economics', label: t('navEconomics', 'Profit & Costs'), icon: Coins },
    { path: '/knowledge', label: t('navKnowledge', 'Schemes & Seeds'), icon: BookOpen },
    { path: '/assistant', label: t('navAssistant', 'AI Agronomist'), icon: Bot }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Extract initials
  const initials = profile?.name
    ? profile.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'RP';

  return (
    <header style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-header)', backdropFilter: 'blur(16px)', position: 'sticky', top: 0, zIndex: 1000, transition: 'background-color 0.3s ease' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 28px', maxWidth: '1600px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 0 16px rgba(16, 185, 129, 0.4)' }}>
            <Sprout size={24} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.03em', background: 'linear-gradient(90deg, #34d399, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              AgriHub
            </h1>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600 }}>
              Smart Agricultural Intelligence Platform
            </span>
          </div>
        </div>

        {/* Current Active Farm Context Pill & User Menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: 'var(--radius-full)', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }}></span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#34d399' }}>{user?.role === 'ADMIN' ? t('roleAdmin') : t('roleFarmer')}</span>
          </div>

          {primaryFarm ? (
            <Link
              to="/farms"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                color: '#38bdf8',
                fontSize: '0.85rem',
                fontWeight: 600,
                textDecoration: 'none'
              }}
              title="Click to view farm cadastral & soil details"
            >
              <MapPin size={14} color="#38bdf8" />
              <span>{primaryFarm.name} ({primaryFarm.areaAcres} Ac)</span>
            </Link>
          ) : (
            <Link
              to="/farms"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                color: '#fbbf24',
                fontSize: '0.85rem',
                fontWeight: 600,
                textDecoration: 'none'
              }}
            >
              <Sprout size={14} color="#fbbf24" />
              <span>{t('registerFarm')}</span>
            </Link>
          )}

            {/* Clickable Profile Picture & Name to open dedicated Profile Page */}
            <Link
              to="/profile"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '5px 12px',
                borderRadius: '12px',
                background: location.pathname === '/profile' ? 'var(--color-primary-subtle)' : 'rgba(255, 255, 255, 0.05)',
                border: location.pathname === '/profile' ? '1px solid #059669' : '1px solid var(--border-subtle)',
                textDecoration: 'none',
                textAlign: 'left',
                transition: 'var(--transition-smooth)'
              }}
              className="table-row-hover"
              title={language === 'mr' ? 'प्रोफाइल पाहण्यासाठी येथे क्लिक करा (Click to view profile page)' : 'Click to view farmer profile page'}
              aria-label="View Farmer Profile Page"
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: '#059669',
                  border: '1px solid rgba(5, 150, 105, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  color: '#ffffff',
                  flexShrink: 0
                }}
              >
                {initials}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {profile?.name || 'Ramesh Patel'}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {profile?.district || 'Pune'}, {profile?.state || 'Maharashtra'}
                </span>
              </div>
            </Link>

            {/* Language Switcher (English / मराठी) */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'mr' : 'en')}
              style={{
                marginLeft: '6px',
                background: language === 'mr' ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255, 255, 255, 0.08)',
                border: language === 'mr' ? '1px solid #10b981' : '1px solid var(--border-subtle)',
                color: language === 'mr' ? '#10b981' : 'var(--text-main)',
                padding: '7px 12px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: 700,
                transition: 'var(--transition-smooth)'
              }}
              title={language === 'en' ? 'मराठी भाषेवर स्विच करा (Switch to Marathi)' : 'Switch to English'}
              aria-label="Toggle language"
            >
              <Languages size={15} />
              <span>{language === 'en' ? 'मराठी' : 'English'}</span>
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              style={{
                marginLeft: '6px',
                background: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(16, 185, 129, 0.1)',
                border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(16, 185, 129, 0.3)',
                color: theme === 'dark' ? '#fbbf24' : '#059669',
                padding: '7px 11px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 600,
                transition: 'var(--transition-smooth)'
              }}
              title={theme === 'dark' ? 'Switch to Light Daylight Theme' : 'Switch to Dark Night Theme'}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              <span>{theme === 'dark' ? t('lightTheme') : t('darkTheme')}</span>
            </button>

            <button
              onClick={handleLogout}
              style={{
                marginLeft: '6px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#f87171',
                padding: '7px 11px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 600
              }}
              title="Sign Out"
            >
              <LogOut size={14} />
              <span>{t('logout')}</span>
            </button>
          </div>
        </div>

      {/* Navigation Bar */}
      <nav style={{ display: 'flex', gap: '6px', padding: '0 28px', maxWidth: '1600px', margin: '0 auto', overflowX: 'auto' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 14px',
                fontSize: '0.88rem',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#34d399' : 'var(--text-muted)',
                borderBottom: isActive ? '2px solid #10b981' : '2px solid transparent',
                transition: 'var(--transition-smooth)',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={17} color={isActive ? '#34d399' : 'var(--text-muted)'} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
};
