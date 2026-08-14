import { useEffect, useRef, useState } from 'react'
import type { SoundSettings, CommandHistory, Ramen } from '../../types/interface'
import { playSound } from '../../lib/Sounds'

type GmBottomPanelV2Props = {
  handleSubmit: React.FormEventHandler<HTMLFormElement>
  isLoading: boolean
  isGameOver: boolean
  soundSettings: SoundSettings
  commandHistory: CommandHistory[] 
  isDisabledInput?: boolean
  activeRamen: Ramen | null
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
  isDisabledInput = false,
  activeRamen,
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
      
      {activeRamen?.steps[activeRamen.currentStepIndex]?.type === 'stash' && (
        <div className="gimmick-hint stash-hint" style={{ color: '#ffb86c', fontWeight: 'bold', marginBottom: '8px' }}>
          ⚠️ 割り込み客だ！ <code>git stash</code> で現在の調理を退避しろ！
        </div>
      )}
      {activeRamen?.steps[activeRamen.currentStepIndex]?.type === 'stash_pop' && (
        <div className="gimmick-hint pop-hint" style={{ color: '#50fa7b', fontWeight: 'bold', marginBottom: '8px' }}>
          ✅ VIP注文完了！ <code>git stash pop</code> で元の調理を再開しろ！
        </div>
      )}
      {activeRamen?.steps[activeRamen.currentStepIndex]?.type === 'reset_soft' && (
        <div className="gimmick-hint reset-hint" style={{ color: '#ff5555', fontWeight: 'bold', marginBottom: '8px' }}>
          ⚠️ 注文変更！ <code>git reset --soft HEAD~1</code> で確定を取り消せ！
        </div>
      )}

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