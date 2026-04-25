import { normalizeCommand } from './helpers'
import type { GameCommandContext } from './types'

export function handleFallback(ctx: GameCommandContext): void {
  if (ctx.activeRamen && ctx.isCurrentStepMatch(ctx.activeRamen, ctx.normalizedCmd)) {
    const nextStep = ctx.getNextStepCommand(ctx.activeRamen)
    ctx.completeCurrentStep(ctx.activeRamen, {
      message: nextStep
        ? `✅ 「${ctx.cmd}」完了！次: ${nextStep}`
        : `✅ 正解！「${ctx.cmd}」を実行しました！`,
    })
    return
  }

  const matchingCmd = ctx.availableCommands.find(c => normalizeCommand(c.command) === ctx.normalizedCmd)

  if (ctx.currentStep) {
    ctx.recordMiss(ctx.activeRamen)
    ctx.setMessage(`❌ 今は「${ctx.currentStep.displayCommand}」の番です`)
  } else if (matchingCmd) {
    ctx.recordMiss(ctx.activeRamen)
    ctx.setMessage('❌ そのコマンドは今じゃない！現在のラーメンのコマンドを入力してください')
  } else {
    ctx.recordMiss(ctx.activeRamen)
    ctx.setMessage(`❓ 不明なコマンド: ${ctx.cmd}`)
  }

  ctx.clearInput()
}
