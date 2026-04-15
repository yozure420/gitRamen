import '../css/GmStart.css'
import { useState } from 'react'

interface GmStartProps {
  onStart: (course: number) => void
}

type StartStatus = 'AWAITING_ENTRY' | 'AWAITING_REMOTE'

function GmStart({ onStart }: GmStartProps) {
  const [command, setCommand] = useState('')
  const [status, setStatus] = useState<StartStatus>('AWAITING_ENTRY')
  const [message, setMessage] = useState('修行: git clone easy / git clone normal、独立: git init')
/////全角を半角に、連続したスペースを一つに、前後の空白を削除、小文字に統一する正規表現
  const normalize = (input: string) => {
    return input
      .replace(/\u3000/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()
  }
  const normalized = normalize(command) //inputされた文字列を正規表現で整えて新たに変数に入れ直す
  const handleSubmit: NonNullable<React.ComponentProps<'form'>['onSubmit']> = (e) => {
    e.preventDefault()

    if (status === 'AWAITING_ENTRY') {
      if (normalized === 'git clone easy') {
        setMessage('🟢 初級で開始します')
        onStart(1)
        return
      }

      if (normalized === 'git clone normal') {
        setMessage('🔵 中級で開始します')
        onStart(2)
        return
      }

      if (normalized === 'git init') {
        setStatus('AWAITING_REMOTE')
        setMessage('独立ルート: git remote add high / git remote add god を入力してください')
        setCommand('')
        return
      }

      setMessage('❌ まだそのコマンドは使えません。git clone easy / git clone normal / git init を入力してください')
      setCommand('')
      return
    }

    if (normalized === 'git remote add high') {
      setMessage('🟠 上級で開始します')
      onStart(3)
      return
    }

    if (normalized === 'git remote add god') {
      setMessage('💀 超上級で開始します')
      onStart(4)
      return
    }

    setMessage('❌ まだそのコマンドは使えません。git remote add high / git remote add god を入力してください')
    setCommand('')
  }

  return (
    <div className="gmstart-container">
      <div className="terminal-content">
        <h1 className="start-message">
          {status === 'AWAITING_ENTRY' ? 'コマンドでルートを選択' : '独立ルート: リモート設定'}
        </h1>
        <p className="start-submessage">{message}</p>
        <form onSubmit={handleSubmit} className="terminal-form">
          <div className="terminal-input-wrapper">
            <span className="terminal-prompt">$</span>
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              className="terminal-input"
              placeholder={status === 'AWAITING_ENTRY' ? 'git clone easy / git clone normal / git init' : 'git remote add high / git remote add god'}
              autoFocus
            />
          </div>
        </form>
      </div>
    </div>
  )
}

export default GmStart