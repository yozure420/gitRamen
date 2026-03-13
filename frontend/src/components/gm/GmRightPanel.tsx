import type { Ramen } from '../../interface'
import { getRequiredToppingForRamen } from '../../game/gameEngine'

type GmRightPanelProps = {
  availableItems: string[]
  activeRamen: Ramen | null
}

function GmRightPanel({ availableItems, activeRamen }: GmRightPanelProps) {
  const requiredTopping = activeRamen ? getRequiredToppingForRamen(activeRamen) : null
  const hasAnyAddExecuted = (activeRamen?.stagedItems.length ?? 0) > 0

  return (
    <div className="right-panel">
      <h3 className="section-title section-title-center">注文の入った具材</h3>
      {availableItems.map(item => {
        const isAdded = activeRamen?.stagedItems.includes(item) || false
        const isTargetPending = requiredTopping === item && !hasAnyAddExecuted
        return (
          <div key={item} className={`item-chip ${isAdded ? 'item-chip-added' : ''} ${isTargetPending ? 'item-chip-target-pending' : ''}`}>
            {isAdded && '✓ '}{item}
          </div>
        )
      })}
    </div>
  )
}

export default GmRightPanel
