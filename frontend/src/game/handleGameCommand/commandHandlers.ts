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

  // if (!ctx.isCurrentStepMatch(ctx.activeRamen, ctx.normalizedCmd)) {
  //   ctx.recordMiss(ctx.activeRamen)
  //   ctx.setMessage(`❌ 今必要なのは「${ctx.currentStep?.displayCommand ?? ''}」です`)
  //   ctx.clearInput()
  //   return true
  // }

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
  // 👇 修正1: 中身の文字列の長さを問わないように * に変更し、前後のスペースも許容
  const commitMatch = ctx.cmd.match(/^git\s+commit\s+-m\s*["“”＂]([^"“”＂]*)["“”＂]\s*$/i)
  if (!commitMatch) return false

  if (!ctx.activeRamen) {
    ctx.setMessage('❌ 操作できるラーメンがありません')
    ctx.clearInput()
    return true
  }

  if (ctx.rejectOutOfOrder('commit')) return true

  // 👇 修正2: 「醤油」問題などの文字コードバグで詰まるのを防ぐため、
  // 今のステップの種類が本当に 'commit' であれば、中身のテキストは問わず無条件で確定成功（クリア）にします！
  if (ctx.currentStep?.type !== 'commit') {
    ctx.recordMiss(ctx.activeRamen)
    ctx.setMessage(`❌ 今必要なのは「${ctx.currentStep?.displayCommand ?? ''}」です`)
    ctx.clearInput()
    return true
  }

  const callText = commitMatch[1] || '無言コミット'
  const nextStep = ctx.getNextStepCommand(ctx.activeRamen)
  ctx.completeCurrentStep(ctx.activeRamen, {
    message: nextStep ? `🍜 ${callText} 次: ${nextStep}` : `🍜 ${callText}`,
    update: () => ({ isCommitted: true }),
  })
  return true
}

export function handlePushCommand(ctx: GameCommandContext): boolean {
  const pushMatch = ctx.cmd.match(/^git\s+push(?:\s+(-u))?(?:\s+origin\s+([^\s]+))?\s*$/i)
  if (!pushMatch) return false

  if (!ctx.activeRamen) {
    ctx.setMessage('❌ 配達できるラーメンがありません')
    ctx.clearInput()
    return true
  }

  const hasUpstreamOption = !!pushMatch[1]
  let targetBranch = pushMatch[2] ? pushMatch[2].trim() : ''

  // プレイヤーが今物理的にいるレーンのブランチ名を取得
  const currentBranchName = ctx.existingBranches[ctx.activeRamen.currentLane - 1] || 'main'

  if (!targetBranch) {
    targetBranch = currentBranchName
  }

  const targetLaneName = ctx.existingBranches[ctx.activeRamen.targetLane - 1] || 'main'

  // 👇 修正3: エラーによるブロックを廃止！ミス条件（未コミット、または現在地と違う宛先へのプッシュ）を判定
  const isEarlyPush = !ctx.activeRamen.isCommitted
  const isWrongBranch = normalizeCommand(targetBranch) !== normalizeCommand(currentBranchName)

  // 誤配達フラグ（本来の目的地と違う、または間違った場所に無理やりプッシュした）
  const pushedToMainFromOtherLane = (normalizeCommand(targetBranch) === 'main' && normalizeCommand(targetLaneName) !== 'main') || isWrongBranch

  if (isEarlyPush || isWrongBranch) {
    // ミス（ペナルティ）を記録
    ctx.recordMiss(ctx.activeRamen)

    // 👇 強制射出！エラーで止めず、失敗作としてレーンに流して画面をクリアする
    ctx.setRamens(prev => prev.map(r => {
      if (r.id !== ctx.activeRamen?.id) return r
      return {
        ...r,
        currentStepIndex: r.steps.length, // ステップを最後まで進める
        speed: ctx.pushSpeed,
        isPushed: true,
        pushedToMainFromOtherLane,
      }
    }))

    if (isEarlyPush) {
      ctx.setMessage('💥 クレーム発生！！ コミット（調理確定）せずに生煮えのまま push してしまった！')
    } else {
      ctx.setMessage(`💥 誤配！！ ${currentBranchName} にいるのに ${targetBranch} ブランチ宛に push してしまった！`)
    }
    ctx.clearInput()
    return true
  }

  // 👇 すべての条件をクリアしている正規のプッシュ（大成功）
  ctx.setRamens(prev => prev.map(r => {
    if (r.id !== ctx.activeRamen?.id) return r
    return {
      ...r,
      currentStepIndex: r.steps.length,
      speed: ctx.pushSpeed,
      isPushed: true,
      pushedToMainFromOtherLane: false,
    }
  }))

  ctx.setMessage(hasUpstreamOption
    ? `🚀 [Upstream] push 完了！追跡ブランチを設定しました！`
    : '🚀 push 完了！お客さんのところへ急げーー！！'
  )
  ctx.clearInput()
  return true
}

