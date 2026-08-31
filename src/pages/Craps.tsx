import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import BettingTable from '../components/BettingTable'
import { init as initDiceRoller, rollTwo } from '../dice/DiceRoller'
import '../CrapsGame/CrapsGame.css'


type BetType = 'pass' | 'dontpass' | 'field' | 'place6' | 'place8'

function Craps() {
  const [dice, setDice] = useState([3, 4])
  const [rolling, setRolling] = useState(false)
  const [phase, setPhase] = useState<'comeout' | 'point'>('comeout')
  const [point, setPoint] = useState<number | null>(null)
  const [balance, setBalance] = useState(1000)
  const [bet, setBet] = useState<BetType>('pass')
  const [amount, setAmount] = useState(25)
  const [message, setMessage] = useState('Place a wager to begin the come-out roll.')
  const [diceReady, setDiceReady] = useState(false)
  const [showRules, setShowRules] = useState(false)

  const audio = useRef<Record<string, HTMLAudioElement>>({})
  const soundBase = `${import.meta.env.BASE_URL}sounds/`

  // Synchronous locks to prevent double-fire bugs
  const isRollingActive = useRef(false)
  const welcomePlayed = useRef(false)

  useEffect(() => {
    // 1. Preload audio
    ;['dice-roll', 'dice-hit', 'win', 'lose', 'welcome', 'chip'].forEach((name) => {
      const sound = new Audio(`${soundBase}${name}.mp3`)
      sound.preload = 'auto'
      audio.current[name] = sound
    })

    // Play welcome once (guards against React Strict Mode double-mount)
    if (!welcomePlayed.current && audio.current['welcome']) {
      audio.current['welcome'].play().catch(() => undefined)
      welcomePlayed.current = true
    }

    // 2. Initialize 3D dice container after layout settles
    let isMounted = true

    async function setupDice() {
      try {
        await new Promise((resolve) => setTimeout(resolve, 150))
        await initDiceRoller('#dice-container')
        if (isMounted) {
          setDiceReady(true)
        }
      } catch (err) {
        console.error('3D Dice Box failed to initialize:', err)
        if (isMounted) setDiceReady(true)
      }
    }

    setupDice()

    return () => {
      isMounted = false
    }
  }, [soundBase])

  const play = (name: string) => {
    const sound = audio.current[name]
    if (sound) {
      sound.currentTime = 0
      void sound.play().catch(() => undefined)
    }
  }

  const roll = async () => {
    if (isRollingActive.current || rolling || balance < amount) return

    isRollingActive.current = true
    setRolling(true)
    play('dice-roll')

    const d1 = Math.floor(Math.random() * 6) + 1
    const d2 = Math.floor(Math.random() * 6) + 1
    const next = [d1, d2]

    try {
      await rollTwo(d1, d2, '#dice-container')
    } catch (err) {
      console.warn('3D roll animation error:', err)
    }

    const total = next[0] + next[1]
    setDice(next)
    play('dice-hit')

    let won: boolean | null = null
    let text = `Rolled ${total}.`
    let payoutMultiplier = 1

    // 1. FIELD BET (Fixed: includes 2 & 12, both pay 2:1)
    if (bet === 'field') {
      if ([2, 12].includes(total)) {
        won = true
        payoutMultiplier = 2
      } else if ([3, 4, 9, 10, 11].includes(total)) {
        won = true
      } else {
        won = false
      }
    }
    // 2. PLACE BETS (Fixed: stays active until 7)
    else if (bet === 'place6' || bet === 'place8') {
      const target = Number(bet.slice(-1))
      if (total === target) {
        won = true
      } else if (total === 7) {
        won = false
        setPhase('comeout')
        setPoint(null)
      } else {
        won = null
        text = `Rolled ${total}. Place bet on ${target} remains active.`
      }
    }
    // 3. COME-OUT PHASE
    else if (phase === 'comeout') {
      if ([7, 11].includes(total)) {
        won = bet === 'pass'
      } else if ([2, 3].includes(total)) {
        won = bet === 'dontpass'
      } else if (total === 12) {
        if (bet === 'pass') {
          won = false
        } else {
          won = null
          text = `Rolled 12. Don't Pass pushes (tie). Bet returned.`
        }
      } else {
        setPoint(total)
        setPhase('point')
        text = `Point is ${total}. Roll it again before seven.`
      }
    }
    // 4. POINT PHASE
    else if (total === point || total === 7) {
      won = total === point ? bet === 'pass' : bet === 'dontpass'
      setPhase('comeout')
      setPoint(null)
      text = total === 7 ? 'Seven out.' : `Point ${total} hit.`
    } else {
      text = `Rolled ${total}. Point remains ${point}.`
    }

    if (won === true) {
      const winnings = amount * payoutMultiplier
      setBalance((value) => value + winnings)
      play('win')
      text += payoutMultiplier > 1 ? ` You win DOUBLE ($${winnings})!` : ' You win.'
    } else if (won === false) {
      setBalance((value) => value - amount)
      play('lose')
      text += ' Wager lost.'
    }

    setMessage(text)
    setRolling(false)
    isRollingActive.current = false
  }

  return (
    <main
      className="craps-page page-image"
      style={{ backgroundImage: `url('${import.meta.env.BASE_URL}images/julian-paefgen-uxU_jyu9e7U-unsplash.jpg')` }}
    >
      <div className="image-overlay" />
      <header className="product-nav product-nav-overlay">
        <Link to="/" className="brand">
          PERSONAL SYSTEMS
        </Link>
        <nav>
          <Link className="current" to="/craps">
            Craps
          </Link>
          <Link to="/dashboard">Dashboard</Link>
        </nav>
        <span className="status-badge">TABLE 04</span>
      </header>
      <section className="craps-layout-new">
        <div className="craps-main-new">
          <div className="table-header">
            <div>
              <p className="eyebrow">LIVE TABLE / PASS LINE</p>
              <h1>Computerized Craps</h1>
            </div>
            <div className="table-header-rules-group">
              <button
                type="button"
                onClick={() => setShowRules(true)}
                className="rules-button"
              >
                ⓘ How to Play
              </button>
              <div className="point-display">
                <small>POINT</small>
                <strong>{point ?? 'OFF'}</strong>
              </div>
            </div>
          </div>
          <div
            className="felt-table"
            style={{
              position: 'relative',
              backgroundColor: 'rgba(6, 19, 16, .72)',
              backgroundImage: `url('${import.meta.env.BASE_URL}images/dice-on-craps-table-2260559.jpg')`,
              backgroundBlendMode: 'multiply',
            }}
          >
            <div className="roll-status">
              <span className={rolling ? 'pulse-dot' : 'live-dot'} />
              {rolling ? 'Rolling dice' : phase === 'point' ? `Point ${point}` : 'Come-out roll'}
            </div>

            {/* 3D DICE CONTAINER */}
            <div id="dice-container" className="dice-container-felt" />

            <p
              className={`game-message${message.toLowerCase().includes('win')
                ? ' win-message'
                : message.toLowerCase().includes('lost')
                  ? ' lose-message'
                  : ''
                }`}
              role="status"
            >
              {message}
            </p>
            <button
              className="roll-button"
              type="button"
              onClick={roll}
              disabled={rolling || balance < amount || !diceReady}
            >
              {rolling ? 'Rolling...' : !diceReady ? 'Loading 3D Engine...' : 'Roll dice'} <span>↗</span>
            </button>
          </div>
          <div className="table-metrics">
            <div>
              <small>Last roll</small>
              <strong>
                {dice[0]} + {dice[1]} = {dice[0] + dice[1]}
              </strong>
            </div>
            <div>
              <small>Session</small>
              <strong>Come-out {phase === 'comeout' ? 'active' : 'in play'}</strong>
            </div>
          </div>
        </div>
        <aside className="craps-sidebar-new">
          <div className="balance-panel">
            <small>AVAILABLE BALANCE</small>
            <strong>${balance.toLocaleString()}</strong>
            <span className={balance >= 1000 ? 'positive' : 'negative'}>
              {balance >= 1000 ? '+$0.00' : `-$${(1000 - balance).toFixed(2)}`} session P/L
            </span>
          </div>
          <BettingTable
            selectedBet={bet}
            onSelectBet={(value) => {
              setBet(value as BetType)
              play('chip')
            }}
            amount={amount}
            onAmountChange={setAmount}
            disabled={rolling || phase === 'point'}
          />
        </aside>
      </section>

      {showRules && <RulesModal onClose={() => setShowRules(false)} />}
    </main>
  )
}

function RulesModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="rules-modal-overlay" onClick={onClose}>
      <div className="rules-modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="rules-close-button" onClick={onClose} aria-label="Close rules">
          ✕
        </button>

        <p className="rules-eyebrow">Craps 101</p>
        <h2 className="rules-title">How to Play Craps</h2>

        <RuleSection title=" The Objective">
          Players bet on the outcome of a two-dice roll. One player (the "shooter") throws the dice,
          and the round unfolds through two distinct phases. You place your bets on the table before
          each roll.
        </RuleSection>

        <RuleSection title=" Phase 1 — The Come-Out Roll">
          The round begins with the come-out roll (the puck shows <b>OFF</b>).
          <ul>
            <li>Roll a <b>7 or 11</b> → Pass Line <b>wins</b> instantly.</li>
            <li>Roll a <b>2, 3, or 12</b> (Craps) → Pass Line <b>loses</b>.</li>
            <li>Roll a <b>4, 5, 6, 8, 9, or 10</b> → That number becomes <b>The Point</b>.</li>
          </ul>
        </RuleSection>

        <RuleSection title=" Phase 2 — The Point Phase">
          Once a point is set, the shooter keeps rolling until one of two outcomes occurs:
          <ul>
            <li>The <b>Point</b> is rolled again → Pass Line <b>wins</b>. </li>
            <li>A <b>7</b> is rolled first ("Seven Out") → Pass Line <b>loses</b>. </li>
          </ul>
        </RuleSection>

        <div className="rules-divider" />

        <h3 className="rules-subtitle">Available Bets</h3>

        <BetCard
          name="Pass Line"
          edge="1.41%"
          desc="The classic bet. Wins on 7/11 come-out or if the point is hit again before a 7."
        />
        <BetCard
          name="Don't Pass"
          edge="1.36%"
          desc="The opposite of Pass Line. Wins on 2/3 come-out, or if a 7 is rolled before the point. A 12 is a push (tie)."
        />
        <BetCard
          name="Field Bet"
          edge="~5.5%"
          desc="One-roll bet. Wins on 2, 3, 4, 9, 10, 11, 12. Rolls of 2 or 12 pay double (2:1)."
        />
        <BetCard
          name="Place 6 / Place 8"
          edge="1.52%"
          desc="Bet that a 6 (or 8) will roll before a 7. Stays active over multiple rolls until you win or a 7 appears."
        />

        <div className="rules-pro-tip">
          <b> Pro Tip:</b> Pass Line and Don't Pass have the lowest house edge in the casino. Stick with these while you learn, and avoid one-roll prop bets in the center of the table.
        </div>

        <button className="rules-action-button" onClick={onClose}>
          Got it — Let's Play
        </button>
      </div>
    </div>
  )
}

function RuleSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rules-section">
      <h3 className="rules-section-title">{title}</h3>
      <div className="rules-section-content">{children}</div>
    </div>
  )
}

function BetCard({ name, edge, desc }: { name: string; edge: string; desc: string }) {
  return (
    <div className="bet-card">
      <div className="bet-card-header">
        <b className="bet-card-title">{name}</b>
        <span className="bet-card-badge">House Edge {edge}</span>
      </div>
      <div className="bet-card-desc">{desc}</div>
    </div>
  )
}

export default Craps