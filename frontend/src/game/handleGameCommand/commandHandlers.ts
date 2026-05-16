import { normalizeCommand } from './helpers'
import type { GameCommandContext } from './types'

export function handlePullCommand(ctx: GameCommandContext): boolean {
  if (ctx.normalizedCmd !== 'git pull') return false

  if (ctx.activeRamen) {
    ctx.setMessage('⚠️ 既に調理中の注文があります。先にこの一杯を届けてください')
    ctx.clearInput()
    return true
  }

  const pullMessage = ctx.onPullOrder()
  ctx.setMessage(pullMessage)
  ctx.clearInput()
  return true
}

export function handleCloneCommand(ctx: GameCommandContext): boolean {
  if (!ctx.cmd.match(/^git clone .+$/i)) return false

  ctx.setMessage('⛔ git clone はゲーム開始前の難易度選択専用です')
  ctx.clearInput()
  return true
}

export function handleAddCommand(ctx: GameCommandContext): boolean {
  const addMatch = ctx.cmd.match(/^git add (.+)$/i)
  if (!addMatch) return false

  if (!ctx.activeRamen) {
    ctx.setMessage('❌ 操作できるラーメンがありません')
    ctx.clearInput()
    return true
  }

  if (ctx.rejectOutOfOrder('add')) return true

  const item = addMatch[1].trim()
  const nextStep = ctx.getNextStepCommand(ctx.activeRamen)

  if (!ctx.isCurrentStepMatch(ctx.activeRamen, ctx.normalizedCmd)) {
    ctx.recordMiss(ctx.activeRamen)
    ctx.setMessage(`❌ 今必要なのは「${ctx.currentStep?.displayCommand ?? ''}」です`)
    ctx.clearInput()
    return true
  }

  if (item === '.') {
    ctx.completeCurrentStep(ctx.activeRamen, {
      message: nextStep
        ? `✅ 全マシ全のせ！ 次: ${nextStep}`
        : '✅ 全マシ全のせ！',
      update: () => ({ stagedItems: [...ctx.availableItems] }),
    })
    return true
  }

  if (ctx.availableItems.includes(item)) {
    if (ctx.activeRamen.stagedItems.includes(item)) {
      ctx.setMessage(`⚠️ ${item}は既に追加されています`)
      ctx.clearInput()
      return true
    }

    ctx.completeCurrentStep(ctx.activeRamen, {
      message: nextStep
        ? `✅ ${item}を追加しました。次: ${nextStep}`
        : `✅ ${item}を追加しました`,
      update: (current) => ({ stagedItems: [...current.stagedItems, item] }),
    })
    return true
  }

  ctx.recordMiss(ctx.activeRamen)
  ctx.setMessage(`❌ ${item}という具材はありません`)
  ctx.clearInput()
  return true
}

export function handleCommitCommand(ctx: GameCommandContext): boolean {
  const commitMatch = ctx.cmd.match(/^git commit -m "(.+)"$/i)
  if (!commitMatch) return false

  if (!ctx.activeRamen) {
    ctx.setMessage('❌ 操作できるラーメンがありません')
    ctx.clearInput()
    return true
  }

  if (ctx.rejectOutOfOrder('commit')) return true

  if (!ctx.isCurrentStepMatch(ctx.activeRamen, ctx.normalizedCmd)) {
    ctx.recordMiss(ctx.activeRamen)
    ctx.setMessage(`❌ 今必要な commit は「${ctx.currentStep?.displayCommand ?? ''}」です`)
    ctx.clearInput()
    return true
  }

  const callText = commitMatch[1]
  const nextStep = ctx.getNextStepCommand(ctx.activeRamen)
  ctx.completeCurrentStep(ctx.activeRamen, {
    message: nextStep
      ? `🍜 ${callText} 次: ${nextStep}`
      : `🍜 ${callText}`,
    update: () => ({ isCommitted: true }),
  })
  return true
}

export function handlePushCommand(ctx: GameCommandContext): boolean {
  const pushMatch = ctx.cmd.match(/^git push origin (.+)$/i)
  if (!pushMatch) return false

  if (!ctx.activeRamen) {
    ctx.setMessage('❌ 配達できるラーメンがありません')
    ctx.clearInput()
    return true
  }

  const targetBranch = pushMatch[1].trim()
  const currentBranchName = ctx.existingBranches[ctx.activeRamen.currentLane - 1] || 'main'

  if (normalizeCommand(targetBranch) !== normalizeCommand(currentBranchName)) {
    ctx.setMessage(`❌ 今いるのは ${currentBranchName} です。${targetBranch} に push するには、先に ${targetBranch} ブランチに移動してください！`)
    ctx.clearInput()
    return true
  }

  const pushedToMainFromOtherLane = false
  const isCurrentPushStep = ctx.currentStep?.type === 'push' && ctx.isCurrentStepMatch(ctx.activeRamen, ctx.normalizedCmd)

  if (isCurrentPushStep) {
    ctx.completeCurrentStep(ctx.activeRamen, {
      scoreDelta: 0,
      message: '🚀 push 完了！お客さんのところへ急げーー！！',
      update: () => ({ speed: ctx.pushSpeed, isPushed: true, pushedToMainFromOtherLane }),
    })
    return true
  }

  ctx.setRamens(prev => prev.map(r => {
    if (r.id !== ctx.activeRamen?.id) return r
    return {
      ...r,
      speed: ctx.pushSpeed,
      isPushed: true,
      pushedToMainFromOtherLane,
    }
  }))

  if (!ctx.activeRamen.isCommitted) {
    ctx.recordMiss(ctx.activeRamen)
    ctx.setMessage('💢 トッピングはどうした💢 空のまま push してしまった！')
  } else {
    ctx.setMessage('🚀 push を実行！ものすごい勢いで流れていく！')
  }

  ctx.clearInput()
  return true
}
