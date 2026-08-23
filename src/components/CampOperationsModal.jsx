import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Users, Shield, Trash2, Plus, UserPlus, LogOut, Wrench, Palette, ChevronDown, Check, Radio } from 'lucide-react';
import './CampOperationsModal.css';

const CampOperationsModal = ({ isOpen, onClose, campsite, isAdmin, onDeleteCampsite, onUpdateCampsite, onLeaveCampsite, currentUser }) => {
  const [activeTab, setActiveTab] = useState('personnel');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  
  // Personnel state
  const [recruitName, setRecruitName] = useState('');
  const [isForgingRole, setIsForgingRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleColor, setNewRoleColor] = useState('#5865F2');
  const [assignDropdownFor, setAssignDropdownFor] = useState(null); // which user's dropdown is open

  // Censorship state
  const [censorshipReason, setCensorshipReason] = useState(campsite?.censorshipReason || '');

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
      onUpdateCampsite((campsite.id || campsite._id), { 
        members: [...members, recruitName.trim()] 
      });
      setRecruitName('');
    }
  };

  const handleForgeRole = async () => {
    if (newRoleName.trim()) {
      try {
        const response = await fetch(`${(import.meta.env.VITE_CORE_API_URL || (import.meta.env.PROD ? 'https://outpost-app.onrender.com' : 'http://localhost:5002'))}/api/campsites/${campsite.id || campsite._id}/roles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newRoleName.trim(), color: newRoleColor })
        });
        if (response.ok) {
          const updated = await response.json();
          onUpdateCampsite((campsite.id || campsite._id), { roles: updated.roles });
        } else {
          throw new Error('Backend failed');
        }
      } catch (err) {
        console.warn("Backend offline, forging role locally:", err);
        onUpdateCampsite((campsite.id || campsite._id), { roles: [...roles, { name: newRoleName.trim(), color: newRoleColor }] });
      } finally {
        setNewRoleName('');
        setIsForgingRole(false);
      }
    }
  };

  const handleAssignRole = async (username, roleName) => {
    try {
      const response = await fetch(`${(import.meta.env.VITE_CORE_API_URL || (import.meta.env.PROD ? 'https://outpost-app.onrender.com' : 'http://localhost:5002'))}/api/campsites/${campsite.id || campsite._id}/roles/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, roleName })
      });
      if (response.ok) {
        const updated = await response.json();
        onUpdateCampsite((campsite.id || campsite._id), { memberRoles: updated.memberRoles });
      } else {
        throw new Error('Backend failed');
      }
    } catch (err) {
      console.warn("Backend offline, assigning role locally:", err);
      const updatedRoles = { ...(campsite.memberRoles || {}) };
      if (roleName === '') {
        delete updatedRoles[username];
      } else {
        updatedRoles[username] = roleName;
      }
      onUpdateCampsite((campsite.id || campsite._id), { memberRoles: updatedRoles });
    } finally {
      setAssignDropdownFor(null);
    }
  };

  const toggleGlobalAgeGate = () => {
    onUpdateCampsite((campsite.id || campsite._id), { globalAgeGate: !globalAgeGate });
  };

  const toggleChannelOverride = (channelId) => {
    onUpdateCampsite((campsite.id || campsite._id), {
      channelOverrides: {
        ...channelOverrides,
        [channelId]: !channelOverrides[channelId]
      }
    });
  };

  const removeMember = (name) => {
    onUpdateCampsite((campsite.id || campsite._id), {
      members: members.filter(m => m !== name)
    });
  };

  const removeRole = (name) => {
    onUpdateCampsite((campsite.id || campsite._id), {
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
            <>
              <button 
                className={`ops-tab-btn ${activeTab === 'safety' ? 'active' : ''}`}
                onClick={() => setActiveTab('safety')}
              >
                <Shield size={18} /> Perimeter Safety
              </button>
              <button 
                className={`ops-tab-btn ${activeTab === 'roles' ? 'active' : ''}`}
                onClick={() => setActiveTab('roles')}
              >
                <Wrench size={18} /> The Role Forge
              </button>
              <button 
                className={`ops-tab-btn censorship ${activeTab === 'censorship' ? 'active' : ''} ${campsite?.censorshipEnabled ? 'censorship-active' : ''}`}
                onClick={() => setActiveTab('censorship')}
              >
                <Radio size={18} />
                <span>Censorship Protocol</span>
                {campsite?.censorshipEnabled && <span className="censorship-badge">ON</span>}
              </button>
            </>
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
              {activeTab === 'roles' && 'The Role Forge'}
              {activeTab === 'censorship' && 'Censorship Protocol'}
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
                          value={`${window.location.origin}/invite/${campsite.id || campsite._id || '1'}`} 
                          style={{ border: 'none', background: 'transparent', flex: 1, padding: '10px 12px', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }}
                        />
                        <button 
                          style={{ background: 'var(--primary-color)', color: 'white', border: 'none', padding: '0 20px', fontWeight: 'bold', cursor: 'pointer', transition: 'opacity 0.2s' }}
                          onMouseOver={(e) => e.target.style.opacity = '0.9'}
                          onMouseOut={(e) => e.target.style.opacity = '1'}
                          onClick={(e) => {
                            navigator.clipboard.writeText(`${window.location.origin}/invite/${campsite.id || campsite._id || '1'}`);
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
                
              </motion.div>
            )}

            {activeTab === 'roles' && isAdmin && (
              <motion.div key="roles" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="ops-section">
                  <h4>The Role Forge</h4>
                  <p>Create and assign custom permissions for your community.</p>
                  
                  {isForgingRole ? (
                    <div className="recruitment-field" style={{ marginTop: '10px', flexDirection: 'column', alignItems: 'stretch' }}>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <input 
                          type="text" 
                          placeholder="Enter Role name..." 
                          autoFocus
                          value={newRoleName}
                          onChange={e => setNewRoleName(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleForgeRole()}
                          style={{ flex: 1 }}
                        />
                        <label style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '0 10px', borderRadius: '6px', cursor: 'pointer' }}>
                          <Palette size={16} style={{ marginRight: '8px' }}/>
                          <input 
                            type="color" 
                            value={newRoleColor} 
                            onChange={e => setNewRoleColor(e.target.value)} 
                            style={{ width: '30px', height: '30px', border: 'none', background: 'none', cursor: 'pointer' }}
                          />
                        </label>
                      </div>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <button className="btn-primary" style={{ flex: 1, padding: '10px 15px', fontSize: '0.9rem' }} onClick={handleForgeRole}>
                          Save Role
                        </button>
                        <button style={{ flex: 1, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', padding: '10px 15px', borderRadius: '6px' }} onClick={() => setIsForgingRole(false)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button className="btn-forge" onClick={() => setIsForgingRole(true)}>
                      <Plus size={16} /> Forge New Role
                    </button>
                  )}

                  <div style={{ marginTop: '20px', marginBottom: '15px' }}>
                    <h5 style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.8rem', textTransform: 'uppercase' }}>Created Roles</h5>
                    {roles.map(role => (
                      <div key={role.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', marginBottom: '8px' }}>
                        <span style={{ color: role.color, fontWeight: 'bold' }}>{role.name}</span>
                        {!defaultRoles.find(r => r.name === role.name) && (
                          <X size={16} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => removeRole(role.name)} />
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div style={{ marginTop: '20px' }}>
                    <h5 style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.8rem', textTransform: 'uppercase' }}>Role Assignments</h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {members.map(member => {
                        const currentRoleName = campsite.memberRoles?.[member];
                        const currentRole = roles.find(r => r.name === currentRoleName) || roles.find(r => r.name === 'Scout') || defaultRoles[1];
                        
                        return (
                          <div key={member} style={{ background: 'rgba(255,255,255,0.05)', padding: '10px 15px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 'bold', color: currentRole?.color }}>{member}</span>
                            
                            <div style={{ position: 'relative' }}>
                              <button 
                                onClick={() => setAssignDropdownFor(assignDropdownFor === member ? null : member)}
                                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                              >
                                {currentRole.name} <ChevronDown size={12} />
                              </button>
                              
                              <AnimatePresence>
                                {assignDropdownFor === member && (
                                  <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    style={{ position: 'absolute', top: '100%', right: 0, marginTop: '5px', background: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '5px', zIndex: 10, width: '150px', boxShadow: '0 10px 20px rgba(0,0,0,0.5)' }}
                                  >
                                    <button
                                      onClick={() => handleAssignRole(member, '')}
                                      style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', color: 'var(--text-primary)', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                                    >
                                      Remove Role
                                    </button>
                                    {roles.map(r => (
                                      <button
                                        key={r.name}
                                        onClick={() => handleAssignRole(member, r.name)}
                                        style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', color: r.color, padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                      >
                                        {r.name}
                                        {currentRoleName === r.name && <Check size={12} />}
                                      </button>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
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

            {activeTab === 'censorship' && isAdmin && (
              <motion.div key="censorship" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                {/* Status Banner */}
                <div className={`censorship-status-banner ${campsite?.censorshipEnabled ? 'active' : ''}`}>
                  <div className="censorship-status-icon">
                    {campsite?.censorshipEnabled ? '📡' : '🔕'}
                  </div>
                  <div className="censorship-status-text">
                    <strong>{campsite?.censorshipEnabled ? 'CENSORSHIP ACTIVE' : 'CENSORSHIP INACTIVE'}</strong>
                    <span>{campsite?.censorshipEnabled
                      ? 'Chat is locked. Only you (Admin) can broadcast messages.'
                      : 'Normal messaging is permitted for all members.'}
                    </span>
                  </div>
                </div>

                {/* Main toggle section */}
                <div className={`ops-section ${campsite?.censorshipEnabled ? 'censorship-section-active' : ''}`}>
                  <h4>Signal Blackout Toggle</h4>
                  <p>When activated, a corruption animation floods the chat and all regular users are blocked from sending messages. Only you (Admin / Developer) can broadcast to the group.</p>
                  
                  <div className="toggle-row" style={{ marginTop: '15px' }}>
                    <div className="toggle-info">
                      <strong style={{ color: campsite?.censorshipEnabled ? '#ff4d4d' : 'var(--text-primary)' }}>
                        {campsite?.censorshipEnabled ? '⛔ Censorship Enabled' : 'Enable Censorship Blackout'}
                      </strong>
                      <span>Applies immediately. All members will see the corruption overlay.</span>
                    </div>
                    <label className="censorship-switch">
                      <input
                        type="checkbox"
                        checked={!!campsite?.censorshipEnabled}
                        onChange={async () => {
                          const newState = !campsite?.censorshipEnabled;
                          const campId = campsite.id || campsite._id;
                          const token = localStorage.getItem('outpost_token');
                          const apiBase = import.meta.env.VITE_CORE_API_URL || (import.meta.env.PROD ? 'https://outpost-app.onrender.com' : 'http://localhost:5002');
                          try {
                            const res = await fetch(`${apiBase}/api/campsites/${campId}/censorship`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                              body: JSON.stringify({
                                censorshipEnabled: newState,
                                censorshipReason: newState ? censorshipReason : '',
                                adminEmail: currentUser?.email
                              })
                            });
                            if (res.ok) {
                              // Update local state optimistically — socket will sync others
                              onUpdateCampsite(campId, {
                                censorshipEnabled: newState,
                                censorshipReason: newState ? censorshipReason : ''
                              });
                            } else {
                              const err = await res.json();
                              console.error('Censorship toggle failed:', err);
                            }
                          } catch (e) {
                            // Fallback to local-only if backend is unreachable
                            onUpdateCampsite(campId, { censorshipEnabled: newState, censorshipReason: newState ? censorshipReason : '' });
                          }
                        }}
                      />
                      <span className="censorship-slider"></span>
                    </label>
                  </div>
                </div>

                {/* Reason / Broadcast message */}
                <div className="ops-section">
                  <h4>Blackout Reason <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>(optional)</span></h4>
                  <p>A message displayed to users explaining the censorship event. Leave blank for a silent lockdown.</p>
                  <textarea
                    className="censorship-reason-input"
                    placeholder="e.g. This channel is under temporary maintenance by the admin..."
                    value={censorshipReason}
                    rows={3}
                    onChange={e => {
                      setCensorshipReason(e.target.value);
                      if (campsite?.censorshipEnabled) {
                        onUpdateCampsite((campsite.id || campsite._id), { censorshipReason: e.target.value });
                      }
                    }}
                  />
                </div>

                {/* Info card */}
                <div className="ops-section censorship-info-card">
                  <h4>⚙️ How It Works</h4>
                  <ul className="censorship-info-list">
                    <li>🔴 Activating this blocks ALL regular users from sending messages.</li>
                    <li>🎭 A glitch & corruption animation overlays the chat area.</li>
                    <li>👑 Only Admin or Developer accounts can still broadcast messages.</li>
                    <li>🌐 Works on both Public and Private groups instantly.</li>
                    <li>🔓 Deactivating restores normal chat immediately.</li>
                  </ul>
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
