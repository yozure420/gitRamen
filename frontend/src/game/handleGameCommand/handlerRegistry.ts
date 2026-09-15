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
import {
  handleAmendCommand,
  handleCommitTreeCommand,
  handleReflogCommand,
  handleResetHardRestoreCommand,
  handleResetSoftCommand,
  handleStashCommand,
  handleStashListCommand,
  handleStashPopCommand,
  handleUpdateRefCommand,
} from './gimmickHandlers'
import { handleHelpCommand, handleLogCommand, handleLogOnelineCommand, handleStatusCommand } from './uiHandlers'
import type { GameCommandHandler } from './types'

export const orderedCommandHandlers: GameCommandHandler[] = [
  handlePullCommand,
  handleCloneCommand,
  handleAddCommand,
  handleAmendCommand,
  handleCommitCommand,
  handleStashListCommand,
  handleStashPopCommand,
  handleStashCommand,
  handleResetSoftCommand,
  handleReflogCommand,
  handleResetHardRestoreCommand,
  handleCommitTreeCommand,
  handleUpdateRefCommand,
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
