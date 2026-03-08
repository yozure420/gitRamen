import './GmStart.css'
import { useState } from 'react'

function GmStart() {
  const [command, setCommand] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Command:', command)
    // ここでコマンド処理を実装
  }

  return (
    <div className="gmstart-container">
      <div className="terminal-content">
        <h1 className="start-message">git initと入力してスタート</h1>
        <form onSubmit={handleSubmit} className="terminal-form">
          <div className="terminal-input-wrapper">
            <span className="terminal-prompt">$</span>
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              className="terminal-input"
              placeholder="git init"
              autoFocus
            />
          </div>
        </form>
      </div>
    </div>
  )
}

export default GmStart