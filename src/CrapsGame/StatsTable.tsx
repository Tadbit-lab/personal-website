import React, { useMemo } from 'react'

interface StatsTableProps {
  totalRolls: number
  wins: number
  losses: number
  currentStreak: number
  streakType: 'win' | 'loss' | 'none'
}

/**
 * Displays game statistics: total rolls, win/loss ratio, current streak.
 * Uses useMemo for the ratio calculation to avoid unnecessary re-renders.
 */
const StatsTable: React.FC<StatsTableProps> = ({
  totalRolls,
  wins,
  losses,
  currentStreak,
  streakType,
}) => {
  const winLossRatio = useMemo(() => {
    if (losses === 0 && wins === 0) return '—'
    if (losses === 0) return `${wins}:0`
    return `${wins}:${losses}`
  }, [wins, losses])

  const winRate = useMemo(() => {
    const total = wins + losses
    if (total === 0) return '—'
    return `${((wins / total) * 100).toFixed(1)}%`
  }, [wins, losses])

  const streakDisplay = useMemo(() => {
    if (currentStreak === 0) return '—'
    const prefix = streakType === 'win' ? 'W' : 'L'
    return `${prefix}${currentStreak}`
  }, [currentStreak, streakType])

  return (
    <div className="stats-card">
      <h3>Statistics</h3>
      <div className="stats-row">
        <span className="stats-label">Total Rolls</span>
        <span className="stats-value">{totalRolls}</span>
      </div>
      <div className="stats-row">
        <span className="stats-label">Win / Loss</span>
        <span className="stats-value">{winLossRatio}</span>
      </div>
      <div className="stats-row">
        <span className="stats-label">Win Rate</span>
        <span className="stats-value">{winRate}</span>
      </div>
      <div className="stats-row">
        <span className="stats-label">Streak</span>
        <span className="stats-value" style={{
          color: streakType === 'win'
            ? 'var(--color-green)'
            : streakType === 'loss'
              ? 'var(--color-red)'
              : undefined
        }}>
          {streakDisplay}
        </span>
      </div>
    </div>
  )
}

export default StatsTable
