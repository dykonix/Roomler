import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import PublicApp from './PublicApp.tsx'
import SeoLandingPage from './SeoLandingPage.tsx'

const path = window.location.pathname
const isAdmin = path.startsWith('/admin')
const isExistingPublicRoute = path === '/' || path === '/search' || path.startsWith('/property/')
const isSeoLandingRoute = !isAdmin && !isExistingPublicRoute && (/^\/(pg-in-[a-z0-9-]+|girls-pg-in-[a-z0-9-]+|boys-pg-in-[a-z0-9-]+)\/$/.test(path) || /^\/pg-in-[a-z0-9-]+\/[a-z0-9-]+\/$/.test(path))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isAdmin ? <App /> : isSeoLandingRoute ? <SeoLandingPage /> : <PublicApp />}
  </StrictMode>,
)
