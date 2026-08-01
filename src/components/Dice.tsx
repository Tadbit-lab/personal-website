interface DiceProps {
  value: number
  rolling: boolean
}

function Dice({ value, rolling }: DiceProps) {
  const dots = Array.from({ length: value }, (_, index) => <span className="die-dot" key={index} />)
  return <div className={`die-face${rolling ? ' rolling' : ''}`} aria-label={`Die showing ${value}`}>{dots}</div>
}

export default Dice
