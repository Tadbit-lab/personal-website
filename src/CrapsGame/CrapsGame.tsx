import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import Dice from './Dice'
import StatsTable from './StatsTable'
import RollButton from './RollButton'
import './CrapsGame.css'

/* ===========================
   TYPES
   =========================== */

type BetType = 'pass' | 'dontpass'
type Phase = 'comeout' | 'point'
type MessageType = 'neutral' | 'win' | 'lose' | 'point'

interface HistoryEntry {
  roll: number
  die1: number
  die2: number
  result: 'win' | 'loss' | 'point'
  betType: BetType
}

/* ===========================
   COMPONENT
   =========================== */

function CrapsGame() {
  // Dice state
  const [die1, setDie1] = useState(1)
  const [die2, setDie2] = useState(1)
  const [rolling, setRolling] = useState(false)

  // Game state
  const [phase, setPhase] = useState<Phase>('comeout')
  const [pointNumber, setPointNumber] = useState<number | null>(null)
  const [betType, setBetType] = useState<BetType>('pass')
  const [betAmount, setBetAmount] = useState(10)
  const [balance, setBalance] = useState(1000)

  // Stats
  const [totalRolls, setTotalRolls] = useState(0)
  const [wins, setWins] = useState(0)
  const [losses, setLosses] = useState(0)
  const [currentStreak, setCurrentStreak] = useState(0)
  const [streakType, setStreakType] = useState<'win' | 'loss' | 'none'>('none')

  // UI
  const [message, setMessage] = useState('Place your bet and roll the dice.')
  const [messageType, setMessageType] = useState<MessageType>('neutral')
  const [history, setHistory] = useState<HistoryEntry[]>([])

  /* ===========================
     AUDIO LOGIC
     =========================== */
  const diceSound = useRef<HTMLAudioElement | null>(null)
  const winSound = useRef<HTMLAudioElement | null>(null)
  const loseSound = useRef<HTMLAudioElement | null>(null)
  const welcomeSound = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    diceSound.current = new Audio('/crapsgame/sounds/dice-roll.mp3')
    winSound.current = new Audio('/crapsgame/sounds/win.mp3')
    loseSound.current = new Audio('/crapsgame/sounds/lose.mp3')
    welcomeSound.current = new Audio('/crapsgame/sounds/welcome.mp3')

    // Play welcome on mount
    welcomeSound.current.play().catch(e => console.error('Sound not found or autoplay prevented:', e))
  }, [])

  const stopAllSounds = useCallback(() => {
    [diceSound, winSound, loseSound, welcomeSound].forEach(ref => {
      if (ref.current) {
        ref.current.pause()
        ref.current.currentTime = 0
      }
    })
  }, [])

  /* ===========================
     ROLL LOGIC — Accurate Craps Rules
     =========================== */

  const rollDice = useCallback(() => {
    if (rolling) return

    const clampedBet = Math.max(1, Math.min(betAmount, balance))
    if (clampedBet > balance || balance <= 0) {
      setMessage('Insufficient balance.')
      setMessageType('lose')
      return
    }

    setRolling(true)
    stopAllSounds()
    if (diceSound.current) {
      diceSound.current.play().catch(e => console.error('Sound not found or autoplay prevented:', e))
    }

    // Simulate roll delay
    setTimeout(() => {
      const d1 = Math.floor(Math.random() * 6) + 1
      const d2 = Math.floor(Math.random() * 6) + 1
      const total = d1 + d2

      setDie1(d1)
      setDie2(d2)
      setTotalRolls(prev => prev + 1)
      setRolling(false)

      let rollResult: 'win' | 'loss' | 'point'

      if (phase === 'comeout') {
        /* ---- COME OUT ROLL ---- */
        if (total === 7 || total === 11) {
          // Natural: Pass wins, Don't Pass loses
          if (betType === 'pass') {
            rollResult = 'win'
            handleWin(clampedBet, `Natural ${total}! Pass Line wins.`)
          } else {
            rollResult = 'loss'
            handleLoss(clampedBet, `Natural ${total}. Don't Pass loses.`)
          }
        } else if (total === 2 || total === 3) {
          // Craps (2, 3): Pass loses, Don't Pass wins
          if (betType === 'pass') {
            rollResult = 'loss'
            handleLoss(clampedBet, `Craps ${total}. Pass Line loses.`)
          } else {
            rollResult = 'win'
            handleWin(clampedBet, `Craps ${total}! Don't Pass wins.`)
          }
        } else if (total === 12) {
          // 12: Pass loses, Don't Pass pushes (tie)
          if (betType === 'pass') {
            rollResult = 'loss'
            handleLoss(clampedBet, `Craps 12. Pass Line loses.`)
          } else {
            rollResult = 'point' // push — no win/loss
            setMessage(`Rolled 12. Don't Pass pushes (tie). Roll again.`)
            setMessageType('point')
          }
        } else {
          // Point established (4, 5, 6, 8, 9, 10)
          rollResult = 'point'
          setPointNumber(total)
          setPhase('point')
          setMessage(`Point is ${total}. Roll again to hit it (or 7 out).`)
          setMessageType('point')
        }
      } else {
        /* ---- POINT PHASE ---- */
        if (total === pointNumber) {
          // Hit the point: Pass wins, Don't Pass loses
          if (betType === 'pass') {
            rollResult = 'win'
            handleWin(clampedBet, `Hit the point ${total}! Pass Line wins.`)
          } else {
            rollResult = 'loss'
            handleLoss(clampedBet, `Point ${total} hit. Don't Pass loses.`)
          }
          setPhase('comeout')
          setPointNumber(null)
        } else if (total === 7) {
          // Seven out: Pass loses, Don't Pass wins
          if (betType === 'pass') {
            rollResult = 'loss'
            handleLoss(clampedBet, `Seven out! Pass Line loses.`)
          } else {
            rollResult = 'win'
            handleWin(clampedBet, `Seven out! Don't Pass wins.`)
          }
          setPhase('comeout')
          setPointNumber(null)
        } else {
          // Neither point nor 7 — keep rolling
          rollResult = 'point'
          setMessage(`Rolled ${total}. Point is still ${pointNumber}. Roll again.`)
          setMessageType('neutral')
        }
      }

      setHistory(prev => [{
        roll: total,
        die1: d1,
        die2: d2,
        result: rollResult,
        betType,
      }, ...prev].slice(0, 50))
    }, 500)
  }, [rolling, betAmount, balance, phase, betType, pointNumber])

  /* ===========================
     WIN / LOSS HANDLERS
     =========================== */

  const handleWin = useCallback((amount: number, msg: string) => {
    setBalance(prev => prev + amount)
    setWins(prev => prev + 1)
    setMessage(msg)
    setMessageType('win')
    setCurrentStreak(prev => streakType === 'win' ? prev + 1 : 1)
    setStreakType('win')
    stopAllSounds()
    if (winSound.current) winSound.current.play().catch(e => console.error('Sound not found or autoplay prevented:', e))
  }, [streakType, stopAllSounds])

  const handleLoss = useCallback((amount: number, msg: string) => {
    setBalance(prev => prev - amount)
    setLosses(prev => prev + 1)
    setMessage(msg)
    setMessageType('lose')
    setCurrentStreak(prev => streakType === 'loss' ? prev + 1 : 1)
    setStreakType('loss')
    stopAllSounds()
    if (loseSound.current) loseSound.current.play().catch(e => console.error('Sound not found or autoplay prevented:', e))
  }, [streakType, stopAllSounds])

  /* ===========================
     RESET
     =========================== */

  const resetGame = useCallback(() => {
    setDie1(1)
    setDie2(1)
    setPhase('comeout')
    setPointNumber(null)
    setBalance(1000)
    setTotalRolls(0)
    setWins(0)
    setLosses(0)
    setCurrentStreak(0)
    setStreakType('none')
    setMessage('Place your bet and roll the dice.')
    setMessageType('neutral')
    setHistory([])
  }, [])

  /* ===========================
     MEMOIZED HISTORY LIST
     =========================== */

  const recentHistory = useMemo(() => history.slice(0, 20), [history])

  /* ===========================
     RENDER
     =========================== */

  return (
    <div className="craps-game-wrapper" style={{
      backgroundImage: "url('/crapsgame/images/dice-on-craps-table-2260559.jpg')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      position: 'relative'
    }}>
      <div className="craps-overlay" style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        zIndex: 0
      }}></div>
      <div className="craps-game" style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div className="craps-header">
        <h1>Craps Simulator</h1>
        <p>Accurate Pass Line and Don&apos;t Pass rules</p>
      </div>

      <div className="craps-layout">
        {/* ---- Main Column ---- */}
        <div className="craps-main">
          {/* Phase indicator */}
          <div className="phase-indicator">
            Phase: <span className="phase-value">
              {phase === 'comeout' ? 'COME OUT' : `POINT — ${pointNumber}`}
            </span>
          </div>

          {/* Dice */}
          <div className="dice-area">
            <Dice value={die1} rolling={rolling} />
            <Dice value={die2} rolling={rolling} />
          </div>

          {/* Message */}
          <div className={`craps-message ${messageType}`}>
            {message}
          </div>

          {/* Controls */}
          <div className="craps-controls">
            <div className="craps-bet-row">
              <div>
                <label htmlFor="craps-bet-type">Bet Type</label>
                <select
                  id="craps-bet-type"
                  value={betType}
                  onChange={(e) => setBetType(e.target.value as BetType)}
                  disabled={phase === 'point' || rolling}
                >
                  <option value="pass">Pass Line</option>
                  <option value="dontpass">Don&apos;t Pass</option>
                </select>
              </div>
              <div>
                <label htmlFor="craps-bet-amount">Bet Amount ($)</label>
                <input
                  type="number"
                  id="craps-bet-amount"
                  min={1}
                  max={balance}
                  value={betAmount}
                  onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 1))}
                  disabled={rolling}
                />
              </div>
            </div>

            <RollButton
              onRoll={rollDice}
              onReset={resetGame}
              disabled={balance <= 0}
              rolling={rolling}
            />
          </div>

          {/* History */}
          {recentHistory.length > 0 && (
            <div className="history-card">
              <h3>Roll History</h3>
              {recentHistory.map((entry, i) => (
                <div className="history-item" key={i}>
                  <span>
                    [{entry.die1}+{entry.die2}] = {entry.roll}
                    {' '}({entry.betType === 'pass' ? 'Pass' : "Don't Pass"})
                  </span>
                  <span style={{
                    color: entry.result === 'win'
                      ? 'var(--color-green)'
                      : entry.result === 'loss'
                        ? 'var(--color-red)'
                        : 'var(--text-muted)'
                  }}>
                    {entry.result === 'win' ? 'WIN' : entry.result === 'loss' ? 'LOSS' : '—'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ---- Sidebar ---- */}
        <div className="craps-sidebar">
          {/* Balance */}
          <div className="balance-display">
            <div className="balance-label">Balance</div>
            <div className="balance-value" style={{
              color: balance > 1000
                ? 'var(--color-green)'
                : balance < 1000
                  ? 'var(--color-red)'
                  : 'var(--text-primary)'
            }}>
              ${balance.toLocaleString()}
            </div>
          </div>

          {/* Stats */}
          <StatsTable
            totalRolls={totalRolls}
            wins={wins}
            losses={losses}
            currentStreak={currentStreak}
            streakType={streakType}
          />
        </div>
      </div>
    </div>
    </div>
  )
}

export default CrapsGame
