import React from 'react';
import { motion } from 'motion/react';
import './LoadingScreen.css';
import loadingBg from '../assets/outpost_loading_bg.png';

const LoadingScreen = () => {
  return (
    <div className="loading-screen">
      
      {/* Background Image with slow zoom */}
      <motion.div 
        className="loading-bg-image"
        style={{ backgroundImage: `url(${loadingBg})` }}
        initial={{ scale: 1 }}
        animate={{ scale: 1.05 }}
        transition={{ duration: 6, ease: "easeOut" }}
      />

      {/* Flickering lighting overlay to simulate fire lighting the scene */}
      <motion.div 
        className="lighting-flicker-overlay"
        animate={{ opacity: [0.3, 0.6, 0.2, 0.7, 0.4, 0.5] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Overlay to darken edges (vignette) */}
      <div className="vignette-overlay"></div>

      <div className="campfire-container">
        {/* Fire sparks floating up from the fire in the image */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={`spark-${i}`}
            className="spark"
            initial={{ opacity: 0, y: 0, x: 0 }}
            animate={{ 
              opacity: [0, 1, 0], 
              y: [0, -250 - Math.random() * 150],
              x: [0, (Math.random() - 0.5) * 150]
            }}
            transition={{ 
              duration: 1.5 + Math.random(), 
              repeat: Infinity, 
              delay: Math.random() * 2,
              ease: "easeOut"
            }}
          />
        ))}
      </div>

      <motion.div 
        className="loading-text"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <span className="text-gradient">IGNITING OUTPOST</span>
        <motion.div 
          className="loading-dots"
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          ...
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoadingScreen;
