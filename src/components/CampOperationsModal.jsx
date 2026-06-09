import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Users, Shield, Trash2, Plus, UserPlus, LogOut } from 'lucide-react';
import './CampOperationsModal.css';

const CampOperationsModal = ({ isOpen, onClose, campsite, isAdmin, onDeleteCampsite, onUpdateCampsite, onLeaveCampsite }) => {
  const [activeTab, setActiveTab] = useState('personnel');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  
  // Personnel state
  const [recruitName, setRecruitName] = useState('');
  const [isForgingRole, setIsForgingRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');

  if (!isOpen || !campsite) return null;

  const isDeleteReady = deleteConfirmation === campsite.name;

  // Safe access to campsite data (fallback to defaults if undefined)
  const members = campsite.members || [];
  const defaultRoles = [
    { name: 'Commander', color: '#ffb732' },
    { name: 'Scout', color: '#4facfe' }
  ];
  const roles = campsite.roles || defaultRoles;
  const globalAgeGate = campsite.globalAgeGate || false;
  const channelOverrides = campsite.channelOverrides || {};

  const handleRecruit = () => {
    if (recruitName.trim()) {
      onUpdateCampsite(campsite.id, { 
        members: [...members, recruitName.trim()] 
      });
      setRecruitName('');
    }
  };

  const handleForgeRole = () => {
    if (newRoleName.trim()) {
      // Pick a random pleasant color
      const colors = ['#ff3b30', '#34c759', '#af52de', '#ffcc00', '#5ac8fa'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      onUpdateCampsite(campsite.id, {
        roles: [...roles, { name: newRoleName.trim(), color: randomColor }]
      });
      setNewRoleName('');
      setIsForgingRole(false);
    }
  };

  const toggleGlobalAgeGate = () => {
    onUpdateCampsite(campsite.id, { globalAgeGate: !globalAgeGate });
  };

  const toggleChannelOverride = (channelId) => {
    onUpdateCampsite(campsite.id, {
      channelOverrides: {
        ...channelOverrides,
        [channelId]: !channelOverrides[channelId]
      }
    });
  };

  const removeMember = (name) => {
    onUpdateCampsite(campsite.id, {
      members: members.filter(m => m !== name)
    });
  };

  const removeRole = (name) => {
    onUpdateCampsite(campsite.id, {
      roles: roles.filter(r => r.name !== name)
    });
  };

  return (
    <div className="camp-ops-overlay">
      <motion.div 
        className="camp-ops-content"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        transition={{ type: "spring", stiffness: 120, damping: 15 }}
      >
        <div className="camp-ops-sidebar">
          <h3>Camp Operations</h3>
          <button 
            className={`ops-tab-btn ${activeTab === 'personnel' ? 'active' : ''}`}
            onClick={() => setActiveTab('personnel')}
          >
            <Users size={18} /> Personnel Management
          </button>
          {isAdmin && (
            <button 
              className={`ops-tab-btn ${activeTab === 'safety' ? 'active' : ''}`}
              onClick={() => setActiveTab('safety')}
            >
              <Shield size={18} /> Perimeter Safety
            </button>
          )}
          
          <button 
            className={`ops-tab-btn danger ${activeTab === 'destruction' ? 'active' : ''}`}
            onClick={() => setActiveTab('destruction')}
          >
            {isAdmin ? (
              <><Trash2 size={18} /> Destruction Directive</>
            ) : (
              <><LogOut size={18} /> Leave Bootcamp</>
            )}
          </button>
        </div>
        
        <div className="camp-ops-main">
          <div className="camp-ops-header">
            <h2>
              {activeTab === 'personnel' && 'Personnel Management'}
              {activeTab === 'safety' && 'Perimeter Safety'}
              {activeTab === 'destruction' && (isAdmin ? 'Danger Perimeter' : 'Leave Bootcamp')}
            </h2>
            <button className="close-btn" onClick={onClose}><X size={20} /></button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'personnel' && (
              <motion.div key="personnel" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="ops-section">
                  {isAdmin && (
                    <>
                      <h4>Summon a Scout to Camp</h4>
                      <p>Instantly recruit new members by their account name.</p>
                      <div className="recruitment-field">
                        <input 
                          type="text" 
                          placeholder="Enter Scout name..." 
                          value={recruitName}
                          onChange={e => setRecruitName(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleRecruit()}
                        />
                        <button className="btn-primary" style={{ padding: '10px 20px', fontSize: '0.9rem' }} onClick={handleRecruit}>
                          Recruit
                        </button>
                      </div>
                      
                      {members.length > 0 && (
                        <div style={{ marginTop: '15px' }}>
                          <h5 style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.8rem', textTransform: 'uppercase' }}>Active Scouts</h5>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {members.map(member => (
                              <div key={member} style={{ background: 'rgba(255,255,255,0.1)', padding: '5px 10px', borderRadius: '4px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <UserPlus size={14} style={{ opacity: 0.7 }} />
                                {member}
                                <X size={14} style={{ cursor: 'pointer', opacity: 0.5 }} onClick={() => removeMember(member)} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {!campsite.isPublic && (
                    <div style={{ marginTop: isAdmin ? '20px' : '0', paddingTop: isAdmin ? '15px' : '0', borderTop: isAdmin ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px', fontWeight: '500' }}>{isAdmin ? 'Or, send a server invite link to a friend' : 'Send a server invite link to a friend'}</p>
                      <div style={{ display: 'flex', background: 'rgba(0, 0, 0, 0.4)', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.1)', overflow: 'hidden' }}>
                        <input 
                          type="text" 
                          readOnly 
                          value={`${window.location.origin}/invite/${campsite.id || '1'}`} 
                          style={{ border: 'none', background: 'transparent', flex: 1, padding: '10px 12px', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }}
                        />
                        <button 
                          style={{ background: 'var(--primary-color)', color: 'white', border: 'none', padding: '0 20px', fontWeight: 'bold', cursor: 'pointer', transition: 'opacity 0.2s' }}
                          onMouseOver={(e) => e.target.style.opacity = '0.9'}
                          onMouseOut={(e) => e.target.style.opacity = '1'}
                          onClick={(e) => {
                            navigator.clipboard.writeText(`${window.location.origin}/invite/${campsite.id || '1'}`);
                            const originalText = e.target.innerText;
                            e.target.innerText = 'Copied!';
                            setTimeout(() => e.target.innerText = originalText, 2000);
                          }}
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                {isAdmin && (
                  <div className="ops-section">
                    <h4>The Role Forge</h4>
                    <p>Create and assign custom permissions for your community.</p>
                    <div style={{ marginBottom: '15px' }}>
                      {roles.map(role => (
                        <div key={role.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', marginBottom: '8px' }}>
                          <span style={{ color: role.color, fontWeight: 'bold' }}>{role.name}</span>
                          {!defaultRoles.find(r => r.name === role.name) && (
                            <X size={16} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => removeRole(role.name)} />
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {isForgingRole ? (
                      <div className="recruitment-field" style={{ marginTop: '10px' }}>
                        <input 
                          type="text" 
                          placeholder="Enter Role name..." 
                          autoFocus
                          value={newRoleName}
                          onChange={e => setNewRoleName(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleForgeRole()}
                        />
                        <button className="btn-primary" style={{ padding: '10px 15px', fontSize: '0.9rem' }} onClick={handleForgeRole}>
                          Save Role
                        </button>
                        <button style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', padding: '10px 15px', borderRadius: '6px' }} onClick={() => setIsForgingRole(false)}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button className="btn-forge" onClick={() => setIsForgingRole(true)}>
                        <Plus size={16} /> Forge New Role
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'safety' && (
              <motion.div key="safety" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="ops-section">
                  <h4>Global Camp Gate</h4>
                  <div className="toggle-row">
                    <div className="toggle-info">
                      <strong>Mature Expedition Gate (18+)</strong>
                      <span>Applies a baseline verification warning to the entire Campsite.</span>
                    </div>
                    <label className="switch">
                      <input type="checkbox" checked={globalAgeGate} onChange={toggleGlobalAgeGate} />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>
                
                <div className="ops-section">
                  <h4>Isolated Overrides</h4>
                  <p>Apply safety restrictions on individual channels.</p>
                  {campsite.expeditions?.map(exp => (
                    <div className="toggle-row" key={exp.id}>
                      <div className="toggle-info">
                        <strong>#{exp.name}</strong>
                      </div>
                      <label className="switch">
                        <input 
                          type="checkbox" 
                          checked={!!channelOverrides[exp.id]} 
                          onChange={() => toggleChannelOverride(exp.id)} 
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'destruction' && (
              <motion.div key="destruction" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="ops-section danger-perimeter">
                  {isAdmin ? (
                    <>
                      <h4>Decommission Campsite</h4>
                      <p>This action cannot be undone. All expeditions, messages, and roles will be permanently wiped.</p>
                    </>
                  ) : (
                    <>
                      <h4>Leave Bootcamp</h4>
                      <p>You will be removed from this basecamp. You can always venture back in later if it's public.</p>
                    </>
                  )}
                  
                  <div style={{ marginTop: '20px' }}>
                    <p>Please type <strong>{campsite.name}</strong> to confirm.</p>
                    <input 
                      type="text" 
                      className="verification-box"
                      placeholder={campsite.name}
                      value={deleteConfirmation}
                      onChange={(e) => setDeleteConfirmation(e.target.value)}
                    />
                    
                    <button 
                      className={`btn-destroy ${isDeleteReady ? 'pulse' : ''}`}
                      disabled={!isDeleteReady}
                      onClick={() => {
                        if (isDeleteReady) {
                          if (isAdmin) {
                            onDeleteCampsite(campsite.id);
                          } else {
                            onLeaveCampsite(campsite.id);
                          }
                          onClose();
                        }
                      }}
                    >
                      {isAdmin ? 'Confirm Permanent Decommission' : 'Confirm Departure'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </motion.div>
    </div>
  );
};

export default CampOperationsModal;
