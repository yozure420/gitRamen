import type { Command } from '../interface'

export type RuntimeCommandLogic = {
  displayCommand: string
  logicLabel: string
  logicDescription: string
  logicExample: string
  expectedInputs: string[]
}

type CommandLogicRule = {
  commandMatcher: RegExp
  buildRuntimeLogic: (command: Command) => RuntimeCommandLogic
}

const TOPPING_OPTIONS = ['ネギ', 'バター', 'チャーシュー', 'メンマ', '煮玉子', 'のり', 'もやし', 'コーン'] as const
const CALL_OPTIONS = ['味噌ラーメン特盛りおまち！', '醤油ラーメン全部のせおまち！', '豚骨ラーメン硬め濃いめおまち！'] as const
const LANE_NAME_OPTIONS = ['akamaru', 'kiwami', 'sapporo', 'iekei'] as const

function pickRandomTopping(): string {
  const index = Math.floor(Math.random() * TOPPING_OPTIONS.length)
  return TOPPING_OPTIONS[index]
}

function pickRandomCall(): string {
  const index = Math.floor(Math.random() * CALL_OPTIONS.length)
  return CALL_OPTIONS[index]
}

function pickRandomLaneName(): string {
  const suffix = Math.floor(Math.random() * 90) + 10
  const index = Math.floor(Math.random() * LANE_NAME_OPTIONS.length)
  return `${LANE_NAME_OPTIONS[index]}-${suffix}`
}

const commandLogicRules: CommandLogicRule[] = [
  {
    // git add <file> を毎回ランダムな具材コマンドに変換する
    commandMatcher: /^git add <file>$/i,
    buildRuntimeLogic: () => {
      const topping = pickRandomTopping()
      const displayCommand = `git add ${topping}`
      return {
        displayCommand,
        logicLabel: '具材投入',
        logicDescription: '`<file>` は具材スロット。出題ごとにランダム具材へ差し替え。',
        logicExample: `例: ${displayCommand} で「${topping}を入れる」`,
        expectedInputs: [displayCommand],
      }
    },
  },
  {
    // git commit -m "コール内容" を具体的なコール文へ差し替える
    commandMatcher: /^git commit -m "(コール内容|message)"$/i,
    buildRuntimeLogic: () => {
      const call = pickRandomCall()
      const displayCommand = `git commit -m "${call}"`
      return {
        displayCommand,
        logicLabel: 'コール',
        logicDescription: 'コール内容を読み上げてラーメンを完成させる。',
        logicExample: `例: ${displayCommand}`,
        expectedInputs: [displayCommand],
      }
    },
  },
  {
    // git branch <name> を具体名に差し替える
    commandMatcher: /^git branch <.+>$/i,
    buildRuntimeLogic: () => {
      const laneName = pickRandomLaneName()
      const displayCommand = `git branch ${laneName}`
      return {
        displayCommand,
        logicLabel: '新規レーン作成',
        logicDescription: '新しいお客さんレーンを増設する。',
        logicExample: `例: ${displayCommand}`,
        expectedInputs: [displayCommand],
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
        displayCommand,
        logicLabel: '作成して切替',
        logicDescription: '新規レーンを作り、そのまま担当レーンを切り替える。',
        logicExample: `例: ${displayCommand}`,
        expectedInputs: [displayCommand],
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
    displayCommand: command.command,
    logicLabel: '通常コマンド',
    logicDescription: '表示されたコマンドをそのまま入力。',
    logicExample: `例: ${command.command}`,
    expectedInputs: [command.command],
  }
}
