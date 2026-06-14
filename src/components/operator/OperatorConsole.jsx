import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Eye, ShieldAlert, ZapOff, Radio } from "lucide-react";

export default function OperatorConsole({ currentUserEmail, activeCampsite, onDecommission }) {
  const [isOpen, setIsOpen] = useState(false);
  const OPERATOR_EMAIL = "harshitmehta1012@gmail.com";

  // Hardcoded security safeguard return statement
  if (!currentUserEmail || currentUserEmail.toLowerCase().trim() !== OPERATOR_EMAIL) return null;

  const handleDecommission = () => {
    const confirmPurge = confirm(`🚨 INITIALIZE DECOMMISSION DECREE: Purge the entire campsite "${activeCampsite?.name}" permanently?`);
    if (!confirmPurge) return;
    
    setIsOpen(false);
    onDecommission(activeCampsite?.id);
  };

  return (
    <div className="relative" style={{ position: "relative", zIndex: 100 }}>
      {/* 👁️ Operator Command Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`theme-trigger-btn flex items-center justify-center transition-all duration-200 ${
          isOpen 
            ? "active shadow-[0_0_15px_rgba(239,68,68,0.2)]" 
            : ""
        }`}
        style={{
          background: isOpen ? 'rgba(69, 10, 10, 0.4)' : 'var(--bg-glass)',
          borderColor: isOpen ? 'rgba(153, 27, 27, 0.8)' : 'var(--border-glass)',
          color: isOpen ? '#f87171' : 'var(--text-secondary)'
        }}
        title="OPERATOR COMMAND PANEL GATE"
      >
        <Eye size={18} className="animate-pulse" />
      </button>

      {/* Glassmorphic Tactical Console Dropdown Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute w-80 bg-zinc-950 border border-red-900/30 rounded-2xl p-4 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] z-[100] font-sans text-zinc-300"
            style={{ top: "calc(100% + 12px)", right: 0 }}
          >
            {/* Console Header */}
            <div className="flex items-center justify-between border-b border-red-900/20 pb-3 mb-3" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(153,27,27,0.2)', paddingBottom: '12px', marginBottom: '12px' }}>
              <div className="flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="size-2 rounded-full bg-red-500 animate-ping" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                <span className="text-[10px] font-mono font-black tracking-widest text-red-400 uppercase" style={{ fontSize: '10px', fontFamily: 'monospace', fontWeight: 900, letterSpacing: '0.1em', color: '#f87171', textTransform: 'uppercase' }}>
                  Operator Console Core
                </span>
              </div>
              <span className="text-[9px] font-mono bg-red-950/60 text-red-400 px-2 py-0.5 rounded border border-red-900/30" style={{ fontSize: '9px', fontFamily: 'monospace', backgroundColor: 'rgba(69,10,10,0.6)', color: '#f87171', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(153,27,27,0.3)' }}>
                SYS_OVERRIDE_ACTIVE
              </span>
            </div>

            {/* Target Status Information Metadata */}
            <div className="space-y-3" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="p-2.5 bg-zinc-900/30 border border-zinc-900 rounded-xl space-y-1.5" style={{ padding: '10px', backgroundColor: 'rgba(24,24,27,0.3)', border: '1px solid #18181b', borderRadius: '12px' }}>
                <div className="flex items-center gap-1.5 text-[9px] font-mono uppercase text-zinc-500" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9px', fontFamily: 'monospace', textTransform: 'uppercase', color: '#71717a' }}>
                  <Radio size={12} className="text-red-500/70" style={{ color: 'rgba(239,68,68,0.7)' }} /> Focused Cluster Target
                </div>
                <p className="text-xs font-bold text-zinc-200 uppercase tracking-wide" style={{ fontSize: '12px', fontWeight: 'bold', color: '#e4e4e7', textTransform: 'uppercase', letterSpacing: '0.025em', margin: '4px 0 0 0' }}>
                  Campsite: <span className="text-white font-mono font-normal" style={{ color: 'white', fontFamily: 'monospace', fontWeight: 'normal' }}>#{activeCampsite?.name || "None"}</span>
                </p>
              </div>

              <p className="text-[11px] text-zinc-500 font-mono leading-normal px-1" style={{ fontSize: '11px', color: '#71717a', fontFamily: 'monospace', lineHeight: 1.5, padding: '0 4px', margin: 0 }}>
                Root security credentials authorized. Executing passes from this matrix bypasses all group creator rules and structures instantly.
              </p>

              {/* High-Consequence Destructive Trigger Button */}
              <button
                onClick={handleDecommission}
                className="w-full py-2.5 px-3 bg-red-950/30 hover:bg-red-900/40 border border-red-900/40 text-red-400 hover:text-red-200 text-xs font-mono font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_4px_12px_rgba(220,38,38,0.05)] group"
                style={{ width: '100%', padding: '10px 12px', backgroundColor: 'rgba(69,10,10,0.3)', border: '1px solid rgba(153,27,27,0.4)', color: '#f87171', fontSize: '12px', fontFamily: 'monospace', fontWeight: 'bold', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(127,29,29,0.4)'; e.currentTarget.style.color = '#fecaca'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(69,10,10,0.3)'; e.currentTarget.style.color = '#f87171'; }}
              >
                <ZapOff size={14} className="group-hover:scale-110 transition-transform" /> 
                [ Decommission Entire Campsite ]
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
