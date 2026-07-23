import React, { Component } from 'react';
import { ShieldCheck } from 'lucide-react';
import './ScoutGuardian.css';

/**
 * Scout-Guardian Frontend Aegis
 * Catches truly catastrophic UI crashes and provides recovery.
 * Does NOT treat normal network errors or API failures as security threats.
 * Does NOT wipe user sessions or force logout on recoverable errors.
 */
export class ScoutGuardian extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      errorCount: 0,
      isRecovering: false,
      lastError: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, lastError: error?.message || 'Unknown error' };
  }

  componentDidCatch(error, errorInfo) {
    // Log the crash for debugging — never show raw error to users
    console.error('[Scout-Guardian] UI crash intercepted:', error.message);

    const newCount = this.state.errorCount + 1;

    // Auto-recover for the first 2 crashes — most are transient render issues
    if (newCount <= 2) {
      this.setState({ isRecovering: true, errorCount: newCount });
      setTimeout(() => {
        this.setState({ hasError: false, isRecovering: false });
        console.log('[Scout-Guardian] Auto-recovery successful.');
      }, 2000);
    } else {
      // After 3 crashes, show the halt screen but DO NOT log out the user
      this.setState({ errorCount: newCount });
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

      // Persistent crash — offer a reload, but keep the user's session intact
      return (
        <div className="scout-guardian-overlay critical">
          <div className="scout-guardian-box">
            <ShieldCheck size={48} className="scout-guardian-icon critical-icon" />
            <h2 className="scout-guardian-title">Scout-Guardian: System Error</h2>
            <p className="scout-guardian-text">
              A persistent display error occurred. Click below to reload the page.
              Your account and data are safe.
            </p>
            <button
              className="scout-guardian-btn"
              onClick={() => window.location.reload()}
            >
              Reload Application
            </button>
            <button
              className="scout-guardian-btn"
              style={{ marginTop: '8px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#aaa' }}
              onClick={() => this.setState({ hasError: false, errorCount: 0, isRecovering: false })}
            >
              Try Without Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
