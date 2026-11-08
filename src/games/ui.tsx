import { ReactNode, useState } from 'react'
import { load, save } from '../state/storage'

export interface Stats { played: number; won: number; streak: number; best: number }
const EMPTY: Stats = { played: 0, won: 0, streak: 0, best: 0 }

export function useStats(key: string): [Stats, (win: boolean) => void, () => void] {
  const k = `mekanikz.game.${key}`
  const [s, setS] = useState<Stats>(() => load(k, EMPTY))
  const record = (win: boolean) => {
    const next: Stats = { played: s.played + 1, won: s.won + (win ? 1 : 0), streak: win ? s.streak + 1 : 0, best: Math.max(s.best, win ? s.streak + 1 : 0) }
    setS(next); save(k, next)
  }
  const reset = () => { setS(EMPTY); save(k, EMPTY) }
  return [s, record, reset]
}

export function GameShell({ title, how, stats, onReset, level, children }: {
  title: string; how: string; stats: Stats; onReset: () => void; level?: number; children: ReactNode
}) {
  return (
    <div className="page game">
      <div className="game-head">
        <div>
          <a className="link small" href="#/games">All games</a>
          <h1>{title}{level ? <span className="lvl">Level {level}</span> : null}</h1>
          <p className="muted" style={{ maxWidth: '62ch' }}>{how}</p>
        </div>
        <div className="scoreboard card">
          <div><b>{stats.won}</b><small>/ {stats.played} solved</small></div>
          <div><b>{stats.streak}</b><small>streak</small></div>
          <div><b>{stats.best}</b><small>best</small></div>
          <button className="btn ghost" onClick={onReset}>Reset</button>
        </div>
      </div>
      {children}
    </div>
  )
}

export function Msg({ kind, children }: { kind: 'good' | 'bad' | 'info'; children: ReactNode }) {
  return <p className={`game-msg ${kind}`}>{children}</p>
}
