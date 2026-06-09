import React from 'react';
import { Terminal, Gamepad2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Hero.css';

const Hero = () => {
  const navigate = useNavigate();
  return (
    <section className="hero">
      <div className="hero-background">
      </div>
      
      <div className="container hero-content">
        <div className="badge glass-panel">
          <span className="live-dot"></span> Outpost v1.0 is live
        </div>
        
        <h1 className="hero-title">
          Connect. <span className="text-gradient">Code.</span> Conquer.
        </h1>
        
        <p className="hero-subtitle">
          The ultimate low-latency communication nexus built specifically for developers and gamers. Seamless voice, instant code sharing, zero compromises.
        </p>
        
        <div className="hero-actions">
          <button className="btn-primary flex-center" onClick={() => navigate(localStorage.getItem('outpost_user') ? '/app' : '/auth')}>
            {localStorage.getItem('outpost_user') ? 'Open App' : 'Join the Outpost'} <ArrowRight size={18} className="ml-2" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
