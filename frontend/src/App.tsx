import { useState } from 'react'
import './App.css'
import GmStart from './GmStart'
import GmScreen from './GmScreen'

function App() {
  const [screen, setScreen] = useState<'start' | 'game'>('start')

  const handleStart = () => {
    setScreen('game')
  }

  return (
    <>
      {screen === 'start' && <GmStart onStart={handleStart} />}
      {screen === 'game' && <GmScreen />}
    </>
  )
}

export default App
