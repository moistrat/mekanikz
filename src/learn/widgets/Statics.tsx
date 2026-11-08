import { useState } from 'react'
import { deg, fix, formatSI, G, rad } from '../../sim/format'
import { Frame, LinSlider, Readouts } from './shared'
import { Arrow, clamp, Ground } from './svg'

/* ---------- Force vectors ---------- */
export function Vectors() {
  const [f1, setF1] = useState(80), [a1, setA1] = useState(20)
  const [f2, setF2] = useState(60), [a2, setA2] = useState(110)
  const s = 1.6, ox = 150, oy = 230
  const p1 = { x: f1 * Math.cos(rad(a1)), y: f1 * Math.sin(rad(a1)) }
  const p2 = { x: f2 * Math.cos(rad(a2)), y: f2 * Math.sin(rad(a2)) }
  const R = { x: p1.x + p2.x, y: p1.y + p2.y }
  const mag = Math.hypot(R.x, R.y), ang = deg(Math.atan2(R.y, R.x))
  const X = (v: number) => ox + v * s, Y = (v: number) => oy - v * s
  return (
    <Frame caption="Two forces acting at a point. Place them tip to tail: the arrow from the start to the end is the resultant. Its components are the horizontal and vertical sums.">
      <svg viewBox="0 0 640 300" className="wsvg" role="img" aria-label="Vector addition">
        <line x1={20} x2={620} y1={oy} y2={oy} className="w-axis" />
        <line x1={ox} x2={ox} y1={10} y2={290} className="w-axis" />
        <Arrow x1={X(0)} y1={Y(0)} x2={X(p1.x)} y2={Y(p1.y)} label="F1" lx={6} />
        <Arrow x1={X(p1.x)} y1={Y(p1.y)} x2={X(R.x)} y2={Y(R.y)} cls="alt" label="F2" lx={6} />
        <Arrow x1={X(0)} y1={Y(0)} x2={X(R.x)} y2={Y(R.y)} cls="red" label="R" lx={8} />
        <line x1={X(R.x)} x2={X(R.x)} y1={Y(0)} y2={Y(R.y)} className="w-ref" />
        <line x1={X(0)} x2={X(R.x)} y1={Y(0)} y2={Y(0)} className="w-ref" />
      </svg>
      <div className="widget-controls">
        <div className="two-col">
          <LinSlider label="F1" value={f1} min={0} max={100} onChange={setF1} fmt={(v) => `${v} N`} />
          <LinSlider label="F1 angle" value={a1} min={0} max={360} onChange={setA1} fmt={(v) => `${v}°`} />
          <LinSlider label="F2" value={f2} min={0} max={100} onChange={setF2} fmt={(v) => `${v} N`} />
          <LinSlider label="F2 angle" value={a2} min={0} max={360} onChange={setA2} fmt={(v) => `${v}°`} />
        </div>
        <Readouts items={[
          ['ΣFx', `${fix(R.x, 1)} N`, 'F1 cos θ1 + F2 cos θ2'],
          ['ΣFy', `${fix(R.y, 1)} N`, 'F1 sin θ1 + F2 sin θ2'],
          ['Resultant R', `${mag.toFixed(1)} N`, '√(ΣFx² + ΣFy²)'],
          ['Direction', `${fix(((ang % 360) + 360) % 360, 1)}°`, 'measured from +x'],
        ]} />
      </div>
    </Frame>
  )
}

