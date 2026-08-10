import React, { Component } from 'react';
import { ShieldCheck, Lock } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import './ScoutGuardian.css';

/**
 * Scout-Guardian Frontend Aegis
 * Catches catastrophic UI crashes and provides recovery.
 * On 3rd consecutive failure, it initiates an emergency lockdown to prevent bypass attempts.
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
              <p className="scout-guardian-text">A display glitch was detected. Auto-recovering...</p>
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
              Multiple consecutive failures detected. To protect your account from unauthorized bypass attempts, 
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
