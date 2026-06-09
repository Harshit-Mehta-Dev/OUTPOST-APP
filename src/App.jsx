import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Basecamp from './pages/Basecamp';
import Invite from './pages/Invite';
import { BeamsBackground } from './components/BeamsBackground';
import { useSoundEngine } from './hooks/useSoundEngine';

function App() {
  // Initialize Global Sound Engine
  useSoundEngine();

  const [isDarkMode, setIsDarkMode] = useState(true);
  const location = useLocation();
  const isAppRoute = location.pathname.startsWith('/app');
  const isInviteRoute = location.pathname.startsWith('/invite');
  const hideHeaderFooter = isAppRoute || isInviteRoute;

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [isDarkMode]);

  // Global Theme Bootstrapper
  useEffect(() => {
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
        "deep-blue-blend": { primary: "29, 78, 216", isGradient: true, start: "#0369a1", end: "#1d4ed8" }
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
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <>
      <BeamsBackground fixed={true} intensity="medium" />
      {!hideHeaderFooter && <Header isDarkMode={isDarkMode} toggleTheme={toggleTheme} />}
      <main className={isAppRoute ? 'app-main' : ''}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/app" element={<Basecamp isDarkMode={isDarkMode} toggleTheme={toggleTheme} />} />
          <Route path="/invite/:id" element={<Invite />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
