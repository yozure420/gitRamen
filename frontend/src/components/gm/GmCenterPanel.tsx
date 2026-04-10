import { useEffect, useMemo } from 'react'
import type { CustomerAlert, OrderLog, Ramen, StatusWindowData } from '../../types/interface'

/////////////////////////////////////////////////

//フォルダ内のファイルを一括インポートし、リストにする

const ramenAssetModules = import.meta.glob('../../assets/ramen/*.png', {
  eager: true,
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


/////////////////////////画像とパスを一個の２次元のリストに変換////////////////////////////////
const assetByName = Object.fromEntries(
  Object.entries({ ...ramenAssetModules, ...toppingAssetModules }).map(([path, url]) => {
    const name = path.split('/').pop() ?? path //パスからファイル名を抽出
    return [name, url]
  })
) as Record<string, string>
///////////////////////値をとって一個のリストに包括する////////////////////////////////////////////////
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

function resolveBaseRamenImage(ramen: Ramen): string {
  const haystack = [ramen.command.game_note, ramen.command.description]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  const matchedImage = Object.entries(baseRamenImageByKeyword).find(([keyword]) => {
    return haystack.includes(keyword.toLowerCase())
  })?.[1]

  return assetByName[matchedImage ?? 'food-ramen.png'] ?? assetByName['food-ramen.png'] ?? ''
}

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
  activeRamen,
  getLaneRamens,
  laneCount,
  existingBranches,
  customerAlert,
  statusWindow,
  showLog,
  isCompactLog,
  orderLogs,
  closeLog,
}: GmCenterPanelProps) {
  const laneCustomerImages = useMemo(() => {
    if (customerImages.length === 0) {
      return Array.from({ length: laneCount }, () => null)
    }

    const pickRandom = () => customerImages[Math.floor(Math.random() * customerImages.length)]
    return Array.from({ length: laneCount }, () => pickRandom())
  }, [laneCount])

  useEffect(() => {
    if (!showLog) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault()
        closeLog()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [showLog, closeLog])

  return (
    <div className="center-panel">
      {statusWindow && (
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
