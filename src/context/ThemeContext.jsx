import React, { createContext, useContext, useState, useEffect } from 'react';

export const AVAILABLE_THEMES = [
  // --- Single Solid Profiles ---
  { id: "orange-solid", name: "Typical Orange", isGradient: false, primaryRGB: "234, 88, 12", previewStyle: { backgroundColor: "rgb(234, 88, 12)" } },
  { id: "rose-solid", name: "Crimson Rose", isGradient: false, primaryRGB: "225, 29, 72", previewStyle: { backgroundColor: "rgb(225, 29, 72)" } },
  { id: "slate-solid", name: "Tactical Slate", isGradient: false, primaryRGB: "71, 85, 105", previewStyle: { backgroundColor: "rgb(71, 85, 105)" } },
  { id: "emerald-solid", name: "Matrix Green", isGradient: false, primaryRGB: "5, 150, 105", previewStyle: { backgroundColor: "rgb(5, 150, 105)" } },
  { id: "indigo-solid", name: "Deep Indigo", isGradient: false, primaryRGB: "79, 70, 229", previewStyle: { backgroundColor: "rgb(79, 70, 229)" } },
  { id: "neon-pink", name: "Neon Pink", isGradient: false, primaryRGB: "236, 72, 153", previewStyle: { backgroundColor: "rgb(236, 72, 153)" } },
  
  // --- Dual Color Blends ---
  { id: "slate-khaki", name: "Slate Khaki", isGradient: true, primaryRGB: "115, 115, 95", gradStart: "#475569", gradEnd: "#8a8a73", previewStyle: { background: "linear-gradient(to right, #475569, #8a8a73)" } },
  { id: "rose-gold", name: "Velvet Rose", isGradient: true, primaryRGB: "225, 29, 72", gradStart: "#e11d48", gradEnd: "#fb923c", previewStyle: { background: "linear-gradient(to right, #e11d48, #fb923c)" } },
  { id: "cyber-pulse", name: "Cyber Orange Burst", isGradient: true, primaryRGB: "234, 88, 12", gradStart: "#ea580c", gradEnd: "#701a75", previewStyle: { background: "linear-gradient(to right, #ea580c, #701a75)" } },
  { id: "deep-blue-blend", name: "Deep Sea", isGradient: true, primaryRGB: "29, 78, 216", gradStart: "#0369a1", gradEnd: "#1d4ed8", previewStyle: { background: "linear-gradient(to right, #0369a1, #1d4ed8)" } },
  { id: "sunset-purple", name: "Sunset Purple", isGradient: true, primaryRGB: "168, 85, 247", gradStart: "#9333ea", gradEnd: "#db2777", previewStyle: { background: "linear-gradient(to right, #9333ea, #db2777)" } },
  { id: "toxic-green", name: "Toxic Green", isGradient: true, primaryRGB: "22, 163, 74", gradStart: "#15803d", gradEnd: "#84cc16", previewStyle: { background: "linear-gradient(to right, #15803d, #84cc16)" } },
  { id: "royal-gold", name: "Royal Gold", isGradient: true, primaryRGB: "202, 138, 4", gradStart: "#b45309", gradEnd: "#eab308", previewStyle: { background: "linear-gradient(to right, #b45309, #eab308)" } },
  { id: "light-warm-red", name: "Warm Red Blend", isGradient: true, primaryRGB: "153, 0, 17", gradStart: "#FCF6F5", gradEnd: "#990011", previewStyle: { background: "linear-gradient(to right, #FCF6F5, #990011)" } },
  { id: "golden-bright-red", name: "Golden Red Blend", isGradient: true, primaryRGB: "199, 45, 27", gradStart: "#FDD20E", gradEnd: "#C72D1B", previewStyle: { background: "linear-gradient(to right, #FDD20E, #C72D1B)" } },
  { id: "muted-royal-blue", name: "Royal Beige Blend", isGradient: true, primaryRGB: "0, 83, 156", gradStart: "#FFD662", gradEnd: "#00539C", previewStyle: { background: "linear-gradient(to right, #FFD662, #00539C)" } },
  { id: "khaki-slate-gray", name: "Khaki Slate Blend", isGradient: true, primaryRGB: "10, 74, 60", gradStart: "#F2B759", gradEnd: "#0A4A3C", previewStyle: { background: "linear-gradient(to right, #F2B759, #0A4A3C)" } },
];

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [activeTheme, setActiveTheme] = useState(AVAILABLE_THEMES[0]);

  useEffect(() => {
    let savedThemeId = localStorage.getItem("outpost-theme-id");
    const userStr = localStorage.getItem("outpost_user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user && user.username) {
          const userThemeId = localStorage.getItem("outpost-theme-id-" + user.username);
          if (userThemeId) savedThemeId = userThemeId;
        }
      } catch(e) {}
    }

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

    const userStr = localStorage.getItem("outpost_user");
    let savedForUser = false;
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user && user.username) {
          localStorage.setItem("outpost-theme-id-" + user.username, theme.id);
          savedForUser = true;
        }
      } catch(e) {}
    }
    
    if (!savedForUser) {
      localStorage.setItem("outpost-theme-id", theme.id);
    }
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
