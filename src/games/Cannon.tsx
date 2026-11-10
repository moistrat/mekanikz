import { useMemo, useRef, useState } from 'react'
import { Env, simulate, VACUUM, DT, Wall } from '../sim/ballistics'
import { useFrame } from '../learn/widgets/shared'
import { Arrow } from '../learn/widgets/svg'
import { Slider } from './Slider'
import { Diff, GameShell, Msg, Props, useStats } from './ui'

interface Level { dist: number; ty: number; wall?: Wall; env: Env; radius: number; shots: number }
function makeLevel(n: number, d: Diff): Level {
  const hard = d === 'hard', easy = d === 'easy'
  const dist = Math.min(150, Math.round((hard ? 35 : 25) + Math.random() * 20 + n * (hard ? 8 : 6)))
  const ty = easy ? 0 : n >= (hard ? 2 : 3) ? 3 + Math.floor(Math.random() * 4) * 2 : 0
  const wall = !easy && n >= (hard ? 2 : 4) ? { x: Math.round(dist * (0.35 + Math.random() * 0.25)), h: 6 + Math.floor(Math.random() * 5) } : undefined
  const env: Env = hard ? { drag: 0.0015, wind: Math.round((Math.random() * 12 - 6) * 2) / 2 } : VACUUM
  return { dist, ty, wall, env, radius: easy ? 4 : hard ? 2 : 2.5, shots: easy ? 8 : hard ? 4 : 5 }
}

