import '../css/GmStart.css'
import { useState } from 'react'

interface GmStartProps {
  onStart: () => void
}

function GmStart({ onStart }: GmStartProps) {
  const [command, setCommand] = useState('')

  const handleSubmit: NonNullable<React.ComponentProps<'form'>['onSubmit']> = (e) => {
    e.preventDefault()
    if (command.trim().toLowerCase() === 'git init') {
      onStart()
    }
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