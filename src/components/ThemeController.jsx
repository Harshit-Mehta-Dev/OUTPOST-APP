import React, { useState } from "react";
import { motion } from "framer-motion";
import { Check, Palette, RotateCcw } from "lucide-react";
import { useTheme, AVAILABLE_THEMES } from "../context/ThemeContext";
import "./ThemeController.css";

export default function ThemeController({ onClose }) {
  const { activeTheme, updateTheme } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState(activeTheme);

  const handleApplyTheme = () => {
    updateTheme(selectedTheme);
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
            localStorage.removeItem("outpost-dynamic-bars");
            localStorage.removeItem("outpost-dynamic-color");
            window.location.reload();
          }}
          className="theme-reset-btn"
          title="Reset System Default"
        >
          <RotateCcw size={14} />
        </button>
      </div>

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

        <div className="theme-status-box">
          <div className="theme-status-label">Target Channel Configuration:</div>
          <div className="theme-status-value">{selectedTheme.name}</div>
        </div>

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
