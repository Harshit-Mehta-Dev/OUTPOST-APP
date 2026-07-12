import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, RefreshCw, Radio, Satellite, Shield, Globe, Wifi, Terminal, Cpu, Server, Zap, Compass, Map, Binoculars } from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';
import LoadingScreen from '../components/LoadingScreen';
import './Auth.css';

const Auth = () => {
  const { signUp, signIn, user: supabaseUser } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState("");
  const [username, setUsername] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [svgCaptchaImage, setSvgCaptchaImage] = useState('');
  const [svgCaptchaId, setSvgCaptchaId] = useState('');
  const [svgCaptchaText, setSvgCaptchaText] = useState('');
  const navigate = useNavigate();

  const fetchSvgCaptcha = async () => {
    try {
      const res = await fetch(`${(import.meta.env.VITE_AUTH_URL || (import.meta.env.PROD ? 'https://outpost-app.onrender.com' : 'http://localhost:5001'))}/api/auth/captcha`);
      const data = await res.json();
      setSvgCaptchaImage(data.image);
      setSvgCaptchaId(data.captchaId);
      setSvgCaptchaText('');
    } catch (err) {
      console.error("Failed to fetch CAPTCHA", err);
    }
  };

  useEffect(() => {
    if (!import.meta.env.VITE_TURNSTILE_SITE_KEY) {
      fetchSvgCaptcha();
    }
  }, []);

  useEffect(() => {
    // If user is already logged in with Supabase, redirect
    if (supabaseUser) {
      setIsLoading(true);
      setTimeout(() => {
        navigate('/app');
      }, 1500);
    }
  }, [supabaseUser, navigate]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/app`
        }
      });
      if (error) throw error;
    } catch (err) {
      console.error("Google login error:", err);
      setError(err.message);
      setIsLoading(false);
    }
  };

  const triggerLoadingAndNavigate = () => {
    setIsLoading(true);
    setTimeout(() => {
      navigate('/app');
    }, 3500); // Increased to 3.5s so the loading animation is visible and enjoyable
  };


  const [lockoutUntil, setLockoutUntil] = useState(null);

  const sanitizeInput = (input) => {
    return input ? input.replace(/[$<>{}]/g, '') : ''; // Basic NoSQL & HTML sanitation
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address first.");
      return;
    }
    if (!turnstileToken && !svgCaptchaText) {
      setError("Please complete the CAPTCHA verification.");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`${(import.meta.env.VITE_AUTH_URL || (import.meta.env.PROD ? 'https://outpost-app.onrender.com' : 'http://localhost:5001'))}/api/users/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: sanitizeInput(email.toLowerCase().trim()),
          turnstileToken,
          captchaText: svgCaptchaText,
          captchaId: svgCaptchaId 
        })
      });
      const data = await res.json();
      setForgotPasswordMessage(data.message || 'If that email exists in our system, a password reset link has been sent.');
      setError("");
    } catch (err) {
      console.error(err);
      setForgotPasswordMessage("Failed to send request. Please try again.");
    } finally {
      setIsLoading(false);
    }
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
    if (!turnstileToken && !svgCaptchaText) {
      setError("Please complete the CAPTCHA verification.");
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
    const sanitizedUsername = sanitizeInput(username); // Don't fake the username from the email

    const endpoint = isLogin ? '/api/users/login' : '/api/users/register';
    let payload = isLogin ? { email: sanitizedEmail, password } : { email: sanitizedEmail, username: sanitizedUsername, password };
    payload = {
      ...payload,
      turnstileToken,
      captchaText: svgCaptchaText,
      captchaId: svgCaptchaId
    };

    // Communicate with Supabase
    setIsLoading(true);
    const authAction = isLogin ? signIn : signUp;
    const authData = isLogin 
      ? { email: sanitizedEmail, password }
      : { email: sanitizedEmail, password, options: { data: { username: sanitizedUsername } } };

    authAction(authData)
    .then(async ({ data, error }) => {
      if (error) throw error;
      setFailedAttempts(0);
      
      if (data.session) {
        localStorage.setItem('outpost_user', JSON.stringify({
          email: data.user.email,
          username: data.user.user_metadata?.username || data.user.email,
          id: data.user.id
        }));
        localStorage.setItem('outpost_token', data.session.access_token);
        setTimeout(() => { navigate('/app'); }, 2000);
      } else {
        setError("Please check your email for a confirmation link to finish signing up.");
        setIsLoading(false);
      }
    })
    .catch(err => {
      console.error("Auth Error:", err);
      setError(err.message);
      setIsLoading(false);
      setFailedAttempts(prev => prev + 1);
      if (!import.meta.env.VITE_TURNSTILE_SITE_KEY) {
        fetchSvgCaptcha();
      }
    });
  };

