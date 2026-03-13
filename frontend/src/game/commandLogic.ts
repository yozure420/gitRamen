import type { Command, CommandStep, CommandStepType } from '../types/interface'

export type RuntimeCommandLogic = {
  steps: CommandStep[]
}

export type PullOrderPayload = {
  command: Command
  runtimeLogic: RuntimeCommandLogic
  orderText: string
  noticeTitle?: string
  noticeDetails?: string[]
  targetLaneOverride?: number | 'startLane'
}

type CommandLogicRule = {
  commandMatcher: RegExp
  buildRuntimeLogic: (command: Command) => RuntimeCommandLogic
}

const TOPPING_OPTIONS = ['ネギ', 'バター', 'チャーシュー', 'メンマ', '煮玉子', 'のり', 'もやし', 'コーン', 'ナルト'] as const
const BASE_RAMEN_OPTIONS = ['味噌ラーメン', '醤油ラーメン', '豚骨ラーメン', '家系ラーメン', '台湾ラーメン'] as const
const CALL_OPTIONS = ['味噌ラーメン特盛りおまち！', '醤油ラーメン全部のせおまち！', '豚骨ラーメン硬め濃いめおまち！'] as const
const LANE_NAME_OPTIONS = ['akamaru', 'kiwami', 'sapporo', 'iekei'] as const
const LANE_SWITCH_OPTIONS = ['lane1', 'lane2', 'lane3'] as const

const pickRandomTopping = (): string => {
  const index = Math.floor(Math.random() * TOPPING_OPTIONS.length)
  return TOPPING_OPTIONS[index]
}

