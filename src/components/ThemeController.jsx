import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Palette, Check, RotateCcw } from "lucide-react";
import "./ThemeController.css";

const AVAILABLE_THEMES = [
  // --- Single Solid Profiles ---
  { id: "orange-solid", name: "Typical Orange", isGradient: false, primaryRGB: "234, 88, 12", previewStyle: { backgroundColor: "rgb(234, 88, 12)" } },
  { id: "rose-solid", name: "Crimson Rose", isGradient: false, primaryRGB: "225, 29, 72", previewStyle: { backgroundColor: "rgb(225, 29, 72)" } },
  { id: "slate-solid", name: "Tactical Slate", isGradient: false, primaryRGB: "71, 85, 105", previewStyle: { backgroundColor: "rgb(71, 85, 105)" } },
  { id: "emerald-solid", name: "Matrix Green", isGradient: false, primaryRGB: "5, 150, 105", previewStyle: { backgroundColor: "rgb(5, 150, 105)" } },
  
  // --- Dual Color Blends ---
  { id: "slate-khaki", name: "Slate Khaki", isGradient: true, primaryRGB: "115, 115, 95", gradStart: "#475569", gradEnd: "#8a8a73", previewStyle: { background: "linear-gradient(to right, #475569, #8a8a73)" } },
  { id: "rose-gold", name: "Velvet Rose", isGradient: true, primaryRGB: "225, 29, 72", gradStart: "#e11d48", gradEnd: "#fb923c", previewStyle: { background: "linear-gradient(to right, #e11d48, #fb923c)" } },
  { id: "cyber-pulse", name: "Cyber Orange Burst", isGradient: true, primaryRGB: "234, 88, 12", gradStart: "#ea580c", gradEnd: "#701a75", previewStyle: { background: "linear-gradient(to right, #ea580c, #701a75)" } },
  { id: "deep-blue-blend", name: "Deep Sea", isGradient: true, primaryRGB: "29, 78, 216", gradStart: "#0369a1", gradEnd: "#1d4ed8", previewStyle: { background: "linear-gradient(to right, #0369a1, #1d4ed8)" } },
];

export default function ThemeController({ onClose }) {
  const [selectedTheme, setSelectedTheme] = useState(AVAILABLE_THEMES[0]);

  // Read configuration state payload on initial mounting sequence
  useEffect(() => {
    const savedThemeId = localStorage.getItem("outpost-theme-id");
    if (savedThemeId) {
      const match = AVAILABLE_THEMES.find((t) => t.id === savedThemeId);
      if (match) setSelectedTheme(match);
    }
  }, []);

  const handleApplyTheme = () => {
    const root = document.documentElement;
    
    // Write dynamic runtime overrides to document style targets
    root.style.setProperty("--brand-primary", selectedTheme.primaryRGB);
    
    if (selectedTheme.isGradient) {
      root.style.setProperty("--brand-gradient-start", selectedTheme.gradStart);
      root.style.setProperty("--brand-gradient-end", selectedTheme.gradEnd);
    } else {
      // If solid, resolve both start/end limits to the primary color wrapper
      root.style.setProperty("--brand-gradient-start", `rgb(${selectedTheme.primaryRGB})`);
      root.style.setProperty("--brand-gradient-end", `rgb(${selectedTheme.primaryRGB})`);
    }

    // Lock configuration into client browser memory matrix
    localStorage.setItem("outpost-theme-id", selectedTheme.id);
    onClose();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="theme-controller-overlay"
    >
      <div className="theme-controller-header">
        <h4 className="theme-controller-title">
          <Palette size={16} color="#f97316" /> Signal Spectrum Control
        </h4>
        <button 
          onClick={() => {
            localStorage.removeItem("outpost-theme-id");
            window.location.reload();
          }}
          className="theme-reset-btn"
          title="Reset System Default"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {/* Grid Display Grid System */}
      <div className="theme-controller-body">
        <div>
          <p className="theme-grid-label">Available Frequencies</p>
          <div className="theme-grid">
            {AVAILABLE_THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => setSelectedTheme(theme)}
                className={`theme-swatch-btn ${selectedTheme.id === theme.id ? "active" : ""}`}
                style={theme.previewStyle}
                title={theme.name}
              >
                {selectedTheme.id === theme.id && (
                  <div className="theme-swatch-active-overlay">
                    <Check size={16} color="white" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Informative Status Preview String Box */}
        <div className="theme-status-box">
          <div className="theme-status-label">Target Channel Configuration:</div>
          <div className="theme-status-value">{selectedTheme.name}</div>
        </div>

        {/* Actions Button Footprint Row */}
        <div className="theme-actions">
          <button 
            onClick={onClose}
            className="theme-btn-retreat"
          >
            Retreat
          </button>
          <button 
            onClick={handleApplyTheme}
            className="theme-btn-deploy"
          >
            Deploy Spectrum
          </button>
        </div>
      </div>
    </motion.div>
  );
}
