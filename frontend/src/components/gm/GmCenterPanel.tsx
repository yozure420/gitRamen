import { useMemo } from 'react'
import type { Ramen } from '../../interface'

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

const baseRamenImageNames = [
  'food-ramen.png',
  'food-aburasoba.png',
  'food-tsukemen.png',
  'food-ramen-iekei.png',
  'food-ramen-tanmen.png',
  'food-ramen-ishiki.png',
  'food-ramen-tom-yam-kung.png',
  'ramen-tonkotsu.png',
  'ramen-shoyu.png',
  'ramen-miso.png',
  'ramen-taiwan.png',
] as const

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
  const baseName = baseRamenImageNames[ramen.command.id % baseRamenImageNames.length]
  return assetByName[baseName] ?? assetByName['food-ramen.png'] ?? ''
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
                <div
                  key={ramen.id}
                  className={`ramen-icon ${isActive ? 'ramen-icon-active' : ''} ${ramen.isPushReady ? 'ramen-icon-push-ready' : ''}`}
                  style={{ left: `${clampedPosition}%` }}
                >
                  {baseImage ? (
                    <img
                      src={baseImage}
                      alt="ramen"
                      className={`ramen-image ${isActive ? 'ramen-image-active' : ''}`}
                    />
                  ) : (
                    <span className="ramen-fallback">🍜</span>
                  )}
                  <div className="ramen-toppings">
                    {ramen.stagedItems.map((item) => {
                      const toppingImage = resolveToppingImage(item)
                      if (!toppingImage) return null
                      return (
                        <img
                          key={`${ramen.id}-${item}`}
                          src={toppingImage}
                          alt={item}
                          className="ramen-topping-image"
                        />
                      )
                    })}
                  </div>
                  {isActive && (
                    <>
                      {ramen.isPushReady ? (
                        <div className="ramen-push-badge">🚀 git push origin main！</div>
                      ) : (
                        <div className="ramen-command-badge">📝 {ramen.displayCommand}</div>
                      )}
                      <div className="ramen-active-badge">⭐操作中</div>
                    </>
                  )}
                </div>
              )
            })}

            <div className="lane-customer">
              {laneCustomerImages[laneNum - 1] ? (
                <img
                  src={laneCustomerImages[laneNum - 1] ?? undefined}
                  alt={`customer-lane-${laneNum}`}
                  className="lane-customer-image"
                />
              ) : (
                <span>👤</span>
              )}
            </div>
            <div className="lane-number">Lane {laneNum}</div>
          </div>
        )
      })}
    </div>
  )
}

export default GmCenterPanel
