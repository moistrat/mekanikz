import { useMemo, useRef, useState } from 'react'
import { G } from '../sim/format'
import { useFrame } from '../learn/widgets/shared'
import { Slider } from './Slider'
import { GameShell, Msg, useStats } from './ui'

interface Level { R: number; loss: number }
const makeLevel = (n: number): Level => ({ R: [1.5, 2, 2.5, 3, 3.5, 4][Math.floor(Math.random() * 6)], loss: n < 2 ? 0 : [0.05, 0.1, 0.15][Math.min(2, Math.floor((n - 2) / 2))] })

/** Track: straight ramp down, flat, then a full circular loop. Units: metres. Points carry height and loop angle. */
function buildTrack(h: number, R: number) {
  const pts: { x: number; y: number; phi: number }[] = []
  const rampLen = 8
  for (let i = 0; i <= 40; i++) { const f = i / 40; pts.push({ x: f * rampLen, y: h * (1 - f * f * (3 - 2 * f)) * 1 + 0, phi: -1 }) }
  const flat = 4
  for (let i = 1; i <= 8; i++) pts.push({ x: rampLen + (i / 8) * flat, y: 0, phi: -1 })
  const cx = rampLen + flat
  for (let i = 1; i <= 120; i++) { const phi = (i / 120) * 2 * Math.PI; pts.push({ x: cx + R * Math.sin(phi), y: R * (1 - Math.cos(phi)), phi }) }
  for (let i = 1; i <= 10; i++) pts.push({ x: cx + (i / 10) * 5, y: 0, phi: -1 })
  return pts
}

export function Coaster() {
  const [stats, record, reset] = useStats('coaster')
  const [n, setN] = useState(1)
  const [lv, setLv] = useState(() => makeLevel(1))
  const [h, setH] = useState(5)
  const [phase, setPhase] = useState<'ready' | 'run' | 'done'>('ready')
  const [res, setRes] = useState<{ ok: boolean; text: string } | null>(null)
  const prog = useRef(0)
  const [, tick] = useState(0)

  const track = useMemo(() => buildTrack(h, lv.R), [h, lv])
  const eff = h * (1 - lv.loss) // effective energy height after friction losses over the run
  const vAt = (y: number) => Math.sqrt(Math.max(0, 2 * G * (eff - y)))

  // Precompute outcome: first loop angle where the normal force goes to zero
  const outcome = useMemo(() => {
    for (let i = 1; i <= 120; i++) {
      const phi = (i / 120) * 2 * Math.PI
      const y = lv.R * (1 - Math.cos(phi))
      const v2 = 2 * G * (eff - y)
      if (v2 < 0) return { ok: false, phi, why: 'stalled' as const }
      if (v2 / lv.R + G * Math.cos(phi) < 0) return { ok: false, phi, why: 'fell' as const }
    }
    return { ok: true, phi: 2 * Math.PI, why: 'ok' as const }
  }, [eff, lv])
  const hMin = (2.5 * lv.R) / (1 - lv.loss)

  const S = 30, ox = 62, oy = 250
  const X = (m: number) => ox + m * S, Y = (m: number) => oy - m * S
  const stopIndex = outcome.ok ? track.length - 1 : track.findIndex((p) => p.phi >= outcome.phi)
  useFrame((dt) => {
    if (phase !== 'run') return
    const i = Math.floor(prog.current)
    const y = track[Math.min(i, track.length - 1)].y
    const v = Math.max(1.5, vAt(y))
    const seg = i < track.length - 1 ? Math.hypot(track[i + 1].x - track[i].x, track[i + 1].y - track[i].y) : 1
    prog.current += (v * dt * 2.2) / Math.max(seg, 0.05)
    if (prog.current >= stopIndex) {
      prog.current = stopIndex
      setPhase('done')
      const near = h <= hMin * 1.2
      const text = outcome.ok ? (near ? 'Perfect run: a minimal, efficient launch height.' : 'Loop complete. Try a lower start for a more efficient design.') : outcome.why === 'stalled' ? 'The cart ran out of energy before the top.' : 'The cart fell off near the top: there was not enough speed to stay in contact with the track.'
      setRes({ ok: outcome.ok, text })
      record(outcome.ok)
    }
    tick((k) => k + 1)
  })
  const run = () => { prog.current = 0; setRes(null); setPhase('run') }
  const next = () => { const l = res?.ok ? n + 1 : n; setN(l); setLv(makeLevel(l)); setPhase('ready'); setRes(null); prog.current = 0 }
  const cur = track[Math.min(Math.floor(prog.current), track.length - 1)]
  const speed = phase === 'ready' ? 0 : vAt(cur.y)
  return (
    <GameShell title="Loop the Loop" level={n} stats={stats} onReset={reset}
      how="Choose how high to release the cart. Gravity converts height into speed (m g h = ½ m v²). At the top of the loop it needs v² ≥ g R to stay on the track. Too low and it falls off, so find the lowest safe height."
    >
      <div className="card game-board">
        <svg viewBox="0 0 640 270" className="wsvg" role="img" aria-label="Roller coaster loop">
          <polyline points={track.map((p) => `${X(p.x)},${Y(p.y)}`).join(' ')} className="w-pipe thick" style={{ strokeWidth: 4 }} />
          <line x1={X(0)} x2={X(0)} y1={Y(0)} y2={Y(h)} className="w-ref" />
          <text x={X(0) - 14} y={Y(h) + 4} textAnchor="end" className="w-t sm">{h.toFixed(1)} m</text>
          <text x={X(12) + 4 + lv.R * S} y={Y(lv.R) - 4} className="w-t sm">R = {lv.R} m</text>
          <circle cx={X(cur.x)} cy={Y(cur.y) - 8} r={8} className="w-dot" />
        </svg>
        <div className="game-controls">
          <Slider label="Start height" min={1} max={20} step={0.1} value={h} onChange={setH} fmt={(v) => `${v.toFixed(1)} m`} disabled={phase === 'run'} />
          <div className="tool-row">
            <button className="btn primary" onClick={run} disabled={phase === 'run'}>{phase === 'done' ? 'Run again' : 'Release'}</button>
            {phase === 'done' && <button className="btn" onClick={next}>{res?.ok ? 'Next level' : 'New loop'}</button>}
          </div>
          {lv.loss > 0 && <p className="hint">Friction wastes {(lv.loss * 100).toFixed(0)}% of the starting energy on the way to the loop.</p>}
          {phase !== 'ready' && <p className="hint">Speed now: {speed.toFixed(1)} m/s at {cur.y.toFixed(1)} m height.</p>}
          {res && <Msg kind={res.ok ? 'good' : 'bad'}>{res.text}{!res.ok && ` Minimum height for this loop is about ${hMin.toFixed(1)} m (h = 2.5 R${lv.loss ? ' plus friction' : ''}).`}</Msg>}
        </div>
      </div>
    </GameShell>
  )
}
