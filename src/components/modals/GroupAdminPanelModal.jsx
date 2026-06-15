import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, X, AlertTriangle } from 'lucide-react';

const GroupAdminPanelModal = ({ isOpen, onClose, campsite, currentUser, onKick, onBan }) => {
  const [members, setMembers] = useState([]);
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'kick'|'ban', username: string }

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
    }
    setConfirmAction(null);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <button className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>
        
        <div className="modal-header">
          <h2><Shield size={20} style={{ marginRight: '8px', verticalAlign: 'middle', color: 'var(--brand-primary)' }}/> Group Admin Panel</h2>
          <p>Manage members for {campsite.name}</p>
        </div>

        <div className="modal-body" style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}>
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
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {confirmAction && (
          <div className="confirmation-dialog" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '16px' }}>
            <div style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: '12px', maxWidth: '80%', textAlign: 'center' }}>
              <AlertTriangle size={32} color={confirmAction.type === 'ban' ? '#ff4444' : 'orange'} style={{ marginBottom: '16px' }} />
              <h3 style={{ marginBottom: '12px' }}>Confirm {confirmAction.type === 'ban' ? 'Ban' : 'Kick'}</h3>
              <p style={{ marginBottom: '24px' }}>
                Are you sure you want to permanently {confirmAction.type} <strong>{confirmAction.username}</strong> from this group?
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
      </div>
    </div>
  );
};

export default GroupAdminPanelModal;
