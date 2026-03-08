import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import GmStart from './GmStart.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <GmStart />
  </StrictMode>,
)
