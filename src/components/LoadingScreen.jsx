import React from 'react';
import { motion } from 'motion/react';
import './LoadingScreen.css';
import loadingBg from '../assets/outpost_loading_bg.png';

const LoadingScreen = () => {
  return (
    <div className="loading-screen">
      
      {/* Background Image with slow zoom. Uses cover to prevent black sidebars */}
      <motion.div 
        className="loading-bg-image"
        style={{ backgroundImage: `url(${loadingBg})` }}
        initial={{ scale: 1.1 }}
        animate={{ scale: 1.0 }}
        transition={{ duration: 6, ease: "easeOut" }}
      />
    </div>
  );
};

export default LoadingScreen;
