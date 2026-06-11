import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, BellOff } from "lucide-react";

export default function NotificationDropdown({ isOpen, alerts, onSelectAlert, onClearAll }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          className="absolute top-16 right-0 w-80 bg-zinc-950/95 border border-zinc-900 backdrop-blur-xl rounded-2xl p-4 shadow-2xl z-50 text-zinc-300 font-sans"
        >
          {/* Panel Header */}
          <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5 mb-3">
            <span className="text-xs font-bold font-mono tracking-wider text-zinc-100 uppercase">Incoming Signals</span>
            {alerts.length > 0 && (
              <button onClick={onClearAll} className="text-[10px] font-mono text-zinc-500 hover:text-orange-400 transition">
                [ Clear Feed ]
              </button>
            )}
          </div>

          {/* Notification Stream Cards Stack */}
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {alerts.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2 text-zinc-600">
                <BellOff className="size-5" />
                <p className="text-[11px] font-mono">Perimeter quiet. No unread signals.</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => onSelectAlert(alert)}
                  className="p-2.5 bg-zinc-900/30 border border-zinc-900 hover:border-zinc-800 rounded-xl cursor-pointer transition-all flex items-start gap-3 group"
                >
                  <div className="p-2 bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/20 text-[var(--brand-primary)] rounded-lg mt-0.5 group-hover:bg-[var(--brand-primary)] group-hover:text-white transition-colors duration-200">
                    <MessageSquare className="size-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <p className="text-[10px] font-mono font-bold text-[var(--brand-primary)] truncate max-w-[60%] uppercase">
                        {alert.campsiteName}
                      </p>
                      <span className="text-[9px] font-mono text-zinc-600">Now</span>
                    </div>
                    <p className="text-xs text-zinc-200 font-semibold mt-0.5">
                      {alert.senderName}
                    </p>
                    <p className="text-[11px] text-zinc-500 truncate mt-0.5 group-hover:text-zinc-400 transition-colors">
                      {alert.textPreview}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
