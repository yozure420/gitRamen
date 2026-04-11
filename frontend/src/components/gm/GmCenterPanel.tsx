import { useEffect, useMemo } from 'react'
import type { CustomerAlert, OrderLog, Ramen, StatusWindowData } from '../../types/interface'
// 各画像をglob（viteの機能）によって一括で採取し、{パス : URL, パス : URL}といったぐあいにプロパティ名と値の関係によって保存する。
const ramenAssetModules = import.meta.glob('../../assets/ramen/*.png', {
  eager: true,　// 初めに全てをimportし終える。
  import: 'default',
}) as Record<string, string>

const toppingAssetModules = import.meta.glob('../../assets/topping/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>

const customerImageModules = import.meta.glob('../../assets/human/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>

// {fileName : URL, ,,,}となっているオブジェクト。 つまり、パスをファイル名に置き換えたい。
const assetByName = Object.fromEntries( //　[key, value]をエントリと呼び、これはそれらの配列を{{key : value}}というオブジェクトに変換する。
  // ... はスプリットといい、 Recordの中身をバラして二つのプロパティをごちゃ混ぜにし、もう一度オブジェクトを作る。
                                                                        // どっちも受け取る
  Object.entries({ ...ramenAssetModules, ...toppingAssetModules }).map(([path, url]) => {
    // pathを/によってわけ、その最後の値をpopすることでfile nameを得る。
    const name = path.split('/').pop() ?? path
    return [name, url]
  })
) as Record<string, string>

// 客の画像のURLだけ収めている配列。
const customerImages = Object.values(customerImageModules)
///////////////////////////////////////////////////////////////////
const baseRamenImageByKeyword: Record<string, string> = {
  '味噌': 'a1.png',
  '醤油': 'a2.png',
  '豚骨': 'a3.png',
  '家系': 'a4.png',
  '台湾': 'a5.png',
  'タンメン': 'food-ramen-tanmen.png',
  'トムヤム': 'food-ramen-tom-yam-kung.png',
  'つけ麺': 'food-tsukemen.png',
  '油そば': 'food-aburasoba.png',
  '一色': 'food-ramen-ishiki.png'
}

const toppingImageByItem: Record<string, string> = {
  '煮玉子': 'b5.png',
  'ネギ': 'b1.png',
  'のり': 'b6.png',
  'チャーシュー': 'b3.png',
  'コーン': 'b8.png',
  'もやし': 'b7.png',
  'メンマ': 'b4.png',
  'ナルト': 'b9.png',
}
<<<<<<< HEAD
////////////３つのプロパティを一個のリストにする////////////////////////////////////////
=======

/**
 * 受け取ったラーメンに対応するラーメンの画像のURLを返す。
 * 
 * @param ramen 
 * @returns 
 */
>>>>>>> 86ad3e585a3d1cf74a68ebad2ad6bde06ee643d4
function resolveBaseRamenImage(ramen: Ramen): string {
  const haystack = [ramen.command.game_note, ramen.command.description]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
<<<<<<< HEAD
//////////////////文字列を検索して、その中で条件にあったやつを表示する/////////////////////
  const matchedImage = Object.entries(baseRamenImageByKeyword).find(([keyword]) => {
=======

  const matchedImage = Object.entries(baseRamenImageByKeyword).find(([keyword]) => { // find: 引数ないのpredicateがtrueなら、trueとなった要素を返す。
>>>>>>> 86ad3e585a3d1cf74a68ebad2ad6bde06ee643d4
    return haystack.includes(keyword.toLowerCase())
  })?.[1]　

  return assetByName[matchedImage ?? 'food-ramen.png'] ?? assetByName['food-ramen.png'] ?? ''
}
/////////////トッピングを検索して、対応するロジックを返す///////
function resolveToppingImage(item: string): string | null {
  const fileName = toppingImageByItem[item]
  if (!fileName) return null
  return assetByName[fileName] ?? null
}

type GmCenterPanelProps = {
  activeRamen: Ramen | null
  getLaneRamens: (lane: number) => Ramen[]
  laneCount: number
  existingBranches: string[]
  customerAlert: CustomerAlert | null
  statusWindow: StatusWindowData | null
  showLog: boolean
  isCompactLog: boolean
  orderLogs: OrderLog[]
  closeLog: () => void
}

function GmCenterPanel({
  activeRamen,       // 現在操作中のラーメン
  getLaneRamens,     // 特定のレーンに流れているラーメンを取得する関数
  laneCount,         // 表示するレーン（ブランチ）の数
  existingBranches,  // 存在するGitブランチ名のリスト
  customerAlert,     // 客からの警告・メッセージ
  statusWindow,      // 現在のゲーム状態（フェーズ）を表示するウィンドウ
  showLog,           // git log（履歴）を表示するかどうかのフラグ
  isCompactLog,      // 履歴を --oneline 形式にするか
  orderLogs,         // 注文履歴のデータ配列
  closeLog,          // 履歴画面を閉じる関数
}: GmCenterPanelProps) {
<<<<<<< HEAD
//////////////客の画像をランダムに決定//////////////////////////////////////////
  const laneCustomerImages = useMemo(() => {
=======
  const laneCustomerImages = useMemo(() => {　// 第二引数が変化したら第一引数の計算を行う。
    // イメージがない場合は、ひとまず枠だけ作る。[null, null, null,,,,]
>>>>>>> 86ad3e585a3d1cf74a68ebad2ad6bde06ee643d4
    if (customerImages.length === 0) {
      return Array.from({ length: laneCount }, () => null)
    }
    //　イメージがる場合、ランダムに画像を選択する関数を定義し、そこからlaneの数だけランダムに画像を選択して配列を作る。
    const pickRandom = () => customerImages[Math.floor(Math.random() * customerImages.length)]

    return Array.from({ length: laneCount }, () => pickRandom())
  }, [laneCount])
///////////////////////////////////////////////////////////////////////////////////
  useEffect(() => {
    if (!showLog) return
///////Enterキーでログ画面閉じる/////////////////
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault() //本来そのeventによって引き起こされる動作をなくして、代わりに以下の動作を実行させる。
        closeLog()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
<<<<<<< HEAD
  }, [showLog, closeLog])
///////////////////////statusWindowはuseGmScreen.tsの中で管理されているフックス/////////////////////////////////////////////////////////
=======
  }, [showLog, closeLog])　// Logが見えているか、closeLogの参照が変わった時に呼び出される。

>>>>>>> 86ad3e585a3d1cf74a68ebad2ad6bde06ee643d4
  return (
    <div className="center-panel">
      {statusWindow && (　//  && は左側の条件が満たされているなら、という意味。
        <div className="status-window-overlay" role="status" aria-live="polite">
          <h4 className="status-window-title">{statusWindow.title}</h4>
          <p className="status-window-phase">{statusWindow.phaseMessage}</p>
          <div className="status-window-details">
            {statusWindow.details.map((line, idx) => (
              <div key={`${line}-${idx}`} className="status-window-line">{line}</div>
            ))}
          </div>
        </div>
      )}
////////////////レシートログ画面///////////////////////////////////////////
      {showLog && (
        <div className="receipt-overlay" role="dialog" aria-modal="true" aria-label="git log receipt" >
          <div className="receipt-modal" style={{maxHeight: '425px',}}>
            <div className="receipt-head">
              <div className="receipt-title">{isCompactLog ? 'git log --oneline' : 'git log'}</div>
              <button type="button" className="receipt-close" onClick={closeLog} style={{display: 'flex', justifyContent: 'center', alignItems: 'center', }}>×</button>
            </div>
            <div className="receipt-meta">RAMEN GIT KITCHEN / ORDER HISTORY</div>
            <div className="receipt-body" >
              {orderLogs.length === 0 && <div className="receipt-row">履歴はまだありません</div>}
              {orderLogs.slice().reverse().map((log, idx) => {
                const time = log.timestamp.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
                const state = log.result === 'delivered' ? 'OK' : log.result === 'failed' ? 'NG' : 'WAIT'
                return (
                  <div key={`${log.ramenId}-${idx}`} className="receipt-row">
                    <div>{time} / #{log.ramenId} / L{log.lane} / {state}</div>
                    <div className="receipt-command">{log.gameNote ?? log.orderCommand}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
///////////////////////////////レシートやラーメンの描画///////////////////////////////////////////////
      {Array.from({ length: laneCount }, (_, i) => i + 1).map(laneNum => {
        const laneRamens = getLaneRamens(laneNum)
        const branchName = existingBranches[laneNum - 1] ?? `lane${laneNum}`
        return (
          <div key={laneNum} className="lane">
            {laneRamens.map(ramen => {
              const isActive = activeRamen?.id === ramen.id
              const baseImage = resolveBaseRamenImage(ramen)
              const clampedPosition = Math.min(90, Math.max(10, ramen.position))
              return (
                <div key={ramen.id} className={`ramen-icon ${isActive ? 'ramen-icon-active' : ''} ${ramen.isPushReady ? 'ramen-icon-push-ready' : ''}`} style={{ left: `${clampedPosition}%` }}>
                    <img src={baseImage} alt="ramen" className={`ramen-image ${isActive ? 'ramen-image-active' : ''}`} />
                  <div className="ramen-toppings">
                    {ramen.stagedItems.map((item) => {
                      const toppingImage = resolveToppingImage(item)
                      if (!toppingImage) return null
                      return (<img key={`${ramen.id}-${item}`} src={toppingImage} alt={item} className="ramen-topping-image" />)
                    })}
                  </div>
                  {isActive && (
                    <>
                      {ramen.isPushReady ? (
                        <div className="ramen-push-badge">🚀 git push origin main!</div>
                      ) : (<div className="ramen-command-badge">📝 {ramen.displayCommand}</div>)
                      }
                    </>
                  )}
                </div>
              )
            })}
            <div className="lane-customer">
              <img src={laneCustomerImages[laneNum - 1] ?? undefined} alt={`customer-lane-${laneNum}`} className="lane-customer-image" />
              {customerAlert && customerAlert.lane === laneNum && (
                <div className="customer-warning-bubble">
                  <div>{customerAlert.text}</div>
                  {customerAlert.label ? <div className="customer-warning-label">{customerAlert.label}</div> : null}
                </div>
              )}
            </div>
            <div className="lane-number">{branchName}レーン</div>
          </div>
        )
      })}
    </div>
  )
}
export default GmCenterPanel
