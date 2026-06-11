import React from 'react';
import { motion } from 'motion/react';
import { Compass, Tent } from 'lucide-react';
import './About.css';

const About = () => {
  return (
    <section id="about" className="about-section">
      <div className="container">
        
        <motion.div 
          className="about-intro text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="section-title">About <span className="text-gradient">Outpost</span></h2>
          <h3 className="about-subtitle">Welcome to the Outpost Basecamp.</h3>
          <div className="intro-text">
            <p>Outpost is a high-performance, community-first communication platform built for gamers, developers, creators, and close-knit friend groups. Designed as a modern, privacy-focused alternative to crowded legacy chat apps, Outpost provides a sleek, reliable basecamp for people who want to connect without compromise.</p>
            <p>We believe that your digital hangout spots should belong to you, not to corporate data harvesters. Outpost combines a robust, developer-friendly engineering backbone with a warm, adventurous user experience to give your communities a permanent home.</p>
          </div>
        </motion.div>

        <motion.div 
          className="about-pillars-container"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h3 className="pillars-title text-center">Our Core Pillars</h3>
          
          <div className="about-pillars">
            <div className="pillar-card glass-panel">
              <div className="pillar-icon">🛠️</div>
              <h4 className="pillar-title">Built with Integrity <span className="pillar-tag">(Professional)</span></h4>
              <p>Outpost is engineered for speed, reliability, and scale. We don’t sacrifice performance for aesthetics. With an ultra-low latency voice engine, crystal-clear 4K streaming, and a completely open, sandboxed API, power users and developers have total freedom to customize their experience. It is a lightweight, rock-solid platform designed to run smoothly in the background while you work, game, or build.</p>
            </div>

            <div className="pillar-card glass-panel featured-pillar">
              <div className="pillar-icon">🛡️</div>
              <h4 className="pillar-title">Guarded with Ethics <span className="pillar-tag">(Ethical)</span></h4>
              <p>The modern internet is broken by data-harvesting and attention economies. Outpost is our rebellion against that model.</p>
              <ul className="ethics-list">
                <li><strong>Privacy by Default:</strong> Your private conversations remain private. We utilize end-to-end encryption (E2EE) for direct messages and private group chats.</li>
                <li><strong>Zero Attention Traps:</strong> No algorithmic discovery feeds, no invasive tracking, and no selling your data to advertisers.</li>
                <li><strong>Honest Monetization:</strong> We will never gatekeep core communication behind a paywall. Our platform relies entirely on transparent, optional cosmetic upgrades and self-hosting options.</li>
              </ul>
            </div>

            <div className="pillar-card glass-panel">
              <div className="pillar-icon">🏕️</div>
              <h4 className="pillar-title">Infused with Spirit <span className="pillar-tag">(Fun)</span></h4>
              <p>At its heart, Outpost is a digital basecamp. We’ve traded chaotic, overwhelming server setups for organized Campsites and focused Expeditions (channels). Gathering with friends in our spatial voice rooms feels like sitting around a campfire—warm, spontaneous, and engaging. We don’t do stuffy corporate speak; we build software with personality for the people who appreciate it.</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="about-outro glass-panel sticker-container"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="sticker sticker-left"><Compass size={24} /></div>
          <h3 className="outro-title">Why We Built This</h3>
          <div className="sticker sticker-right"><Tent size={24} /></div>
          <blockquote className="quote">"Built for Connection, Not Consumption."</blockquote>
          
          <div className="outro-content">
            <p>We grew tired of platforms that treat users like products and communities like ad-space targets. Outpost was created to return digital sovereignty to the internet. Success for us isn't measured by how many hours we can trap you into scrolling; it’s measured by the quality of the interactions you have while you're here.</p>
            <p>Whether you are coordinating a competitive raid, collaborating on an open-source project, or just hanging out with your favorite people, Outpost is your new home base.</p>
            <p className="final-call">Pack your gear. Welcome to the Outpost community.</p>
          </div>
        </motion.div>

      </div>
    </section>
  );
};

export default About;