export function handleStashCommand(ctx: GameCommandContext): boolean {
  const match = ctx.cmd.match(/^git\s+stash(\s+save)?(\s+.*)?$/i)
  if (!match) return false
  if (ctx.cmd.match(/^git\s+stash\s+(pop|list|drop|apply)/i)) return false

  if (ctx.course !== 2) {
    ctx.setMessage('⛔ git stash は normalモード で解放されます')
    ctx.clearInput()
    return true
  }

  if (!ctx.activeRamen) {
    ctx.setMessage('❌ 退避できるラーメンがありません')
    ctx.clearInput()
    return true
  }

  if (ctx.currentStep?.type !== 'stash') {
    ctx.recordMiss(ctx.activeRamen)
    ctx.setMessage(`❌ 今は stash するタイミングではありません`)
    ctx.clearInput()
    return true
  }

  const nextStep = ctx.getNextStepCommand(ctx.activeRamen)
  ctx.completeCurrentStep(ctx.activeRamen, {
    message: `📦 ラーメンを脇に退避しました！ 次: ${nextStep || '新しい注文を取ってください'}`,
    update: () => ({ isStashed: true }),
  })
  return true
}

export function handleStashPopCommand(ctx: GameCommandContext): boolean {
  const match = ctx.cmd.match(/^git\s+stash\s+pop(\s+.*)?$/i)
  if (!match) return false

  if (ctx.course !== 2) {
    ctx.setMessage('⛔ git stash pop は normalモード で解放されます')
    ctx.clearInput()
    return true
  }

  if (!ctx.activeRamen || !ctx.activeRamen.isStashed) {
    ctx.setMessage('❌ 退避しているラーメンはありません')
    ctx.clearInput()
    return true
  }

  if (ctx.currentStep?.type !== 'stash_pop') {
    ctx.recordMiss(ctx.activeRamen)
    ctx.setMessage(`❌ 今は stash pop するタイミングではありません`)
    ctx.clearInput()
    return true
  }

  const nextStep = ctx.getNextStepCommand(ctx.activeRamen)
  ctx.completeCurrentStep(ctx.activeRamen, {
    message: `🔄 退避したラーメンを復帰しました！ 次: ${nextStep || '続けて調理してください'}`,
    update: () => ({ isStashed: false }),
  })
  return true
}

export function handleResetSoftCommand(ctx: GameCommandContext): boolean {
  const match = ctx.cmd.match(/^git\s+reset\s+--soft\s+HEAD~1$/i)
  if (!match) return false

  if (ctx.course !== 2) {
    ctx.setMessage('⛔ git reset は normalモード で解放されます')
    ctx.clearInput()
    return true
  }

  if (!ctx.activeRamen) {
    ctx.setMessage('❌ reset する対象のラーメンがありません')
    ctx.clearInput()
    return true
  }

  if (ctx.currentStep?.type !== 'reset_soft') {
    ctx.recordMiss(ctx.activeRamen)
    ctx.setMessage(`❌ 今は reset するタイミングではありません`)
    ctx.clearInput()
    return true
  }

  const nextStep = ctx.getNextStepCommand(ctx.activeRamen)
  ctx.completeCurrentStep(ctx.activeRamen, {
    message: `⏪ 確定(commit)を取り消しました。 次: ${nextStep || '具材を追加してください'}`,
    update: () => ({ isCommitted: false }),
  })
  return true
}
