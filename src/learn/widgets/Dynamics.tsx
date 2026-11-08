import { useRef, useState } from 'react'
import { deg, fix, G, rad } from '../../sim/format'
import { Frame, LinSlider, Readouts, useFrame } from './shared'
import { Arrow, clamp } from './svg'

/* ---------- Kinematics: constant acceleration ---------- */
export function Kinematics() {
  const [v0, setV0] = useState(2), [a, setA] = useState(1.5), [t, setT] = useState(4)
  const T = 10
  const x = v0 * t + 0.5 * a * t * t, v = v0 + a * t
  const vmax = Math.max(1, Math.abs(v0), Math.abs(v0 + a * T))
  const PX = 50, PW = 560, PY = 20, PH = 140
  const cx = (s: number) => PX + (s / T) * PW
  const cy = (val: number) => PY + PH / 2 - (val / vmax) * (PH / 2 - 6)
  const pts = [0, T].map((s) => `${cx(s)},${cy(v0 + a * s)}`).join(' ')
  const area = `${cx(0)},${cy(0)} ${cx(0)},${cy(v0)} ${cx(t)},${cy(v)} ${cx(t)},${cy(0)}`
  const xmax = Math.max(1, Math.abs(v0 * T + 0.5 * a * T * T))
  const carX = 60 + clamp(x / xmax, -1, 1) * 480
  return (
    <Frame caption="With constant acceleration the velocity graph is a straight line, and the shaded area under it is the distance travelled. Slide the time marker to watch both change.">
      <svg viewBox="0 0 660 270" className="wsvg" role="img" aria-label="Velocity versus time graph">
        <line x1={PX} x2={PX + PW} y1={cy(0)} y2={cy(0)} className="w-axis" />
        <line x1={PX} x2={PX} y1={PY} y2={PY + PH} className="w-axis" />
        <polygon points={area} className="w-area" />
        <polyline points={pts} className="w-curve" />
        <line x1={cx(t)} x2={cx(t)} y1={PY} y2={PY + PH} className="w-ref" />
        <circle cx={cx(t)} cy={cy(v)} r={5} className="w-dot" />
        <text x={PX - 6} y={PY + 10} textAnchor="end" className="w-t sm">v</text>
        <text x={PX + PW} y={cy(0) + 16} textAnchor="end" className="w-t sm">t (s)</text>
        <line x1={50} x2={620} y1={228} y2={228} className="w-axis" />
        <rect x={carX - 22} y={206} width={44} height={20} rx={4} className="w-body" />
        <circle cx={carX - 12} cy={228} r={5} className="w-joint" /><circle cx={carX + 12} cy={228} r={5} className="w-joint" />
      </svg>
      <div className="widget-controls">
        <LinSlider label="Start speed" value={v0} min={-6} max={10} step={0.5} onChange={setV0} fmt={(v) => `${v} m/s`} />
        <LinSlider label="Acceleration" value={a} min={-4} max={4} step={0.25} onChange={setA} fmt={(v) => `${v} m/s²`} />
        <LinSlider label="Time" value={t} min={0} max={T} step={0.25} onChange={setT} fmt={(v) => `${v} s`} />
        <Readouts items={[
          ['Velocity  v = v₀ + at', `${fix(v, 2)} m/s`],
          ['Position  x = v₀t + ½at²', `${fix(x, 2)} m`],
          ['Check  v² = v₀² + 2ax', `${fix(v0 * v0 + 2 * a * x, 2)} m²/s²`, `v² = ${fix(v * v, 2)}`],
        ]} />
      </div>
    </Frame>
  )
}

