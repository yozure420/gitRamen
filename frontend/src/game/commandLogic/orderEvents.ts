import type { CommandStep } from '../../types/interface'
import { pickRandomBaseRamen, pickRandomTopping } from './randomCatalog'
import { createStep } from './stepFactory'
import type { OrderEventType } from './types'

export type OrderMeta = {
  baseRamen: string
  topping: string
  call: string
}

/**
 * コースごとのギミック出現確率（残りの確率は通常注文）。
 * 定義のないコースは、それ以下で最も近いコースの設定を引き継ぐ。
 */
export const ORDER_EVENT_RATES: Record<number, Partial<Record<Exclude<OrderEventType, 'standard'>, number>>> = {
  1: {},
  2: { stash: 0.2, reset_soft: 0.2, amend: 0.2 },
}

/** E2E テストなどから特定のギミックを強制するためのグローバルキー */
export const FORCE_ORDER_EVENT_KEY = '__GITRAMEN_FORCE_ORDER_EVENT__'

function resolveEventRates(course: number) {
  const definedLevels = Object.keys(ORDER_EVENT_RATES).map(Number).filter(level => level <= course)
  const level = definedLevels.length > 0 ? Math.max(...definedLevels) : 1
  return ORDER_EVENT_RATES[level]
}

export function getAvailableOrderEvents(course: number): OrderEventType[] {
  return ['standard', ...(Object.keys(resolveEventRates(course)) as OrderEventType[])]
}

export function readForcedOrderEvent(course: number): OrderEventType | null {
  const forced = (globalThis as Record<string, unknown>)[FORCE_ORDER_EVENT_KEY]
  if (typeof forced !== 'string') return null
  const available = getAvailableOrderEvents(course)
  return available.includes(forced as OrderEventType) ? forced as OrderEventType : null
}

export function pickOrderEvent(course: number, rng: () => number = Math.random): OrderEventType {
  const roll = rng()
  let threshold = 0
  for (const [event, rate] of Object.entries(resolveEventRates(course))) {
    threshold += rate ?? 0
    if (roll < threshold) return event as OrderEventType
  }
  return 'standard'
}

export function createOrderMeta(): OrderMeta {
  const baseRamen = pickRandomBaseRamen()
  const topping = pickRandomTopping()
  return { baseRamen, topping, call: `${baseRamen}${topping}入りおまち！` }
}

function pickOtherValue(pick: () => string, excluded: string, fallback: string): string {
  for (let i = 0; i < 20; i++) {
    const value = pick()
    if (value !== excluded) return value
  }
  return fallback
}

function createAddStep(topping: string, laneLabel: string, eventNotice?: CommandStep['eventNotice']): CommandStep {
  return createStep({
    type: 'add',
    displayCommand: `git add ${topping}`,
    logicLabel: `${laneLabel}調理`,
    logicDescription: `${laneLabel}注文の具材「${topping}」を投入。`,
    itemName: topping,
    eventNotice,
  })
}

function createCommitStep(call: string, laneLabel: string): CommandStep {
  return createStep({
    type: 'commit',
    displayCommand: `git commit -m "${call}"`,
    logicLabel: `${laneLabel}確定`,
    logicDescription: `${laneLabel}注文をコミットで確定する。`,
  })
}

/** 注文の調理部分（push 手前まで）のステップ列をギミックに応じて組み立てる */
export function buildCookingSteps(event: OrderEventType, params: { meta: OrderMeta; laneLabel: string }): CommandStep[] {
  const { meta, laneLabel } = params

  switch (event) {
    case 'stash': {
      const regularTopping = pickOtherValue(pickRandomTopping, meta.topping, meta.topping === 'ネギ' ? 'のり' : 'ネギ')
      return [
        createAddStep(meta.topping, laneLabel),
        createStep({
          type: 'stash',
          displayCommand: 'git stash',
          expectedInputs: ['git stash', 'git stash push'],
          logicLabel: '作りかけを退避',
          logicDescription: `作りかけの丼（${meta.topping}）を git stash で一時退避する。`,
          eventNotice: {
            title: '常連さんの割り込み！',
            message: `「大将、いつもの${regularTopping}のせ急ぎで！」`,
            details: [
              '1. git stash で作りかけの丼を退避',
              `2. git add ${regularTopping} → git commit で常連さんの分を先に確定`,
              '3. git stash pop で作りかけを戻して仕上げる',
            ],
          },
        }),
        createAddStep(regularTopping, '割り込み'),
        createCommitStep(`常連さんの${regularTopping}のせおまち！`, '割り込み'),
        createStep({
          type: 'stash_pop',
          displayCommand: 'git stash pop',
          logicLabel: '作りかけを復帰',
          logicDescription: '退避していた丼を git stash pop で戻す。',
        }),
        createCommitStep(meta.call, laneLabel),
      ]
    }
    case 'reset_soft': {
      const wrongBase = pickOtherValue(pickRandomBaseRamen, meta.baseRamen, meta.baseRamen === '味噌ラーメン' ? '醤油ラーメン' : '味噌ラーメン')
      const wrongCall = `${wrongBase}${meta.topping}入りおまち！`
      return [
        createAddStep(meta.topping, laneLabel),
        createStep({
          type: 'commit',
          displayCommand: `git commit -m "${wrongCall}"`,
          logicLabel: 'コール（言い間違い）',
          logicDescription: `うっかり「${wrongBase}」とコールしてしまう。`,
        }),
        createStep({
          type: 'reset_soft',
          displayCommand: 'git reset --soft HEAD~1',
          expectedInputs: ['git reset --soft HEAD~1', 'git reset --soft HEAD^'],
          logicLabel: 'コール取り消し',
          logicDescription: '直前のコミットだけを取り消し、具材はステージに残す。',
          eventNotice: {
            title: 'コール間違い！',
            message: `「${wrongCall}」…注文は${meta.baseRamen}だった！`,
            details: [
              'git reset --soft HEAD~1 で直前のコールだけ取り消す（具材はそのまま）',
              `git commit -m "${meta.call}" で正しくコールし直す`,
            ],
          },
        }),
        createCommitStep(meta.call, laneLabel),
      ]
    }
    case 'amend': {
      const extraTopping = pickOtherValue(pickRandomTopping, meta.topping, meta.topping === 'ネギ' ? 'のり' : 'ネギ')
      return [
        createAddStep(meta.topping, laneLabel),
        createCommitStep(meta.call, laneLabel),
        createAddStep(extraTopping, '注文変更', {
          title: '注文変更！',
          message: `「すいません、やっぱり${extraTopping}も追加で！」`,
          details: [
            `git add ${extraTopping} で具材を追加`,
            'git commit --amend で直前のコールを上書き（普通の git commit はミス）',
          ],
        }),
        createStep({
          type: 'amend',
          displayCommand: 'git commit --amend',
          expectedInputs: ['git commit --amend', 'git commit --amend --no-edit'],
          logicLabel: 'コール上書き',
          logicDescription: '追加した具材を直前のコミットに含めて上書きする。',
        }),
      ]
    }
    case 'standard':
    default:
      return [createAddStep(meta.topping, laneLabel), createCommitStep(meta.call, laneLabel)]
  }
}
