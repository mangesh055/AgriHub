import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';

import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { FarmOnboardingPage } from './pages/FarmOnboardingPage';

import { DashboardPage } from './pages/DashboardPage';
import { FarmsPage } from './pages/FarmsPage';
import { CropPlanPage } from './pages/CropPlanPage';
import { WeatherPage } from './pages/WeatherPage';
import { IrrigationPage } from './pages/IrrigationPage';
import { CropHealthPage } from './pages/CropHealthPage';
import { MarketPage } from './pages/MarketPage';
import { EconomicsPage } from './pages/EconomicsPage';
import { SchemesSeedsPage } from './pages/SchemesSeedsPage';
import { AssistantPage } from './pages/AssistantPage';
import { ProfilePage } from './pages/ProfilePage';

// Main App Layout with Navbar and Footer
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
    <Navbar />
    <main style={{ flex: 1 }}>{children}</main>
    <footer style={{ borderTop: '1px solid var(--border-subtle)', padding: '16px 28px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
      AgriHub Unified Agricultural Decision-Support System • Built for Indian Agriculture
    </footer>
  </div>
);

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
          <Routes>
            {/* Public Auth Entry Points */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* First-Time Farm Onboarding */}
            <Route
              path="/onboarding/farm"
              element={
                <ProtectedRoute>
                  <FarmOnboardingPage />
                </ProtectedRoute>
              }
            />

            {/* Protected Application Workspace */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <DashboardPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/farms"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <FarmsPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/crop-plan"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <CropPlanPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/weather"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <WeatherPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/irrigation"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <IrrigationPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/crop-health"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <CropHealthPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/market"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <MarketPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/economics"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <EconomicsPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/knowledge"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <SchemesSeedsPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/assistant"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <AssistantPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ProfilePage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  </LanguageProvider>
  );
};
