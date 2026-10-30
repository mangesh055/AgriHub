import React from 'react';
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
  LogOut,
  Sun,
  Moon,
  Languages,
  User,
  PlusCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

interface NavbarProps {
  currentFarmName?: string;
}

export const Navbar: React.FC<NavbarProps> = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, primaryFarm, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const navItems = [
    { path: '/', label: t('navDashboard', 'Dashboard'), icon: LayoutDashboard },
    { path: '/farms', label: t('navFarms', 'My Farms'), icon: MapPin },
    { path: '/crop-plan', label: t('navCropPlan', 'Crop Plan'), icon: Compass },
    { path: '/weather', label: t('navWeather', 'Weather & Radar'), icon: CloudRain },
    { path: '/irrigation', label: t('navIrrigation', 'IoT Irrigation'), icon: Droplets },
    { path: '/crop-health', label: t('navCropHealth', 'Crop Health AI'), icon: ScanLine },
    { path: '/market', label: t('navMarket', 'Mandi & Market'), icon: TrendingUp },
    { path: '/economics', label: t('navEconomics', 'Profit & Costs'), icon: Coins },
    { path: '/knowledge', label: t('navKnowledge', 'Schemes & Seeds'), icon: BookOpen },
    { path: '/assistant', label: t('navAssistant', 'AI Agronomist'), icon: Bot }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = profile?.name
    ? profile.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'RP';

  return (
    <header
      style={{
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-header)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        transition: 'background-color 0.3s ease, border-color 0.3s ease'
      }}
    >
      {/* Top Brand & Farmer Status Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 32px',
          maxWidth: '1680px',
          margin: '0 auto',
          gap: '16px',
          flexWrap: 'wrap'
        }}
      >
        {/* Brand Logo & Tagline */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textDecoration: 'none'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <Sprout size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '1.45rem',
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  fontFamily: 'var(--font-heading)',
                  background: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                AgriHub
              </span>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase'
                }}
              >
                v2.4 Smart Agro
              </span>
            </div>
            <p
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                letterSpacing: '0.03em',
                fontWeight: 600,
                marginTop: '-1px'
              }}
            >
              Unified Agricultural Decision-Support System
            </p>
          </div>
        </Link>

        {/* Right Utility & Context Area */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          
          {/* Live System Status Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 13px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: '#34d399'
            }}
          >
            <span className="live-pulse-dot" />
            <span>{user?.role === 'ADMIN' ? t('roleAdmin') : t('roleFarmer')}</span>
          </div>

          {/* Active Farm Link */}
          {primaryFarm ? (
            <Link
              to="/farms"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(14, 165, 233, 0.1)',
                border: '1px solid rgba(14, 165, 233, 0.28)',
                color: '#38bdf8',
                fontSize: '0.82rem',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'var(--transition-smooth)'
              }}
              title="Click to view cadastral & GIS plot details"
            >
              <MapPin size={14} color="#38bdf8" />
              <span>{primaryFarm.name}</span>
              <span style={{ opacity: 0.8, fontSize: '0.76rem' }}>({primaryFarm.areaAcres} Ac)</span>
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
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                color: '#fbbf24',
                fontSize: '0.82rem',
                fontWeight: 600,
                textDecoration: 'none'
              }}
            >
              <PlusCircle size={14} color="#fbbf24" />
              <span>{t('registerFarm')}</span>
            </Link>
          )}

          {/* Farmer Profile Button */}
          <Link
            to="/profile"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '5px 12px',
              borderRadius: '12px',
              background: location.pathname === '/profile' ? 'var(--color-primary-subtle)' : 'rgba(255, 255, 255, 0.05)',
              border: location.pathname === '/profile' ? '1px solid var(--color-primary)' : '1px solid var(--border-subtle)',
              textDecoration: 'none',
              transition: 'var(--transition-smooth)'
            }}
            title={language === 'mr' ? 'प्रोफाइल पाहण्यासाठी येथे क्लिक करा' : 'View Farmer Profile'}
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                border: '1.5px solid rgba(52, 211, 153, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.82rem',
                color: '#ffffff',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
              }}
            >
              {initials}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-heading)', lineHeight: 1.2 }}>
                {profile?.name || 'Ramesh Patel'}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {profile?.district || 'Pune'}, {profile?.state || 'MH'}
              </span>
            </div>
          </Link>

          {/* Language Toggle (English / Marathi) */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'mr' : 'en')}
            style={{
              background: language === 'mr' ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255, 255, 255, 0.06)',
              border: language === 'mr' ? '1px solid var(--color-primary)' : '1px solid var(--border-subtle)',
              color: language === 'mr' ? 'var(--color-primary-light)' : 'var(--text-main)',
              padding: '7px 12px',
              borderRadius: '9px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: 700,
              transition: 'var(--transition-smooth)'
            }}
            title={language === 'en' ? 'मराठी भाषेवर स्विच करा (Switch to Marathi)' : 'Switch to English'}
          >
            <Languages size={15} />
            <span>{language === 'en' ? 'मराठी' : 'English'}</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            style={{
              background: theme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(5, 150, 105, 0.1)',
              border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(5, 150, 105, 0.3)',
              color: theme === 'dark' ? '#fbbf24' : '#059669',
              padding: '7px 11px',
              borderRadius: '9px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600,
              transition: 'var(--transition-smooth)'
            }}
            title={theme === 'dark' ? 'Switch to Light Daylight Theme' : 'Switch to Dark Agro Theme'}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            <span>{theme === 'dark' ? t('lightTheme') : t('darkTheme')}</span>
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#f87171',
              padding: '7px 11px',
              borderRadius: '9px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600,
              transition: 'var(--transition-smooth)'
            }}
            title="Sign Out"
          >
            <LogOut size={14} />
            <span>{t('logout')}</span>
          </button>
        </div>
      </div>

      {/* Modern Navigation Links Bar */}
      <nav
        style={{
          display: 'flex',
          gap: '4px',
          padding: '0 32px',
          maxWidth: '1680px',
          margin: '0 auto',
          overflowX: 'auto',
          scrollbarWidth: 'none'
        }}
      >
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
                padding: '11px 16px',
                fontSize: '0.88rem',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--color-primary-light)' : 'var(--text-muted)',
                borderBottom: isActive ? '2.5px solid var(--color-primary)' : '2.5px solid transparent',
                background: isActive ? 'rgba(16, 185, 129, 0.06)' : 'transparent',
                borderRadius: '8px 8px 0 0',
                transition: 'var(--transition-smooth)',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon
                size={17}
                color={isActive ? '#34d399' : 'currentColor'}
                style={{ transition: 'transform 0.2s ease', transform: isActive ? 'scale(1.1)' : 'scale(1)' }}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
};
