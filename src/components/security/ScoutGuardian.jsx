import React, { Component } from 'react';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import './ScoutGuardian.css';

/**
 * Scout-Guardian Frontend Aegis
 * Protects the UI from fatal crashes, automatically recovers, and monitors for tampering.
 */
export class ScoutGuardian extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      errorCount: 0,
      isRecovering: false,
      tamperDetected: false
    };
  }

  static getDerivedStateFromError(error) {
    // Intercept crash and prepare to auto-recover
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the glitch silently for analytics without bringing down the whole app
    console.error("[Scout-Guardian] 🛡️ Intercepted UI Glitch:", error);
    
    // Auto-Recovery Mechanism
    if (this.state.errorCount < 3) {
      this.setState({ isRecovering: true, errorCount: this.state.errorCount + 1 });
      
      // Attempt to silently reboot the corrupted component after 2 seconds
      setTimeout(() => {
        this.setState({ hasError: false, isRecovering: false });
        console.log("[Scout-Guardian] 🛡️ Auto-Recovery Successful.");
      }, 2000);
    }
  }

  componentDidMount() {
    // Basic Anti-Tamper: Detect if someone opens DevTools (simplified check via screen resize metrics)
    const devToolsCheck = setInterval(() => {
      if (window.outerWidth - window.innerWidth > 160 || window.outerHeight - window.innerHeight > 160) {
        if (!this.state.tamperDetected) {
          console.warn("[Scout-Guardian] ⚠️ Environment Tampering / Inspection Detected.");
          // We don't block them, but we flag it locally
          this.setState({ tamperDetected: true });
        }
      }
    }, 3000);
    this.devToolsCheck = devToolsCheck;
  }

  componentWillUnmount() {
    clearInterval(this.devToolsCheck);
  }

  render() {
    if (this.state.hasError) {
      if (this.state.isRecovering) {
        return (
          <div className="scout-guardian-overlay">
            <div className="scout-guardian-box">
              <ShieldAlert size={48} className="scout-guardian-icon pulse" />
              <h2 className="scout-guardian-title">Scout-Guardian: Glitch Intercepted</h2>
              <p className="scout-guardian-text">A UI anomaly was detected. Auto-recovering system...</p>
              <div className="scout-guardian-loader"></div>
            </div>
          </div>
        );
      }
      
      // Ultimate failure if auto-recovery failed 3 times
      return (
        <div className="scout-guardian-overlay critical">
          <div className="scout-guardian-box">
            <ShieldCheck size={48} className="scout-guardian-icon critical-icon" />
            <h2 className="scout-guardian-title">Scout-Guardian: Security Halt</h2>
            <p className="scout-guardian-text">Multiple fatal errors detected. System locked for your protection.</p>
            <button className="scout-guardian-btn" onClick={() => window.location.reload()}>Reboot Terminal</button>
          </div>
        </div>
      );
    }

    return (
      <>
        {/* Silent global indicator if tampering was detected */}
        {this.state.tamperDetected && (
          <div className="scout-guardian-stealth-indicator" title="Scout-Guardian is monitoring.">
            <ShieldCheck size={14} color="var(--brand-primary)" />
          </div>
        )}
        {this.props.children}
      </>
    );
  }
}
