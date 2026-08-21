import React, { Component } from 'react';
import { ShieldCheck, Lock, ShieldAlert } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import './ScoutGuardian.css';

/**
 * Scout-Guardian Client Execution & Payload Sanitizer Utility
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/on\w+\s*=/gi, '');
};

/**
 * Client-Side Dispatch Rate Limiter (Blast Radius Containment)
 */
const clientDispatchLog = [];
export const checkExecutionLimits = (maxReq = 15, windowMs = 5000) => {
  const now = Date.now();
  while (clientDispatchLog.length > 0 && clientDispatchLog[0] <= now - windowMs) {
    clientDispatchLog.shift();
  }
  if (clientDispatchLog.length >= maxReq) {
    console.warn('[Scout-Guardian] Client execution limit exceeded. Throttling action.');
    return false;
  }
  clientDispatchLog.push(now);
  return true;
};

/**
 * Scout-Guardian Frontend Aegis Component
 * Catches UI execution crashes, provides auto-recovery, and handles Emergency Lockdown.
 */
export class ScoutGuardian extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      errorCount: 0,
      isRecovering: false,
      isLockdown: false,
      lastError: null,
      securityStatus: 'ACTIVE_AEGIS'
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, lastError: error?.message || 'Unknown error' };
  }

  async componentDidCatch(error, errorInfo) {
    console.error('[Scout-Guardian] UI crash intercepted:', error.message);
    const newCount = this.state.errorCount + 1;

    if (newCount <= 2) {
      this.setState({ isRecovering: true, errorCount: newCount });
      setTimeout(() => {
        this.setState({ hasError: false, isRecovering: false });
        console.log('[Scout-Guardian] Auto-recovery successful.');
      }, 2000);
    } else {
      // 3rd crash -> EMERGENCY LOCKDOWN
      this.setState({ isLockdown: true, errorCount: newCount });
      console.warn('[Scout-Guardian] 3 consecutive failures detected. Initiating Emergency Lockdown.');
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error('Logout failed during lockdown', e);
      }
      localStorage.clear();
      sessionStorage.clear();
      
      // Force reload to login screen after 3 seconds
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.state.isRecovering) {
        return (
          <div className="scout-guardian-overlay">
            <div className="scout-guardian-box">
              <ShieldCheck size={48} className="scout-guardian-icon pulse" />
              <h2 className="scout-guardian-title">Restoring Systems...</h2>
              <p className="scout-guardian-text">A display or execution glitch was detected. Auto-recovering...</p>
              <div className="scout-guardian-loader"></div>
            </div>
          </div>
        );
      }

      // Persistent crash -> Emergency Lockdown UI
      return (
        <div className="scout-guardian-overlay critical">
          <div className="scout-guardian-box">
            <Lock size={48} className="scout-guardian-icon critical-icon pulse" style={{ color: '#ff3b30' }} />
            <h2 className="scout-guardian-title" style={{ color: '#ff3b30' }}>EMERGENCY LOCKDOWN</h2>
            <p className="scout-guardian-text">
              Multiple consecutive execution failures detected. To protect your account from unauthorized bypass attempts, 
              Scout-Guardian has initiated an emergency lockdown and safely terminated your session.
            </p>
            <div className="scout-guardian-loader" style={{ borderTopColor: '#ff3b30' }}></div>
            <p className="scout-guardian-text" style={{ fontSize: '10px', marginTop: '16px', color: 'rgba(255,255,255,0.4)' }}>
              Redirecting to secure login...
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

