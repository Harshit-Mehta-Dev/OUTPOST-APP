import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Hero from '../components/Hero';
import Features from '../components/Features';
import About from '../components/About';
import Community from '../components/Community';
import HelpDesk from '../components/HelpDesk';
import OutpostFooter from '../components/OutpostFooter';
import LegalHub from '../components/LegalHub';
import FounderSection from '../components/landing/FounderSection';
import FeedbackForm from '../components/FeedbackForm';
import { GeometricBorder } from '../components/ui/GeometricBorder';

const SectionBlendDivider = () => (
  <div style={{
    width: '100%',
    height: '100px',
    background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.2) 50%, transparent)',
    marginTop: '-50px',
    marginBottom: '-50px',
    position: 'relative',
    zIndex: 10,
    pointerEvents: 'none'
  }} />
);


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
            <div style={{ position: 'relative' }}>
              <GeometricBorder side="left" opacity={0.35} />
              <GeometricBorder side="right" opacity={0.35} />
              <Hero />
              <SectionBlendDivider />
              <Features />
              <SectionBlendDivider />
              <Community />
              <SectionBlendDivider />
              <About />
            </div>
            <SectionBlendDivider />
            <HelpDesk />
            <SectionBlendDivider />
            <FeedbackForm />
            <SectionBlendDivider />
            <FounderSection />
          </>
        )}
      </div>
      <OutpostFooter />
    </div>
  );
};

export default Landing;
