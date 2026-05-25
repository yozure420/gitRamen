import React, { useEffect, useRef, useState } from 'react'
import type { SoundSettings, CommandHistory } from '../../types/interface'
import { playSound } from '../../lib/Sounds'

type GmBottomPanelV2Props = {
  handleSubmit: React.SubmitEventHandler<HTMLFormElement>
  isLoading: boolean
  isGameOver: boolean
  soundSettings: SoundSettings
  commandHistory: CommandHistory[] 
  isDisabledInput?: boolean // 👇 追加: モーダルが開いているかどうかのフラグ
}

/** タイプ音を鳴らさないキー */
const SILENT_KEYS = new Set([
  'Backspace', 'Delete', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'Shift', 'Control', 'Alt', 'Meta', 'Tab', 'CapsLock', 'Escape', 'Enter',
])

function GmBottomPanelV2({
  handleSubmit,
  isLoading,
  isGameOver,
  soundSettings,
  commandHistory,
  isDisabledInput = false, // 👇 追加: 初期値はfalse
}: GmBottomPanelV2Props) {
  const [text, setText] = useState('')
  const [historyIndex, setHistoryIndex] = useState(-1) // 履歴の何番目を見ているか

  const inputRef = useRef<HTMLInputElement | null>(null)
  
  // 👇 修正: モーダルが閉じた（isDisabledInputがfalseになった）瞬間にも、自動で入力欄にフォーカスを戻す親切設計！
  useEffect(() => {
    if (!isLoading && !isGameOver && !isDisabledInput) {
      inputRef.current?.focus()
    }
  }, [isGameOver, isLoading, isDisabledInput])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // タイプ音の再生
    if (!SILENT_KEYS.has(e.key)) {
      playSound('type', soundSettings)
    }

    // ↑キー：古い履歴へ遡る
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (commandHistory.length > 0) {
        const nextIndex = Math.min(historyIndex + 1, commandHistory.length - 1)
        setHistoryIndex(nextIndex)
        // 最新の履歴が一番最初に来るように反転
        const reversedHistory = [...commandHistory].reverse()
        setText(reversedHistory[nextIndex].command)
      }
    } 
    // ↓キー：新しい履歴へ戻る
    else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex > 0) {
        const nextIndex = historyIndex - 1
        setHistoryIndex(nextIndex)
        const reversedHistory = [...commandHistory].reverse()
        setText(reversedHistory[nextIndex].command)
      } else if (historyIndex === 0) {
        // 現在の入力に戻る
        setHistoryIndex(-1)
        setText('')
      }
    }
  }

  // フォーム送信時に履歴インデックスをリセット
  const onSubmitForm = (e: React.FormEvent<HTMLFormElement>) => {
    handleSubmit(e)
    setText('')
    setHistoryIndex(-1)
  }

  return (
    <form onSubmit={onSubmitForm} className="command-form bottom-panel" autoComplete="off">
      <div className="command-input-wrapper">
        <span className="prompt">&gt;</span>
        <input
          ref={inputRef}
          type="text"
          name="command"
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setHistoryIndex(-1) // 手入力したら履歴追跡をリセット
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            // 👇 修正: モーダル表示中でない場合のみフォーカスをロックする
            if (!isLoading && !isGameOver && !isDisabledInput) {
              inputRef.current?.focus()
            }
          }}
          className="command-input"
          // 👇 修正: モーダル表示中はプレースホルダーを切り替えてプレイヤーに知らせる
          placeholder={isDisabledInput ? "確認中... (Enterで戻る)" : "注文を捌け！"}
          inputMode="text"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          autoFocus
          // 👇 修正: isDisabledInput も disabled の条件に追加！
          disabled={isLoading || isGameOver || isDisabledInput}
          autoComplete="off"
        />
      </div>
    </form>
  )
}

export default GmBottomPanelV2