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
    }
) as Record<string, string>

/** パス： 客画像URL というプロパティを集めたオブジェクト。*/
const customerAssetModules = import.meta.glob('../../assets/human/*.png', {
    eager: true,
    import: 'default',
    }
) as Record<string, string>

function prunePathToName<V>(
    record: Record<string, V>
): Record<string, V> {
    return Object.fromEntries(
        Object.entries(record).map(([path, url]) => {
            const name = path.split('/').pop() ?? path
            return [name, url]
        })
    )
}
/** ラーメンについて、画像名：URLというプロパティを集めたオブジェクト。*/
const fileNameToRamenImage = prunePathToName(ramenAssetModules)

/** トッピングについて、画像名：URLというプロパティを集めたオブジェクト。*/
const fineNameToToppingImage = prunePathToName(toppingAssetModules)

const customerImages = Object.values(prunePathToName(customerAssetModules))

/** ラーメンについて、日本語キーワードと画像名を対応させたオブジェクト。 */
const keywordToRamenImage: Record<string, string> = {
    '仮キーワード': 'ramen-pixel.png'
}

/** トッピングについて、日本語キーワード(ネギ）と画像名(foo.png)を対応させたオブジェクト。 */
const keywordToToppingImage: Record<string, string> = {
    '煮玉子': 'food-ramen-topping-1-tamago.png',
    'ネギ': 'food-ramen-topping-2-negi.png',
    'のり': 'food-ramen-topping-4-nori.png',
    'チャーシュー': 'food-ramen-topping-5-chashu.png',
    'コーン': 'food-ramen-topping-6-corn.png',
    'もやし': 'food-ramen-topping-7-moyashi.png',
    'メンマ': 'food-ramen-topping-8-menma.png',
    'ナルト': 'food-ramen-topping-10-naruto.png',
}

/**
 * 受け取ったラーメンに対応するラーメンの画像のURLを返す。
 * 
 * @param ramen 
 * @returns ラーメンの画像URL
 */
function resolveBaseRamenImage(ramen: Ramen): string {
    const haystack = [ramen.displayCommand, ramen.command.game_note, ramen.command.description]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
  
    const matchedImage = Object.entries(keywordToRamenImage).find(([keyword]) => {
      return haystack.includes(keyword.toLowerCase())
    })?.[1]　
  
    return fileNameToRamenImage[matchedImage ?? 'ramen-pixel.png'] ?? fileNameToRamenImage['ramen-pixel.png'] ?? ''
}

/**
 * 受け取った日本語トッピング名に対応するトッピングの画像のURLを返す。
 * 
 * @param topping 日本語トッピング名
 * @returns トッピングの画像URL
 */
function resolveToppingImage(topping: string): string | null {
    const fileName = keywordToToppingImage[topping]
    if (!fileName) return null
    return fineNameToToppingImage[fileName] ?? null
}

/** LanePanelに必要な情報。 */
type GmLanePanelV2Props = {
    ramen: Ramen | null
    existingBrancheNames: string[]
}

function GmLanePanelV2({
    ramen,
    existingBrancheNames
}: GmLanePanelV2Props) {
    const laneCount = existingBrancheNames.length
    const laneCustomerImages = useMemo(() => {　// 第二引数が変化したら第一引数の計算を行う。
        // イメージがない場合は、ひとまず枠だけ作る。[null, null, null,,,,]
        if (customerImages.length === 0) {
          return Array.from({ length: laneCount }, () => null)
        }
        //　イメージがある場合、ランダムに画像を選択する関数を定義し、そこからlaneの数だけランダムに画像を選択して配列を作る。
        const pickRandom = () => customerImages[Math.floor(Math.random() * customerImages.length)]
    
        return Array.from({ length: laneCount }, () => pickRandom())
      }, [laneCount])

    return (
        <div className='center-panel'>
            {Array.from({ length: laneCount }, (_, i) => i + 1).map(laneIdx => {
                /** ラーメンは現在のレーンにいるか？ */
                const isRamenHere = ramen !== null && ramen.currentLane === laneIdx
                /** 現在のレーンはラーメンの目的地か？ */
                const isTargetLane = ramen !== null && ramen.targetLane === laneIdx
                const baseImage = isRamenHere ? resolveBaseRamenImage(ramen) : ''
                const customerImage = laneCustomerImages[laneIdx-1]
                const clampedPosition = ramen ? 10 + (Math.min(100, Math.max(0, ramen.position)) / 100) * 80 : 10
                return (
                    <div key={laneIdx} className="lane">
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




