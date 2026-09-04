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
  Bell,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  currentFarmName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ currentFarmName = 'Krishna Agri Fields' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, logout } = useAuth();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/farms', label: 'My Farms', icon: MapPin },
    { path: '/crop-plan', label: 'Crop Plan', icon: Compass },
    { path: '/weather', label: 'Weather', icon: CloudRain },
    { path: '/irrigation', label: 'IoT Irrigation', icon: Droplets },
    { path: '/crop-health', label: 'Crop Health', icon: ScanLine },
    { path: '/market', label: 'Mandi & Market', icon: TrendingUp },
    { path: '/economics', label: 'Profit & Costs', icon: Coins },
    { path: '/knowledge', label: 'Schemes & Seeds', icon: BookOpen },
    { path: '/assistant', label: 'AI Agronomist', icon: Bot }
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
    <header style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(12, 18, 12, 0.95)', backdropFilter: 'blur(16px)', position: 'sticky', top: 0, zIndex: 1000 }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: 'var(--radius-full)', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }}></span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#34d399' }}>Role: {user?.role || 'FARMER'}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '8px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#1e293b', border: '2px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', color: '#ffffff' }}>
                {initials}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{profile?.name || 'Ramesh Patel'}</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{profile?.district || 'Pune'}, {profile?.state || 'Maharashtra'}</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              style={{
                marginLeft: '8px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#f87171',
                padding: '6px 10px',
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
              <span>Logout</span>
            </button>
          </div>
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
