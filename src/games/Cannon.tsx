import { useMemo, useRef, useState } from 'react'
import { G, rad } from '../sim/format'
import { useFrame } from '../learn/widgets/shared'
import { Slider } from './Slider'
import { GameShell, Msg, useStats } from './ui'

interface Level { dist: number; ty: number; wall?: { x: number; h: number } }
function makeLevel(n: number): Level {
  const dist = Math.round(25 + Math.random() * 20 + n * 6)
  const ty = n >= 3 ? 3 + Math.floor(Math.random() * 4) * 2 : 0
  const wall = n >= 4 ? { x: Math.round(dist * (0.35 + Math.random() * 0.25)), h: 6 + Math.floor(Math.random() * 5) } : undefined
  return { dist, ty, wall }
}

export function Cannon() {
  const [stats, record, reset] = useStats('cannon')
  const [n, setN] = useState(1)
  const [lv, setLv] = useState(() => makeLevel(1))
  const [v0, setV0] = useState(25), [ang, setAng] = useState(40)
  const [shots, setShots] = useState(5)
  const [phase, setPhase] = useState<'aim' | 'flying' | 'hit' | 'miss' | 'out'>('aim')
  const [msg, setMsg] = useState('')
  const [t, setT] = useState(0)
  const flight = useRef<{ tEnd: number } | null>(null)

  const th = rad(ang), vx = v0 * Math.cos(th), vy = v0 * Math.sin(th)
  const pos = (s: number) => ({ x: vx * s, y: vy * s - 0.5 * G * s * s })
  // landing at the target height on the way down
  const tLand = (vy + Math.sqrt(Math.max(0, vy * vy - 2 * G * lv.ty))) / G
  const maxX = lv.dist * 1.25
  const sc = Math.min(590 / maxX, 1000)
  const X = (m: number) => 25 + m * sc, Y = (m: number) => 235 - m * sc

  useFrame((dt) => { if (phase === 'flying') setT((s) => Math.min(s + dt * 1.3, flight.current!.tEnd)) })

  const fire = () => {
    if (phase !== 'aim' && phase !== 'miss') return
    setShots((s) => s - 1)
    let tEnd = tLand, result: 'hit' | 'miss' = 'miss', text = ''
    if (!(vy * vy >= 2 * G * lv.ty)) { text = 'Too weak to reach the platform.'; tEnd = vy / G * 2 }
    else {
      const landX = vx * tLand
      let hitWall = false
      if (lv.wall) {
        const tw = lv.wall.x / vx
        if (tw < tLand && pos(tw).y < lv.wall.h) { hitWall = true; tEnd = tw; text = 'Crashed into the wall. Aim higher.' }
      }
      if (!hitWall) {
        if (Math.abs(landX - lv.dist) <= 2.5) { result = 'hit'; text = `Direct hit at ${landX.toFixed(1)} m.` }
        else text = landX < lv.dist ? `Short by ${(lv.dist - landX).toFixed(1)} m.` : `Long by ${(landX - lv.dist).toFixed(1)} m.`
      }
    }
    flight.current = { tEnd: Math.max(tEnd, 0.2) }
    setT(0); setPhase('flying')
    window.setTimeout(() => { setMsg(text); setPhase(result === 'hit' ? 'hit' : shots - 1 <= 0 ? 'out' : 'miss'); if (result === 'hit') record(true); else if (shots - 1 <= 0) record(false) }, (Math.max(tEnd, 0.2) / 1.3) * 1000 + 100)
  }
  const nextLevel = (won: boolean) => { const l = won ? n + 1 : n; setN(l); setLv(makeLevel(l)); setShots(5); setPhase('aim'); setMsg(''); setT(0) }

  const path = useMemo(() => {
    const pts: string[] = []
    const end = tLand
    for (let i = 0; i <= 50; i++) { const s = (i / 50) * end; const p = pos(s); pts.push(`${X(p.x)},${Y(p.y)}`) }
    return pts.join(' ')
  }, [v0, ang, lv]) // eslint-disable-line react-hooks/exhaustive-deps
  const ball = pos(phase === 'aim' ? 0 : t)
  const busy = phase === 'flying'
  return (
    <GameShell title="Cannon Range" level={n} stats={stats} onReset={reset}
      how="Pick a launch speed and angle to land on the target. Horizontal speed is v cos θ and never changes, while vertical speed v sin θ is slowed by gravity. You have five shots per level.">
      <div className="card game-board">
        <svg viewBox="0 0 640 260" className="wsvg" role="img" aria-label="Cannon and target">
          <line x1={10} x2={630} y1={235} y2={235} className="w-axis" />
          {lv.ty > 0 && <rect x={X(lv.dist) - 30} y={Y(lv.ty)} width={60} height={235 - Y(lv.ty)} className="w-body" />}
          <circle cx={X(lv.dist)} cy={Y(lv.ty) - 8} r={9} className="target" /><circle cx={X(lv.dist)} cy={Y(lv.ty) - 8} r={4} className="target-in" />
          {lv.wall && <rect x={X(lv.wall.x) - 5} y={Y(lv.wall.h)} width={10} height={235 - Y(lv.wall.h)} className="w-body" />}
          {!busy && <polyline points={path} className="w-curve alt" strokeDasharray="4 6" opacity={0.5} />}
          <g transform={`rotate(${-ang} ${X(0)} ${Y(0)})`}><rect x={X(0)} y={Y(0) - 6} width={34} height={12} rx={3} className="w-body alt" /></g>
          <circle cx={X(0)} cy={Y(0)} r={9} className="w-body" />
          {phase !== 'aim' && <circle cx={X(ball.x)} cy={Y(ball.y)} r={5} className="w-dot" />}
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
          <p className="hint">Ideal range with no height: R = v² sin 2θ / g. The dotted line previews your path.</p>
        </div>
      </div>
    </GameShell>
  )
}
