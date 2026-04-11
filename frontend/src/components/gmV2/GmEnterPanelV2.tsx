import React, { useEffect, useRef, useState} from 'react'
import type { SoundSettings } from '../../types/interface'
import { playSound } from '../../lib/Sounds'


type GmBottomPanelV2Props = {
    handleSubmit: React.SubmitEventHandler<HTMLFormElement>
    isLoading: boolean
    isGameOver: boolean
    soundSettings: SoundSettings
    
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

function GmBottomPanelV2({
    handleSubmit,
    isLoading,
    isGameOver,
    soundSettings,
}: GmBottomPanelV2Props) {
    // textはtsx側でローカルで管理する。
    const [text, setText] = useState('')

    // ロード中でない、かつゲーム中の時はinputにフォーカス。
    const inputRef = useRef<HTMLInputElement | null>(null)
    useEffect(() => {
        if (!isLoading && !isGameOver) {
            inputRef.current?.focus()
        }
    }, [isGameOver, isLoading])
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!SILENT_KEYS.has(e.key)) {
            playSound('type', soundSettings)
        }
    }

    return (
      <form onSubmit={(e) => { handleSubmit(e); setText('')}} className="command-form bottom-panel">
        <div className="command-input-wrapper">
          <span className="prompt">&gt;</span>
          <input
            ref={inputRef}
            type="text"
            name="command"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (!isLoading && !isGameOver) {
                inputRef.current?.focus()
              }
            }}
            className="command-input"
            placeholder="注文を捌け！"
            inputMode="text"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            autoFocus
            disabled={isLoading || isGameOver}
          />
        </div>
      </form>
    )
}

export default GmBottomPanelV2