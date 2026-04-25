import type { CommandStep, CommandStepType } from '../../types/interface'
import type { RuntimeCommandLogic } from './types'

export const createStep = (params: {
  type: CommandStepType
  displayCommand: string
  expectedInputs?: string[]
  logicLabel: string
  logicDescription: string
  logicExample?: string
  itemName?: string
}): CommandStep => {
  const {
    type,
    displayCommand,
    expectedInputs = [displayCommand],
    logicLabel,
    logicDescription,
    logicExample = `例: ${displayCommand}`,
    itemName,
  } = params

  return {
    id: `${type}:${displayCommand}`,
    type,
    displayCommand,
    expectedInputs,
    logicLabel,
    logicDescription,
    logicExample,
    itemName,
  }
}

export const createAddCommitWorkflow = (params: {
  addCommand: string
  addItem?: string
  commitCommand: string
}): RuntimeCommandLogic => {
  const { addCommand, addItem, commitCommand } = params

  return {
    steps: [
      createStep({
        type: 'add',
        displayCommand: addCommand,
        logicLabel: '具材投入',
        logicDescription: 'まず git add で具材をステージに載せる。',
        logicExample: `例: ${addCommand}`,
        itemName: addItem,
      }),
      createStep({
        type: 'commit',
        displayCommand: commitCommand,
        logicLabel: 'コール',
        logicDescription: '次に git commit で注文内容を確定する。',
      }),
    ],
  }
}

export const createSetupThenStandardWorkflow = (params: {
  setupCommand: string
  setupLabel: string
  setupDescription: string
  setupExample?: string
}): RuntimeCommandLogic => {
  const { setupCommand, setupLabel, setupDescription, setupExample } = params

  return {
    steps: [
      createStep({
        type: 'command',
        displayCommand: setupCommand,
        logicLabel: setupLabel,
        logicDescription: setupDescription,
        logicExample: setupExample ?? `例: ${setupCommand}`,
      }),
      createStep({
        type: 'add',
        displayCommand: 'git add .',
        logicLabel: '変更をステージング',
        logicDescription: '準備後の変更をまとめてステージングする。',
        logicExample: '例: git add .',
      }),
      createStep({
        type: 'commit',
        displayCommand: 'git commit -m "変更を記録"',
        logicLabel: 'コミット',
        logicDescription: '変更をコミットして履歴に残す。',
      }),
    ],
  }
}
