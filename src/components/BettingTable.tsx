interface BettingTableProps {
  selectedBet: string
  onSelectBet: (bet: string) => void
  amount: number
  onAmountChange: (amount: number) => void
  disabled: boolean
}

const bets = [
  { id: 'pass', label: 'Pass Line', detail: '1:1' },
  { id: 'dontpass', label: "Don't Pass", detail: '1:1' },
  { id: 'field', label: 'Field', detail: '1:1 / 2:1 on 2, 12' },
  { id: 'place6', label: 'Place 6', detail: '7:6' },
  { id: 'place8', label: 'Place 8', detail: '7:6' },
]

function BettingTable({ selectedBet, onSelectBet, amount, onAmountChange, disabled }: BettingTableProps) {
  return <section className="betting-panel" aria-labelledby="betting-title">
    <div className="section-heading"><div><p className="eyebrow">WAGER CONSOLE</p><h2 id="betting-title">Active bets</h2></div><span className="chip-label">MIN $5</span></div>
    <div className="bet-grid">{bets.map((bet) => <button key={bet.id} className={`bet-option${selectedBet === bet.id ? ' selected' : ''}`} onClick={() => onSelectBet(bet.id)} disabled={disabled} type="button"><strong>{bet.label}</strong><small>{bet.detail}</small></button>)}</div>
    <label className="field-label" htmlFor="bet-amount">Stake</label>
    <div className="stake-control"><span>$</span><input id="bet-amount" type="number" min="5" step="5" value={amount} onChange={(event) => onAmountChange(Math.max(5, Number(event.target.value) || 5))} disabled={disabled} /></div>
  </section>
}

export default BettingTable
