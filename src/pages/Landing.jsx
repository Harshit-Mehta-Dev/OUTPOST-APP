import React from 'react';
import Hero from '../components/Hero';
import Features from '../components/Features';
import About from '../components/About';
import Community from '../components/Community';
import OutpostFooter from '../components/OutpostFooter';

const Landing = () => {
  return (
    <>
      <Hero />
      <Features />
      <Community />
      <About />
      <OutpostFooter />
    </>
  );
};

export default Landing;
