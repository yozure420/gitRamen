import { useMemo } from 'react'
import type { Ramen } from '../../types/interface'

const assetModules = import.meta.glob('../../assets/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>

const customerImageModules = import.meta.glob('../../img/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>

const assetByName = Object.fromEntries(
  Object.entries(assetModules).map(([path, url]) => {
    const name = path.split('/').pop() ?? path
    return [name, url]
  })
) as Record<string, string>

const customerImages = Object.values(customerImageModules)

const baseRamenImageByKeyword: Record<string, string> = {
  '味噌': 'ramen-miso.png',
  '醤油': 'ramen-shoyu.png',
  '豚骨': 'ramen-tonkotsu.png',
  '家系': 'food-ramen-iekei.png',
  '台湾': 'ramen-taiwan.png',
  'タンメン': 'food-ramen-tanmen.png',
  'トムヤム': 'food-ramen-tom-yam-kung.png',
  'つけ麺': 'food-tsukemen.png',
  '油そば': 'food-aburasoba.png',
  '一色': 'food-ramen-ishiki.png'
}

const toppingImageByItem: Record<string, string> = {
  '煮玉子': 'food-ramen-topping-1-tamago.png',
  'ネギ': 'food-ramen-topping-2-negi.png',
  'のり': 'food-ramen-topping-4-nori.png',
  'チャーシュー': 'food-ramen-topping-5-chashu.png',
  'コーン': 'food-ramen-topping-6-corn.png',
  'もやし': 'food-ramen-topping-7-moyashi.png',
  'メンマ': 'food-ramen-topping-8-menma.png',
}

function resolveBaseRamenImage(ramen: Ramen): string {
  const haystack = [ramen.displayCommand, ramen.command.game_note, ramen.command.description]
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
}

function GmCenterPanel({ activeRamen, getLaneRamens, laneCount }: GmCenterPanelProps) {
  const laneCustomerImages = useMemo(() => {
    if (customerImages.length === 0) {
      return Array.from({ length: laneCount }, () => null)
    }

    const pickRandom = () => customerImages[Math.floor(Math.random() * customerImages.length)]
    return Array.from({ length: laneCount }, () => pickRandom())
  }, [laneCount])

  return (
    <div className="center-panel">
      {Array.from({ length: laneCount }, (_, i) => i + 1).map(laneNum => {
        const laneRamens = getLaneRamens(laneNum)
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
            </div>
            <div className="lane-number">Lane {laneNum}</div>
          </div>
        )
      })}
    </div>
  )
}
export default GmCenterPanel