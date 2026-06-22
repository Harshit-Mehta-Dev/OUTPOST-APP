import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { Eye, EyeOff } from 'lucide-react';
import LoadingScreen from '../components/LoadingScreen';
import './Auth.css';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // If user is already logged in, show loading screen briefly then redirect
    if (localStorage.getItem('outpost_user')) {
      setIsLoading(true);
      setTimeout(() => {
        navigate('/app');
      }, 1500);
    }
  }, [navigate]);

  const handleGoogleSignIn = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      console.log('Google login success:', tokenResponse);
      setError(null);
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const userInfo = await res.json();
        
        const finalEmail = userInfo?.email || email || `scout_${Math.floor(Math.random() * 10000)}@outpost.local`;
        const finalUsername = userInfo?.name || (finalEmail.includes('@') ? finalEmail.split('@')[0] : finalEmail);
        
        // Sync with backend
        try {
          const syncRes = await fetch(`${(import.meta.env.VITE_AUTH_URL || 'http://localhost:5001')}/api/users/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: finalEmail.toLowerCase().trim(), username: finalUsername })
          });
          const syncedUser = await syncRes.json();
          localStorage.setItem('outpost_user', JSON.stringify(syncedUser));
          if (syncedUser.token) localStorage.setItem('outpost_token', syncedUser.token);
        } catch (syncErr) {
          console.error("Failed to sync user with backend", syncErr);
          localStorage.setItem('outpost_user', JSON.stringify({ 
            email: finalEmail.toLowerCase().trim(), 
            username: finalUsername 
          }));
        }

        triggerLoadingAndNavigate();
      } catch (err) {
        console.error('Failed to fetch user info', err);
        const fallbackEmail = email || `scout_${Math.floor(Math.random() * 10000)}@outpost.local`;
        localStorage.setItem('outpost_user', JSON.stringify({ email: fallbackEmail, username: 'GoogleUser' }));
        triggerLoadingAndNavigate();
      }
    },
    onError: error => {
      console.error("Google sign in error:", error);
      setError("Failed to sign in with Google. Please try again.");
    }
  });

  const triggerLoadingAndNavigate = () => {
    setIsLoading(true);
    setTimeout(() => {
      navigate('/app');
    }, 5000); // 5 seconds loading screen
  };

  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState(null);

  const sanitizeInput = (input) => {
    return input ? input.replace(/[$<>{}]/g, '') : ''; // Basic NoSQL & HTML sanitation
  };

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    setError(null);

    // Brute force lockout check
    if (lockoutUntil && Date.now() < lockoutUntil) {
      const remainingSeconds = Math.ceil((lockoutUntil - Date.now()) / 1000);
      setError(`Too many failed attempts. Try again in ${remainingSeconds} seconds.`);
      return;
    } else if (lockoutUntil && Date.now() >= lockoutUntil) {
      setLockoutUntil(null);
      setFailedAttempts(0);
    }

    // Validation
    if (!email || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    // Safe Regex for ReDoS mitigation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Invalid email format.");
      return;
    }
    
    if (!isLogin && !username) {
      setError("Username is required for sign up.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    
    if (password.length > 128) {
      setError("Password exceeds maximum allowed length.");
      return;
    }

    // Frontend Input Sanitization (Defense in Depth)
    const sanitizedEmail = sanitizeInput(email.toLowerCase().trim());
    const sanitizedUsername = sanitizeInput(isLogin ? sanitizedEmail.split('@')[0] : username);

    const endpoint = isLogin ? '/api/users/login' : '/api/users/register';
    const payload = isLogin ? { email: sanitizedEmail, password } : { email: sanitizedEmail, username: sanitizedUsername, password };

    // Communicate with backend
    setIsLoading(true);
    fetch(`${(import.meta.env.VITE_AUTH_URL || 'http://localhost:5001')}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(async res => {
      if (!res.ok) {
        throw new Error('Authentication failed');
      }
      return res.json();
    })
    .then(syncedUser => {
      setFailedAttempts(0);
      localStorage.setItem('outpost_user', JSON.stringify(syncedUser));
      if (syncedUser.token) localStorage.setItem('outpost_token', syncedUser.token);
      setTimeout(() => { navigate('/app'); }, 4000);
    })
    .catch(err => {
      console.error("Authentication error:", err);
      // Secure error handling (Info Leakage Mitigation)
      setError("Invalid credentials or service unavailable.");
      setIsLoading(false);
      
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      if (newAttempts >= 5) {
        setLockoutUntil(Date.now() + 30000); // Lock out for 30 seconds
      }
    });
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="auth-page">
      
      <motion.div 
        className="auth-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="auth-header">
          <h1 className="auth-title">Welcome to <span className="text-gradient font-malinton" style={{ fontWeight: 'normal', letterSpacing: 'normal' }}>OUTPOST</span></h1>
          <p className="auth-subtitle">
            {isLogin ? 'Sign in to sync your comms.' : 'Create an account to join the nexus.'}
          </p>
        </div>

        <div className="auth-toggle">
          <button 
            className={isLogin ? 'active' : ''} 
            onClick={() => setIsLogin(true)}
          >
            Sign In
          </button>
          <button 
            className={!isLogin ? 'active' : ''} 
            onClick={() => setIsLogin(false)}
          >
            Sign Up
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.form 
            key={isLogin ? 'login' : 'signup'}
            initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
            transition={{ duration: 0.3 }}
            className="auth-form"
            onSubmit={handleAuthSubmit}
          >
            {!isLogin && (
              <div className="form-group">
                <label>Username</label>
                <input 
                  type="text" 
                  placeholder="GlitchHunter99" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={32}
                  spellCheck="false"
                  autoComplete="username"
                />
              </div>
            )}
            <div className="form-group">
              <label>Email</label>
              <input 
                type="email" 
                placeholder="dev@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={64}
                spellCheck="false"
                autoComplete="email"
              />
            </div>
            <div className="form-group" style={{ position: 'relative' }}>
              <label>Password</label>
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                maxLength={128}
                spellCheck="false"
                autoComplete={isLogin ? "current-password" : "new-password"}
                style={{ paddingRight: '40px' }}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '40px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button type="submit" className="btn-primary auth-submit flex-center">
              {isLogin ? 'Enter Outpost' : 'Create Account'}
            </button>
          </motion.form>
        </AnimatePresence>

        <div className="auth-divider">OR</div>

        <div className="social-auth">
          {error && <div className="auth-error" style={{ color: '#ff4d4d', marginBottom: '10px', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}
          <button className="btn-social" onClick={handleGoogleSignIn}>
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
