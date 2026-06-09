import React, { createContext, useContext, useState, useEffect } from 'react';

export const AVAILABLE_THEMES = [
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

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [activeTheme, setActiveTheme] = useState(AVAILABLE_THEMES[0]);

  useEffect(() => {
    const savedThemeId = localStorage.getItem("outpost-theme-id");
    if (savedThemeId) {
      const match = AVAILABLE_THEMES.find((t) => t.id === savedThemeId);
      if (match) setActiveTheme(match);
    }
  }, []);

  const updateTheme = (theme) => {
    setActiveTheme(theme);
    const root = document.documentElement;
    root.style.setProperty("--brand-primary", theme.primaryRGB);
    
    if (theme.isGradient) {
      root.style.setProperty("--brand-gradient-start", theme.gradStart);
      root.style.setProperty("--brand-gradient-end", theme.gradEnd);
    } else {
      root.style.setProperty("--brand-gradient-start", `rgb(${theme.primaryRGB})`);
      root.style.setProperty("--brand-gradient-end", `rgb(${theme.primaryRGB})`);
    }

    localStorage.setItem("outpost-theme-id", theme.id);
  };

  return (
    <ThemeContext.Provider value={{ activeTheme, updateTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
