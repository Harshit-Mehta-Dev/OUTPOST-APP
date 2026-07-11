import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Shield, Lock } from 'lucide-react';
import './Auth.css'; // Reuse auth styles

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (twoFactorCode.length !== 6) {
      setError("Please enter a valid 6-digit 2FA code");
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const res = await fetch(`${(import.meta.env.VITE_AUTH_URL || (import.meta.env.PROD ? 'https://outpost-app.onrender.com' : 'http://localhost:5001'))}/api/users/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, twoFactorCode, newPassword })
      });
      const data = await res.json();
      
      if (res.ok) {
        setMessage('Password reset successful! Redirecting to login...');
        setTimeout(() => navigate('/'), 3000);
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: '400px', width: '100%' }}>
        <div className="auth-header" style={{ marginBottom: '20px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}><Lock size={24} /> Reset Password</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Enter your 2FA code and a new password.</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Shield size={14} /> Google Authenticator Code</label>
            <input 
              type="text" 
              placeholder="123456" 
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value)}
              maxLength={6}
              style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '1.2rem' }}
              required
            />
          </div>
          
          <div className="form-group">
            <label>New Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Confirm Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {error && <div style={{ color: '#e74c3c', fontSize: '0.85rem', marginBottom: '15px', textAlign: 'center' }}>{error}</div>}
          {message && <div style={{ color: '#2ecc71', fontSize: '0.85rem', marginBottom: '15px', textAlign: 'center' }}>{message}</div>}

          <button type="submit" className="btn-primary auth-submit flex-center" disabled={isLoading} style={{ width: '100%' }}>
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