export function Cannon({ difficulty, onDifficulty }: Props) {
  const [stats, record, reset] = useStats(`cannon.${difficulty}`)
  const [n, setN] = useState(1)
  const [lv, setLv] = useState(() => makeLevel(1, difficulty))
  const [v0, setV0] = useState(25), [ang, setAng] = useState(40)
  const [shots, setShots] = useState(lv.shots)
  const [phase, setPhase] = useState<'aim' | 'flying' | 'hit' | 'miss' | 'out'>('aim')
  const [msg, setMsg] = useState('')
  const [t, setT] = useState(0)
  const flight = useRef<ReturnType<typeof simulate> | null>(null)
  const speed = 1.3

  const maxX = lv.dist * 1.3
  const sc = Math.min(590 / maxX, 1000)
  const X = (m: number) => 25 + m * sc, Y = (m: number) => 235 - m * sc

  useFrame((dt) => { if (phase === 'flying') setT((s) => Math.min(s + dt * speed, flight.current!.tEnd)) })

  const fire = () => {
    if (phase !== 'aim' && phase !== 'miss') return
    const fl = simulate(v0, ang, lv.ty, lv.env, lv.wall)
    flight.current = fl
    setShots((s) => s - 1)
    let result: 'hit' | 'miss' = 'miss', text = ''
    if (fl.hitWall) text = 'Crashed into the wall. Aim higher.'
    else if (fl.short) text = 'Too weak to reach the platform.'
    else if (Math.abs(fl.landX - lv.dist) <= lv.radius) { result = 'hit'; text = `Direct hit at ${fl.landX.toFixed(1)} m.` }
    else text = fl.landX < lv.dist ? `Short by ${(lv.dist - fl.landX).toFixed(1)} m.` : `Long by ${(fl.landX - lv.dist).toFixed(1)} m.`
    setT(0); setPhase('flying')
    const left = shots - 1
    window.setTimeout(() => { setMsg(text); setPhase(result === 'hit' ? 'hit' : left <= 0 ? 'out' : 'miss'); if (result === 'hit') record(true); else if (left <= 0) record(false) }, (Math.max(fl.tEnd, 0.2) / speed) * 1000 + 100)
  }
  const nextLevel = (won: boolean) => { const l = won ? n + 1 : n; const nl = makeLevel(l, difficulty); setN(l); setLv(nl); setShots(nl.shots); setPhase('aim'); setMsg(''); setT(0) }

  const preview = useMemo(() => {
    const fl = simulate(v0, ang, lv.ty, VACUUM)
    return fl.pts.map((p) => `${X(p.x)},${Y(p.y)}`).join(' ')
  }, [v0, ang, lv]) // eslint-disable-line react-hooks/exhaustive-deps
  const fl = flight.current
  const ball = fl && phase !== 'aim' ? fl.pts[Math.min(fl.pts.length - 1, Math.floor(t / DT))] : { x: 0, y: 0 }
  const trail = fl && phase !== 'aim' ? fl.pts.slice(0, Math.min(fl.pts.length, Math.floor(t / DT) + 1)).map((p) => `${X(p.x)},${Y(p.y)}`).join(' ') : ''
  const busy = phase === 'flying'
  const hard = difficulty === 'hard'
  return (
    <GameShell title="Cannon Range" level={n} stats={stats} onReset={reset} difficulty={difficulty} onDifficulty={onDifficulty}
      factors={hard ? ['Air drag', `Wind ${lv.env.wind === 0 ? 'calm' : `${Math.abs(lv.env.wind)} m/s ${lv.env.wind > 0 ? 'tailwind' : 'headwind'}`}`, 'Walls and platforms', `Only ${lv.shots} shots`] : undefined}
      how="Pick a launch speed and angle to land on the target. Horizontal speed is v cos θ and never changes in a vacuum, while vertical speed v sin θ is slowed by gravity. In Real world mode the air fights back, so the dotted vacuum path is only a rough guide.">
      <div className="card game-board">
        <svg viewBox="0 0 640 260" className="wsvg" role="img" aria-label="Cannon and target">
          <line x1={10} x2={630} y1={235} y2={235} className="w-axis" />
          {lv.ty > 0 && <rect x={X(lv.dist) - 30} y={Y(lv.ty)} width={60} height={235 - Y(lv.ty)} className="w-body" />}
          <circle cx={X(lv.dist)} cy={Y(lv.ty) - 8} r={Math.max(7, lv.radius * sc * 0.9)} className="target" /><circle cx={X(lv.dist)} cy={Y(lv.ty) - 8} r={4} className="target-in" />
          {lv.wall && <rect x={X(lv.wall.x) - 5} y={Y(lv.wall.h)} width={10} height={235 - Y(lv.wall.h)} className="w-body" />}
          {!busy && <polyline points={preview} className="w-curve alt" strokeDasharray="4 6" opacity={0.5} />}
          {phase !== 'aim' && <polyline points={trail} className="w-curve" opacity={0.8} />}
          <g transform={`rotate(${-ang} ${X(0)} ${Y(0)})`}><rect x={X(0)} y={Y(0) - 6} width={34} height={12} rx={3} className="w-body alt" /></g>
          <circle cx={X(0)} cy={Y(0)} r={9} className="w-body" />
          {phase !== 'aim' && <circle cx={X(ball.x)} cy={Y(ball.y)} r={5} className="w-dot" />}
          {hard && lv.env.wind !== 0 && <g><Arrow x1={320} y1={30} x2={320 + lv.env.wind * 10} y2={30} cls="alt" /><text x={320} y={18} textAnchor="middle" className="w-t sm">wind {lv.env.wind > 0 ? '+' : '−'}{Math.abs(lv.env.wind)} m/s</text></g>}
          <text x={X(lv.dist)} y={252} textAnchor="middle" className="w-t sm">{lv.dist} m{lv.ty ? `, up ${lv.ty} m` : ''}</text>
        </svg>
        <div className="game-controls">
          <Slider label="Speed" min={10} max={60} value={v0} onChange={setV0} fmt={(v) => `${v} m/s`} disabled={busy} />
          <Slider label="Angle" min={5} max={85} value={ang} onChange={setAng} fmt={(v) => `${v}°`} disabled={busy} />
          <div className="tool-row">
            <button className="btn primary" onClick={fire} disabled={busy || phase === 'hit' || phase === 'out'}>Fire ({shots} left)</button>
            {(phase === 'hit' || phase === 'out') && <button className="btn primary" onClick={() => nextLevel(phase === 'hit')}>{phase === 'hit' ? 'Next level' : 'New target'}</button>}
          </div>
          {phase === 'hit' && <Msg kind="good">{msg}</Msg>}
          {(phase === 'miss' || phase === 'out') && <Msg kind="bad">{msg}{phase === 'out' ? ' Out of shots.' : ''}</Msg>}
          <p className="hint">{hard ? 'Drag grows with speed squared and a tailwind lifts the range, a headwind cuts it. Use each miss to correct the next shot.' : 'Ideal range with no height: R = v² sin 2θ / g. The dotted line previews your path.'} Target radius {lv.radius} m.</p>
        </div>
      </div>
    </GameShell>
  )
}
