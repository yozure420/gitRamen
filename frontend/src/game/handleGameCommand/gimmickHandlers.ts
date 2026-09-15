import type { CommandStepType, Ramen } from '../../types/interface'
import type { GameCommandContext } from './types'

const AMEND_PATTERN = /^git\s+commit\s+--amend(?:\s+--no-edit|\s+-m\s*["“”＂][^"“”＂]*["“”＂])?\s*$/i
const RESET_SOFT_PATTERN = /^git reset --soft head(?:~1|\^)$/

function rejectWithMiss(ctx: GameCommandContext, message: string): true {
  ctx.recordMiss(ctx.activeRamen)
  ctx.setMessage(message)
  ctx.clearInput()
  return true
}

/**
 * ギミック系コマンド共通の事前チェック。
 * 対象ラーメンがあり、今の手順が stepType のときだけ ramen を返す（それ以外は処理済み）。
 */
function resolveGimmickTarget(ctx: GameCommandContext, stepType: CommandStepType): Ramen | null {
  if (!ctx.activeRamen) {
    ctx.setMessage('❌ 操作できるラーメンがありません')
    ctx.clearInput()
    return null
  }
  if (!ctx.currentStep) {
    rejectWithMiss(ctx, '❌ この丼の手順はもう終わっています。git push で届けてください')
    return null
  }
  if (ctx.rejectOutOfOrder(stepType)) return null
  return ctx.activeRamen
}

function withNext(ctx: GameCommandContext, ramen: Ramen, message: string): string {
  const nextStep = ctx.getNextStepCommand(ramen)
  return nextStep ? `${message}。次: ${nextStep}` : message
}

export function handleStashListCommand(ctx: GameCommandContext): boolean {
  if (ctx.normalizedCmd !== 'git stash list') return false

  const ramen = ctx.activeRamen
  ctx.setMessage(ramen?.isStashed
    ? `📦 stash@{0}: 作りかけの丼（${ramen.stashedItems.join('・')}）`
    : '📦 退避中の丼はありません')
  ctx.clearInput()
  return true
}

export function handleStashCommand(ctx: GameCommandContext): boolean {
  if (ctx.normalizedCmd !== 'git stash' && ctx.normalizedCmd !== 'git stash push') return false

  const ramen = resolveGimmickTarget(ctx, 'stash')
  if (!ramen) return true
  if (ramen.isStashed) return rejectWithMiss(ctx, '❌ 既に丼を退避中です。先に git stash pop してください')
  if (ramen.stagedItems.length === 0) return rejectWithMiss(ctx, '❌ 退避する具材がありません')

  ctx.completeCurrentStep(ramen, {
    message: withNext(ctx, ramen, '📦 作りかけの丼を退避しました'),
    update: (current) => ({ isStashed: true, stashedItems: [...current.stagedItems], stagedItems: [] }),
  })
  return true
}

export function handleStashPopCommand(ctx: GameCommandContext): boolean {
  if (ctx.normalizedCmd !== 'git stash pop') return false

  const ramen = resolveGimmickTarget(ctx, 'stash_pop')
  if (!ramen) return true
  if (!ramen.isStashed) return rejectWithMiss(ctx, '❌ 退避中の丼がありません')

  ctx.completeCurrentStep(ramen, {
    message: withNext(ctx, ramen, '📤 退避していた丼を戻しました'),
    // 戻した具材は未コミットの変更なので、もう一度 commit が必要になる
    update: (current) => ({
      isStashed: false,
      stashedItems: [],
      stagedItems: Array.from(new Set([...current.stagedItems, ...current.stashedItems])),
      isCommitted: false,
    }),
  })
  return true
}

export function handleResetSoftCommand(ctx: GameCommandContext): boolean {
  if (!RESET_SOFT_PATTERN.test(ctx.normalizedCmd)) return false

  const ramen = resolveGimmickTarget(ctx, 'reset_soft')
  if (!ramen) return true
  if (!ramen.isCommitted) return rejectWithMiss(ctx, '❌ 取り消すコール（コミット）がありません')

  ctx.completeCurrentStep(ramen, {
    message: withNext(ctx, ramen, '↩️ 直前のコールを取り消しました（具材はそのまま）'),
    update: () => ({ isCommitted: false }),
  })
  return true
}

export function handleAmendCommand(ctx: GameCommandContext): boolean {
  if (!AMEND_PATTERN.test(ctx.cmd)) return false

  const ramen = resolveGimmickTarget(ctx, 'amend')
  if (!ramen) return true
  if (!ramen.isCommitted) return rejectWithMiss(ctx, '❌ 上書きするコール（コミット）がありません')

  ctx.completeCurrentStep(ramen, {
    message: withNext(ctx, ramen, '✏️ 注文変更を直前のコールに上書きしました'),
    update: () => ({ isCommitted: true }),
  })
  return true
}
