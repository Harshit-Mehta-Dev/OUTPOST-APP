import React, { useState } from "react";
import { motion } from "motion/react";
import { Bot, ShieldAlert, AudioLines, Sparkles, BrainCircuit } from "lucide-react";

export default function AIOperations({ onClose }) {
  const [rangerActive, setRangerActive] = useState(() => localStorage.getItem("outpost_ai_ranger") === "true");
  const [transcribeActive, setTranscribeActive] = useState(() => localStorage.getItem("outpost_ai_transcribe") === "true");

  const handleCommitConfig = () => {
    localStorage.setItem("outpost_ai_ranger", String(rangerActive));
    localStorage.setItem("outpost_ai_transcribe", String(transcribeActive));
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="absolute top-16 right-4 w-80 bg-zinc-950/95 border border-zinc-900 backdrop-blur-xl rounded-2xl p-5 shadow-2xl z-50 text-zinc-300 font-sans"
      style={{
        position: 'absolute',
        top: '60px',
        right: '10px',
        width: '320px',
        background: 'rgba(9, 9, 11, 0.95)',
        border: '1px solid rgba(39, 39, 42, 1)',
        backdropFilter: 'blur(24px)',
        borderRadius: '1rem',
        padding: '20px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        zIndex: 50,
        color: '#d4d4d8',
        fontFamily: 'sans-serif'
      }}
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-4" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(39, 39, 42, 1)', paddingBottom: '12px', marginBottom: '16px' }}>
        <h4 className="text-xs font-bold font-mono tracking-wider text-zinc-100 uppercase flex items-center gap-2" style={{ fontSize: '0.75rem', fontWeight: 'bold', fontFamily: 'monospace', letterSpacing: '0.05em', color: '#f4f4f5', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <BrainCircuit size={16} style={{ color: 'var(--brand-primary)', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} /> Missions AI Core
        </h4>
        <button 
          onClick={onClose} 
          style={{ fontSize: '10px', fontFamily: 'monospace', color: '#71717a', background: 'transparent', border: 'none', cursor: 'pointer' }}
        >
          [ Hide ]
        </button>
      </div>

      {/* Control Stack */}
      <div className="space-y-3" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        
        {/* Toggle Card 1: Basecamp Ranger */}
        <div style={{ padding: '12px', background: 'rgba(24, 24, 27, 0.4)', border: '1px solid rgba(39, 39, 42, 1)', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s' }}>
          <div style={{ display: 'flex', gap: '10px', maxWidth: '75%' }}>
            <ShieldAlert size={16} style={{ flexShrink: 0, marginTop: '2px', color: rangerActive ? 'var(--brand-primary)' : '#52525b' }} />
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#e4e4e7', margin: 0 }}>Basecamp Ranger</p>
              <p style={{ fontSize: '10px', color: '#71717a', lineHeight: 'normal', margin: '2px 0 0 0' }}>Scans chat packets via NLP models to halt toxic emissions in real-time.</p>
            </div>
          </div>
          
          <button
            onClick={() => setRangerActive(!rangerActive)}
            style={{
              width: '36px', height: '20px', borderRadius: '9999px', padding: '2px', transition: 'background-color 0.2s', border: 'none', cursor: 'pointer', flexShrink: 0,
              background: rangerActive ? 'var(--brand-primary)' : '#27272a'
            }}
          >
            <motion.div
              layout
              style={{ width: '16px', height: '16px', background: '#fff', borderRadius: '9999px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
              animate={{ x: rangerActive ? 16 : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </button>
        </div>

        {/* Toggle Card 2: Voice-to-Text */}
        <div style={{ padding: '12px', background: 'rgba(24, 24, 27, 0.4)', border: '1px solid rgba(39, 39, 42, 1)', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s' }}>
          <div style={{ display: 'flex', gap: '10px', maxWidth: '75%' }}>
            <AudioLines size={16} style={{ flexShrink: 0, marginTop: '2px', color: transcribeActive ? 'var(--brand-primary)' : '#52525b' }} />
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#e4e4e7', margin: 0 }}>Hearth Transcript Nexus</p>
              <p style={{ fontSize: '10px', color: '#71717a', lineHeight: 'normal', margin: '2px 0 0 0' }}>Translates active WebRTC audio packets into floating chat summaries.</p>
            </div>
          </div>
          
          <button
            onClick={() => setTranscribeActive(!transcribeActive)}
            style={{
              width: '36px', height: '20px', borderRadius: '9999px', padding: '2px', transition: 'background-color 0.2s', border: 'none', cursor: 'pointer', flexShrink: 0,
              background: transcribeActive ? 'var(--brand-primary)' : '#27272a'
            }}
          >
            <motion.div
              layout
              style={{ width: '16px', height: '16px', background: '#fff', borderRadius: '9999px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
              animate={{ x: transcribeActive ? 16 : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </button>
        </div>

        {/* Operational Diagnostics Readout */}
        <div style={{ background: '#09090b', border: '1px solid rgba(39, 39, 42, 0.8)', borderRadius: '0.75rem', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'monospace', fontSize: '10px', color: '#71717a' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Bot size={12} style={{ color: '#a1a1aa' }} /> GPU Async Uplink:</span>
          <span style={{ color: '#10b981', fontWeight: 'bold', letterSpacing: '-0.025em', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Sparkles size={10} style={{ color: '#34d399', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} /> ACTIVE_INF
          </span>
        </div>

        {/* Action Commit Button */}
        <button
          onClick={handleCommitConfig}
          style={{ width: '100%', padding: '8px 0', background: '#18181b', color: '#e4e4e7', fontSize: '12px', fontFamily: 'monospace', fontWeight: 'bold', borderRadius: '0.75rem', border: '1px solid #27272a', transition: 'all 0.2s', marginTop: '4px', cursor: 'pointer' }}
        >
          Commit Operation Configurations
        </button>

      </div>
    </motion.div>
  );
}
