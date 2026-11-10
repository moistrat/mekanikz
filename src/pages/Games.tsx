import { ReactNode, useState } from 'react'
import { Balance } from '../games/Balance'
import { Cannon } from '../games/Cannon'
import { Coaster } from '../games/Coaster'
import { GearTrain } from '../games/GearTrain'
import { HangSign } from '../games/HangSign'
import { Sprint } from '../games/Sprint'
import { SpringRig } from '../games/SpringRig'
import { load, save } from '../state/storage'
import { Diff, DIFFS, Props, Stats } from '../games/ui'

interface GameDef { id: string; title: string; topic: string; blurb: string; icon: ReactNode; view?: (p: Props) => ReactNode; href?: string }

const I = (d: string) => (
  <svg viewBox="0 0 48 48" width="40" height="40" aria-hidden><path d={d} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
)

const GAMES: GameDef[] = [
  { id: 'bridge', title: 'Bridge Builder', topic: 'Statics, trusses', blurb: 'Design a truss that carries the load within budget. Watch every member go into tension or compression.', icon: I('M4 34h40M4 34l10-14 10 14 10-14 10 14M14 20h20'), href: '#/sandbox' },
  { id: 'balance', title: 'Balance the Beam', topic: 'Moments', blurb: 'Place a weight so the beam sits level. Equal moments on both sides.', icon: I('M24 14v20M14 34h20M6 22l18-8 18 8M10 22v6M38 22v6'), view: (p) => <Balance {...p} /> },
  { id: 'sign', title: 'Hang the Sign', topic: 'Equilibrium, vectors', blurb: 'Set cable tensions so every force cancels and the sign stops drifting.', icon: I('M6 8h36M10 8l14 16M38 8L24 24M14 24h20v12H14z'), view: (p) => <HangSign {...p} /> },
  { id: 'cannon', title: 'Cannon Range', topic: 'Projectiles', blurb: 'Choose angle and speed to hit targets near and far, over walls and onto platforms.', icon: I('M6 38c8-24 28-24 36 0M6 38h36M34 40a2 2 0 100 .1'), view: (p) => <Cannon {...p} /> },
  { id: 'coaster', title: 'Loop the Loop', topic: 'Energy', blurb: 'Find the lowest release height that still carries the cart around the loop.', icon: I('M6 10l10 18h8a8 8 0 100-.1M24 28h18'), view: (p) => <Coaster {...p} /> },
  { id: 'spring', title: 'Spring Rig', topic: 'Springs, vibration', blurb: 'Combine springs in series and parallel, then design a suspension that rides well loaded or empty.', icon: I('M10 6h28M24 6v4l-9 3 18 5-18 5 18 5-9 3v6M12 42h24'), view: (p) => <SpringRig {...p} /> },
  { id: 'gears', title: 'Gear Train', topic: 'Machines', blurb: 'Choose tooth counts for the exact ratio and direction the machine demands.', icon: I('M18 12l2 4 4 0 2-4 3 1 0 4 3 2 4-1 1 3-3 3 0 4 3 3-1 3-4 1-3 2 0 4-3 1-2-4-4 0-2 4-3-1 0-4-3-2-4 1-1-3 3-3 0-4-3-3 1-3 4-1 3-2 0-4z'), view: (p) => <GearTrain {...p} /> },
  { id: 'sprint', title: 'Concept Sprint', topic: 'Whole course', blurb: 'Sixty seconds of rapid-fire questions drawn from every lesson. Build a streak.', icon: I('M24 8a16 16 0 100 .1M24 16v9l6 4M20 4h8'), view: (p) => <Sprint {...p} /> },
]

function Host({ g }: { g: GameDef }) {
  const key = `mekanikz.diff.${g.id}`
  const [d, setD] = useState<Diff>(() => { const v = load<string>(key, 'normal'); return (DIFFS.some((x) => x.id === v) ? v : 'normal') as Diff })
  return <div key={d}>{g.view!({ difficulty: d, onDifficulty: (x) => { save(key, x); setD(x) } })}</div>
}

export function Games({ game }: { game?: string }) {
  const g = GAMES.find((x) => x.id === game && x.view)
  if (g) return <Host key={g.id} g={g} />
  return (
    <div className="page games">
      <p className="eyebrow">Games and challenges</p>
      <h1 className="games-h">Learn by playing</h1>
      <p className="lead" style={{ maxWidth: '60ch' }}>Each game turns one idea from the course into a puzzle with instant feedback. Pick Easy for ideal physics, Normal for standard problems, or Real world for friction, drag, wind, loads and tolerances.</p>
      <div className="game-grid">
        {GAMES.map((x) => {
          const all = DIFFS.map((d) => load<Stats | null>(`mekanikz.game.${x.id}.${d.id}`, null)).filter(Boolean) as Stats[]
          const s = all.length ? { won: all.reduce((a, b) => a + b.won, 0), best: Math.max(...all.map((b) => b.best)) } : null
          return (
            <a key={x.id} className="game-card card" href={x.href ?? `#/games/${x.id}`}>
              <div className="game-icon">{x.icon}</div>
              <p className="eyebrow">{x.topic}</p>
              <h3>{x.title}</h3>
              <p className="muted">{x.blurb}</p>
              {s && <p className="small muted">Solved {s.won} · best streak {s.best}</p>}
              <span className="btn primary">Play</span>
            </a>
          )
        })}
      </div>
    </div>
  )
}
