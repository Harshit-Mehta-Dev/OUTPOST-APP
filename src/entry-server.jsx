import React from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { ThemeProvider } from './context/ThemeContext.jsx'
import App from './App.jsx'

const CLIENT_ID = "724286936097-natg9ao2lo3sg4budtu77dqae531b02l.apps.googleusercontent.com";

export function render(url) {
  const html = renderToString(
    <React.StrictMode>
      <GoogleOAuthProvider clientId={CLIENT_ID}>
        <ThemeProvider>
          <StaticRouter location={url}>
            <App />
          </StaticRouter>
        </ThemeProvider>
      </GoogleOAuthProvider>
    </React.StrictMode>
  )
  return { html }
}
