import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Scale, ScrollText, ShieldAlert } from "lucide-react";
import "./LegalHub.css";

const tabMeta = [
  { id: "privacy", label: "Privacy Covenant", icon: ShieldCheck },
  { id: "terms", label: "Terms of Service", icon: ScrollText },
  { id: "community", label: "Community Decrees", icon: Scale },
];

export default function LegalHub() {
  const [activeTab, setActiveTab] = useState("privacy");

  return (
    <div className="legal-hub-container" id="legal">
      {/* Header Context Banner */}
      <div className="legal-header">
        <div className="legal-ambient-glow" />
        <h2 className="legal-title">
          <ShieldAlert className="animate-pulse" size={32} color="#f97316" />
          Tactical Decrees
        </h2>
        <p className="legal-subtitle">
          Review the structural foundations, privacy protocols, and behavioral rules governing all worldwide Outpost Campsites.
        </p>
      </div>

      {/* Glassmorphic Tab Switching Dock */}
      <div className="legal-tab-dock">
        {tabMeta.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`legal-tab-btn ${isActive ? "active" : ""}`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeLegalTab"
                  className="legal-tab-indicator"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <Icon className={`legal-tab-icon ${isActive ? "active" : ""}`} />
              <span className="legal-tab-label">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Policy Content Viewer Shell */}
      <div className="legal-content-shell">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="legal-prose"
          >
            {activeTab === "privacy" && (
              <>
                <h3 className="legal-prose-header">
                  🛡️ PROTOCOL 0-K: PRIVACY COVENANT
                </h3>
                <div className="legal-prose-section">
                  <p className="legal-prose-title">SECTION 1.1: ZERO-KNOWLEDGE LOGISTICS</p>
                  <p>
                    Outpost is engineered on a baseline protocol of absolute structural anonymity. No centralized entity retains keys to your private text packets, server operations, or user state vectors. Data updates occur entirely point-to-point or via encrypted volatile buffers.
                  </p>
                  <p className="legal-prose-title">SECTION 1.2: EMISSION OF DATA TRAFFIC</p>
                  <p>
                    Your chosen profile credentials, system metrics, and campsite arrays are indexed securely within your decentralized MongoDB node. No metadata mapping or tracking arrays are executed for advertising networks.
                  </p>
                  <p className="legal-prose-title">SECTION 1.3: TRANSIENT STORAGE & LOGGING</p>
                  <p>
                    All communication packets handled inside text or voice streams execute on volatile system architecture. Once an active connection is decommissioned, logs are permanently flushed from server buffers.
                  </p>
                </div>
              </>
            )}

            {activeTab === "terms" && (
              <>
                <h3 className="legal-prose-header">
                  📜 TERMS OF SERVICE & DEPLOYMENT COMPACT
                </h3>
                <div className="legal-prose-section">
                  <p className="legal-prose-title">SECTION 2.1: ACCOUNT ELIGIBILITY & SOVEREIGNTY</p>
                  <p>
                    By initializing a unique Scout Handle inside Outpost, you acknowledge that you remain entirely responsible for guarding your security tokens and authorization arrays. Access coordinates may not be sub-licensed to third-party operations.
                  </p>
                  <p className="legal-prose-title">SECTION 2.2: DESTRUCTION DIRECTIVES</p>
                  <p>
                    Campsite creators retain sovereign authorization to execute a <i>Decommission Directive</i> to wipe any public or private group permanently. Once verified, this destructive cascade removes all operational server data instantly and permanently.
                  </p>
                  <p className="legal-prose-title">SECTION 2.3: SERVICE AVAILABILITY MATRIX</p>
                  <p>
                    Outpost functions on an open system architecture. While we maintain a 99.9% uptime target across our real-time messaging hubs, connection performance might fluctuate depending on global network node constraints.
                  </p>
                </div>
              </>
            )}

            {activeTab === "community" && (
              <>
                <h3 className="legal-prose-header">
                  ⚖️ THE SCOUT CODE: COMMUNITY RULES
                </h3>
                <div className="legal-prose-section">
                  <p className="legal-prose-title">DECREE 3.1: RESPECT THE PERIMETER SAFETY</p>
                  <p>
                    If an expedition channel handles mature briefings or tracking arrays, camp operators are strictly required to toggle the <b>Age Restriction Perimeter (18+)</b> flag on to safeguard junior scouts.
                  </p>
                  <p className="legal-prose-title">DECREE 3.2: MALICIOUS ATTACK STREAMS</p>
                  <p>
                    The utilization of internal voice channels or automated chat bots to deploy malicious exploits, spam chains, or denial-of-service streams against external nodes will trigger immediate account bans by campsite administrators.
                  </p>
                  <p className="legal-prose-title">DECREE 3.3: COMMAND HIERARCHY</p>
                  <p>
                    Custom roles forged by Campsite Leaders carry authoritative permissions inside their operational zone. Scouts must coordinate effectively within assigned channel boundaries to maintain order at basecamp.
                  </p>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
