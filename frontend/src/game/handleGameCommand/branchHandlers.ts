import type { GameCommandContext } from './types'

export function handleCheckoutCreateCommand(ctx: GameCommandContext): boolean {
  const checkoutBranchMatch = ctx.cmd.match(/^git\s+(?:checkout|switch)\s+-b\s+(.+)$/i)
  if (!checkoutBranchMatch) return false

  if (!ctx.activeRamen) {
    ctx.setMessage('❌ 操作できるラーメンがありません')
    ctx.clearInput()
    return true
  }

  const branchName = checkoutBranchMatch[1].trim()
  if (!branchName) {
    ctx.recordMiss(ctx.activeRamen)
    ctx.setMessage('❌ ブランチ名を入力してください')
    ctx.clearInput()
    return true
  }

  if (!ctx.isCurrentStepMatch(ctx.activeRamen, ctx.normalizedCmd)) {
    ctx.recordMiss(ctx.activeRamen)
    ctx.setMessage(`❌ 今は「${ctx.currentStep?.displayCommand ?? ''}」の番です`)
    ctx.clearInput()
    return true
  }

  if (ctx.getBranchLane(branchName) > 0) {
    ctx.recordMiss(ctx.activeRamen)
    ctx.setMessage(`❌ ${branchName} は既に存在します`)
    ctx.clearInput()
    return true
  }

  if (ctx.existingBranches.length >= ctx.maxLanes) {
    ctx.recordMiss(ctx.activeRamen)
    ctx.setMessage(`ℹ️ 既に最大レーン数（${ctx.maxLanes}）です。既存ブランチへ checkout してください`)
    ctx.clearInput()
    return true
  }

  const nextLane = ctx.existingBranches.length + 1
  
  // 👇 修正1: 以前の状態を確実に引き継ぎ、mainを先頭に固定して配列を更新する！
  ctx.setExistingBranches(prev => {
    // 万が一prevが空だったりmainが無かったりした場合のフェイルセーフ
    const safePrev = prev.length > 0 && prev[0] === 'main' ? prev : ['main', ...prev.filter(b => b !== 'main')]
    return [...safePrev, branchName]
  })
  ctx.setLaneCount(nextLane)

  const nextStep = ctx.getNextStepCommand(ctx.activeRamen)
  ctx.completeCurrentStep(ctx.activeRamen, {
    message: nextStep
      ? `🆕 ${branchName} を作成して Lane ${nextLane} へ切替。次: ${nextStep}`
      : `🆕 ${branchName} を作成して Lane ${nextLane} へ切替`,
    update: () => ({ currentLane: nextLane }),
  })
  return true
}

export function handleSwitchCheckoutCommand(ctx: GameCommandContext): boolean {
  const switchMatch = ctx.cmd.match(/^git\s+(switch|checkout)\s+(.+)$/i)
  if (!switchMatch) return false
  
  // -b オプションは上のハンドラーで処理するので弾く
  if (switchMatch[2].trim().startsWith('-b')) return false

  const branchName = switchMatch[2].trim()
  const targetLane = ctx.getBranchLane(branchName)

  if (targetLane <= 0) {
    ctx.recordMiss(ctx.activeRamen)
    ctx.setMessage(`❌ ${branchName} は存在しません。既存: ${ctx.toBranchListText()}`)
    ctx.clearInput()
    return true
  }

  if (!ctx.activeRamen) {
    ctx.setMessage('❌ 移動できるラーメンがありません')
    ctx.clearInput()
    return true
  }

  if (ctx.isCurrentStepMatch(ctx.activeRamen, ctx.normalizedCmd)) {
    const nextStep = ctx.getNextStepCommand(ctx.activeRamen)
    ctx.completeCurrentStep(ctx.activeRamen, {
      message: nextStep
        ? `🔀 ${branchName} (Lane ${targetLane}) へ切替。次: ${nextStep}`
        : `🔀 ${branchName} (Lane ${targetLane}) へ切替`,
      update: () => ({ currentLane: targetLane }),
    })
    return true
  }

  ctx.applyLaneSwitchWithoutStepAdvance(ctx.activeRamen, targetLane)
  ctx.setMessage(`🔀 ${branchName} (Lane ${targetLane}) へ切り替えました`)
  ctx.clearInput()
  return true
}

export function handleBranchListCommand(ctx: GameCommandContext): boolean {
  if (ctx.normalizedCmd !== 'git branch') return false

  const laneList = ctx.toBranchListText()
  if (ctx.activeRamen && ctx.isCurrentStepMatch(ctx.activeRamen, ctx.normalizedCmd)) {
    const nextStep = ctx.getNextStepCommand(ctx.activeRamen)
    ctx.completeCurrentStep(ctx.activeRamen, {
      message: nextStep
        ? `🌿 現在のレーン: ${laneList}。次: ${nextStep}`
        : `🌿 現在のレーン: ${laneList}`,
    })
  } else {
    ctx.setMessage(`🌿 現在のレーン: ${laneList}`)
    ctx.clearInput()
  }

  return true
}

export function handleBranchCreateCommand(ctx: GameCommandContext): boolean {
  const branchMatch = ctx.cmd.match(/^git\s+branch\s+(.+)$/i)
  if (!branchMatch) return false

  const branchName = branchMatch[1].trim()
  if (!branchName) {
    ctx.recordMiss(ctx.activeRamen)
    ctx.setMessage('❌ ブランチ名を入力してください')
    ctx.clearInput()
    return true
  }

  if (!ctx.isCurrentStepMatch(ctx.activeRamen, ctx.normalizedCmd)) {
    ctx.recordMiss(ctx.activeRamen)
    ctx.setMessage(`❌ 今は「${ctx.currentStep?.displayCommand ?? ''}」の番です`)
    ctx.clearInput()
    return true
  }

  if (ctx.getBranchLane(branchName) > 0) {
    ctx.setMessage(`ℹ️ ${branchName} は既に存在します`)
    ctx.clearInput()
    return true
  }

  if (ctx.existingBranches.length >= ctx.maxLanes) {
    ctx.setMessage(`ℹ️ 既に最大レーン数（${ctx.maxLanes}）です`)
    ctx.clearInput()
    return true
  }

  const nextLane = ctx.existingBranches.length + 1
  
  // 👇 修正2: ここも確実にmainを先頭にして配列を更新する！
  ctx.setExistingBranches(prev => {
    const safePrev = prev.length > 0 && prev[0] === 'main' ? prev : ['main', ...prev.filter(b => b !== 'main')]
    return [...safePrev, branchName]
  })
  ctx.setLaneCount(nextLane)

  if (ctx.activeRamen && ctx.isCurrentStepMatch(ctx.activeRamen, ctx.normalizedCmd)) {
    const nextStep = ctx.getNextStepCommand(ctx.activeRamen)
    ctx.completeCurrentStep(ctx.activeRamen, {
      message: nextStep
        ? `🆕 ${branchName} (Lane ${nextLane}) を開設。次: ${nextStep}`
        : `🆕 ${branchName} (Lane ${nextLane}) を開設`,
    })
    return true
  }

  ctx.setMessage(`🆕 ${branchName} (Lane ${nextLane}) を開設しました`)
  ctx.clearInput()
  return true
}