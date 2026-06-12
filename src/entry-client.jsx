import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import { ThemeProvider } from './context/ThemeContext.jsx'
import App from './App.jsx'

const CLIENT_ID = "724286936097-natg9ao2lo3sg4budtu77dqae531b02l.apps.googleusercontent.com";

hydrateRoot(document.getElementById('root'),
  <StrictMode>
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <ThemeProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)
