import { useEffect, useRef, useState } from 'react'
import type { Ramen, CommandHistory } from '../../types/interface'
import type { SoundSettings } from '../../types/interface'
import { playSound } from '../../lib/Sounds'

type FormOnSubmit = NonNullable<React.ComponentProps<'form'>['onSubmit']>
// 情報量の定義、ここを減らすべきだ。
type GmBottomPanelProps = {
  message: string
  activeRamen: Ramen | null
  handleSubmit: FormOnSubmit
  inputCommand: string
  setInputCommand: (value: string) => void
  isLoading: boolean
  isGameOver: boolean
  soundSettings: SoundSettings
  commandHistory: CommandHistory[]
}

/** タイプ音を鳴らさないキー */
const SILENT_KEYS = new Set([
  'Backspace',
  'Delete',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Shift',
  'Control',
  'Alt',
  'Meta',
  'Tab',
  'CapsLock',
  'Escape',
  'Enter',
])

function GmBottomPanel({
  message,
  activeRamen,
  handleSubmit,
  inputCommand,
  setInputCommand,
  isLoading,
  isGameOver,
  soundSettings,
  commandHistory,
}: GmBottomPanelProps) {
  let messageClass = ''
  if (message.includes('正解') || message.includes('完了') || message.includes('完璧') || message.includes('うまい')) {
    messageClass = 'message-success'
  } else if (message.includes('❌') || message.includes('間違') || message.includes('まずい')) {
    messageClass = 'message-error'
  }

  const inputRef = useRef<HTMLInputElement | null>(null)

  // ── 矢印キー履歴ナビ用 state ─────────────────────────
  // -1 = 未選択（現在の入力中テキスト）、0 = 最新履歴、1 = 1つ前 …
  const [historyIndex, setHistoryIndex] = useState(-1)
  const draftRef = useRef('')  // 矢印キーを押す前の入力テキストを退避

  // 履歴から重複を除いた逆順リスト（最新が index 0）
  const uniqueHistory = (() => {
    const seen = new Set<string>()
    const result: string[] = []
    for (let i = commandHistory.length - 1; i >= 0; i--) {
      const cmd = commandHistory[i].command
      if (!seen.has(cmd)) {
        seen.add(cmd)
        result.push(cmd)
      }
    }
    return result
  })()

  // Submit で履歴が伸びたらインデックスをリセット
  useEffect(() => {
    setHistoryIndex(-1)
  }, [commandHistory.length])

  useEffect(() => {
    if (!isLoading && !isGameOver) {
      inputRef.current?.focus()
    }
  }, [isLoading, isGameOver, activeRamen?.id])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // ── 矢印キー↑: 古い方へ ──
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (uniqueHistory.length === 0) return

      if (historyIndex === -1) {
        draftRef.current = inputCommand
      }

      const nextIndex = Math.min(historyIndex + 1, uniqueHistory.length - 1)
      setHistoryIndex(nextIndex)
      setInputCommand(uniqueHistory[nextIndex])
      return
    }

    // ── 矢印キー↓: 新しい方へ ──
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex <= -1) return

      const nextIndex = historyIndex - 1
      setHistoryIndex(nextIndex)

      if (nextIndex === -1) {
        setInputCommand(draftRef.current)
      } else {
        setInputCommand(uniqueHistory[nextIndex])
      }
      return
    }

    // ── タイプ音（Backspace/Delete 等は鳴らさない）──
    if (!SILENT_KEYS.has(e.key)) {
      playSound('type', soundSettings)
    }
  }

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
              // ユーザーが手動で書き換えたら履歴ナビをリセット
              if (historyIndex !== -1) {
                setHistoryIndex(-1)
              }
            }}
            onKeyDown={handleKeyDown}
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
