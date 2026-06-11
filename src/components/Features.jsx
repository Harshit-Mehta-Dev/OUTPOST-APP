import React from 'react';
import { Mic, Code2, Globe2, Shield, Gamepad2, Terminal, Headphones, Radio, Cpu, Laptop, Server, Wifi } from 'lucide-react';
import './Features.css';

const featuresData = [
  {
    icon: <Mic className="feature-icon" size={32} />,
    title: 'Crystal Clear Voice',
    description: 'Proprietary audio engine delivering sub-5ms latency for uninterrupted comms during high-stakes raids or intense debugging sessions.',
    glowColor: 'var(--accent-primary)',
    stickers: [<Headphones size={24} />, <Radio size={24} />]
  },
  {
    icon: <Code2 className="feature-icon" size={32} />,
    title: 'Integrated Dev Tools',
    description: 'Share snippets with rich syntax highlighting, or start a collaborative pair-programming session directly in your channel.',
    glowColor: 'var(--accent-secondary)',
    stickers: [<Cpu size={24} />, <Laptop size={24} />]
  },
  {
    icon: <Globe2 className="feature-icon" size={32} />,
    title: 'Global Infrastructure',
    description: 'Edge computing nodes worldwide ensure you connect to the fastest server automatically, minimizing ping for all users.',
    glowColor: 'var(--accent-primary)',
    stickers: [<Server size={24} />, <Wifi size={24} />]
  },
  {
    icon: <Shield className="feature-icon" size={32} />,
    title: 'Enterprise Security',
    description: 'End-to-end encryption for DMs and private channels, keeping your game strats and proprietary code completely secure.',
    glowColor: 'var(--accent-secondary)',
    stickers: [<Gamepad2 size={24} />, <Terminal size={24} />]
  }
];

const Features = () => {
  return (
    <section id="features" className="features-section container">
      <div className="features-header">
        <h2 className="section-title">Built for <span className="text-gradient">Performance</span></h2>
        <p className="section-subtitle">Everything you need to communicate effectively, without the bloat.</p>
      </div>
      
      <div className="features-grid">
        {featuresData.map((feature, index) => (
          <div key={index} className="feature-card glass-panel sticker-container">
            {feature.stickers && (
              <>
                <div className="sticker sticker-left">
                  {feature.stickers[0]}
                </div>
                <div className="sticker sticker-right">
                  {feature.stickers[1]}
                </div>
              </>
            )}
            <div 
              className="feature-icon-wrapper" 
              style={{ boxShadow: `0 0 20px ${feature.glowColor}40` }}
            >
              {feature.icon}
            </div>
            <h3 className="feature-title">{feature.title}</h3>
            <p className="feature-description">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Features;
