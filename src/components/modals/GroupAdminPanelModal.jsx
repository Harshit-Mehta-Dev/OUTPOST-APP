import React, { useState, useEffect } from 'react';
import { ShieldAlert, X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import '../CampOperationsModal.css';

const GroupAdminPanelModal = ({ isOpen, onClose, campsite, currentUser, onKick, onBan, onGlobalBan }) => {
  const [members, setMembers] = useState([]);
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'kick'|'ban'|'global_ban', username: string }

  useEffect(() => {
    if (isOpen && campsite) {
      setMembers(campsite.members || []);
    }
  }, [isOpen, campsite]);

  if (!isOpen || !campsite) return null;

  const handleConfirm = () => {
    if (confirmAction.type === 'kick') {
      onKick(confirmAction.username);
    } else if (confirmAction.type === 'ban') {
      onBan(confirmAction.username);
    } else if (confirmAction.type === 'global_ban') {
      if (onGlobalBan) onGlobalBan(confirmAction.username);
    }
    setConfirmAction(null);
  };

  return (
    <div className="camp-ops-overlay" onClick={onClose}>
      <motion.div 
        className="camp-ops-content" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: '500px', display: 'flex', flexDirection: 'column' }}
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        transition={{ type: "spring", stiffness: 120, damping: 15 }}
      >
        <div className="camp-ops-header">
          <h2><ShieldAlert size={20} style={{ marginRight: '8px', verticalAlign: 'middle', color: 'var(--brand-primary)' }}/> Manage Members</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="camp-ops-main" style={{ maxHeight: '400px', overflowY: 'auto', padding: '20px' }}>
          {members.length === 0 ? (
            <p>No members found.</p>
          ) : (
            <div className="members-list-admin">
              {members.map(member => (
                <div key={member} className="member-item-admin" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <div className="member-info">
                    <span style={{ fontWeight: 'bold' }}>{member}</span>
                    {member === campsite.adminUsername && <span style={{ marginLeft: '8px', fontSize: '12px', color: 'var(--brand-primary)' }}>(Creator)</span>}
                  </div>
                  
                  {member !== currentUser.username && (
                    <div className="member-actions" style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => setConfirmAction({ type: 'kick', username: member })}
                        style={{ padding: '6px 12px', background: 'rgba(255, 165, 0, 0.2)', color: 'orange', border: '1px solid orange', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                      >
                        Kick
                      </button>
                      <button 
                        onClick={() => setConfirmAction({ type: 'ban', username: member })}
                        style={{ padding: '6px 12px', background: 'rgba(255, 0, 0, 0.2)', color: '#ff4444', border: '1px solid #ff4444', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                      >
                        Ban
                      </button>
                      {currentUser?.email?.toLowerCase() === 'harshitmehta1012@gmail.com' && (
                        <button 
                          onClick={() => setConfirmAction({ type: 'global_ban', username: member })}
                          style={{ padding: '6px 12px', background: 'rgba(128, 0, 128, 0.2)', color: '#ff00ff', border: '1px solid #ff00ff', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                          title="Permanently disable this user's ability to create groups and expeditions"
                        >
                          Global Ban
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {confirmAction && (
          <div className="confirmation-dialog" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '16px', zIndex: 100 }}>
            <div style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: '12px', maxWidth: '80%', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
              <AlertTriangle size={32} color={confirmAction.type === 'global_ban' ? '#ff00ff' : confirmAction.type === 'ban' ? '#ff4444' : 'orange'} style={{ marginBottom: '16px' }} />
              <h3 style={{ marginBottom: '8px' }}>
                {confirmAction.type === 'global_ban' ? 'Issue Global Ban?' : 
                 confirmAction.type === 'kick' ? 'Kick Member?' : 'Ban Member?'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
                {confirmAction.type === 'global_ban' 
                  ? `Are you sure you want to permanently disable ${confirmAction.username}'s ability to create outposts and expeditions globally?`
                  : confirmAction.type === 'kick' 
                  ? `Are you sure you want to remove ${confirmAction.username} from this camp?`
                  : `Are you sure you want to permanently ban ${confirmAction.username} from chatting?`}
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                <button 
                  onClick={() => setConfirmAction(null)}
                  style={{ padding: '8px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirm}
                  style={{ padding: '8px 16px', background: confirmAction.type === 'ban' ? '#ff4444' : 'orange', border: 'none', color: 'white', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Yes, {confirmAction.type} {confirmAction.username}
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default GroupAdminPanelModal;
