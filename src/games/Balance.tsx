import { useMemo, useState } from 'react'
import { Slider } from './Slider'
import { clamp } from '../learn/widgets/svg'
import { GameShell, Msg, useStats } from './ui'

interface W { m: number; x: number }
interface Puzzle { fixed: W[]; mass: number; answer: number }

function makePuzzle(level: number): Puzzle {
  for (;;) {
    const n = Math.min(1 + Math.floor((level - 1) / 2), 3)
    const fixed: W[] = []
    for (let i = 0; i < n; i++) {
      const x = (Math.floor(Math.random() * 10) + 1) * 0.5 * (Math.random() < 0.5 ? -1 : 1)
      fixed.push({ m: (1 + Math.floor(Math.random() * 6)) * 5, x })
    }
    const mass = (1 + Math.floor(Math.random() * 6)) * 5
    const sum = fixed.reduce((s, w) => s + w.m * w.x, 0)
    const x = -sum / mass
    if (Math.abs(x) >= 0.5 && Math.abs(x) <= 5 && Math.abs(x * 2 - Math.round(x * 2)) < 1e-9 && !fixed.some((w) => w.x === x)) return { fixed, mass, answer: x }
  }
}

export function Balance() {
  const [stats, record, reset] = useStats('balance')
  const [level, setLevel] = useState(1)
  const [p, setP] = useState(() => makePuzzle(1))
  const [x, setX] = useState(2)
  const [state, setState] = useState<'play' | 'won' | 'lost'>('play')
  const [hint, setHint] = useState(false)

  const net = useMemo(() => p.fixed.reduce((s, w) => s + w.m * w.x, 0) + p.mass * x, [p, x]) // + = right side down
  const tilt = clamp(net / 25, -12, 12)
  const next = (win: boolean) => { const l = win ? level + 1 : level; setLevel(l); setP(makePuzzle(l)); setX(2); setState('play'); setHint(false) }
  const check = () => {
    if (state !== 'play') return
    const ok = Math.abs(net) < 1e-6
    setState(ok ? 'won' : 'lost'); record(ok)
  }
  const cx = 320, cy = 175, sc = 54
  const block = (m: number, xx: number, key: string, mine = false) => {
    const w = 26 + m * 0.7, h = 16 + m * 0.9
    return (
      <g key={key} transform={`translate(${cx + xx * sc},${cy - 8})`}>
        <rect x={-w / 2} y={-h} width={w} height={h} className={`w-body ${mine ? 'alt' : ''}`} />
        <text y={-h / 2 + 4} textAnchor="middle" className="w-t sm">{m} kg</text>
      </g>
    )
  }
  return (
    <GameShell title="Balance the Beam" level={level} stats={stats} onReset={reset}
      how="The beam balances when the clockwise and counter-clockwise moments are equal (moment = weight × distance from the pivot). Place the orange weight so the beam sits level, then press Check.">
      <div className="card game-board">
        <svg viewBox="0 0 640 260" className="wsvg" role="img" aria-label="Beam balance puzzle">
          <polygon points={`${cx},${cy} ${cx - 20},${cy + 55} ${cx + 20},${cy + 55}`} className="w-body" />
          <g transform={`rotate(${tilt} ${cx} ${cy})`}>
            <rect x={cx - 5.4 * sc} y={cy - 8} width={10.8 * sc} height={8} className="w-body" />
            {Array.from({ length: 21 }, (_, i) => (i - 10) / 2).map((v) => (
              <g key={v}><line x1={cx + v * sc} x2={cx + v * sc} y1={cy} y2={cy + (Number.isInteger(v) ? 8 : 4)} className="w-axis" />{Number.isInteger(v) && v !== 0 && <text x={cx + v * sc} y={cy + 20} textAnchor="middle" className="w-t sm">{Math.abs(v)}</text>}</g>
            ))}
            {p.fixed.map((w, i) => block(w.m, w.x, `f${i}`))}
            {block(p.mass, x, 'mine', true)}
          </g>
        </svg>
        <div className="game-controls">
          <Slider label="Position" min={-5} max={5} step={0.5} value={x} onChange={setX} fmt={(v) => `${v > 0 ? 'right ' : v < 0 ? 'left ' : ''}${Math.abs(v)} m`} disabled={state !== 'play'} />
          <div className="tool-row">
            <button className="btn primary" onClick={check} disabled={state !== 'play'}>Check balance</button>
            <button className="btn" onClick={() => setHint(!hint)}>{hint ? 'Hide' : 'Show'} moments</button>
            {state !== 'play' && <button className="btn primary" onClick={() => next(state === 'won')}>{state === 'won' ? 'Next level' : 'Try another'}</button>}
          </div>
          {hint && <ul className="tips">{p.fixed.map((w, i) => <li key={i}>{w.m} kg × 9.81 × {Math.abs(w.x)} m on the {w.x < 0 ? 'left' : 'right'} = {(w.m * 9.81 * Math.abs(w.x)).toFixed(0)} N·m</li>)}<li>Your {p.mass} kg weight at distance d gives {(p.mass * 9.81).toFixed(1)} × d.</li></ul>}
          {state === 'won' && <Msg kind="good">Balanced. The moments cancel: ΣM = 0.</Msg>}
          {state === 'lost' && <Msg kind="bad">Not balanced: the {net > 0 ? 'right' : 'left'} side is heavier by {Math.abs(net * 9.81).toFixed(0)} N·m. The answer was {Math.abs(p.answer)} m on the {p.answer < 0 ? 'left' : 'right'}.</Msg>}
        </div>
      </div>
    </GameShell>
  )
}
