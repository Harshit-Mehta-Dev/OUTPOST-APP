import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import './AnimatedMesh.css';

export default function AnimatedMesh() {
  const { activeTheme } = useTheme();
  
  // Use state to track the active gradient for the mesh
  const [gradientStart, setGradientStart] = useState('#000000');
  const [gradientEnd, setGradientEnd] = useState('#000000');

  useEffect(() => {
    if (activeTheme) {
      if (activeTheme.isGradient) {
        setGradientStart(activeTheme.gradStart);
        setGradientEnd(activeTheme.gradEnd);
      } else {
        setGradientStart(`rgb(${activeTheme.primaryRGB})`);
        setGradientEnd(`rgb(${activeTheme.primaryRGB})`);
      }
    }
  }, [activeTheme]);

  return (
    <div className="animated-mesh-container">
      <motion.div
        className="mesh-orb orb-1"
        style={{ background: `radial-gradient(circle, ${gradientStart} 0%, transparent 70%)` }}
        animate={{
          x: [0, 100, -50, 0],
          y: [0, -100, 50, 0],
          scale: [1, 1.2, 0.9, 1],
          opacity: [0.4, 0.6, 0.4]
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="mesh-orb orb-2"
        style={{ background: `radial-gradient(circle, ${gradientEnd} 0%, transparent 70%)` }}
        animate={{
          x: [0, -100, 50, 0],
          y: [0, 100, -50, 0],
          scale: [1, 0.8, 1.3, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="mesh-orb orb-3"
        style={{ background: `radial-gradient(circle, ${gradientStart} 0%, transparent 70%)` }}
        animate={{
          x: [-50, 50, 100, -50],
          y: [50, -50, -100, 50],
          scale: [1.2, 0.9, 1.1, 1.2],
          opacity: [0.5, 0.3, 0.5]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <div className="mesh-glass-overlay"></div>
    </div>
  );
}
