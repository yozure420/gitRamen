// ラーメンのデータ構造（型）を読み込む
import type { Ramen } from '../../types/interface'
// ゲームの裏側の判定ロジック（次に入れる具材、必要な全具材）を読み込む
import { getRequiredToppingForRamen, getWorkflowToppingItems } from '../../game/gameEngine'

// このパネル（画面右側）が親コンポーネントから受け取るデータ
type GmRightPanelProps = {
  availableItems: string[]      // お店に存在する「すべての具材」のリスト（例: ['ネギ', 'メンマ', 'チャーシュー'...]）
  activeRamen: Ramen | null     // プレイヤーが現在操作している「対象のラーメン」（注文がない時は null）
}

function GmRightPanel({ availableItems, activeRamen }: GmRightPanelProps) {
  // ① 次に git add するべき「正解の具材」を取得（例: 'ネギ'）
  const requiredTopping = activeRamen ? getRequiredToppingForRamen(activeRamen) : null
  
  // ② 今作っているラーメンを完成させるために必要な「正解の全具材リスト」を取得（例: ['ネギ', 'メンマ']）
  const workflowItems = activeRamen ? getWorkflowToppingItems(activeRamen) : []
  
  // ③ プレイヤーがすでに1つでも具材を git add（お椀に追加）したかどうかを判定
  const hasAnyAddExecuted = (activeRamen?.stagedItems.length ?? 0) > 0

  // ④ 画面に表示する具材リストを決定（関係ない具材を隠して画面をスッキリさせる賢い処理）
  const visibleItems = workflowItems.length > 0
    // 注文が入っている場合：すべての具材から「正解の具材」または「既に間違えて入れちゃった具材」だけを残す
    ? availableItems.filter(item => workflowItems.includes(item) || activeRamen?.stagedItems.includes(item))
    // 注文が入っていない場合：すべての具材をそのままメニューのように表示する
    : availableItems

  return (
    <div className="right-panel">
      <h3 className="section-title section-title-center">注文の入った具材</h3>
      
      {/* 絞り込んだ具材リストを1つずつ取り出して画面のタグ（div）を作る */}
      {visibleItems.map(item => {
        // A. この具材は、すでに git add されているか？
        const isAdded = activeRamen?.stagedItems.includes(item) || false
        
        // B. この具材は「今すぐ入れるべき最初のターゲット」か？
        // （次に入れるべき具材であり、かつ、まだ何も具材を入れていない状態なら true）
        const isTargetPending = requiredTopping === item && !hasAnyAddExecuted

        return (
          <div 
            key={item} 
            // 具材の状態に合わせて CSS のクラス（見た目）を動的に切り替える
            // - 追加済みなら 'item-chip-added'（グレーアウト等）を付与
            // - 最初のターゲットなら 'item-chip-target-pending'（ハイライト等）を付与
            className={`item-chip ${isAdded ? 'item-chip-added' : ''} ${isTargetPending ? 'item-chip-target-pending' : ''}`}
          >
            {/* もし追加済みなら、具材名の前に「✓」マークをつける */}
            {isAdded && '✓ '}{item}
          </div>
        )
      })}
    </div>
  )
}

export default GmRightPanel