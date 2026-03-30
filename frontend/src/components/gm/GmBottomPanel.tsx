import { useEffect, useRef, useState } from 'react'
import type { Ramen, CommandHistory } from '../../types/interface'
import type { SoundSettings } from '../../types/interface'
import { playSound } from '../../lib/Sounds'

/**
 * GmBottomPanel
 *
 * Game Master（GM）画面の下部パネルで、次の機能が使われている:
 * - システムメッセージ表示（正解/間違い等に応じたクラス付与）
 * - コマンド入力フォーム
 * - コマンド履歴（↑↓キー）での遡りと復帰
 * - 文字入力時のタイプ音再生（特定キーは無音）
 * - フォーカス維持とロード/ゲーム終了時の無効化
 */

/** form の onSubmit イベントハンドラの型エイリアス */
type FormOnSubmit = NonNullable<React.ComponentProps<'form'>['onSubmit']>

/** GmBottomPanel に渡す props */
type GmBottomPanelProps = {
  message: string // コマンドを実行した結果として表示するメッセージ
  activeRamen: Ramen | null // 現在アクティブなラーメン（null なら未選択）
  handleSubmit: FormOnSubmit // フォーム送信時のハンドラ（親から渡す）
  inputCommand: string // 入力欄のコマンド文字列
  setInputCommand: (value: string) => void //inputCommand の setter
  isLoading: boolean // API リクエスト中かどうか
  isGameOver: boolean // ゲームオーバー状態かどうか
  soundSettings: SoundSettings // サウンド設定
  commandHistory: CommandHistory[] // コマンド履歴リスト
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
  // 'f', // fキーも無音に
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
  // メッセージ内容に応じて CSS クラスを決定（成功 / エラー / なし）
  let messageClass = ''
  if (message.includes('正解') || message.includes('完了') || message.includes('完璧') || message.includes('うまい')) {
    messageClass = 'message-success'
  } else if (message.includes('❌') || message.includes('間違') || message.includes('まずい')) {
    messageClass = 'message-error'
  }

  const inputRef = useRef<HTMLInputElement | null>(null) // input要素への参照を保持するもの

  // ── 矢印キー履歴ナビ用 state ─────────────────────────
  // -1 = 未選択（現在入力中のテキスト）、0 = 最新、1 = 1つ前 、 2 = 2つ前…
  const [historyIndex, setHistoryIndex] = useState(-1)
  const draftRef = useRef('')  // 矢印キーを押した時に、現在の入力テキストを一旦保持する

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

  // ローディング終了・ゲームオーバー解除・ラーメン切り替え時に入力欄へフォーカスを戻す
  useEffect(() => {
    if (!isLoading && !isGameOver) {
      inputRef.current?.focus()
    }
  }, [isLoading, isGameOver, activeRamen?.id])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // ── 矢印キー↑: 古い方へ ──
    if (e.key === 'ArrowUp') {
      e.preventDefault() // 矢印キーが押されたとき、本来やろうとしている動作（カーソルを行頭に移動）をキャンセル
      if (uniqueHistory.length === 0) return // 履歴が空なら何もしない

      if (historyIndex === -1) {
        draftRef.current = inputCommand // 何かコマンドを入力しているときに矢印キーを押したら、入力中のコマンドを保存
      }

      const nextIndex = Math.min(historyIndex + 1, uniqueHistory.length - 1) // インデックスを1つ古い方へ進める（履歴の範囲内で）
      setHistoryIndex(nextIndex) // 履歴からコマンドをセット（インデックスが -1 なら入力中のテキストに戻す）
      setInputCommand(uniqueHistory[nextIndex])
      return
    }

    // ── 矢印キー↓: 新しい方へ ──
    if (e.key === 'ArrowDown') {
      e.preventDefault() // 矢印キーが押されたとき、本来やろうとしている動作（カーソルを行頭に移動）をキャンセル
      if (historyIndex <= -1) return // 一番新しい状態なら何もしない

      const nextIndex = historyIndex - 1 // インデックスを1つ新しい方へ進める
      setHistoryIndex(nextIndex) // 履歴からコマンドをセット（インデックスが -1 なら入力中のテキストに戻す）

      if (nextIndex === -1) {
        setInputCommand(draftRef.current) // 一番新しい状態に戻るときは、ArrowUpの方で保存しておいたテキストを復元
      } else {
        setInputCommand(uniqueHistory[nextIndex])
      }
      return
    }

    // ── キーボードが打ち込まれたときにタイプ音を鳴らす処理（Backspace/Delete 等は鳴らさない）──
    if (!SILENT_KEYS.has(e.key)) {
      playSound('type', soundSettings)
    }
  }

  // html部分
  return (
    <div className="bottom-panel">
      {/* メッセージが空でないときに表示、内容に応じてクラスを付与してスタイルを変える */}
      {message && (<p className={`message-text ${messageClass}`}>{message}</p>)}
      <form onSubmit={handleSubmit} className="command-form">
        <div className="command-input-wrapper">
          <span className="prompt">&gt;</span>
          <input // 入力欄
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
