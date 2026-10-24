import type { CommandStepType, Ramen } from '../../types/interface'
import type { GameCommandContext } from './types'

// ギミック系のコマンドは表記ゆれ（--no-edit や HEAD^ など）を受け付けたいので、
// このファイルのパターンが「何を正解とみなすか」の正になる。
// CommandStep.expectedInputs は伝票の表示と、他のハンドラ（checkout など）が使う
// isCurrentStepMatch 用なので、受け付ける形を変えるときは両方を直すこと。
const AMEND_PATTERN = /^git\s+commit\s+--amend(?:\s+--no-edit|\s+-m\s*["“”＂][^"“”＂]*["“”＂])?\s*$/i
const RESET_SOFT_PATTERN = /^git reset --soft head(?:~1|\^)$/
const RESTORE_PATTERN = /^git reset --hard head@\{1\}$/
const COMMIT_TREE_PATTERN = /^git\s+commit-tree\s+([0-9a-f]{4,40})\s+-p\s+(\S+)\s+-m\s*["“”＂][^"“”＂]*["“”＂]\s*$/i
const UPDATE_REF_PATTERN = /^git update-ref refs\/heads\/\S+ [0-9a-f]{4,40}$/

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

export function handleReflogCommand(ctx: GameCommandContext): boolean {
  if (ctx.normalizedCmd !== 'git reflog') return false

  const ramen = ctx.activeRamen
  const reflogText = ramen?.isLost
    ? `HEAD@{0}: reset: moving to HEAD~1 / HEAD@{1}: commit: 消える前の丼（${ramen.lostItems.join('・')}）`
    : 'HEAD@{0}: 最新の状態です'

  if (ramen && ctx.isCurrentStepMatch(ramen, ctx.normalizedCmd)) {
    ctx.completeCurrentStep(ramen, { message: withNext(ctx, ramen, `📜 ${reflogText}`) })
    return true
  }

  ctx.setMessage(`📜 ${reflogText}`)
  ctx.clearInput()
  return true
}

export function handleResetHardRestoreCommand(ctx: GameCommandContext): boolean {
  if (!RESTORE_PATTERN.test(ctx.normalizedCmd)) return false

  const ramen = resolveGimmickTarget(ctx, 'reset_hard_restore')
  if (!ramen) return true
  if (!ramen.isLost) return rejectWithMiss(ctx, '❌ 復元する丼がありません')

  ctx.completeCurrentStep(ramen, {
    message: withNext(ctx, ramen, '🛟 reflog から丼を復元しました'),
    update: (current) => ({ stagedItems: [...current.lostItems], lostItems: [], isLost: false, isCommitted: true }),
  })
  return true
}

export function handleCommitTreeCommand(ctx: GameCommandContext): boolean {
  const inputMatch = ctx.cmd.match(COMMIT_TREE_PATTERN)
  if (!inputMatch) return false

  const ramen = resolveGimmickTarget(ctx, 'commit_tree')
  if (!ramen) return true

  // メッセージは自由。ツリーと親の指定だけを厳密に見る
  const expectedMatch = ctx.currentStep?.displayCommand.match(COMMIT_TREE_PATTERN)
  const [, expectedTree = '', expectedParent = ''] = expectedMatch ?? []
  const [, inputTree, inputParent] = inputMatch
  if (inputTree.toLowerCase() !== expectedTree.toLowerCase() || inputParent.toLowerCase() !== expectedParent.toLowerCase()) {
    return rejectWithMiss(ctx, `❌ ツリーか親の指定が違います。git commit-tree ${expectedTree} -p ${expectedParent} -m "..." です`)
  }

  ctx.completeCurrentStep(ramen, {
    message: withNext(ctx, ramen, '🔧 コミットオブジェクトを手作りしました'),
  })
  return true
}

export function handleUpdateRefCommand(ctx: GameCommandContext): boolean {
  if (!UPDATE_REF_PATTERN.test(ctx.normalizedCmd)) return false

  const ramen = resolveGimmickTarget(ctx, 'update_ref')
  if (!ramen) return true
  if (!ctx.isCurrentStepMatch(ramen, ctx.normalizedCmd)) {
    return rejectWithMiss(ctx, `❌ 貼り先のブランチかコミットが違います。「${ctx.currentStep?.displayCommand}」です`)
  }

  ctx.completeCurrentStep(ramen, {
    message: withNext(ctx, ramen, '📌 ブランチにコミットを貼りました（コール完了）'),
    update: () => ({ isCommitted: true }),
  })
  return true
}
