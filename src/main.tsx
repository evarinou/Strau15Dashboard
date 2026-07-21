import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { applyDisplayPreferences } from './lib/daylight'
import './index.css'

// Vor dem ersten Render, damit das Glas nicht erst blurrt und dann umspringt
applyDisplayPreferences()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
