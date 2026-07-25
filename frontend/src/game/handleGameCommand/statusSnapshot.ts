import type { Ramen } from '../../types/interface'

export type StatusSnapshot = {
  phaseMessage: string
  details: string[]
}

export function buildStatusSnapshot(ramen: Ramen): StatusSnapshot {
  const requiredItems = ramen.steps
    .filter(step => step.type === 'add' && step.itemName)
    .map(step => step.itemName as string)
  const uniqueItems = Array.from(new Set([...requiredItems, ...ramen.stagedItems]))

  const phaseMessage = (() => {
    if (ramen.stagedItems.length === 0) {
      return '厨房の状態: まだ具材が選ばれていません！ git add で具材を乗せてください。'
    }

    if (!ramen.isCommitted) {
      return '厨房の状態: 具材は乗っています！ あとは git commit -m で注文を確定させてください。'
    }

    if (!ramen.isPushed) {
      return '厨房の状態: 調理完了！ 爆速で git push してお客さんに届けてください！'
    }

    return '厨房の状態: 配達中です。無事に届くか見守りましょう。'
  })()

  const itemDetails = uniqueItems.length > 0
    ? uniqueItems.map(item => `具材：[${item}] (${ramen.stagedItems.includes(item) ? '投入済み' : '未投入'})`)
    : ['具材：[なし] (未投入)']

  return {
    phaseMessage,
    details: [
      `対象ラーメン: #${ramen.id} / Lane${ramen.currentLane} -> Lane${ramen.targetLane}`,
      `isCommitted: ${ramen.isCommitted ? 'true' : 'false'}`,
      `isPushed: ${ramen.isPushed ? 'true' : 'false'}`,
      ...itemDetails,
    ],
  }
}
