import { useEffect, useRef } from 'react'
import type { Ramen } from '../../interface'
import type { SoundSettings } from '../../Settings'
import { playSound } from '../../Sounds'

type FormOnSubmit = NonNullable<React.ComponentProps<'form'>['onSubmit']>

type GmBottomPanelProps = {
  message: string
  activeRamen: Ramen | null
  handleSubmit: FormOnSubmit
  inputCommand: string
  setInputCommand: (value: string) => void
  isLoading: boolean
  isGameOver: boolean
  soundSettings: SoundSettings
}

function GmBottomPanel({
  message,
  activeRamen,
  handleSubmit,
  inputCommand,
  setInputCommand,
  isLoading,
  isGameOver,
  soundSettings,
}: GmBottomPanelProps) {
  let messageClass = ''
  if (message.includes('正解') || message.includes('完了') || message.includes('完璧') || message.includes('うまい')) {
    messageClass = 'message-success'
  } else if (message.includes('❌') || message.includes('間違') || message.includes('まずい')) {
    messageClass = 'message-error'
  }

  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!isLoading && !isGameOver) {
      inputRef.current?.focus()
    }
  }, [isLoading, isGameOver, activeRamen?.id])

  return (
    <div className="bottom-panel">
      {message && (<p className={`message-text ${messageClass}`}>{message}</p>)}
      <form onSubmit={handleSubmit} className="command-form">
        <div className="command-input-wrapper">
          <span className="prompt">&gt;</span>
          <input
            ref={inputRef}
            type="text"
            value={inputCommand}
            onChange={(e) => {
              setInputCommand(e.target.value)
              playSound('type', soundSettings)
            }}
            onBlur={() => {
              if (!isLoading && !isGameOver) {
                inputRef.current?.focus()
              }
            }}
            className="command-input"
            placeholder="コマンドを入力してください"
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

// コマンドの正誤判定はhandleSubmit関数に渡して行ってる、いやその関数どこのファイルにあんねん