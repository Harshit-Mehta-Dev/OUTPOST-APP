import React from "react";
import { motion } from "framer-motion";
import { Terminal, ShieldCheck, Cpu, Code2 } from "lucide-react";
import "./FounderSection.css"; // Import the vanilla CSS

export default function FounderSection() {
  const engineeringMetrics = [
    { label: "Architecture", value: "Hybrid Micro", icon: Cpu },
    { label: "Core Security", value: "AI Guard Zero", icon: ShieldCheck },
    { label: "Engine Protocols", value: "WebSockets / Live", icon: Code2 },
  ];

  return (
    <section className="founder-section">
      {/* Background Ambient Radial Frequency Aura */}
      <div className="founder-ambient-glow" />

      <div className="founder-grid">
        
        {/* 🖼️ Left Cluster: Animated Founder Profile Frame */}
        <motion.div 
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="founder-photo-wrapper"
        >
          {/* Animated Glow Border Frame backing the profile image */}
          <div className="founder-glow-border" />
          
          {/* Main Visual Image Card Holder */}
          <div className="founder-photo-card">
            <img 
              src="/founder-avatar.jpg" 
              alt="Harshit Mehta - Founder of Outpost" 
              className="founder-image"
            />
            
            {/* Overlay Glass Dashboard Badge on top of Photo */}
            <div className="founder-glass-badge">
              <div>
                <p className="founder-badge-name">Harshit Mehta</p>
                <p className="founder-badge-role">INDIA // Founder</p>
              </div>
              <div className="founder-badge-icon">
                <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* 📝 Right Cluster: Visionary Statement & Engineering Metadata */}
        <motion.div 
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
          className="founder-content"
        >
          {/* Section Marker */}
          <div className="founder-marker">
            <Terminal size={14} /> Founder's Briefing Manifest
          </div>

          {/* Heading Layout */}
          <h3 className="founder-heading">
            The Ideology Behind <span>Outpost</span>
          </h3>

          {/* The Thought / Quote Block */}
          <div className="founder-quote-block">
            <span className="founder-quote-mark">“</span>
            <p className="founder-quote-text">
              Outpost was forged out of a simple, uncompromised necessity: communication tools should be sovereign, fast, and unburdened by bloat. We didn't build this platform to copy what exists—we engineered it to redefine how technical teams and gaming squads deploy basecamps, manage perimeters, and secure their digital frequencies.
            </p>
          </div>

          {/* Founder Signature Block */}
          <div className="founder-signature">
            <p className="founder-sig-name">HARSHIT MEHTA</p>
            <p className="founder-sig-role">Core System Architect & Project Lead</p>
          </div>

          <hr className="founder-divider" />

          {/* Internal Structural Specs Sub-Grid */}
          <div className="founder-specs-grid">
            {engineeringMetrics.map((spec, index) => {
              const Icon = spec.icon;
              return (
                <div key={index} className="founder-spec-card">
                  <div className="founder-spec-label">
                    <Icon size={14} className="founder-spec-icon" /> {spec.label}
                  </div>
                  <p className="founder-spec-value">{spec.value}</p>
                </div>
              );
            })}
          </div>

        </motion.div>

      </div>
    </section>
  );
}
