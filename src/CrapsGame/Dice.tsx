import React from 'react'

interface DiceProps {
  value: number
  rolling: boolean
}

/**
 * CSS-only die face. Renders 1–6 dots using CSS Grid.
 * The `rolling` prop triggers a rotate animation.
 */
const Dice: React.FC<DiceProps> = ({ value, rolling }) => {
  const clampedValue = Math.max(1, Math.min(6, value))
  const dots = Array.from({ length: clampedValue }, (_, i) => (
    <span key={i} className="die-dot" />
  ))

  return (
    <div
      className={`die-face${rolling ? ' rolling' : ''}`}
      data-value={clampedValue}
      aria-label={`Die showing ${clampedValue}`}
    >
      {dots}
    </div>
  )
}

export default Dice
