import React, { useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, useLocation } from 'react-router-dom'
import App from './App'
import './styles/_tokens.css'
import './App.css'

const GAME_ROUTES = ['/game']
const STACKING_ROUTES = ['/projects']

function BodyClassSetter() {
  const location = useLocation()

  useEffect(() => {
    const path = location.pathname
    if (GAME_ROUTES.includes(path)) {
      document.body.className = 'game-page'
    } else if (STACKING_ROUTES.includes(path)) {
      // Projects page uses position: sticky — overflow-x: hidden breaks it
      document.body.className = 'projects-page'
    } else {
      document.body.className = 'home-page'
    }
  }, [location])

  return null
}

function AnalyticsTracker() {
  const location = useLocation()

  useEffect(() => {
    if (typeof window.gtag !== 'function') return

    window.gtag('config', 'G-RYR4303N09', {
      page_path: location.pathname + location.search,
    })
  }, [location])

  return null
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <BodyClassSetter />
      <AnalyticsTracker />
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