/* ---------- Block on an incline ---------- */
export function Incline() {
  const [theta, setTheta] = useState(25), [m, setM] = useState(10), [mu, setMu] = useState(0.4)
  const th = rad(theta)
  const W = m * G, Wpar = W * Math.sin(th), N = W * Math.cos(th), fmax = mu * N
  const slides = Wpar > fmax
  const a = slides ? (Wpar - mu * N) / m : 0
  const bx = 330, by = 200, L = 380
  // incline from lower-left (60,260) up to right
  const x0 = 70, y0 = 262, x1 = x0 + L * Math.cos(th), y1 = y0 - L * Math.sin(th)
  const u = { x: Math.cos(th), y: -Math.sin(th) }, n = { x: Math.sin(th), y: Math.cos(th) } // n points off-surface (up-left in screen is -n.. adjust)
  const off = { x: -Math.sin(th), y: -Math.cos(th) } // outward normal in screen coords
  void bx; void by; void n
  const t = 0.55, cx = x0 + u.x * L * t + off.x * 20, cy = y0 + u.y * L * t + off.y * 20
  const k = 1.1
  return (
    <Frame caption="Resolve the weight into a part along the slope and a part pushing into it. The block slides when the downhill part beats the maximum friction, which is exactly the same as tan θ > μ.">
      <svg viewBox="0 0 640 300" className="wsvg" role="img" aria-label="Block on an inclined plane">
        <polygon points={`${x0},${y0} ${x1},${y1} ${x1},${y0}`} className="w-fill" />
        <line x1={x0} y1={y0} x2={x1} y2={y1} className="w-pipe thick" />
        <g transform={`translate(${cx},${cy}) rotate(${-theta})`}>
          <rect x={-22} y={-22} width={44} height={44} className="w-body" />
        </g>
        <Arrow x1={cx} y1={cy} x2={cx} y2={cy + W * k * 0.6} cls="" label="W" lx={8} ly={4} />
        <Arrow x1={cx} y1={cy} x2={cx + off.x * N * k * 0.6} y2={cy + off.y * N * k * 0.6} cls="alt" label="N" lx={-14} ly={-4} />
        <Arrow x1={cx} y1={cy} x2={cx - u.x * Math.min(fmax, Wpar) * k * 0.6} y2={cy - u.y * Math.min(fmax, Wpar) * k * 0.6} cls="red" label="f" lx={-14} ly={14} />
        <path d={`M ${x0 + 46} ${y0} A 46 46 0 0 0 ${x0 + 46 * Math.cos(th)} ${y0 - 46 * Math.sin(th)}`} className="w-ref" fill="none" />
        <text x={x0 + 56} y={y0 - 6} className="w-t sm">{theta}°</text>
        <text x={470} y={40} className={`w-t ${slides ? 'bad' : 'accent'}`}>{slides ? 'SLIDING' : 'HOLDS'}</text>
      </svg>
      <div className="widget-controls">
        <LinSlider label="Angle" value={theta} min={0} max={60} onChange={setTheta} fmt={(v) => `${v}°`} />
        <LinSlider label="Mass" value={m} min={1} max={50} onChange={setM} fmt={(v) => `${v} kg`} />
        <LinSlider label="Friction μ" value={mu} min={0} max={1} step={0.05} onChange={setMu} fmt={(v) => v.toFixed(2)} />
        <Readouts items={[
          ['Weight W = mg', `${W.toFixed(1)} N`],
          ['Along slope  W sin θ', `${Wpar.toFixed(1)} N`, 'pulls the block downhill'],
          ['Normal  N = W cos θ', `${N.toFixed(1)} N`],
          ['Max friction  μN', `${fmax.toFixed(1)} N`],
          ['Acceleration', `${a.toFixed(2)} m/s²`, slides ? 'a = g (sin θ − μ cos θ)' : 'static: friction balances'],
        ]} />
      </div>
    </Frame>
  )
}

/* ---------- Lever / moments ---------- */
export function Lever() {
  const [w1, setW1] = useState(40), [d1, setD1] = useState(3)
  const [w2, setW2] = useState(60), [d2, setD2] = useState(2)
  const t1 = w1 * d1, t2 = w2 * d2, net = t2 - t1 // positive: right side down
  const tilt = clamp(net / 20, -14, 14)
  const cx = 320, cy = 190, scale = 50
  const g1 = `rotate(${tilt} ${cx} ${cy})`
  return (
    <Frame caption="A moment is force times perpendicular distance from the pivot. The beam tips toward the larger moment and sits level when the two are equal.">
      <svg viewBox="0 0 640 260" className="wsvg" role="img" aria-label="Lever balance">
        <polygon points={`${cx},${cy} ${cx - 22},${cy + 50} ${cx + 22},${cy + 50}`} className="w-body" />
        <g transform={g1}>
          <rect x={cx - 6 * scale} y={cy - 8} width={12 * scale} height={8} className="w-body" />
          <rect x={cx - d1 * scale - 22} y={cy - 8 - 14 - w1 / 4} width={44} height={14 + w1 / 4} className="w-fill w-outline" />
          <text x={cx - d1 * scale} y={cy - 22 - w1 / 4} textAnchor="middle" className="w-t sm">{w1} N</text>
          <rect x={cx + d2 * scale - 22} y={cy - 8 - 14 - w2 / 4} width={44} height={14 + w2 / 4} className="w-fill w-outline" />
          <text x={cx + d2 * scale} y={cy - 22 - w2 / 4} textAnchor="middle" className="w-t sm">{w2} N</text>
        </g>
        <Ground x={cx - 120} y={cy + 50} w={240} />
        <text x={cx - d1 * scale} y={cy + 28} textAnchor="middle" className="w-t sm">{d1} m</text>
        <text x={cx + d2 * scale} y={cy + 28} textAnchor="middle" className="w-t sm">{d2} m</text>
      </svg>
      <div className="widget-controls">
        <div className="two-col">
          <LinSlider label="Left load" value={w1} min={10} max={100} step={5} onChange={setW1} fmt={(v) => `${v} N`} />
          <LinSlider label="Left arm" value={d1} min={0.5} max={5.5} step={0.5} onChange={setD1} fmt={(v) => `${v} m`} />
          <LinSlider label="Right load" value={w2} min={10} max={100} step={5} onChange={setW2} fmt={(v) => `${v} N`} />
          <LinSlider label="Right arm" value={d2} min={0.5} max={5.5} step={0.5} onChange={setD2} fmt={(v) => `${v} m`} />
        </div>
        <Readouts items={[
          ['Left moment', `${t1} N·m`, 'counter-clockwise'],
          ['Right moment', `${t2} N·m`, 'clockwise'],
          ['Net moment', `${fix(net, 0)} N·m`, net === 0 ? 'balanced' : net > 0 ? 'right side goes down' : 'left side goes down'],
        ]} />
      </div>
    </Frame>
  )
}

