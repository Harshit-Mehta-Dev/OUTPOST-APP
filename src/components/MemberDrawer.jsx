import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, ShieldCheck, X } from 'lucide-react';
import './MemberDrawer.css';

const MemberDrawer = ({ isOpen, onClose, members = [], adminEmail, campsite }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="member-drawer glass-panel-dark"
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <div className="drawer-header">
            <div className="drawer-title">
              <Users size={16} className="drawer-icon" />
              <span>Scout Registry ({members.length})</span>
            </div>
            <button className="drawer-close-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          <div className="drawer-members-list">
            {members.map((member, index) => {
              const isAdmin = member === adminEmail || (member.email && member.email === adminEmail);
              const displayName = typeof member === 'string' ? member : (member.username || 'Scout');
              const avatar = typeof member === 'string' ? null : member.profilePictureUrl;
              
              const userRoleName = campsite?.memberRoles?.[displayName];
              const userRoleColor = campsite?.roles?.find(r => r.name === userRoleName)?.color || 'var(--text-primary)';
              const defaultRoleText = isAdmin ? 'Admin' : 'Scout';

              return (
                <div key={index} className="member-item">
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
                    <span className="member-name" style={{ color: userRoleColor, fontWeight: userRoleName ? 'bold' : 'normal' }}>{displayName}</span>
                    <span className="member-role" style={{ color: userRoleName ? userRoleColor : undefined, opacity: userRoleName ? 0.8 : 0.5 }}>
                      {isAdmin && <ShieldCheck size={12} className="admin-badge" />}
                      {userRoleName || defaultRoleText}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MemberDrawer;
