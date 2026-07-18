import type { Ramen } from '../../types/interface'
import { advanceWorkflow, getCurrentCommandStep } from '../gameEngin/workflow'
import { getBranchLane, getNextStepCommand, isCurrentStepMatch, toBranchListText } from './helpers'
import type { ExecuteGameCommandParams, GameCommandContext } from './types'

export function createGameCommandContext(params: ExecuteGameCommandParams): GameCommandContext {
  const activeRamen = params.getActiveRamen()
  const currentStep = activeRamen ? getCurrentCommandStep(activeRamen) : null

  const clearInput = () => {
    params.setInputCommand('')
  }

  const applyLaneSwitchWithoutStepAdvance = (ramen: Ramen, lane: number) => {
    params.setRamens(prev => prev.map((current) => {
      if (current.id !== ramen.id) return current
      return { ...current, currentLane: lane }
    }))
  }

  const completeCurrentStep: GameCommandContext['completeCurrentStep'] = (ramen, options) => {
    const { scoreDelta = 50 * params.course, message, update } = options ?? { message: '' }

    if (scoreDelta !== 0) {
      params.setScore(prev => prev + scoreDelta)
    }

    params.setRamens(prev => prev.map(current => {
      if (current.id !== ramen.id) return current
      const nextState = advanceWorkflow(current, {
        commandsExecuted: current.commandsExecuted + 1,
        ...(update ? update(current) : {}),
      })
      return nextState
    }))

    params.setMessage(message)
    clearInput()
  }

  const recordMiss = (ramen?: Ramen | null) => {
    const target = ramen ?? activeRamen
    if (!target?.command?.id) return
    params.recordMissByCommandId(target.command.id)
  }

  const rejectOutOfOrder: GameCommandContext['rejectOutOfOrder'] = (stepType) => {
    if (!currentStep) return false
    if (currentStep.type === stepType) return false

    recordMiss(activeRamen)

    if (stepType === 'add') {
      params.setMessage(`❌ まだ add の番ではありません。今は「${currentStep.displayCommand}」です`)
    } else if (stepType === 'commit') {
      params.setMessage(`❌ まだ commit できません。先に「${currentStep.displayCommand}」を完了してください`)
    } else {
      params.setMessage(`❌ まだ push できません。先に「${currentStep.displayCommand}」を完了してください`)
    }

    clearInput()
    return true
  }

  return {
    cmd: params.cmd,
    normalizedCmd: params.normalizedCmd,
    course: params.course,
    showHelp: params.showHelp,
    existingBranches: params.existingBranches,
    availableCommands: params.availableCommands,
    availableItems: params.availableItems,
    maxLanes: params.maxLanes,
    pushSpeed: params.pushSpeed,
    activeRamen,
    currentStep,
    setInputCommand: params.setInputCommand,
    setMessage: params.setMessage,
    setRamens: params.setRamens,
    setShowHelp: params.setShowHelp,
    setShowLog: params.setShowLog,
    setIsCompactLog: params.setIsCompactLog,
    setLaneCount: params.setLaneCount,
    setExistingBranches: params.setExistingBranches,
    setIsPaused: params.setIsPaused,
    setStatusWindow: params.setStatusWindow,
    onPullOrder: params.onPullOrder,
    clearInput,
    isCurrentStepMatch,
    getNextStepCommand,
    getBranchLane: (branchName: string) => getBranchLane(branchName, params.existingBranches),
    toBranchListText: () => toBranchListText(params.existingBranches),
    applyLaneSwitchWithoutStepAdvance,
    completeCurrentStep,
    recordMiss,
    rejectOutOfOrder,
  }
}
