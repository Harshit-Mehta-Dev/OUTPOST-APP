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
          style={{
            position: 'absolute',
            top: '60px',
            right: '10px',
            width: 'calc(100vw - 20px)',
            maxWidth: '320px',
            background: 'rgba(9, 9, 11, 0.95)',
            border: '1px solid rgba(39, 39, 42, 1)',
            backdropFilter: 'blur(12px)',
            borderRadius: '16px',
            padding: '16px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            fontFamily: 'var(--font-body)',
            color: 'var(--text-primary)'
          }}
        >
          {/* Panel Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', fontFamily: 'monospace', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
              Incoming Signals
            </span>
            {alerts.length > 0 && (
              <button 
                onClick={onClearAll} 
                style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                onMouseOver={(e) => e.currentTarget.style.color = 'var(--brand-primary)'}
                onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                [ Clear Feed ]
              </button>
            )}
          </div>

          {/* Notification Stream Cards Stack */}
          <div style={{ maxHeight: '250px', overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {alerts.length === 0 ? (
              <div style={{ padding: '32px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                <BellOff size={20} />
                <p style={{ fontSize: '11px', fontFamily: 'monospace' }}>Perimeter quiet. No unread signals.</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => onSelectAlert(alert)}
                  style={{
                    padding: '10px',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(var(--brand-primary), 0.5)';
                    e.currentTarget.style.backgroundColor = 'rgba(var(--brand-primary), 0.05)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-glass)';
                    e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
                  }}
                >
                  <div style={{ padding: '8px', backgroundColor: 'rgba(var(--brand-primary), 0.1)', border: '1px solid rgba(var(--brand-primary), 0.2)', color: 'rgb(var(--brand-primary))', borderRadius: '8px', marginTop: '2px' }}>
                    <MessageSquare size={14} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <p style={{ fontSize: '10px', fontFamily: 'monospace', fontWeight: 'bold', color: 'rgb(var(--brand-primary))', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '70%', textTransform: 'uppercase' }}>
                        {alert.campsiteName}
                      </p>
                      <span style={{ fontSize: '9px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>Now</span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: '600', marginTop: '2px', marginBottom: '2px' }}>
                      {alert.senderName}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
