import { useMemo } from 'react'
import type { Ramen } from '../../types/interface'

/** パス：ラーメン画像URL というプロパティを集めたオブジェクト。*/
const ramenAssetModules = import.meta.glob('../../assets/ramen/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>

/** パス： トッピング画像URL というプロパティを集めたオブジェクト。*/
const toppingAssetModules = import.meta.glob('../../assets/topping/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>

/** パス： 客画像URL というプロパティを集めたオブジェクト。*/
const customerAssetModules = import.meta.glob('../../assets/human/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>

function prunePathToName<V>(record: Record<string, V>): Record<string, V> {
  return Object.fromEntries(
    Object.entries(record).map(([path, url]) => {
      const name = path.split('/').pop() ?? path
      return [name, url]
    })
  )
}

const fileNameToRamenImage = prunePathToName(ramenAssetModules)
const fineNameToToppingImage = prunePathToName(toppingAssetModules)
const customerImages = Object.values(prunePathToName(customerAssetModules))

const keywordToRamenImage: Record<string, string> = {
  '味噌': 'a1.png',
  '醤油': 'a2.png',
  '豚骨': 'a3.png',
  '家系': 'a4.png',
  '台湾': 'a5.png'
}

const keywordToToppingImage: Record<string, string> = {
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
  // 👇 修正: すべてのコマンド（commit等）の文字列からラーメン名を推測する！
  const allStepsText = ramen.steps.map(s => s.displayCommand).join(' ')
  const haystack = [ramen.displayCommand, ramen.command.game_note, ramen.command.description, allStepsText]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  const matchedImage = Object.entries(keywordToRamenImage).find(([keyword]) => {
    return haystack.includes(keyword.toLowerCase())
  })?.[1]

  return fileNameToRamenImage[matchedImage ?? 'ramen-pixel.png'] ?? fileNameToRamenImage['ramen-pixel.png'] ?? ''
}

function resolveToppingImage(topping: string): string | null {
  const fileName = keywordToToppingImage[topping]
  if (!fileName) return null
  return fineNameToToppingImage[fileName] ?? null
}

type GmLanePanelV2Props = {
  ramen: Ramen | null
  existingBrancheNames: string[]
}

function GmLanePanelV2({
  ramen,
  existingBrancheNames
}: GmLanePanelV2Props) {
  const laneCount = existingBrancheNames.length
  const laneCustomerImages = useMemo(() => {
    if (customerImages.length === 0) {
      return Array.from({ length: laneCount }, () => null)
    }
    const pickRandom = () => customerImages[Math.floor(Math.random() * customerImages.length)]
    return Array.from({ length: laneCount }, () => pickRandom())
  }, [laneCount])

  return (
    <div className='center-panel'>
      {Array.from({ length: laneCount }, (_, i) => i + 1).map(laneIdx => {
        const isRamenHere = ramen !== null && ramen.currentLane === laneIdx
        const isTargetLane = ramen !== null && ramen.targetLane === laneIdx
        const baseImage = isRamenHere ? resolveBaseRamenImage(ramen) : ''
        const customerImage = laneCustomerImages[laneIdx-1]
        const clampedPosition = ramen ? 10 + (Math.min(100, Math.max(0, ramen.position)) / 100) * 80 : 10
        return (
          <div key={laneIdx} className="lane">
            <span className="lane-branch-label">
              {existingBrancheNames[laneIdx - 1]}
            </span>
            {isRamenHere && (
              <div
                className={`ramen-icon ${ramen.isPushReady ? 'ramen-icon-push-ready' : ''}`}
                style={{ left: `${clampedPosition}%` }}
              >
                <img src={baseImage} alt="ramen" className="ramen-image" />
                <div className="ramen-toppings">
                  {ramen.stagedItems.map((item) => {
                    const toppingImage = resolveToppingImage(item)
                    return toppingImage
                      ? <img key={item} src={toppingImage} alt={item} className="ramen-topping-image" />
                      : null
                  })}
                </div>
              </div>
            )}
            <div className="lane-customer">
              {customerImage && (
                <img
                  src={customerImage}
                  alt={`customer-lane-${laneIdx}`}
                  className={`lane-customer-image ${isTargetLane ? 'lane-customer-active' : ''}`}
                />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default GmLanePanelV2
