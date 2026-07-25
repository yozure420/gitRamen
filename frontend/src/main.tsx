import { createRoot } from 'react-dom/client'
import './css/index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { SoundProvider } from './context/SoundContext'

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <SoundProvider>
      <App />
    </SoundProvider>
  </BrowserRouter>
)
