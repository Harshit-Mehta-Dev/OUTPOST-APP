import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Compass,
  Radio,
  ShieldAlert,
  HelpCircle,
  Activity,
  Code,
  GitBranch,
  Shield,
  FileText,
  Users,
  Lock,
  Headphones,
  Search,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Send,
  ExternalLink,
  Flame,
  Zap,
  Server
} from 'lucide-react';
import './FooterModal.css';

export default function FooterModal({ isOpen, onClose, initialSection = 'system-faqs' }) {
  const [activeSection, setActiveSection] = useState(initialSection);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportSubmitted, setSupportSubmitted] = useState(false);

  useEffect(() => {
    if (initialSection) {
      setActiveSection(initialSection);
    }
  }, [initialSection]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Section categories navigation definition
  const navigationCategories = [
    {
      category: 'Terrain Navigation',
      icon: Compass,
      items: [
        { id: 'basecamp-core', label: 'The Basecamp Core', icon: Flame },
        { id: 'discover-radar', label: 'Global Discover Radar', icon: Compass },
      ]
    },
    {
      category: 'Legal Protocols',
      icon: ShieldAlert,
      items: [
        { id: 'privacy-charter', label: 'Scout Data Charter (Privacy)', icon: Shield },
        { id: 'terms-compact', label: 'Basecamp Compact (ToS)', icon: FileText },
        { id: 'scout-code', label: 'The Scout Code (Guidelines)', icon: Users },
      ]
    },
    {
      category: 'Comm Arrays',
      icon: Radio,
      items: [
        { id: 'system-faqs', label: 'System FAQs', icon: HelpCircle },
        { id: 'support-line', label: 'Signal Support Line', icon: Headphones },
      ]
    }
  ];

  // FAQ Database
  const faqData = [
    {
      category: 'Troubleshooting & Connection',
      q: 'How does Outpost handle WebSockets reconnections if my network drops?',
      a: 'Outpost utilizes an intelligent exponential backoff algorithm with an instant jitter-buffer. If your connection drops, the client automatically attempts reconnection every 2–5 seconds and resynchronizes unread message packets as soon as the signal is restored.'
    },
    {
      category: 'Troubleshooting & Connection',
      q: 'What should I do if my Voice Expedition / Hearth audio is not connecting?',
      a: '1) Ensure microphone permissions are granted in your browser settings.\n2) If behind a strict corporate firewall, ensure UDP traffic on WebRTC ports is allowed.\n3) Check the Voice Hearth Status tab to verify the regional relay node is fully operational.'
    },
    {
      category: 'Basecamp Operations',
      q: 'What is the difference between a Public Basecamp and a Hidden Outpost?',
      a: 'Public Basecamps are indexed on the Global Discover Radar for all scouts to explore and join. Hidden Outposts are strictly invite-only with encrypted invite links, invisible to global discovery.'
    },
    {
      category: 'Basecamp Operations',
      q: 'How do Campsite roles and permissions work?',
      a: 'Campsite Commanders (Admins) can create custom roles with tailored color codes and privileges (managing channels, deleting messages, and kicking members) inside the Camp Operations modal.'
    },
    {
      category: 'Basecamp Operations',
      q: 'How does the Dual-Delete message deletion protocol work?',
      a: 'When deleting a message, you have two options:\n• "Delete for me": Removes the message locally from your device view without affecting others.\n• "Delete for everyone": Permanently purges the message from the server and removes it in real-time from all users.'
    },
    {
      category: 'Audio & Spotify Chill Zone',
      q: 'Why does the Chill Zone music keep playing when I change channels?',
      a: 'The Chill Zone is engineered as a persistent audio subsystem. It stays mounted in the background so you can read, code, and chat in text expeditions without interrupting your lo-fi study beats or background music.'
    },
    {
      category: 'Security & AI Moderation',
      q: 'How does Scout-Guardian protect basecamps from malicious activity?',
      a: 'Scout-Guardian runs an on-device NLP moderation engine (`model.nlp`) alongside rate-limiting filters to intercept toxic content, spam exploits, and malicious transmissions before they can compromise your basecamp.'
    },
    {
      category: 'Account & Progression',
      q: 'How do I earn XP and Level Up my Scout status?',
      a: 'You automatically earn XP through active participation—sending tactical messages, collaborating in basecamps, and completing Basecamp Board Kanban tasks. Leveling up unlocks visual rank badges and flair.'
    }
  ];

  const filteredFaqs = faqData.filter(
    (faq) =>
      faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.a.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sampleApiCode = `// Outpost Bot Sandbox API Example
import { OutpostClient } from '@outpost/bot-sdk';

const scoutBot = new OutpostClient({
  apiKey: 'opt_live_98a76d54f3e21c',
  campsiteId: 'camp_alpha_702'
});

// Listen for tactical broadcasts
scoutBot.on('message', async (transmission) => {
  if (transmission.text.startsWith('!ping')) {
    await scoutBot.send({
      channel: transmission.channelId,
      text: '🏓 Signal Nominal: Latency 14ms. Scout ready for orders!'
    });
  }
});

scoutBot.connect();`;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSupportSubmit = (e) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;
    setSupportSubmitted(true);
    setTimeout(() => {
      setSupportMessage('');
      setSupportEmail('');
      setSupportSubmitted(false);
    }, 4000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="footer-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className="footer-modal-container"
            initial={{ scale: 0.94, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="footer-modal-header">
              <div className="header-badge-group">
                <div className="header-logo-chip">
                  <Flame size={18} color="#f97316" />
                </div>
                <div>
                  <h2 className="header-title">OUTPOST COMMAND DIRECTORY</h2>
                  <span className="header-subtitle">Tactical Systems & Operations Hub v3.1</span>
                </div>
              </div>
              <button className="footer-modal-close" onClick={onClose} title="Close Directory (ESC)">
                <X size={20} />
              </button>
            </div>

            {/* Modal Body with Left Navigation & Right Content Area */}
            <div className="footer-modal-layout">
              
              {/* Left Navigation Sidebar */}
              <aside className="footer-modal-sidebar">
                {navigationCategories.map((group) => {
                  const GroupIcon = group.icon;
                  return (
                    <div key={group.category} className="sidebar-group">
                      <div className="sidebar-group-title">
                        <GroupIcon size={14} className="group-icon" />
                        <span>{group.category}</span>
                      </div>
                      <div className="sidebar-group-items">
                        {group.items.map((item) => {
                          const ItemIcon = item.icon;
                          const isActive = activeSection === item.id;
                          return (
                            <button
                              key={item.id}
                              className={`sidebar-nav-btn ${isActive ? 'active' : ''}`}
                              onClick={() => setActiveSection(item.id)}
                            >
                              <ItemIcon size={16} className="item-icon" />
                              <span className="item-label">{item.label}</span>
                              {item.hasIndicator && (
                                <span className="live-status-dot" title="Systems Active" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </aside>

              {/* Right Content Viewport */}
              <main className="footer-modal-content">
                
                {/* 1. THE BASECAMP CORE */}
                {activeSection === 'basecamp-core' && (
                  <div className="section-pane">
                    <div className="pane-header">
                      <div className="pane-icon-box"><Flame size={24} color="#f97316" /></div>
                      <div>
                        <h3>The Basecamp Core</h3>
                        <p className="pane-desc">Architecture and real-time topology powering Outpost basecamps.</p>
                      </div>
                    </div>
                    <div className="pane-body">
                      <div className="feature-card-grid">
                        <div className="feature-card">
                          <h4>⚡ High-Throughput WebSockets</h4>
                          <p>Bi-directional event loop streaming message packets, typing indicators, and presence updates with sub-20ms latency.</p>
                        </div>
                        <div className="feature-card">
                          <h4>🛡️ Sovereign Campsite Isolation</h4>
                          <p>Each Campsite functions as an autonomous communication room with dedicated role hierarchies and expedition permissions.</p>
                        </div>
                        <div className="feature-card">
                          <h4>📁 Expeditions Matrix</h4>
                          <p>Organize communications into tailored Text Expeditions, Voice Hearth audio channels, Basecamp Board Kanban, and AI Nexus assistant hubs.</p>
                        </div>
                        <div className="feature-card">
                          <h4>🔒 End-to-End Encryption Visuals</h4>
                          <p>All transmitted media and payload packets pass through hardened sanitization filters and volatile transit buffers.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. GLOBAL DISCOVER RADAR */}
                {activeSection === 'discover-radar' && (
                  <div className="section-pane">
                    <div className="pane-header">
                      <div className="pane-icon-box"><Compass size={24} color="#f97316" /></div>
                      <div>
                        <h3>Global Discover Radar</h3>
                        <p className="pane-desc">The open campsite directory connecting scouts to developer and gaming communities worldwide.</p>
                      </div>
                    </div>
                    <div className="pane-body">
                      <p className="lead-text">
                        The Discover Radar operates as Outpost's decentralized public registry. Campsite commanders can publish their basecamp to the radar with custom emblems, descriptions, and tag arrays.
                      </p>
                      <div className="info-callout">
                        <Zap size={20} color="#f97316" />
                        <div>
                          <strong>One-Click Scout Deployment:</strong> When a scout joins from Discover, they are instantly verified and assigned initial scout standing without friction.
                        </div>
                      </div>
                      <div className="feature-list">
                        <div className="list-item">🔹 <strong>Live Scout Counts:</strong> Displays real-time online members currently active at basecamp.</div>
                        <div className="list-item">🔹 <strong>Tag-Based Filtering:</strong> Instantly filter between Gaming Guilds, Developer Squads, AI Labs, and Casual Hubs.</div>
                        <div className="list-item">🔹 <strong>Privacy Controls:</strong> Toggle visibility on or off anytime via the Camp Operations Control Deck.</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. SCOUT DATA CHARTER (PRIVACY) */}
                {activeSection === 'privacy-charter' && (
                  <div className="section-pane">
                    <div className="pane-header">
                      <div className="pane-icon-box"><Shield size={24} color="#f97316" /></div>
                      <div>
                        <h3>Scout Data Charter (Privacy)</h3>
                        <p className="pane-desc">Our cryptographic commitment to zero-knowledge user sovereignty.</p>
                      </div>
                    </div>
                    <div className="pane-body legal-text-flow">
                      <h4>1. Zero-Knowledge Logistics</h4>
                      <p>Outpost does not sell, profile, or monetize your communication streams. User telemetry is restricted to operational ping metrics necessary for maintaining real-time socket connections.</p>
                      
                      <h4>2. Transient Buffer Policy</h4>
                      <p>Audio frames transmitted in Voice Expeditions are routed in real-time and never recorded or stored on disk. Text transmissions are stored with strict encryption at rest.</p>

                      <h4>3. Account Deletion & Right to Forget</h4>
                      <p>Scouts retain unilateral authority to wipe their user account or individual chat history locally via the Dual-Delete protocol.</p>
                    </div>
                  </div>
                )}

                {/* 3. BASECAMP COMPACT (TOS) */}
                {activeSection === 'terms-compact' && (
                  <div className="section-pane">
                    <div className="pane-header">
                      <div className="pane-icon-box"><FileText size={24} color="#f97316" /></div>
                      <div>
                        <h3>Basecamp Compact (Terms of Service)</h3>
                        <p className="pane-desc">Operational rules and terms governing global Outpost node usage.</p>
                      </div>
                    </div>
                    <div className="pane-body legal-text-flow">
                      <h4>1. Authorization & Responsibility</h4>
                      <p>By establishing an Outpost Scout credential, you agree to safeguard your authentication tokens and uphold civil tactical communications.</p>

                      <h4>2. Campsite Commander Authority</h4>
                      <p>Basecamp creators act as sovereign moderators of their individual groups, possessing the authority to configure channel rules, assign role permissions, or decommission their campsite.</p>

                      <h4>3. Infrastructure Availability</h4>
                      <p>While Outpost targets 99.9% uptime, access may occasionally be throttled during scheduled edge deployments or network maintenance.</p>
                    </div>
                  </div>
                )}

                {/* 4. THE SCOUT CODE (GUIDELINES) */}
                {activeSection === 'scout-code' && (
                  <div className="section-pane">
                    <div className="pane-header">
                      <div className="pane-icon-box"><Users size={24} color="#f97316" /></div>
                      <div>
                        <h3>The Scout Code (Community Decrees)</h3>
                        <p className="pane-desc">Standards of conduct required across all verified basecamps.</p>
                      </div>
                    </div>
                    <div className="pane-body">
                      <div className="decree-card">
                        <div className="decree-num">01</div>
                        <div>
                          <h4>Respect The Perimeter</h4>
                          <p>Treat all commanders and scouts with mutual respect. Harassment, targeted toxicity, and hate speech are strictly prohibited.</p>
                        </div>
                      </div>
                      <div className="decree-card">
                        <div className="decree-num">02</div>
                        <div>
                          <h4>Zero Malicious Transmission</h4>
                          <p>Do not deploy malware, automated spam chains, phishing vectors, or malicious attack streams against Outpost nodes.</p>
                        </div>
                      </div>
                      <div className="decree-card">
                        <div className="decree-num">03</div>
                        <div>
                          <h4>Protect Sensitive Comms</h4>
                          <p>Never transmit unauthorized credentials, passwords, or personal identifying information in public basecamp channels.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 10. SYSTEM FAQS (ACCORDION WITH SEARCH) */}
                {activeSection === 'system-faqs' && (
                  <div className="section-pane">
                    <div className="pane-header">
                      <div className="pane-icon-box"><HelpCircle size={24} color="#f97316" /></div>
                      <div>
                        <h3>System FAQs (Frequently Asked Questions)</h3>
                        <p className="pane-desc">Find instant answers to common questions, operations, and troubleshooting steps.</p>
                      </div>
                    </div>

                    {/* FAQ Search Bar */}
                    <div className="faq-search-wrapper">
                      <Search size={16} className="faq-search-icon" />
                      <input
                        type="text"
                        placeholder="Search troubleshooting, features, audio, or account questions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="faq-search-input"
                      />
                      {searchQuery && (
                        <button className="faq-search-clear" onClick={() => setSearchQuery('')}>
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    {/* FAQ List */}
                    <div className="faq-accordion-list">
                      {filteredFaqs.length === 0 ? (
                        <div className="faq-empty-state">
                          <AlertCircle size={28} color="#71717a" />
                          <p>No questions matched your search query. Try typing another keyword or check our Signal Support Line.</p>
                        </div>
                      ) : (
                        filteredFaqs.map((faq, index) => {
                          const isExpanded = expandedFaq === index;
                          return (
                            <div key={index} className={`faq-card ${isExpanded ? 'expanded' : ''}`}>
                              <button
                                className="faq-question-btn"
                                onClick={() => setExpandedFaq(isExpanded ? null : index)}
                              >
                                <span className="faq-category-tag">{faq.category}</span>
                                <span className="faq-q-text">{faq.q}</span>
                                <span className="faq-toggle-icon">
                                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                </span>
                              </button>
                              {isExpanded && (
                                <div className="faq-answer-pane">
                                  <p>{faq.a}</p>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* 11. SIGNAL SUPPORT LINE */}
                {activeSection === 'support-line' && (
                  <div className="section-pane">
                    <div className="pane-header">
                      <div className="pane-icon-box"><Headphones size={24} color="#f97316" /></div>
                      <div>
                        <h3>Signal Support Line & Dispatch</h3>
                        <p className="pane-desc">Direct communications with Outpost core engineering and support staff.</p>
                      </div>
                    </div>
                    <div className="pane-body">
                      {supportSubmitted ? (
                        <div className="support-success-box">
                          <CheckCircle2 size={36} color="#22c55e" />
                          <h4>Transmission Received!</h4>
                          <p>Your signal has been dispatched to our engineering desk. We typically respond within 2–4 hours.</p>
                        </div>
                      ) : (
                        <form onSubmit={handleSupportSubmit} className="support-form">
                          <div className="form-group">
                            <label>Scout Return Signal (Email Address)</label>
                            <input
                              type="email"
                              placeholder="scout@yourbasecamp.com"
                              required
                              value={supportEmail}
                              onChange={(e) => setSupportEmail(e.target.value)}
                              className="support-input"
                            />
                          </div>
                          <div className="form-group">
                            <label>Incident or Inquery Briefing</label>
                            <textarea
                              placeholder="Describe the issue, bug report, or feature request in detail..."
                              required
                              rows={4}
                              value={supportMessage}
                              onChange={(e) => setSupportMessage(e.target.value)}
                              className="support-textarea"
                            />
                          </div>
                          <button type="submit" className="support-submit-btn">
                            <Send size={16} /> Dispatch Signal to Support
                          </button>
                          <div className="direct-email-hint">
                            Or reach us directly via official comms: <a href="mailto:hello.outpostbasecamp@gmail.com">hello.outpostbasecamp@gmail.com</a>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                )}

              </main>

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
