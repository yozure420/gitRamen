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
  const addMatch = ctx.cmd.match(/^git\s+add\s+(.+)$/i)
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
      message: nextStep ? `✅ 全マシ全のせ！ 次: ${nextStep}` : '✅ 全マシ全のせ！',
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
      message: nextStep ? `✅ ${item}を追加しました。次: ${nextStep}` : `✅ ${item}を追加しました`,
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
  const commitMatch = ctx.cmd.match(/^git\s+commit\s+-m\s*"([^"]+)"\s*$/i)
  if (!commitMatch) return false

  if (!ctx.activeRamen) {
    ctx.setMessage('❌ 操作できるラーメンがありません')
    ctx.clearInput()
    return true
  }

  if (ctx.rejectOutOfOrder('commit')) return true

  const callText = commitMatch[1]
  const expectedCmd = ctx.currentStep?.displayCommand ?? ''
  const expectedMatch = expectedCmd.match(/-m\s*"([^"]+)"/i)
  const expectedMessage = expectedMatch ? expectedMatch[1] : ''

  if (callText !== expectedMessage) {
    ctx.recordMiss(ctx.activeRamen)
    ctx.setMessage(`❌ メッセージが違います。正解は "${expectedMessage}" です`)
    ctx.clearInput()
    return true
  }

  const nextStep = ctx.getNextStepCommand(ctx.activeRamen)
  ctx.completeCurrentStep(ctx.activeRamen, {
    message: nextStep ? `🍜 ${callText} 次: ${nextStep}` : `🍜 ${callText}`,
    update: () => ({ isCommitted: true }),
  })
  return true
}

export function handlePushCommand(ctx: GameCommandContext): boolean {
  // git push / git push origin branch / git push -u origin branch の全パターンを柔軟に解析
  const pushMatch = ctx.cmd.match(/^git\s+push(?:\s+(-u))?(?:\s+origin\s+([^\s]+))?\s*$/i)
  if (!pushMatch) return false

  if (!ctx.activeRamen) {
    ctx.setMessage('❌ 配達できるラーメンがありません')
    ctx.clearInput()
    return true
  }

  if (!ctx.activeRamen.isCommitted) {
    ctx.recordMiss(ctx.activeRamen)
    ctx.setMessage('❌ まだコミットされていません！先に git commit を行ってください')
    ctx.clearInput()
    return true
  }

  const hasUpstreamOption = !!pushMatch[1]
  let targetBranch = pushMatch[2] ? pushMatch[2].trim() : ''

  // プレイヤーが今物理的にいるレーンのブランチ名を取得
  const currentBranchName = ctx.existingBranches[ctx.activeRamen.currentLane - 1] || 'main'

  // 👇 修正：もしブランチ名が省略されていたら、今いるブランチ(currentBranchName)を自動セット！
  if (!targetBranch) {
    targetBranch = currentBranchName
  }

  // push先と、今いるブランチ（checkout先）が一致しているか厳しくチェック
  if (normalizeCommand(targetBranch) !== normalizeCommand(currentBranchName)) {
    ctx.setMessage(`❌ 今いるのは ${currentBranchName} です。${targetBranch} に push するには、先に ${targetBranch} ブランチに移動してください！`)
    ctx.clearInput()
    return true
  }

  const targetLaneName = ctx.existingBranches[ctx.activeRamen.targetLane - 1] || 'main'
  const pushedToMainFromOtherLane = (normalizeCommand(targetBranch) === 'main' && normalizeCommand(targetLaneName) !== 'main')

  // 内部の手順に囚われず、コミットされていれば確実にクリアさせる
  ctx.setRamens(prev => prev.map(r => {
    if (r.id !== ctx.activeRamen?.id) return r
    return {
      ...r,
      currentStepIndex: r.steps.length,
      speed: ctx.pushSpeed,
      isPushed: true,
      pushedToMainFromOtherLane,
    }
  }))

  ctx.setMessage(hasUpstreamOption 
    ? `🚀 [Upstream] push 完了！追跡ブランチを設定しました！`
    : '🚀 push 完了！お客さんのところへ急げーー！！'
  )
  ctx.clearInput()
  return true
}