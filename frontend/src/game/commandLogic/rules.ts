import type { Command } from '../../types/interface'
import { createStep } from './stepFactory'
import type { RuntimeCommandLogic } from './types'
import { commandLogicRules } from './ruleCatalog'

export function resolveRuntimeCommandLogic(command: Command): RuntimeCommandLogic {
  const matchedRule = commandLogicRules.find(rule => rule.commandMatcher.test(command.command))
  if (matchedRule) {
    return matchedRule.buildRuntimeLogic(command)
  }

  return {
    steps: [createStep({
      type: 'command',
      displayCommand: command.command,
      logicLabel: '通常コマンド',
      logicDescription: '表示されたコマンドをそのまま入力。',
    })],
  }
}
