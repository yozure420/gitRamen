import { createGameCommandContext } from './context'
import { handleFallback } from './fallback'
import { orderedCommandHandlers } from './handlerRegistry'
import type { ExecuteGameCommandParams } from './types'

export function executeGameCommand(params: ExecuteGameCommandParams): void {
  if (!params.cmd.trim() || params.isGameOver) return

  params.setCommandHistory(prev => [...prev, { command: params.cmd, timestamp: new Date() }])

  const ctx = createGameCommandContext(params)

  for (const handler of orderedCommandHandlers) {
    if (handler(ctx)) {
      return
    }
  }

  handleFallback(ctx)
}
