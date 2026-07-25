import {
  handleAddCommand,
  handleCloneCommand,
  handleCommitCommand,
  handlePullCommand,
  handlePushCommand,
} from './commandHandlers'
import {
  handleBranchCreateCommand,
  handleBranchListCommand,
  handleCheckoutCreateCommand,
  handleSwitchCheckoutCommand,
} from './branchHandlers'
import { handleHelpCommand, handleLogCommand, handleLogOnelineCommand, handleStatusCommand } from './uiHandlers'
import type { GameCommandHandler } from './types'

export const orderedCommandHandlers: GameCommandHandler[] = [
  handlePullCommand,
  handleCloneCommand,
  handleAddCommand,
  handleCommitCommand,
  handleCheckoutCreateCommand,
  handleSwitchCheckoutCommand,
  handleBranchListCommand,
  handleBranchCreateCommand,
  handleHelpCommand,
  handleLogCommand,
  handleLogOnelineCommand,
  handleStatusCommand,
  handlePushCommand,
]
