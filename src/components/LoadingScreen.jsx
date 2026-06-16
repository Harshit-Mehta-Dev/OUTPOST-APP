import React from 'react';
import { motion } from 'motion/react';
import './LoadingScreen.css';
import loadingBg from '../assets/outpost_loading_bg.png';
import { ShaderAnimation } from './ui/shader-animation';

const LoadingScreen = () => {
  return (
    <div className="loading-screen" style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <ShaderAnimation />
      
      {/* Centered Logo with pulsing animation */}
      <motion.div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <motion.img 
          src={loadingBg} 
          alt="Outpost Logo" 
          style={{ width: '180px', height: 'auto', dropShadow: '0 0 15px rgba(255, 255, 255, 0.3)' }}
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          style={{
            marginTop: '24px',
            color: 'white',
            fontSize: '1.25rem',
            fontWeight: '600',
            letterSpacing: '0.3em',
            textShadow: '0 0 10px rgba(255, 255, 255, 0.5)',
            fontFamily: 'monospace'
          }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          CONNECTING
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoadingScreen;
