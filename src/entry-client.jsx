import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import { ThemeProvider } from './context/ThemeContext.jsx'
import App from './App.jsx'

const CLIENT_ID = "724286936097-natg9ao2lo3sg4budtu77dqae531b02l.apps.googleusercontent.com";

// Self-XSS Security Warning
if (typeof window !== 'undefined') {
  console.log(
    "%cSTOP!",
    "color: red; font-family: sans-serif; font-size: 4em; font-weight: bolder; text-shadow: #000 1px 1px;"
  );
  console.log(
    "%cThis is a browser feature intended for developers. If someone told you to copy-paste something here to enable an Outpost feature or 'hack' someone's account, it is a scam and will give them access to your account.",
    "color: white; background: red; font-family: sans-serif; font-size: 1.5em; padding: 10px; border-radius: 5px;"
  );
  console.log(
    "%cSee https://en.wikipedia.org/wiki/Self-XSS for more information.",
    "font-family: sans-serif; font-size: 1em; color: gray;"
  );
}

// Global Fetch Interceptor to automatically inject JWT tokens into all API requests
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  let [resource, config] = args;
  if (typeof resource === 'string' && resource.includes('/api/')) {
    config = config || {};
    config.headers = {
      ...config.headers,
      'Authorization': `Bearer ${localStorage.getItem('outpost_token')}`
    };
  }
  return originalFetch(resource, config);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <ThemeProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </GoogleOAuthProvider>
  </StrictMode>
)