const IconBackground = () => {
  // Filter out any undefined icons just in case they don't exist in the current lucide-react version
  const rawIcons = [Radio, Satellite, Shield, Globe, Wifi, Terminal, Cpu, Server, Zap, Compass, Map, Binoculars];
  const icons = rawIcons.filter(icon => typeof icon === 'object' || typeof icon === 'function');
  
  const [elements, setElements] = React.useState([]);
  
  React.useEffect(() => {
    const newElements = Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      IconComponent: icons[Math.floor(Math.random() * icons.length)] || Shield,
      left: Math.random() * 100,
      duration: 15 + Math.random() * 25,
      delay: Math.random() * 20,
      size: 1 + Math.random() * 1.5,
      opacity: 0.05 + Math.random() * 0.15 // Slightly lower opacity for a cleaner look
    }));
    setElements(newElements);
  }, []);

  return (
    <div className="emoji-background-container">
      {elements.map((el) => {
        const Icon = el.IconComponent || Shield;
        // Strict safety check to prevent React from crashing
        if (typeof Icon !== 'function' && typeof Icon !== 'object') return null;
        
        return (
          <div 
            key={el.id}  
            className="floating-emoji"
            style={{
              left: `${el.left}%`,
              animationDuration: `${el.duration}s`,
              animationDelay: `-${el.delay}s`,
              opacity: el.opacity,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)'
            }}
          >
            <Icon size={el.size * 24} />
          </div>
        );
      })}
    </div>
  );
};

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="auth-page">
      <IconBackground />
      
      <motion.div 
        className="auth-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="auth-card-layout">
          <div className="auth-card-left">
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

            <div className="auth-divider" style={{ margin: '15px 0' }}>OR</div>

            <div className="social-auth">
              {error && <div className="auth-error" style={{ color: '#ff4d4d', marginBottom: '10px', fontSize: '0.9rem', textAlign: 'center', width: '100%' }}>{error}</div>}
              <button type="button" className="btn-social" onClick={handleGoogleSignIn}>
                <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
            </div>
          </div>

          <div className="auth-divider-vertical"></div>

          <div className="auth-card-right">
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
            
            <div className="form-group captcha-container" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Turnstile 
                  siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || "0x4AAAAAAD0VEYB6AeTVN4V2"} 
                  onSuccess={(token) => setTurnstileToken(token)}
                />
              </div>
            </div>

            {isLogin && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-10px', marginBottom: '15px' }}>
                <button 
                  type="button" 
                  onClick={() => setIsForgotPassword(true)}
                  style={{ background: 'none', border: 'none', color: '#3498db', fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Forgot Password?
                </button>
              </div>
            )}

            <button type="submit" className="btn-primary auth-submit flex-center">
              {isLogin ? 'Enter Outpost' : 'Create Account'}
            </button>
          </motion.form>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
      
      {/* Forgot Password Modal */}
      <AnimatePresence>
        {isForgotPassword && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 99, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div 
              className="auth-card" 
              style={{ position: 'relative', zIndex: 100, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '30px', maxWidth: '400px', width: '90%' }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <h2 style={{ marginBottom: '15px' }}>Reset Password</h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                Enter your email address to receive a password reset link.
              </p>
              <form onSubmit={handleForgotPassword}>
                <div className="form-group">
                  <input 
                    type="email" 
                    placeholder="dev@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="form-group captcha-container" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px', marginBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <Turnstile 
                      siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || "0x4AAAAAAD0VEYB6AeTVN4V2"} 
                      onSuccess={(token) => setTurnstileToken(token)}
                    />
                  </div>
                </div>

                {forgotPasswordMessage && (
                  <div style={{ color: '#2ecc71', fontSize: '0.85rem', marginBottom: '15px', textAlign: 'center' }}>
                    {forgotPasswordMessage}
                  </div>
                )}
                {error && <div style={{ color: '#e74c3c', fontSize: '0.85rem', marginBottom: '15px', textAlign: 'center' }}>{error}</div>}
                <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                  <button type="button" onClick={() => { setIsForgotPassword(false); setForgotPasswordMessage(""); setError(""); }} className="btn-primary" style={{ background: '#555', flex: 1, padding: '12px' }}>Cancel</button>
                  <button type="submit" className="btn-primary" style={{ flex: 1, padding: '12px' }}>Send Link</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Auth;
