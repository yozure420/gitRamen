import {
  createCheckoutLaneCommand,
  pickRandomCall,
  pickRandomLaneName,
  pickRandomLaneSwitch,
  pickRandomTopping,
} from './randomCatalog'
import { createAddCommitWorkflow, createSetupThenStandardWorkflow, createStep } from './stepFactory'
import type { CommandLogicRule } from './types'

export const commandLogicRules: CommandLogicRule[] = [
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
    // git branch（一覧表示）後に add -> commit へ連鎖
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
    // git log 系も確認後に add -> commit へ連鎖
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
