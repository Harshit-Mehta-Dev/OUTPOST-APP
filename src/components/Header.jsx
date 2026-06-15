import React, { useState, useEffect } from 'react';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import logoUrl from '../assets/logo.png'; // Make sure to save your image here!
import './Header.css';

const Header = ({ isDarkMode, toggleTheme }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isLoggedIn = !!localStorage.getItem('outpost_user');

  const handleLogoClick = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      window.location.href = '/';
    }, 800);
  };

  const handleNavClick = (e, path) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    
    const targetId = path.split('#')[1];
    
    if (location.pathname !== '/') {
      navigate(path);
    } else {
      navigate(path);
    }

    if (targetId !== 'legal') {
      setTimeout(() => {
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`header ${isScrolled ? 'scrolled glass-panel' : ''}`}>
      <div className="container header-content">
        <div className="logo-container" onClick={handleLogoClick}>
          <motion.img 
            src={logoUrl} 
            alt="Outpost Logo" 
            className="logo-image" 
            style={{ height: '40px', width: 'auto' }} 
            animate={isRefreshing ? { rotate: 360, scale: 0, opacity: 0 } : {}}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />
          <motion.span 
            className="logo-text"
            animate={isRefreshing ? { opacity: 0, filter: 'blur(10px)', x: 50 } : {}}
            transition={{ duration: 0.8 }}
          >
            OUTPOST
          </motion.span>
        </div>

        <nav className={`nav-links ${mobileMenuOpen ? 'active glass-panel' : ''}`}>
          <a href="/#features" onClick={(e) => handleNavClick(e, '/#features')}>Features</a>
          <a href="/#community" onClick={(e) => handleNavClick(e, '/#community')}>Community</a>
          <a href="/#about" onClick={(e) => handleNavClick(e, '/#about')}>About</a>
          <a href="/#legal" onClick={(e) => handleNavClick(e, '/#legal')}>Legal</a>
          <a href="/#helpdesk" onClick={(e) => handleNavClick(e, '/#helpdesk')}>Help Desk</a>
          <div className="nav-actions-mobile">
            <button className="theme-toggle" onClick={toggleTheme}>
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button className="btn-secondary" onClick={() => { setMobileMenuOpen(false); navigate(isLoggedIn ? '/app' : '/auth'); }}>
              {isLoggedIn ? 'Open App' : 'Sign In'}
            </button>
          </div>
        </nav>

        <div className="nav-actions-desktop">
          <button className="theme-toggle" onClick={toggleTheme} style={{ display: 'flex', alignItems: 'center', padding: '0 12px', color: 'var(--text-primary)' }}>
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button className="btn-secondary" onClick={() => navigate(isLoggedIn ? '/app' : '/auth')}>
            {isLoggedIn ? 'Open App' : 'Sign In'}
          </button>
        </div>

        <button 
          className="mobile-toggle" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </header>
  );
};

export default Header;
