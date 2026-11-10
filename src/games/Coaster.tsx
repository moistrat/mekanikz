import { useMemo, useRef, useState } from 'react'
import { G } from '../sim/format'
import { useFrame } from '../learn/widgets/shared'
import { Slider } from './Slider'
import { Diff, GameShell, Msg, Props, useStats } from './ui'

interface Level { R: number; loss: number; attempts: number }
const makeLevel = (n: number, d: Diff): Level => ({
  R: d === 'hard' ? [2, 2.5, 3, 3.5, 4, 5][Math.floor(Math.random() * 6)] : [1.5, 2, 2.5, 3, 3.5, 4][Math.floor(Math.random() * 6)],
  loss: d === 'easy' ? 0 : d === 'hard' ? [0.15, 0.2, 0.25, 0.3][Math.min(3, Math.floor((n - 1) / 2))] : n < 2 ? 0 : [0.05, 0.1, 0.15][Math.min(2, Math.floor((n - 2) / 2))],
  attempts: d === 'hard' ? 3 : 99,
})

/** Track: straight ramp down, flat, then a full circular loop. Units: metres. */
function buildTrack(h: number, R: number) {
  const pts: { x: number; y: number; phi: number }[] = []
  const rampLen = 8
  for (let i = 0; i <= 40; i++) { const f = i / 40; pts.push({ x: f * rampLen, y: h * (1 - f * f * (3 - 2 * f)), phi: -1 }) }
  const flat = 4
  for (let i = 1; i <= 8; i++) pts.push({ x: rampLen + (i / 8) * flat, y: 0, phi: -1 })
  const cx = rampLen + flat
  for (let i = 1; i <= 120; i++) { const phi = (i / 120) * 2 * Math.PI; pts.push({ x: cx + R * Math.sin(phi), y: R * (1 - Math.cos(phi)), phi }) }
  for (let i = 1; i <= 10; i++) pts.push({ x: cx + (i / 10) * 5, y: 0, phi: -1 })
  return pts
}

export function Coaster({ difficulty, onDifficulty }: Props) {
  const [stats, record, reset] = useStats(`coaster.${difficulty}`)
  const [n, setN] = useState(1)
  const [lv, setLv] = useState(() => makeLevel(1, difficulty))
  const [h, setH] = useState(5)
  const [left, setLeft] = useState(lv.attempts)
  const [phase, setPhase] = useState<'ready' | 'run' | 'done'>('ready')
  const [res, setRes] = useState<{ ok: boolean; text: string; final: boolean } | null>(null)
  const prog = useRef(0)
  const [, tick] = useState(0)
  const hard = difficulty === 'hard'

  const track = useMemo(() => buildTrack(h, lv.R), [h, lv])
  const eff = h * (1 - lv.loss)
  const vAt = (y: number) => Math.sqrt(Math.max(0, 2 * G * (eff - y)))
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
  const efficient = h <= hMin * (hard ? 1.15 : 1.2)

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
      const win = outcome.ok && (!hard || efficient)
      const remaining = left - 1
      let text = outcome.ok ? (efficient ? 'Perfect run: a minimal, efficient launch height.' : 'Loop complete. Try a lower start for a more efficient design.') : outcome.why === 'stalled' ? 'The cart ran out of energy before the top.' : 'The cart fell off near the top: not enough speed to stay in contact with the track.'
      if (hard && outcome.ok && !efficient) text = `The loop works, but the start is ${(h / hMin * 100 - 100).toFixed(0)}% above the minimum. Real engineers cannot waste height: get within 15%.`
      const final = win || !hard || remaining <= 0
      setLeft(remaining)
      setRes({ ok: win, text, final })
      if (final) record(win)
    }
    tick((k) => k + 1)
  })
  const run = () => { prog.current = 0; setRes(null); setPhase('run') }
  const next = () => { const l = res?.ok ? n + 1 : n; const nl = makeLevel(l, difficulty); setN(l); setLv(nl); setLeft(nl.attempts); setPhase('ready'); setRes(null); prog.current = 0 }
  const cur = track[Math.min(Math.floor(prog.current), track.length - 1)]
  const speed = phase === 'ready' ? 0 : vAt(cur.y)
  return (
    <GameShell title="Loop the Loop" level={n} stats={stats} onReset={reset} difficulty={difficulty} onDifficulty={onDifficulty}
      factors={hard ? ['Friction and air drag', `${lv.attempts} attempts per track`, 'Must be efficient (within 15%)'] : undefined}
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
          <Slider label="Start height" min={1} max={25} step={0.1} value={h} onChange={setH} fmt={(v) => `${v.toFixed(1)} m`} disabled={phase === 'run'} />
          <div className="tool-row">
            <button className="btn primary" onClick={run} disabled={phase === 'run' || (phase === 'done' && !!res?.final)}>{phase === 'done' ? `Run again${hard ? ` (${left} left)` : ''}` : 'Release'}</button>
            {phase === 'done' && res?.final && <button className="btn primary" onClick={next}>{res?.ok ? 'Next level' : 'New loop'}</button>}
          </div>
          {lv.loss > 0 && <p className="hint">{hard ? 'Rolling friction and air drag' : 'Friction'} waste {(lv.loss * 100).toFixed(0)}% of the starting energy on the way to the loop.</p>}
          {difficulty === 'easy' && <p className="hint">Hint: with no friction the minimum height is exactly 2.5 R = {(2.5 * lv.R).toFixed(1)} m. Why 2.5? Energy at the top needs ½ m v² ≥ ½ m g R, plus the 2R climb.</p>}
          {phase !== 'ready' && <p className="hint">Speed now: {speed.toFixed(1)} m/s at {cur.y.toFixed(1)} m height.</p>}
          {res && <Msg kind={res.ok ? 'good' : 'bad'}>{res.text}{!res.ok && res.final && ` Minimum height for this loop is about ${hMin.toFixed(1)} m (h = 2.5 R${lv.loss ? ' plus losses' : ''}).`}</Msg>}
        </div>
      </div>
    </GameShell>
  )
}
