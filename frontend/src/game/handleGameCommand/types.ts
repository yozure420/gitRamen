import type { Dispatch, SetStateAction } from 'react'
import type { Command, CommandHistory, CommandStep, Ramen, StatusWindowData } from '../../types/interface'

export type ExecuteGameCommandParams = {
  cmd: string
  normalizedCmd: string
  isGameOver: boolean
  course: number
  existingBranches: string[]
  showHelp: boolean
  availableCommands: Command[]
  availableItems: string[]
  maxLanes: number
  pushSpeed: number
  onPullOrder: () => string
  getActiveRamen: () => Ramen | null
  setInputCommand: (value: string) => void
  setCommandHistory: Dispatch<SetStateAction<CommandHistory[]>>
  setMessage: (value: string) => void
  setRamens: Dispatch<SetStateAction<Ramen[]>>
  setScore: Dispatch<SetStateAction<number>>
  setShowHelp: (value: boolean) => void
  setShowLog: (value: boolean) => void
  setIsCompactLog: (value: boolean) => void
  setLaneCount: (value: number) => void
  setExistingBranches: Dispatch<SetStateAction<string[]>>
  setIsPaused: (value: boolean) => void
  setStatusWindow: Dispatch<SetStateAction<StatusWindowData | null>>
  recordMissByCommandId: (commandId: number) => void
}

export type CompleteCurrentStepOptions = {
  scoreDelta?: number
  message: string
  update?: (current: Ramen) => Partial<Ramen>
}

export type GameCommandContext = {
  cmd: string
  normalizedCmd: string
  course: number
  showHelp: boolean
  existingBranches: string[]
  availableCommands: Command[]
  availableItems: string[]
  maxLanes: number
  pushSpeed: number
  activeRamen: Ramen | null
  currentStep: CommandStep | null
  setInputCommand: (value: string) => void
  setMessage: (value: string) => void
  setRamens: Dispatch<SetStateAction<Ramen[]>>
  setShowHelp: (value: boolean) => void
  setShowLog: (value: boolean) => void
  setIsCompactLog: (value: boolean) => void
  setLaneCount: (value: number) => void
  setExistingBranches: Dispatch<SetStateAction<string[]>>
  setIsPaused: (value: boolean) => void
  setStatusWindow: Dispatch<SetStateAction<StatusWindowData | null>>
  onPullOrder: () => string
  clearInput: () => void
  isCurrentStepMatch: (ramen: Ramen | null, input: string) => boolean
  getNextStepCommand: (ramen: Ramen) => string | null
  getBranchLane: (branchName: string) => number
  toBranchListText: () => string
  applyLaneSwitchWithoutStepAdvance: (ramen: Ramen, lane: number) => void
  completeCurrentStep: (ramen: Ramen, options?: CompleteCurrentStepOptions) => void
  recordMiss: (ramen?: Ramen | null) => void
  rejectOutOfOrder: (stepType: 'add' | 'commit' | 'push') => boolean
}

export type GameCommandHandler = (ctx: GameCommandContext) => boolean
