import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import './Community.css';

const tabData = {
  privacy: {
    title: "1. Privacy Policy (The Scout Data Charter)",
    tldr: "We don't sell your data, we don't track your behavior, and we don't build profiles on you. What happens at the basecamp stays at the basecamp. Your private communications are encrypted, and we only collect the absolute bare minimum needed to keep the Outpost running.",
    sections: [
      {
        title: "Data Collection",
        content: "Outpost collects essential account creation details (email and Scout username) and critical system telemetry (such as crash logs, if explicitly opted-in) to maintain basecamp stability. We do not track location data or external browsing history."
      },
      {
        title: "Data Encryption",
        content: "All Direct Messages (DMs) and private group communications between Scouts are secured using end-to-end encryption (E2EE). Outpost cannot read, intercept, decrypt, or log these messages."
      },
      {
        title: "Third-Party Sharing",
        content: "We do not sell, rent, or trade Scout data to third-party advertising companies or data brokers. Data is only disclosed if strictly required by a binding legal warrant."
      },
      {
        title: "Scout Sovereignty",
        content: "You retain full ownership of your data. Every Scout has the right to download a complete archive of their account history or permanently delete their presence from the Basecamp at any time via user settings."
      }
    ]
  },
  terms: {
    title: "2. Terms of Service (The Basecamp Compact)",
    tldr: "You own what you build and post. Don't use this platform to break the law, run malicious automation scripts, or crash our infrastructure. If you act maliciously against the Basecamp, your Scout credentials will be revoked.",
    sections: [
      {
        title: "Eligibility",
        content: "By creating an account and becoming a Scout, you affirm that you meet the minimum age requirements to utilize communication services in your local jurisdiction (typically 13+)."
      },
      {
        title: "Content Ownership",
        content: "Every Scout retains all intellectual property rights to the text, images, videos, and code they upload to the Outpost. The platform claims zero ownership over your content."
      },
      {
        title: "Infrastructure Integrity",
        content: "Scouts may not engage in automated scraping, DDoS attacks, reverse-engineering with malicious intent, or exploiting software vulnerabilities to disrupt Outpost services."
      },
      {
        title: "Account Termination",
        content: "Outpost reserves the right to suspend or permanently revoke the credentials of any Scout who violates local laws, engages in systemic platform abuse, or breaches these core terms."
      }
    ]
  },
  guidelines: {
    title: "3. Community Guidelines (The Scout Code)",
    tldr: "Respect the perimeter. Keep the environment safe, welcome all fellow Scouts around the campfire, and don’t ruin the expedition for everyone else.",
    sections: [
      {
        title: "Protect the Perimeter (Safety)",
        content: "Scouts must not post or distribute illegal material, deploy malware, or coordinate real-world harm. Harassment, doxxing, and targeted hate speech will result in an immediate, permanent ban from the Basecamp."
      },
      {
        title: "Respect the Campfire (Conduct)",
        content: "Treat fellow Scouts with dignity. Avoid toxic behavior, spamming text channels, or intentionally disrupting voice rooms with audio spam."
      },
      {
        title: "Keep it Human (Authenticity)",
        content: "Do not deploy unauthorized self-bots or automated scripts designed to spam advertisements, scrape user profiles, or manipulate engagement metrics."
      },
      {
        title: "Empowered Expedition Leaders",
        content: "Campsite owners have total control over their local communities. While Outpost enforces global safety rules, individual hosts have the right to set and enforce supplementary rules for their own camp."
      }
    ]
  }
};

const Community = () => {
  const [activeTab, setActiveTab] = useState('privacy');

  return (
    <section id="community" className="community-section">
      <div className="container">
        <motion.div 
          className="community-header text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="section-title">Community & <span className="text-gradient">Ethics</span></h2>
          <p className="community-subtitle">The rules of the basecamp are simple, transparent, and built for your protection.</p>
        </motion.div>

        <div className="community-tabs-container glass-panel">
          <div className="tabs-header">
            <button 
              className={`tab-btn ${activeTab === 'privacy' ? 'active' : ''}`}
              onClick={() => setActiveTab('privacy')}
            >
              Privacy Policy
            </button>
            <button 
              className={`tab-btn ${activeTab === 'terms' ? 'active' : ''}`}
              onClick={() => setActiveTab('terms')}
            >
              Terms of Service
            </button>
            <button 
              className={`tab-btn ${activeTab === 'guidelines' ? 'active' : ''}`}
              onClick={() => setActiveTab('guidelines')}
            >
              Community Guidelines
            </button>
          </div>

          <div className="tab-content-wrapper">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="tab-content"
              >
                <h3 className="tab-title">{tabData[activeTab].title}</h3>
                
                <div className="tldr-box">
                  <div className="tldr-icon">🧭</div>
                  <div className="tldr-text">
                    <strong>The TL;DR:</strong>
                    <p>{tabData[activeTab].tldr}</p>
                  </div>
                </div>

                <div className="clear-rules">
                  <h4 className="rules-heading">⚖️ The Clear Policy</h4>
                  <div className="rules-grid">
                    {tabData[activeTab].sections.map((section, idx) => (
                      <div className="rule-card" key={idx}>
                        <h5 className="rule-title">{section.title}</h5>
                        <p className="rule-desc">{section.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Community;
