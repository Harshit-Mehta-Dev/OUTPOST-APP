import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Hero from '../components/Hero';
import Features from '../components/Features';
import About from '../components/About';
import Community from '../components/Community';
import OutpostFooter from '../components/OutpostFooter';
import LegalHub from '../components/LegalHub';
import FounderSection from '../components/landing/FounderSection';

const Landing = () => {
  const location = useLocation();
  const isLegalView = location.hash === '#legal';

  useEffect(() => {
    if (isLegalView) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isLegalView]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div style={{ flexGrow: 1 }}>
        {isLegalView ? (
          <LegalHub />
        ) : (
          <>
            <Hero />
            <Features />
            <Community />
            <About />
            <FounderSection />
          </>
        )}
      </div>
      <OutpostFooter />
    </div>
  );
};

export default Landing;
