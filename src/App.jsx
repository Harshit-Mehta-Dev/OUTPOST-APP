import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Header from './components/Header';
import { BeamsBackground } from './components/BeamsBackground';
import { useSoundEngine } from './hooks/useSoundEngine';
import { GeometricBorder } from './components/ui/GeometricBorder'; // Loading indicator placeholder

// Lazy-loaded routes
const Landing = lazy(() => import('./pages/Landing'));
const Auth = lazy(() => import('./pages/Auth'));
const Basecamp = lazy(() => import('./pages/Basecamp'));
const Invite = lazy(() => import('./pages/Invite'));
// Lazy-loaded routes

// Fallback loader
const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--brand-primary)' }}>
    <div style={{ color: 'white', fontFamily: 'monospace', fontSize: '1.2rem' }}>INITIALIZING OUTPOST...</div>
  </div>
);

// Wrapper for named exports like NotFoundPage
const NotFoundPage = lazy(() => import('./components/ui/404-page-not-found').then(module => ({ default: module.NotFoundPage })));

const RequireAuth = ({ children }) => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('outpost_user');
    if (!saved) {
      return <Navigate to="/auth" replace />;
    }
  }
  return children;
};

function App() {
  // Initialize Global Sound Engine
  useSoundEngine();

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('outpost_theme_dark');
      return saved !== null ? JSON.parse(saved) : true;
    }
    return true; // Default for SSR
  });
  const location = useLocation();
  const isAppRoute = location.pathname.startsWith('/app');
  const isInviteRoute = location.pathname.startsWith('/invite');
  const isAdminRoute = location.pathname.startsWith('/admin');
  const hideHeaderFooter = isAppRoute || isInviteRoute || isAdminRoute;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (isDarkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
      localStorage.setItem('outpost_theme_dark', JSON.stringify(isDarkMode));
    }
  }, [isDarkMode]);

  // Global Theme Bootstrapper
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const activeThemeId = localStorage.getItem("outpost-theme-id");
      if (activeThemeId) {
        const root = document.documentElement;
        
        const themeColors = {
          "orange-solid": { primary: "234, 88, 12", isGradient: false },
          "rose-solid": { primary: "225, 29, 72", isGradient: false },
          "slate-solid": { primary: "71, 85, 105", isGradient: false },
          "emerald-solid": { primary: "5, 150, 105", isGradient: false },
          "slate-khaki": { primary: "115, 115, 95", isGradient: true, start: "#475569", end: "#8a8a73" },
          "rose-gold": { primary: "225, 29, 72", isGradient: true, start: "#e11d48", end: "#fb923c" },
          "cyber-pulse": { primary: "234, 88, 12", isGradient: true, start: "#ea580c", end: "#701a75" },
          "deep-blue-blend": { primary: "29, 78, 216", isGradient: true, start: "#0369a1", end: "#1d4ed8" },
          "light-warm-red": { primary: "153, 0, 17", isGradient: true, start: "#FCF6F5", end: "#990011" },
          "golden-bright-red": { primary: "199, 45, 27", isGradient: true, start: "#FDD20E", end: "#C72D1B" },
          "muted-royal-blue": { primary: "0, 83, 156", isGradient: true, start: "#FFD662", end: "#00539C" },
          "khaki-slate-gray": { primary: "10, 74, 60", isGradient: true, start: "#F2B759", end: "#0A4A3C" }
        };

        const theme = themeColors[activeThemeId];
        if (theme) {
          root.style.setProperty("--brand-primary", theme.primary);
          if (theme.isGradient) {
            root.style.setProperty("--brand-gradient-start", theme.start);
            root.style.setProperty("--brand-gradient-end", theme.end);
          } else {
            root.style.setProperty("--brand-gradient-start", `rgb(${theme.primary})`);
            root.style.setProperty("--brand-gradient-end", `rgb(${theme.primary})`);
          }
        }
      }
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <>
      <BeamsBackground fixed={true} intensity="medium" />
      {!hideHeaderFooter && <Header isDarkMode={isDarkMode} toggleTheme={toggleTheme} />}
      <main className={isAppRoute ? 'app-main' : ''}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/app" element={
              <RequireAuth>
                <Basecamp isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
              </RequireAuth>
            } />
            <Route path="/invite/:id" element={
              <RequireAuth>
                <Invite />
              </RequireAuth>
            } />
            

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>
    </>
  );
}

export default App;
