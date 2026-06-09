import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Basecamp from './pages/Basecamp';
import Invite from './pages/Invite';
import { BeamsBackground } from './components/BeamsBackground';

function App() {
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
      
      {!hideHeaderFooter && (
      <footer style={{
        textAlign: 'center',
        padding: '40px',
        color: 'var(--text-secondary)',
        borderTop: '1px solid var(--border-glass)',
        marginTop: '60px'
      }}>
        <p>&copy; {new Date().getFullYear()} OUTPOST. All rights reserved.</p>
      </footer>
      )}
    </>
  );
}

export default App;