const pickRandomBaseRamen = (): string => {
  const index = Math.floor(Math.random() * BASE_RAMEN_OPTIONS.length)
  return BASE_RAMEN_OPTIONS[index]
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

const pickRandomLaneSwitch = (): string => {
  const index = Math.floor(Math.random() * LANE_SWITCH_OPTIONS.length)
  return LANE_SWITCH_OPTIONS[index]
}

const createCheckoutLaneCommand = (lane: string): string => `git checkout ${lane}`

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

const createAddCommitWorkflow = (params: {
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

const createSetupThenStandardWorkflow = (params: {
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

const commandLogicRules: CommandLogicRule[] = [
  {
    // git add 系は add -> commit のセットフローへ変換する
    commandMatcher: /^git add(?: <file>| .+)$/i,
    buildRuntimeLogic: () => {
      const topping = pickRandomTopping()
      const displayCommand = `git add ${topping}`
      const call = pickRandomCall()
      return createAddCommitWorkflow({
        addCommand: displayCommand,
        addItem: topping,
        commitCommand: `git commit -m "${call}"`,
      })
    },
  },
  {
    // git commit 系も add -> commit のセットフローへ変換する
    commandMatcher: /^git commit -m ".+"$/i,
    buildRuntimeLogic: () => {
      const topping = pickRandomTopping()
      const call = pickRandomCall()
      return createAddCommitWorkflow({
        addCommand: `git add ${topping}`,
        addItem: topping,
        commitCommand: `git commit -m "${call}"`,
      })
    },
  },
  {
    // push は単独注文として扱う
    commandMatcher: /^git push origin main$/i,
    buildRuntimeLogic: () => {
      return {
        steps: [createStep({
          type: 'push',
          displayCommand: 'git push origin main',
          logicLabel: '配膳',
          logicDescription: 'git push でお客さんへ届ける。',
        })],
      }
    },
  },
  {
    // git status は厨房状態の確認コマンド
    commandMatcher: /^git status$/i,
    buildRuntimeLogic: () => {
      return {
        steps: [createStep({
          type: 'command',
          displayCommand: 'git status',
          logicLabel: '厨房状況確認',
          logicDescription: '現在の調理状況を確認する。',
        })],
      }
    },
  },
  {
    // git branch（一覧表示）後に add -> commit -> push へ連鎖
    commandMatcher: /^git branch$/i,
    buildRuntimeLogic: () => {
      return createSetupThenStandardWorkflow({
        setupCommand: 'git branch',
        setupLabel: 'レーン一覧確認',
        setupDescription: '現在のレーン一覧を確認する。',
      })
    },
  },
  {
    // git branch <name> を具体名に差し替える
    commandMatcher: /^git branch <.+>$/i,
    buildRuntimeLogic: () => {
      const laneName = pickRandomLaneName()
      const displayCommand = `git branch ${laneName}`
      return createSetupThenStandardWorkflow({
        setupCommand: displayCommand,
        setupLabel: '新規レーン作成',
        setupDescription: `新規レーン「${laneName}」を作成する。`,
        setupExample: `例: ${displayCommand}`,
      })
    },
  },
  {
    // git checkout <branch> を lane 切替コマンドへ変換する
    commandMatcher: /^git checkout <branch>$/i,
    buildRuntimeLogic: () => {
      const lane = pickRandomLaneSwitch()
      const displayCommand = createCheckoutLaneCommand(lane)
      return createSetupThenStandardWorkflow({
        setupCommand: displayCommand,
        setupLabel: 'レーン切替',
        setupDescription: `指定レーン「${lane}」へ切り替える。`,
        setupExample: `例: ${displayCommand}`,
      })
    },
  },
  {
    // git log 系も確認後に add -> commit -> push へ連鎖
    commandMatcher: /^git log(?: --oneline)?$/i,
    buildRuntimeLogic: (command) => {
      const compact = /--oneline/i.test(command.command)
      return createSetupThenStandardWorkflow({
        setupCommand: compact ? 'git log --oneline' : 'git log',
        setupLabel: compact ? 'レシート簡易表示' : 'レシート表示',
        setupDescription: compact ? 'レシートを1行表示で確認する。' : 'レシート詳細を確認する。',
      })
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
          logicDescription: `新規レーン「${laneName}」を作り、そのまま切り替える。`,
          logicExample: `例: ${displayCommand}`,
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

export function createPullOrderPayload(course: number, ramenId: number): PullOrderPayload {
  const baseRamen = pickRandomBaseRamen()
  const topping = pickRandomTopping()
  const orderText = `${baseRamen}、トッピングは${topping}`
  const call = `${baseRamen}${topping}入りおまち！`

  return {
    command: {
      id: -ramenId,
      command: `git add ${topping}`,
      description: `${baseRamen}に${topping}を追加する注文`,
      game_note: orderText,
      course,
    },
    runtimeLogic: createAddCommitWorkflow({
      addCommand: `git add ${topping}`,
      addItem: topping,
      commitCommand: `git commit -m "${call}"`,
    }),
    orderText,
  }
}

export function createLaneAwarePullOrderPayload(params: {
  course: number
  ramenId: number
  laneCount: number
  maxLanes: number
  existingBranches: string[]
}): PullOrderPayload {
  const { course, ramenId, laneCount, maxLanes, existingBranches } = params

  // Random customer-arrival event: the required command is branch creation.
  if (laneCount < maxLanes && Math.random() < 0.35) {
    const newBranchName = pickRandomLaneName()
    return {
      command: {
        id: -ramenId,
        command: `git branch ${newBranchName}`,
        description: `新規来客レーン ${newBranchName} を開設する注文`,
        game_note: 'お客さんいらっしゃいました！！いらっしゃいませ～！',
        course,
      },
      runtimeLogic: {
        steps: [createStep({
          type: 'command',
          displayCommand: `git branch ${newBranchName}`,
          logicLabel: '来客対応',
          logicDescription: '新しいお客さん用レーンを増設する。',
          logicExample: `例: git branch ${newBranchName}`,
        })],
      },
      orderText: 'お客さんいらっしゃいました！！いらっしゃいませ～！',
      noticeTitle: 'お客さんいらっしゃいました！！いらっしゃいませ～！',
      noticeDetails: [`必要コマンド: git branch ${newBranchName}`],
      targetLaneOverride: 'startLane',
    }
  }

  const targetLane = Math.floor(Math.random() * laneCount) + 1
  const targetBranchName = existingBranches[targetLane - 1] ?? `lane${targetLane}`
  const baseRamen = pickRandomBaseRamen()
  const topping = pickRandomTopping()
  const call = `${baseRamen}${topping}入りおまち！`
  const laneOrderText = `${targetBranchName}レーン: ${baseRamen}、トッピングは${topping}`

  const setupStepByLane: Record<number, CommandStep | null> = {
    1: null,
    2: createStep({
      type: 'command',
      displayCommand: 'git status',
      logicLabel: 'Lane2 受付確認',
      logicDescription: 'Lane2 の注文票を確認してから調理に入る。',
      logicExample: '例: git status',
    }),
    3: createStep({
      type: 'command',
      displayCommand: 'git log --oneline',
      logicLabel: 'Lane3 受付確認',
      logicDescription: 'Lane3 は履歴確認をしてから調理に入る。',
      logicExample: '例: git log --oneline',
    }),
  }

  const addStep = createStep({
    type: 'add',
    displayCommand: `git add ${topping}`,
    logicLabel: `${targetBranchName}レーン調理`,
    logicDescription: `${targetBranchName}レーン注文の具材「${topping}」を投入。`,
    logicExample: `例: git add ${topping}`,
    itemName: topping,
  })

  const commitStep = createStep({
    type: 'commit',
    displayCommand: `git commit -m "${call}"`,
    logicLabel: `${targetBranchName}レーン確定`,
    logicDescription: `${targetBranchName}レーン注文をコミットで確定する。`,
  })

  const maybeSetupStep = setupStepByLane[targetLane]
  const steps = maybeSetupStep ? [maybeSetupStep, addStep, commitStep] : [addStep, commitStep]

  return {
    command: {
      id: -ramenId,
      command: addStep.displayCommand,
      description: `${targetBranchName}レーンの注文`,
      game_note: laneOrderText,
      course,
    },
    runtimeLogic: { steps },
    orderText: laneOrderText,
    noticeTitle: '新規注文が入りました',
    noticeDetails: [`対象: ${targetBranchName}レーン`, `最初のコマンド: ${steps[0].displayCommand}`],
    targetLaneOverride: targetLane,
  }
}
