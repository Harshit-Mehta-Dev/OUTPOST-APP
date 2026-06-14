import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShieldAlert, ZapOff, Radio, Terminal, X, RefreshCw, Database } from "lucide-react";

export default function OperatorTerminalTab({ isOpen, onClose, campsiteName, currentCampsiteId }) {
  
  const handleDecommission = async () => {
    const verification = prompt("⚠️ CRITICAL OVERRIDE DIRECTIVE: Type 'CONFIRM_DESTRUCT' to completely erase this campsite data footprint:");
    if (verification !== "CONFIRM_DESTRUCT") {
      alert("Verification mismatch. Decommission canceled.");
      return;
    }
    
    // Execute backend drop sequence call
    await fetch(`https://outpost-app.onrender.com/api/operator/decommission-campsite/${currentCampsiteId}`, { 
      method: "DELETE",
      headers: {
        "x-operator-email": "harshitmehta1012@gmail.com"
      }
    });
    
    onClose();
  };

  const handleForceSocketReboot = () => {
    alert("Broadcasting dynamic gateway socket flush pass...");
    // Wire your local socket.emit("operator-force-reboot-channels") hook link here
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 1. SOLID BACKGROUND UNDERLAY BLANKET OVER CHAT TEXT */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100]"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          />

          {/* 2. THE SLIDING OPERATOR TERMINAL PANEL BOARD */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 20, stiffness: 120 }}
            className="fixed top-0 right-0 h-screen w-80 sm:w-96 border-l flex flex-col justify-between font-sans text-zinc-300 z-[101]"
            style={{ 
              backgroundColor: '#09090b', 
              borderColor: 'rgba(127, 29, 29, 0.3)', 
              padding: '20px', 
              boxShadow: '-10px 0 40px rgba(0,0,0,0.8)' 
            }}
          >
            {/* Upper Workstation Cluster */}
            <div className="space-y-5" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Core Terminal Window Header */}
              <div className="flex items-center justify-between border-b pb-3" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #18181b', paddingBottom: '12px' }}>
                <div className="flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Terminal className="text-red-500 animate-pulse" size={16} />
                  <span className="text-[11px] font-mono font-black tracking-widest text-red-400 uppercase" style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 900, letterSpacing: '0.1em', color: '#f87171' }}>
                    Operator Station // Core
                  </span>
                </div>
                {/* Close Drawer Cross Trigger Button */}
                <button 
                  onClick={onClose}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ padding: '6px', backgroundColor: 'rgba(24, 24, 27, 0.6)', border: '1px solid #27272a', color: '#a1a1aa', cursor: 'pointer' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.backgroundColor = '#27272a'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#a1a1aa'; e.currentTarget.style.backgroundColor = 'rgba(24, 24, 27, 0.6)'; }}
                >
                  <X size={14} />
                </button>
              </div>

              {/* Cluster Signal Focus Panel Frame */}
              <div className="p-3 rounded-xl space-y-2" style={{ padding: '12px', backgroundColor: '#09090b', border: '1px solid #18181b', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="flex items-center justify-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="font-mono uppercase flex items-center gap-1" style={{ fontSize: '9px', color: '#71717a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Radio size={12} className="text-red-500" /> Active Grid Target
                  </span>
                  <span className="font-mono px-1.5 py-0.5 rounded" style={{ fontSize: '8px', backgroundColor: '#450a0a', color: '#f87171', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(127, 29, 29, 0.2)' }}>
                    SYS_OVERRIDE
                  </span>
                </div>
                <p className="font-black uppercase tracking-wide" style={{ fontSize: '14px', color: '#fff', margin: 0 }}>
                  Campsite Cluster: <span className="font-mono font-normal" style={{ color: '#f87171' }}>#{campsiteName || "None"}</span>
                </p>
              </div>

              {/* Warning Context Readout Text Block */}
              <div className="p-3 rounded-xl flex items-start" style={{ padding: '12px', backgroundColor: 'rgba(69, 10, 10, 0.1)', border: '1px solid rgba(127, 29, 29, 0.2)', borderRadius: '12px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <ShieldAlert size={16} className="text-red-400 shrink-0 mt-0.5" style={{ flexShrink: 0, marginTop: '2px', color: '#f87171' }} />
                <p className="font-mono leading-normal" style={{ fontSize: '11px', color: '#a1a1aa', margin: 0, lineHeight: 1.5 }}>
                  Sovereign authority template active. Executing actions from this matrix overrides standard campsite parameters and drops associated data strings directly from MongoDB Atlas tables.
                </p>
              </div>

              {/* Functional Dashboard Action Switches Matrix */}
              <div className="space-y-2 pt-2" style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '8px' }}>
                <label className="font-mono uppercase tracking-wider block px-1" style={{ fontSize: '9px', color: '#71717a', padding: '0 4px', margin: 0 }}>Network Overrides</label>
                
                <button
                  onClick={handleForceSocketReboot}
                  className="w-full py-2 px-3 rounded-xl font-mono flex items-center gap-2.5 transition-all group"
                  style={{ width: '100%', padding: '8px 12px', backgroundColor: 'rgba(24, 24, 27, 0.4)', border: '1px solid rgba(39, 39, 42, 0.8)', borderRadius: '12px', fontSize: '12px', color: '#d4d4d8', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#18181b'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(24, 24, 27, 0.4)'; }}
                >
                  <RefreshCw size={14} className="text-zinc-500" style={{ color: '#71717a' }} /> 
                  Flush Gateway Socket Channels
                </button>

                <button
                  className="w-full py-2 px-3 rounded-xl font-mono flex items-center gap-2.5 transition-all group"
                  style={{ width: '100%', padding: '8px 12px', backgroundColor: 'rgba(24, 24, 27, 0.4)', border: '1px solid rgba(39, 39, 42, 0.8)', borderRadius: '12px', fontSize: '12px', color: '#d4d4d8', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#18181b'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(24, 24, 27, 0.4)'; }}
                >
                  <Database size={14} className="text-zinc-500" style={{ color: '#71717a' }} /> 
                  Inspect Remote Atlas Indices
                </button>
              </div>

            </div>

            {/* Bottom Panel Frame: High-Consequence Destructive Execution Module */}
            <div className="pt-4" style={{ borderTop: '1px solid #18181b', paddingTop: '16px' }}>
              <button
                onClick={handleDecommission}
                className="w-full py-2.5 font-mono font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md group"
                style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(69, 10, 10, 0.2)', border: '1px solid rgba(127, 29, 29, 0.4)', color: '#f87171', fontSize: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#dc2626'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#ef4444'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(69, 10, 10, 0.2)'; e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(127, 29, 29, 0.4)'; }}
              >
                <ZapOff size={14} /> 
                [ Decommission Basecamp ]
              </button>
              <span className="font-mono text-center block mt-3 uppercase tracking-widest" style={{ fontSize: '9px', color: '#52525b', textAlign: 'center', display: 'block', marginTop: '12px', letterSpacing: '0.1em' }}>
                Operator Terminal: Secure Access Node
              </span>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
