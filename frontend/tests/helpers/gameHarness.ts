import type { SetStateAction } from 'react'
import { createLaneAwarePullOrderPayload } from '../../src/game/commandLogic'
import { FORCE_ORDER_EVENT_KEY } from '../../src/game/commandLogic/orderEvents'
import type { OrderEventType } from '../../src/game/commandLogic/types'
import { evaluateDelivery } from '../../src/game/gameEngin/deliveryJudge'
import { createRamenEntry } from '../../src/game/gameEngin/ramenFactory'
import { selectActiveRamen } from '../../src/game/gameEngin/ramenSelectors'
import { executeGameCommand, normalizeCommand } from '../../src/game/handleGameCommand'
import type { CommandHistory, Ramen, StatusWindowData } from '../../src/types/interface'
import { AVAILABLE_ITEMS } from './ramen'

type HarnessState = {
  ramens: Ramen[]
  score: number
  message: string
  statusWindow: StatusWindowData | null
  statusWindowTitles: string[]
  misses: number[]
  existingBranches: string[]
  laneCount: number
  currentLane: number
  history: CommandHistory[]
}

function applyAction<T>(current: T, action: SetStateAction<T>): T {
  return typeof action === 'function' ? (action as (prev: T) => T)(current) : action
}

/**
 * useGmScreen の状態管理を最小限に再現し、実際のハンドラ・注文生成・配達判定を通しで動かすテスト用ハーネス。
 */
export function createGameHarness(course: number) {
  let nextRamenId = 1
  const state: HarnessState = {
    ramens: [],
    score: 0,
    message: '',
    statusWindow: null,
    statusWindowTitles: [],
    misses: [],
    existingBranches: ['main'],
    laneCount: 1,
    currentLane: 1,
    history: [],
  }

  const active = () => selectActiveRamen(state.ramens)

  const onPullOrder = () => {
    const payload = createLaneAwarePullOrderPayload({
      course,
      baseCommandId: 1,
      laneCount: state.laneCount,
      maxLanes: 3,
      existingBranches: state.existingBranches,
      currentLane: state.currentLane,
    })
    const ramen = {
      ...createRamenEntry({
        id: nextRamenId++,
        command: payload.command,
        steps: payload.runtimeLogic.steps,
        laneCount: state.laneCount,
        speed: 0.12,
        targetLaneOverride: payload.targetLaneOverride,
      }),
      currentLane: state.currentLane,
    }
    state.ramens = [...state.ramens, ramen]
    return `注文受付: ${payload.orderText}`
  }

  const run = (cmd: string) => {
    executeGameCommand({
      cmd,
      normalizedCmd: normalizeCommand(cmd),
      isGameOver: false,
      course,
      existingBranches: state.existingBranches,
      showHelp: false,
      availableCommands: [],
      availableItems: AVAILABLE_ITEMS,
      maxLanes: 3,
      pushSpeed: 5,
      onPullOrder,
      getActiveRamen: active,
      setInputCommand: () => {},
      setCommandHistory: (action) => { state.history = applyAction(state.history, action) },
      setMessage: (value) => { state.message = value },
      setRamens: (action) => { state.ramens = applyAction(state.ramens, action) },
      setScore: (action) => { state.score = applyAction(state.score, action) },
      setShowHelp: () => {},
      setShowLog: () => {},
      setIsCompactLog: () => {},
      setLaneCount: (value) => { state.laneCount = value },
      setExistingBranches: (action) => { state.existingBranches = applyAction(state.existingBranches, action) },
      setIsPaused: () => {},
      setStatusWindow: (action) => {
        state.statusWindow = applyAction(state.statusWindow, action)
        if (state.statusWindow) state.statusWindowTitles.push(state.statusWindow.title)
      },
      recordMissByCommandId: (commandId) => { state.misses.push(commandId) },
    })
    // useGmScreen と同様、作業中のレーンはアクティブなラーメンの位置に追従する
    const current = active()
    if (current) state.currentLane = current.currentLane
  }

  /** 伝票に表示されている手順をそのまま順に入力して、push まで捌く */
  const playActiveOrder = () => {
    for (let guard = 0; guard < 30; guard++) {
      const ramen = active()
      if (!ramen || ramen.isPushed) return
      const step = ramen.steps[ramen.currentStepIndex]
      if (!step) return
      run(step.displayCommand)
    }
    throw new Error('order did not finish within 30 commands')
  }

  /** レーン終端に到着したとして配達判定し、ラーメンを片付ける */
  const deliverActive = () => {
    const ramen = active()
    if (!ramen) throw new Error('no active ramen to deliver')
    const outcome = evaluateDelivery(ramen, course)
    state.score = Math.max(0, state.score + outcome.scoreDelta)
    state.ramens = state.ramens.filter(r => r.id !== ramen.id)
    return outcome
  }

  return { state, active, run, playActiveOrder, deliverActive }
}

export function forceOrderEvent(event: OrderEventType | null) {
  const globals = globalThis as Record<string, unknown>
  if (event) {
    globals[FORCE_ORDER_EVENT_KEY] = event
  } else {
    delete globals[FORCE_ORDER_EVENT_KEY]
  }
}
