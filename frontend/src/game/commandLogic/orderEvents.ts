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
  3: { stash: 0.12, reset_soft: 0.12, amend: 0.12, reflog: 0.2, bisect: 0.2 },
  4: { stash: 0.08, reset_soft: 0.08, amend: 0.08, reflog: 0.12, bisect: 0.12, plumbing: 0.3 },
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

/** 画面表示用の短縮コミットハッシュ（7桁） */
export function createFakeHash(): string {
  return Math.floor(Math.random() * 0x10000000).toString(16).padStart(7, '0')
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
export function buildCookingSteps(
  event: OrderEventType,
  params: { meta: OrderMeta; laneLabel: string; branchName: string },
): CommandStep[] {
  const { meta, laneLabel, branchName } = params

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
    case 'reflog': {
      return [
        createAddStep(meta.topping, laneLabel),
        createCommitStep(meta.call, laneLabel),
        createStep({
          type: 'command',
          displayCommand: 'git reflog',
          logicLabel: '履歴を探す',
          logicDescription: '消える前のコミットを reflog で探す。',
          // この手順に入った瞬間、新人の reset --hard で丼（コミット）が消える
          onEnter: 'drop_bowl',
          eventNotice: {
            title: '丼が消えた！',
            message: '「すみません大将…git reset --hard で丼を片付けちゃいました！」',
            details: [
              'コールした丼（コミット）が消えてしまった',
              'git reflog で消える前の履歴 HEAD@{1} を見つける',
              'git reset --hard HEAD@{1} で丼を復元してから届ける',
            ],
          },
        }),
        createStep({
          type: 'reset_hard_restore',
          displayCommand: 'git reset --hard HEAD@{1}',
          logicLabel: '丼を復元',
          logicDescription: 'reflog で見つけたコミットに戻して丼を復元する。',
        }),
      ]
    }
    case 'bisect': {
      const goodHash = createFakeHash()
      const culpritHash = createFakeHash()
      return [
        createStep({
          type: 'command',
          displayCommand: 'git bisect start',
          logicLabel: '犯人探し開始',
          logicDescription: 'どの仕込みからスープがまずくなったか二分探索を始める。',
          eventNotice: {
            title: 'スープがまずい！',
            message: '「昨日の仕込みから味がおかしい…どのコミットで壊れた？」',
            details: [
              'git bisect start で二分探索を開始',
              'git bisect bad で今のスープはまずいと記録',
              `git bisect good ${goodHash} で美味しかった仕込みを記録`,
              'git bisect reset で探索を終えてから調理する',
            ],
          },
        }),
        createStep({
          type: 'command',
          displayCommand: 'git bisect bad',
          expectedInputs: ['git bisect bad', 'git bisect bad HEAD'],
          logicLabel: '今はまずい',
          logicDescription: '現在のスープはまずい（bad）と記録する。',
        }),
        createStep({
          type: 'command',
          displayCommand: `git bisect good ${goodHash}`,
          logicLabel: '昔はうまい',
          logicDescription: `${goodHash} の仕込みは美味しかった（good）と記録する。`,
        }),
        createStep({
          type: 'command',
          displayCommand: 'git bisect reset',
          logicLabel: '犯人探し終了',
          logicDescription: '二分探索を終えて元のレーンに戻る。',
          eventNotice: {
            title: '犯人判明！',
            message: `${culpritHash} が最初のまずいコミット（塩の入れすぎ）でした`,
            details: [
              'git bisect reset で探索を終了',
              `その後 git add ${meta.topping} → git commit で作り直して届ける`,
            ],
          },
        }),
        createAddStep(meta.topping, laneLabel),
        createCommitStep(meta.call, laneLabel),
      ]
    }
    case 'plumbing': {
      const treeHash = createFakeHash()
      const commitHash = createFakeHash()
      return [
        createAddStep(meta.topping, laneLabel),
        createStep({
          type: 'command',
          displayCommand: 'git write-tree',
          logicLabel: 'ツリーを作る',
          logicDescription: 'ステージの具材からツリーオブジェクトを作る。',
          eventNotice: {
            title: '親方の検品！',
            message: '「今日は porcelain 禁止だ。plumbing で仕上げてみろ」',
            details: [
              `git write-tree でツリー ${treeHash} を作る`,
              `git commit-tree ${treeHash} -p HEAD -m "${meta.call}" でコミットを手作り（メッセージは自由）`,
              `git update-ref refs/heads/${branchName} ${commitHash} でブランチに貼る`,
            ],
          },
        }),
        createStep({
          type: 'commit_tree',
          displayCommand: `git commit-tree ${treeHash} -p HEAD -m "${meta.call}"`,
          logicLabel: 'コミットを手作り',
          logicDescription: `ツリー ${treeHash} から、親を HEAD にしたコミットを作る。`,
        }),
        createStep({
          type: 'update_ref',
          displayCommand: `git update-ref refs/heads/${branchName} ${commitHash}`,
          logicLabel: 'ブランチに貼る',
          logicDescription: `できたコミット ${commitHash} を ${branchName} ブランチに記録する。`,
        }),
      ]
    }
    case 'standard':
    default:
      return [createAddStep(meta.topping, laneLabel), createCommitStep(meta.call, laneLabel)]
  }
}