/* ---------- Projectile ---------- */
export function Projectile() {
  const [v0, setV0] = useState(25), [ang, setAng] = useState(45), [h0, setH0] = useState(0)
  const ball = useRef<SVGCircleElement>(null)
  const th = rad(ang), vx = v0 * Math.cos(th), vy = v0 * Math.sin(th)
  const tf = (vy + Math.sqrt(vy * vy + 2 * G * h0)) / G
  const range = vx * tf, hmax = h0 + (vy * vy) / (2 * G)
  const W = 640, Hh = 270, gx = 40, gy = 240
  const scale = Math.min(560 / Math.max(range, 20), 190 / Math.max(hmax, 5))
  const X = (m: number) => gx + m * scale, Y = (m: number) => gy - m * scale
  const pts: string[] = []
  for (let i = 0; i <= 60; i++) { const s = (i / 60) * tf; pts.push(`${X(vx * s).toFixed(1)},${Y(h0 + vy * s - 0.5 * G * s * s).toFixed(1)}`) }
  const t = useRef(0)
  useFrame((dt) => {
    t.current = (t.current + dt * 0.7) % (tf + 0.8)
    const s = Math.min(t.current, tf)
    ball.current?.setAttribute('cx', String(X(vx * s)))
    ball.current?.setAttribute('cy', String(Y(h0 + vy * s - 0.5 * G * s * s)))
  })
  return (
    <Frame caption="Horizontal and vertical motion are independent: constant speed sideways, constant acceleration g downward. The path is a parabola, and on level ground 45° gives the longest range.">
      <svg viewBox={`0 0 ${W} ${Hh}`} className="wsvg" role="img" aria-label="Projectile trajectory">
        <line x1={gx} x2={W - 10} y1={gy} y2={gy} className="w-axis" />
        <line x1={X(0)} x2={X(0)} y1={Y(0)} y2={Y(h0)} className="w-pipe thick" />
        <polyline points={pts.join(' ')} className="w-curve alt" strokeDasharray="5 5" />
        <line x1={X(range / 2)} x2={X(range / 2)} y1={Y(0)} y2={Y(hmax)} className="w-ref" />
        <circle ref={ball} r={6} className="w-dot" />
        <Arrow x1={X(0)} y1={Y(h0)} x2={X(0) + vx * 2.2} y2={Y(h0) - vy * 2.2} cls="red" />
        <text x={X(range)} y={gy + 16} textAnchor="middle" className="w-t sm accent">{range.toFixed(1)} m</text>
        <text x={X(range / 2) + 6} y={Y(hmax) + 12} className="w-t sm">peak {hmax.toFixed(1)} m</text>
      </svg>
      <div className="widget-controls">
        <LinSlider label="Launch speed" value={v0} min={5} max={40} onChange={setV0} fmt={(v) => `${v} m/s`} />
        <LinSlider label="Angle" value={ang} min={5} max={85} onChange={setAng} fmt={(v) => `${v}°`} />
        <LinSlider label="Start height" value={h0} min={0} max={30} onChange={setH0} fmt={(v) => `${v} m`} />
        <Readouts items={[
          ['Horizontal speed vx', `${vx.toFixed(1)} m/s`, 'v cos θ, never changes'],
          ['Vertical speed vy', `${vy.toFixed(1)} m/s`, 'v sin θ, decreases by g each second'],
          ['Flight time', `${tf.toFixed(2)} s`],
          ['Range', `${range.toFixed(1)} m`],
          ['Impact angle', `${deg(Math.atan2(Math.sqrt(vy * vy + 2 * G * h0), vx)).toFixed(1)}°`, 'below horizontal'],
        ]} />
      </div>
    </Frame>
  )
}

/* ---------- Pendulum energy ---------- */
export function Energy() {
  const [start, setStart] = useState(50), [damp, setDamp] = useState(0)
  const state = useRef({ th: rad(50), w: 0 })
  const [, force] = useState(0)
  const Lm = 1.2, m = 1
  const reset = (a: number) => { state.current = { th: rad(a), w: 0 } }
  useFrame((dt) => {
    const s = state.current
    const steps = 8, h = dt / steps
    for (let i = 0; i < steps; i++) {
      const acc = -(G / Lm) * Math.sin(s.th) - damp * s.w
      s.w += acc * h
      s.th += s.w * h
    }
    force((n) => n + 1)
  })
  const { th, w } = state.current
  const ke = 0.5 * m * (Lm * w) ** 2
  const pe = m * G * Lm * (1 - Math.cos(th))
  const e0 = m * G * Lm * (1 - Math.cos(rad(start)))
  const px = 240, py = 40, R = 150
  const bx = px + R * Math.sin(th), by = py + R * Math.cos(th)
  const bar = (e: number) => (e / Math.max(e0, 0.01)) * 150
  return (
    <Frame caption="At the top of each swing all the energy is potential (height). At the bottom it is all kinetic (speed). Without friction the total never changes. Add damping and the total drains away as heat.">
      <svg viewBox="0 0 640 240" className="wsvg" role="img" aria-label="Pendulum energy">
        <line x1={px - 40} x2={px + 40} y1={py} y2={py} className="w-pipe thick" />
        <line x1={px} y1={py} x2={bx} y2={by} className="w-pipe" />
        <circle cx={bx} cy={by} r={14} className="w-body" />
        <line x1={px} y1={py} x2={px} y2={py + R + 24} className="w-ref" />
        <g transform="translate(420,40)">
          <text x={0} y={-8} className="w-t sm">Energy (J)</text>
          {[['PE', pe, 'w-bar a'], ['KE', ke, 'w-bar b'], ['Total', pe + ke, 'w-bar c']].map(([k, e, c], i) => (
            <g key={k as string} transform={`translate(${i * 62},0)`}>
              <rect x={0} y={170 - bar(e as number)} width={40} height={bar(e as number)} className={c as string} />
              <text x={20} y={188} textAnchor="middle" className="w-t sm">{k as string}</text>
              <text x={20} y={164 - bar(e as number)} textAnchor="middle" className="w-t sm">{(e as number).toFixed(1)}</text>
            </g>
          ))}
        </g>
      </svg>
      <div className="widget-controls">
        <LinSlider label="Release angle" value={start} min={10} max={85} onChange={(v) => { setStart(v); reset(v) }} fmt={(v) => `${v}°`} />
        <LinSlider label="Friction" value={damp} min={0} max={1} step={0.05} onChange={setDamp} fmt={(v) => (v === 0 ? 'none' : v.toFixed(2))} />
        <button className="btn" onClick={() => reset(start)} style={{ width: 'fit-content' }}>Release again</button>
        <Readouts items={[
          ['Height above lowest point', `${(Lm * (1 - Math.cos(th))).toFixed(2)} m`],
          ['Speed', `${Math.abs(Lm * w).toFixed(2)} m/s`, `max ${Math.sqrt(2 * e0 / m).toFixed(2)} m/s at the bottom`],
        ]} />
      </div>
    </Frame>
  )
}

