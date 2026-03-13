import type { Ramen } from '../../interface'

type GmRightPanelProps = {
  availableItems: string[]
  activeRamen: Ramen | null
}

function GmRightPanel({ availableItems, activeRamen }: GmRightPanelProps) {
  return (
    <div className="right-panel">
      <h3 className="section-title section-title-center">利用可能な具材</h3>
      {availableItems.map(item => {
        const isAdded = activeRamen?.stagedItems.includes(item) || false
        return (
          <div key={item} className={`item-chip ${isAdded ? 'item-chip-added' : ''}`}>
            {isAdded && '✓ '}{item}
          </div>
        )
      })}
    </div>
  )
}

export default GmRightPanel
