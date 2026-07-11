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

const TOPPING_OPTIONS = ['ネギ', 'バター', 'チャーシュー', 'メンマ', '煮玉子', 'のり', 'もやし', 'コーン', 'ナルト'] as const
const BASE_RAMEN_OPTIONS = ['味噌ラーメン', '醤油ラーメン', '豚骨ラーメン', '家系ラーメン', '台湾ラーメン'] as const
const LANE_NAME_OPTIONS = ['akamaru', 'kiwami', 'sapporo', 'iekei'] as const

const pickRandomTopping = (): string => {
  const index = Math.floor(Math.random() * TOPPING_OPTIONS.length)
  return TOPPING_OPTIONS[index]
}

const pickRandomBaseRamen = (): string => {
  const index = Math.floor(Math.random() * BASE_RAMEN_OPTIONS.length)
  return BASE_RAMEN_OPTIONS[index]
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

export function createLaneAwarePullOrderPayload(params: {
  course: number
  baseCommandId: number
  laneCount: number
  maxLanes: number
  existingBranches: string[]
}): PullOrderPayload {
  const { course, baseCommandId, laneCount, maxLanes, existingBranches } = params

  // Random customer-arrival event: the required command is branch creation.
  if (laneCount < maxLanes && Math.random() < 0.35) {
    const newBranchName = pickRandomLaneName()
    return {
      command: {
        id: baseCommandId,
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
      // id: -ramenId,
      id: baseCommandId,
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