/* ---------- 1-D collision ---------- */
export function Collision() {
  const [m1, setM1] = useState(2), [v1, setV1] = useState(4), [m2, setM2] = useState(1), [v2, setV2] = useState(-1), [e, setE] = useState(1)
  const [t, setT] = useState(0)
  useFrame((dt) => setT((x) => (x + dt) % 5))
  // positions: cart 1 centre starts at 100, cart 2 at 540; widths 50. Contact when x2-x1 = 50.
  const gap = 440 - 50, sc = 40
  const closing = v1 - v2
  const tc = closing > 0 ? gap / (closing * sc) : Infinity
  const u1 = ((m1 - e * m2) * v1 + (1 + e) * m2 * v2) / (m1 + m2)
  const u2 = ((m2 - e * m1) * v2 + (1 + e) * m1 * v1) / (m1 + m2)
  const pos = (x0: number, va: number, vb: number) => (t <= tc ? x0 + va * sc * t : x0 + va * sc * tc + vb * sc * (t - tc))
  const x1 = pos(100, v1, u1), x2 = pos(540, v2, u2)
  const KE = (a: number, va: number, b: number, vb: number) => 0.5 * a * va * va + 0.5 * b * vb * vb
  const w1 = 30 + m1 * 6, w2 = 30 + m2 * 6
  return (
    <Frame caption="Momentum is conserved in every collision. Kinetic energy is conserved only when the collision is perfectly elastic (e = 1). With e = 0 the carts stick and the lost energy becomes heat and deformation.">
      <svg viewBox="0 0 640 170" className="wsvg" role="img" aria-label="Two carts colliding">
        <line x1={10} x2={630} y1={120} y2={120} className="w-axis" />
        <rect x={x1 - w1 / 2} y={120 - w1 * 0.6 - 6} width={w1} height={w1 * 0.6} rx={4} className="w-body" />
        <rect x={x2 - w2 / 2} y={120 - w2 * 0.6 - 6} width={w2} height={w2 * 0.6} rx={4} className="w-body alt" />
        <text x={x1} y={120 - w1 * 0.3 - 4} textAnchor="middle" className="w-t sm">{m1} kg</text>
        <text x={x2} y={120 - w2 * 0.3 - 4} textAnchor="middle" className="w-t sm">{m2} kg</text>
      </svg>
      <div className="widget-controls">
        <div className="two-col">
          <LinSlider label="Mass 1" value={m1} min={1} max={6} onChange={setM1} fmt={(v) => `${v} kg`} />
          <LinSlider label="Velocity 1" value={v1} min={-5} max={5} step={0.5} onChange={setV1} fmt={(v) => `${v} m/s`} />
          <LinSlider label="Mass 2" value={m2} min={1} max={6} onChange={setM2} fmt={(v) => `${v} kg`} />
          <LinSlider label="Velocity 2" value={v2} min={-5} max={5} step={0.5} onChange={setV2} fmt={(v) => `${v} m/s`} />
        </div>
        <LinSlider label="Restitution e" value={e} min={0} max={1} step={0.1} onChange={setE} fmt={(v) => (v === 1 ? '1 elastic' : v === 0 ? '0 sticky' : v.toFixed(1))} />
        {closing <= 0 && <p className="hint">Cart 1 must be moving toward cart 2 faster than cart 2 moves away. Adjust the velocities.</p>}
        <Readouts items={[
          ['Momentum before', `${(m1 * v1 + m2 * v2).toFixed(2)} kg·m/s`],
          ['Momentum after', `${(m1 * u1 + m2 * u2).toFixed(2)} kg·m/s`, 'identical, always'],
          ['Velocities after', `${fix(u1, 2)} and ${fix(u2, 2)} m/s`],
          ['Kinetic energy', `${KE(m1, v1, m2, v2).toFixed(2)} J → ${KE(m1, u1, m2, u2).toFixed(2)} J`],
        ]} />
      </div>
    </Frame>
  )
}