/* ---------- Three-member truss ---------- */
export function Truss() {
  const [span, setSpan] = useState(8), [h, setH] = useState(3), [P, setP] = useState(12)
  const ang = Math.atan2(h, span / 2)
  const rafter = P / (2 * Math.sin(ang)) // compression
  const chord = P / (2 * Math.tan(ang)) // tension
  const sc = 340 / span
  const A = { x: 150, y: 220 }, B = { x: 150 + span * sc, y: 220 }, C = { x: 150 + (span / 2) * sc, y: 220 - h * sc }
  return (
    <Frame caption="Cut the structure at each joint and balance the forces: the loaded apex pushes the rafters into compression (blue) and spreads the supports apart, which the bottom chord resists in tension (red). A flatter truss multiplies the forces.">
      <svg viewBox="0 0 640 280" className="wsvg" role="img" aria-label="Simple triangular truss">
        <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} className="mem tens" style={{ strokeWidth: 3 + chord / 4 }} />
        <line x1={A.x} y1={A.y} x2={C.x} y2={C.y} className="mem comp" style={{ strokeWidth: 3 + rafter / 4 }} />
        <line x1={B.x} y1={B.y} x2={C.x} y2={C.y} className="mem comp" style={{ strokeWidth: 3 + rafter / 4 }} />
        {[A, B, C].map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={6} className="w-joint" />)}
        <polygon points={`${A.x},${A.y + 6} ${A.x - 12},${A.y + 26} ${A.x + 12},${A.y + 26}`} className="w-body" />
        <circle cx={B.x} cy={B.y + 14} r={8} className="w-body" />
        <Arrow x1={C.x} y1={C.y - 44} x2={C.x} y2={C.y - 6} cls="red" label={`${P} kN`} lx={8} ly={-10} />
        <text x={(A.x + B.x) / 2} y={A.y + 20} textAnchor="middle" className="w-t sm tens-t">{chord.toFixed(1)} kN tension</text>
        <text x={(A.x + C.x) / 2 - 12} y={(A.y + C.y) / 2 - 8} textAnchor="end" className="w-t sm comp-t">{rafter.toFixed(1)} kN comp.</text>
        <text x={(B.x + C.x) / 2 + 12} y={(B.y + C.y) / 2 - 8} className="w-t sm comp-t">{rafter.toFixed(1)} kN comp.</text>
      </svg>
      <div className="widget-controls">
        <LinSlider label="Span" value={span} min={4} max={10} step={0.5} onChange={setSpan} fmt={(v) => `${v} m`} />
        <LinSlider label="Height" value={h} min={0.5} max={6} step={0.25} onChange={setH} fmt={(v) => `${v} m`} />
        <LinSlider label="Apex load" value={P} min={2} max={40} onChange={setP} fmt={(v) => `${v} kN`} />
        <Readouts items={[
          ['Support reactions', `${formatSI(P / 2 * 1000, 'N')} each`, 'ΣFy = 0 and symmetry'],
          ['Rafter angle', `${deg(ang).toFixed(1)}°`],
          ['Rafter force', `${rafter.toFixed(2)} kN`, 'P / (2 sin θ), compression'],
          ['Bottom chord', `${chord.toFixed(2)} kN`, 'P / (2 tan θ), tension'],
        ]} />
      </div>
    </Frame>
  )
}
