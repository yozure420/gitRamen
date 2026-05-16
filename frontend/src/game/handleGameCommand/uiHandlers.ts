import type { GameCommandContext } from './types'
import { buildStatusSnapshot } from './statusSnapshot'

export function handleHelpCommand(ctx: GameCommandContext): boolean {
  if (ctx.normalizedCmd !== 'git help') return false

  const nextShow = !ctx.showHelp
  ctx.setShowHelp(nextShow)
  ctx.setIsPaused(nextShow)
  ctx.setMessage(nextShow ? '💡 ヒントを表示（一時停止中）' : 'ヒントを非表示')
  ctx.clearInput()
  return true
}

export function handleLogCommand(ctx: GameCommandContext): boolean {
  if (ctx.normalizedCmd !== 'git log') return false

  if (ctx.activeRamen && ctx.isCurrentStepMatch(ctx.activeRamen, ctx.normalizedCmd)) {
    const nextStep = ctx.getNextStepCommand(ctx.activeRamen)
    ctx.completeCurrentStep(ctx.activeRamen, {
      message: nextStep
        ? `📜 注文履歴を表示。次: ${nextStep}`
        : '📜 注文履歴を表示',
    })
  } else {
    ctx.setMessage('📜 注文履歴を表示')
    ctx.clearInput()
  }

  ctx.setIsPaused(false)
  ctx.setIsCompactLog(false)
  ctx.setShowLog(true)
  return true
}

export function handleLogOnelineCommand(ctx: GameCommandContext): boolean {
  if (ctx.normalizedCmd !== 'git lof --oneline' && ctx.normalizedCmd !== 'git log --oneline') return false

  if (ctx.activeRamen && ctx.isCurrentStepMatch(ctx.activeRamen, ctx.normalizedCmd)) {
    const nextStep = ctx.getNextStepCommand(ctx.activeRamen)
    ctx.completeCurrentStep(ctx.activeRamen, {
      message: nextStep
        ? `👋 おかえりでーす！レシート簡易表示。次: ${nextStep}`
        : '👋 おかえりでーす！レシート簡易表示',
    })
  } else {
    ctx.setMessage('🧾 レシート簡易表示')
    ctx.clearInput()
  }

  ctx.setIsPaused(false)
  ctx.setIsCompactLog(true)
  ctx.setShowLog(true)
  return true
}

export function handleStatusCommand(ctx: GameCommandContext): boolean {
  if (ctx.normalizedCmd !== 'git status') return false

  if (!ctx.activeRamen) {
    ctx.setMessage('📊 お腹すいた～')
    ctx.setStatusWindow({
      title: '伝票 / git status',
      phaseMessage: '厨房の状態: まだ調理中の注文がありません。',
      details: ['注文待機中'],
    })
    setTimeout(() => ctx.setStatusWindow(null), 2300)
    ctx.clearInput()
    return true
  }

  const { phaseMessage, details } = buildStatusSnapshot(ctx.activeRamen)

  ctx.setStatusWindow({
    title: '伝票 / git status',
    phaseMessage,
    details,
  })
  setTimeout(() => ctx.setStatusWindow(null), 2600)

  ctx.setMessage(`📊 状態確認: ${phaseMessage}`)
  if (ctx.isCurrentStepMatch(ctx.activeRamen, ctx.normalizedCmd)) {
    const nextStep = ctx.getNextStepCommand(ctx.activeRamen)
    ctx.completeCurrentStep(ctx.activeRamen, {
      message: nextStep
        ? `📊 状態確認完了。次: ${nextStep}`
        : '📊 状態確認完了',
    })
    return true
  }

  ctx.clearInput()
  return true
}
