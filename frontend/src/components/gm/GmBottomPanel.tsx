import { useEffect, useRef } from 'react'
import type { Ramen } from '../../interface'

type FormOnSubmit = NonNullable<React.ComponentProps<'form'>['onSubmit']>

type GmBottomPanelProps = {
  message: string
  activeRamen: Ramen | null
  handleSubmit: FormOnSubmit
  inputCommand: string
  setInputCommand: (value: string) => void
  isLoading: boolean
  isGameOver: boolean
}

function GmBottomPanel({
  message,
  activeRamen,
  handleSubmit,
  inputCommand,
  setInputCommand,
  isLoading,
  isGameOver,
}: GmBottomPanelProps) {
  const messageClass =
    message.includes('正解') || message.includes('完了') || message.includes('完璧')
      ? 'message-success'
      : message.includes('❌') || message.includes('間違')
        ? 'message-error'
        : ''

  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!isLoading && !isGameOver) {
      inputRef.current?.focus()
    }
  }, [isLoading, isGameOver, activeRamen?.id])

  return (
    <div className="bottom-panel">
      {message && (
        <p className={`message-text ${messageClass}`}>
          {message}
        </p>
      )}
      {activeRamen && (
        <p className="active-order">
          命令文:
          {' '}
          <code>
            command: {activeRamen.displayCommand}
            {activeRamen.command.game_note && ` | game_note: ${activeRamen.command.game_note}`}
          </code>
        </p>
      )}
      {activeRamen?.isPushReady && (
        <p className="push-ready-hint">
          🚀 準備完了！<code>git push origin main</code> でお客さんに届けよう！
        </p>
      )}
      <p className="input-label">⭐操作中のラーメンのコマンドを入力するか、git add/commit/switchを使用</p>
      <form onSubmit={handleSubmit} className="command-form">
        <div className="command-input-wrapper">
          <span className="prompt">&gt;</span>
          <input
            ref={inputRef}
            type="text"
            value={inputCommand}
            onChange={(e) => setInputCommand(e.target.value)}
            onBlur={() => {
              if (!isLoading && !isGameOver) {
                inputRef.current?.focus()
              }
            }}
            className="command-input"
            placeholder="例: git add ネギ または git switch lane2"
            inputMode="text"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            autoFocus
            disabled={isLoading || isGameOver}
          />
        </div>
      </form>
    </div>
  )
}

export default GmBottomPanel
