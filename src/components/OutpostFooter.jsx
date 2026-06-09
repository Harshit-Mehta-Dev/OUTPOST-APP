import React from "react";
import { motion } from "motion/react";
import {
  Flame,
  Radio,
  Compass,
  ShieldAlert,
} from "lucide-react";
import './OutpostFooter.css';

const LinkedinIcon = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const GithubIcon = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

const InstagramIcon = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const data = {
  linkedinLink: "https://www.linkedin.com/in/harshit-mehta-%E2%98%81%EF%B8%8F-107425279/",
  githubLink: "https://github.com/Harshit-Mehta-Dev",
  instaLink: "https://www.instagram.com/_harshit.mehta_/",
  email: "hello@outpostbasecamp.com",
  company: {
    name: "OUTPOST",
    description:
      "A next-generation, community-centric digital basecamp. Built on sovereignty, end-to-end encryption, and low-latency tactical communication protocols.",
  },
};

const socialLinks = [
  { icon: LinkedinIcon, label: "LinkedIn", href: data.linkedinLink },
  { icon: GithubIcon, label: "GitHub", href: data.githubLink },
  { icon: InstagramIcon, label: "Instagram", href: data.instaLink },
];

const ecosystemLinks = [
  { text: "The Basecamp Core", href: "#" },
  { text: "Global Discover Radar", href: "#" },
  { text: "Bot Sandbox API", href: "#" },
  { text: "Open Source Blueprint", href: "#" },
];

const documentationLinks = [
  { text: "Scout Data Charter (Privacy)", href: "#" },
  { text: "Basecamp Compact (ToS)", href: "#" },
  { text: "The Scout Code (Guidelines)", href: "#" },
  { text: "Security Manifestos", href: "#" },
];

const infrastructureLinks = [
  { text: "Voice Hearth Status", href: "#", hasIndicator: true },
  { text: "System FAQs", href: "#" },
  { text: "Signal Support Line", href: "#" },
];

export default function OutpostFooter() {
  return (
    <footer className="outpost-footer">
      {/* 🎬 Subtle Animated Ambient Cloud Glow Background */}
      <div className="footer-ambient-glow" />

      <div className="footer-container">
        <div className="footer-grid">
          
          {/* Brand Presentation Block */}
          <div className="footer-brand-block">
            <a href="/" className="footer-brand-logo group">
              <div className="brand-flame-container">
                <Flame className="brand-flame-icon animate-pulse" />
              </div>
              <span className="brand-name">
                {data.company.name}
              </span>
            </a>

            <p className="brand-description">
              {data.company.description}
            </p>

            {/* Premium Animated Social Links */}
            <ul className="social-links-list">
              {socialLinks.map(({ icon: Icon, label, href }) => (
                <li key={label}>
                  <motion.a
                    whileHover={{ scale: 1.15, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link-item"
                  >
                    <span className="sr-only">{label}</span>
                    <Icon size={20} />
                  </motion.a>
                </li>
              ))}
            </ul>
          </div>

          {/* Directory Navigation Blocks Grid */}
          <div className="footer-nav-grid">
            
            <div className="footer-nav-block">
              <p className="nav-block-title">
                <Compass size={16} className="nav-icon" /> Terrain Navigation
              </p>
              <ul className="nav-links-list">
                {ecosystemLinks.map(({ text, href }) => (
                  <li key={text}>
                    <a href={href} className="nav-link">
                      {text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="footer-nav-block">
              <p className="nav-block-title">
                <ShieldAlert size={16} className="nav-icon" /> Legal Protocols
              </p>
              <ul className="nav-links-list">
                {documentationLinks.map(({ text, href }) => (
                  <li key={text}>
                    <a href={href} className="nav-link">
                      {text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="footer-nav-block">
              <p className="nav-block-title">
                <Radio size={16} className="nav-icon" /> Comm Arrays
              </p>
              <ul className="nav-links-list">
                {infrastructureLinks.map(({ text, href, hasIndicator }) => (
                  <li key={text}>
                    <a href={href} className="nav-link indicator-link">
                      <span>{text}</span>
                      {hasIndicator && (
                        <span className="status-indicator">
                          <span className="status-ping" />
                          <span className="status-dot" />
                        </span>
                      )}
                    </a>
                  </li>
                ))}
                <li>
                  <a href={`mailto:${data.email}`} className="email-link">
                    {data.email}
                  </a>
                </li>
              </ul>
            </div>

          </div>
        </div>

        {/* Bottom Metadata Bar Container */}
        <div className="footer-bottom-bar">
          <div className="footer-bottom-content">
            <p className="footer-signal">
              SIGNAL FREQUENCY: SECURE SECURE // LEVEL 1
            </p>
            <p className="footer-copyright">
              &copy; 2026 OUTPOST BASECAMP. All rights reserved.
            </p>
          </div>
        </div>

      </div>
    </footer>
  );
}
