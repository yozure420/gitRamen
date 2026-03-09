import { useState } from 'react'
import './App.css'
import GmStart from './GmStart'
import GmScreen from './GmScreen'
import CourseSelection from './CourseSelection'
import Result from './Result'
import CommandExplanation from './CommandExplanation'

function App() {
  const [screen, setScreen] = useState<'start' | 'game' | 'course' | 'result' | 'explanation'>('start')
  
  const [targetCommand, setTargetCommand] = useState<string | null>(null)

  
  const handleNavigate = (nextScreen: 'start' | 'game' | 'course' | 'result' | 'explanation', target?: string) => {
    setScreen(nextScreen)
    setTargetCommand(target || null)
  }

  return (
    <>
      {}
      {screen === 'start' && <GmStart onStart={() => handleNavigate('course')} />}
      
      {screen === 'game' && <GmScreen />}
      
      {}
      {screen === 'course' && <CourseSelection onNavigate={handleNavigate} />}
      {screen === 'result' && <Result onNavigate={handleNavigate} />}
      {screen === 'explanation' && <CommandExplanation onNavigate={handleNavigate} targetCommand={targetCommand} />}

      {/* デバッグメニュー
        画面の右下に、強制的に画面を切り替えるボタンを配置します。
      */}
      <div style={{ position: 'fixed', bottom: '10px', right: '10px', background: '#f0f0f0', padding: '10px', borderRadius: '8px', zIndex: 9999, border: '1px solid #ccc' }}>
        <p style={{ margin: '0 0 5px 0', fontSize: '12px', fontWeight: 'bold', color: '#333' }}>🖥️ デバッグ用画面切り替え</p>
        <div style={{ display: 'flex', gap: '5px' }}>
          <button onClick={() => setScreen('start')}>タイトル</button>
          <button onClick={() => setScreen('course')}>コース選択</button>
          <button onClick={() => setScreen('game')}>ゲーム</button>
          <button onClick={() => setScreen('result')}>リザルト</button>
          <button onClick={() => setScreen('explanation')}>解説</button>
        </div>
      </div>
    </>
  )
}

export default App