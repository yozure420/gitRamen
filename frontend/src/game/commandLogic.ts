import type { Command, CommandStep, CommandStepType } from '../types/interface'

export type RuntimeCommandLogic = {
  steps: CommandStep[]
}

type CommandLogicRule = {
  commandMatcher: RegExp
  buildRuntimeLogic: (command: Command) => RuntimeCommandLogic
}

const TOPPING_OPTIONS = ['ネギ', 'バター', 'チャーシュー', 'メンマ', '煮玉子', 'のり', 'もやし', 'コーン', 'ナルト'] as const
const CALL_OPTIONS = ['味噌ラーメン特盛りおまち！', '醤油ラーメン全部のせおまち！', '豚骨ラーメン硬め濃いめおまち！'] as const
const LANE_NAME_OPTIONS = ['akamaru', 'kiwami', 'sapporo', 'iekei'] as const

const pickRandomTopping = (): string => {
  const index = Math.floor(Math.random() * TOPPING_OPTIONS.length)
  return TOPPING_OPTIONS[index]
}

const pickRandomCall = (): string => {
  const index = Math.floor(Math.random() * CALL_OPTIONS.length)
  return CALL_OPTIONS[index]
}

const pickRandomLaneName = (): string => {
  const suffix = Math.floor(Math.random() * 90) + 10
  const index = Math.floor(Math.random() * LANE_NAME_OPTIONS.length)
  return `${LANE_NAME_OPTIONS[index]}-${suffix}`
}

const createStep = (params: {
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

const createStandardWorkflow = (params: {
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
      createStep({
        type: 'push',
        displayCommand: 'git push origin main',
        logicLabel: '配膳',
        logicDescription: '最後に git push でお客さんへ届ける。',
      }),
    ],
  }
}

const commandLogicRules: CommandLogicRule[] = [
  {
    // git add 系は add -> commit -> push の標準フローへ変換する
    commandMatcher: /^git add(?: <file>| .+)$/i,
    buildRuntimeLogic: () => {
      const topping = pickRandomTopping()
      const displayCommand = `git add ${topping}`
      const call = pickRandomCall()
      return createStandardWorkflow({
        addCommand: displayCommand,
        addItem: topping,
        commitCommand: `git commit -m "${call}"`,
      })
    },
  },
  {
    // git commit 系も add から始まる標準フローへ変換する
    commandMatcher: /^git commit -m ".+"$/i,
    buildRuntimeLogic: () => {
      const topping = pickRandomTopping()
      const call = pickRandomCall()
      return createStandardWorkflow({
        addCommand: `git add ${topping}`,
        addItem: topping,
        commitCommand: `git commit -m "${call}"`,
      })
    },
  },
  {
    // push 単体注文も add -> commit -> push へ拡張する
    commandMatcher: /^git push origin main$/i,
    buildRuntimeLogic: () => {
      const topping = pickRandomTopping()
      const call = pickRandomCall()
      return createStandardWorkflow({
        addCommand: `git add ${topping}`,
        addItem: topping,
        commitCommand: `git commit -m "${call}"`,
      })
    },
  },
  {
    // git branch <name> を具体名に差し替える
    commandMatcher: /^git branch <.+>$/i,
    buildRuntimeLogic: () => {
      const laneName = pickRandomLaneName()
      const displayCommand = `git branch ${laneName}`
      return {
        steps: [createStep({
          type: 'command',
          displayCommand,
          logicLabel: '新規レーン作成',
          logicDescription: '新しいお客さんレーンを増設する。',
        })],
      }
    },
  },
  {
    // git checkout -b <branch> を具体名に差し替える
    commandMatcher: /^git checkout -b <branch>$/i,
    buildRuntimeLogic: () => {
      const laneName = pickRandomLaneName()
      const displayCommand = `git checkout -b ${laneName}`
      return {
        steps: [createStep({
          type: 'command',
          displayCommand,
          logicLabel: '作成して切替',
          logicDescription: '新規レーンを作り、そのまま担当レーンを切り替える。',
        })],
      }
    },
  },
]

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
