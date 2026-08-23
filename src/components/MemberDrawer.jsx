import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, ShieldCheck, X, Search, UserCheck } from 'lucide-react';
import './MemberDrawer.css';

const MemberDrawer = ({ isOpen, onClose, members = [], adminEmail, campsite }) => {
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset search when opening/closing
  useEffect(() => {
    if (!isOpen) setSearchQuery('');
  }, [isOpen]);

  const filteredMembers = members.filter((member) => {
    const displayName = typeof member === 'string' ? member : (member.username || 'Scout');
    return displayName.toLowerCase().includes(searchQuery.toLowerCase().trim());
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="member-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className="member-modal-card"
            initial={{ scale: 0.92, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 15 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="member-modal-header">
              <div className="member-modal-title">
                <div className="title-icon-badge">
                  <Users size={18} />
                </div>
                <div>
                  <h3>Scout Registry</h3>
                  <span className="member-count-subtitle">{members.length} {members.length === 1 ? 'member' : 'members'} in {campsite?.name || 'basecamp'}</span>
                </div>
              </div>
              <button className="member-modal-close-btn" onClick={onClose} title="Close Registry">
                <X size={18} />
              </button>
            </div>

            {/* Search Input (if more than 3 members) */}
            {members.length > 3 && (
              <div className="member-search-container">
                <Search size={15} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search scouts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="member-search-input"
                  autoFocus
                />
                {searchQuery && (
                  <button className="search-clear-btn" onClick={() => setSearchQuery('')}>
                    <X size={13} />
                  </button>
                )}
              </div>
            )}

            {/* Member List */}
            <div className="member-modal-list">
              {filteredMembers.length === 0 ? (
                <div className="member-empty-state">
                  <Users size={32} style={{ opacity: 0.25, marginBottom: '10px' }} />
                  <p>{searchQuery ? 'No scouts match your search' : 'No scouts currently deployed'}</p>
                </div>
              ) : (
                filteredMembers.map((member, index) => {
                  const isAdmin = member === adminEmail || (member.email && member.email === adminEmail);
                  const displayName = typeof member === 'string' ? member : (member.username || 'Scout');
                  const avatar = typeof member === 'string' ? null : member.profilePictureUrl;
                  
                  const userRoleName = campsite?.memberRoles?.[displayName];
                  const userRoleColor = campsite?.roles?.find(r => r.name === userRoleName)?.color || 'var(--text-primary)';
                  const defaultRoleText = isAdmin ? 'Admin' : 'Scout';

                  return (
                    <div key={index} className="member-card-row">
                      <div className="member-avatar-wrapper">
                        {avatar ? (
                          <img src={avatar} alt={displayName} className="member-avatar" />
                        ) : (
                          <div className="member-avatar-placeholder">
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="member-status-dot online"></span>
                      </div>
                      <div className="member-info">
                        <div className="member-name-row">
                          <span className="member-name" style={{ color: userRoleName ? userRoleColor : undefined }}>
                            {displayName}
                          </span>
                          {isAdmin && (
                            <span className="admin-chip">
                              <ShieldCheck size={11} /> Admin
                            </span>
                          )}
                        </div>
                        <span className="member-role-label" style={{ color: userRoleName ? userRoleColor : undefined }}>
                          {userRoleName || defaultRoleText}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="member-modal-footer">
              <div className="footer-status-pill">
                <span className="status-indicator-dot"></span>
                <span>Active Basecamp Network</span>
              </div>
              <button className="member-done-btn" onClick={onClose}>
                Done
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MemberDrawer;
