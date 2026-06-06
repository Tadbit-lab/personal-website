import React from 'react'

interface RollButtonProps {
  onRoll: () => void
  onReset: () => void
  disabled: boolean
  rolling: boolean
}

/**
 * Roll and Reset buttons for the Craps game.
 * Roll = flat solid blue. Reset = flat red outline (no fill).
 */
const RollButton: React.FC<RollButtonProps> = ({ onRoll, onReset, disabled, rolling }) => {
  return (
    <div className="craps-action-buttons">
      <button
        className="btn btn-primary"
        onClick={onRoll}
        disabled={disabled || rolling}
        id="roll-dice-btn"
      >
        {rolling ? 'Rolling…' : 'Roll Dice'}
      </button>
      <button
        className="btn btn-outline-red"
        onClick={onReset}
        id="reset-game-btn"
      >
        Reset Game
      </button>
    </div>
  )
}

export default RollButton
