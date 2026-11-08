import { useRef, useState } from 'react'
import { formatSI } from '../../sim/format'
import { Frame, LinSlider, Readouts, useFrame } from './shared'
import { Arrow } from './svg'

/* ---------- Gears ---------- */
export function gearPath(teeth: number, rOuter: number, rRoot: number) {
  const pts: string[] = []
  const pitch = (2 * Math.PI) / teeth
  for (let i = 0; i < teeth; i++) {
    const a = i * pitch
    const seq: [number, number][] = [[0.0, rRoot], [0.15, rOuter], [0.5, rOuter], [0.65, rRoot]]
    for (const [f, r] of seq) pts.push(`${(r * Math.cos(a + f * pitch)).toFixed(1)},${(r * Math.sin(a + f * pitch)).toFixed(1)}`)
  }
  return pts.join(' ')
}

export function Gears() {
  const [n1, setN1] = useState(12), [n2, setN2] = useState(24), [rpm, setRpm] = useState(120), [tq, setTq] = useState(10)
  const mod = 5.2
  const r1 = (n1 * mod) / 2, r2 = (n2 * mod) / 2
  const ang = useRef(0)
  const [, tick] = useState(0)
  useFrame((dt) => { ang.current += (rpm / 60) * 360 * dt * 0.08; tick((n) => n + 1) })
  const a1 = ang.current, a2 = -(a1 * n1) / n2 + (180 / n2)
  const ratio = n2 / n1
  const x1 = 90 + 0, y = 120
  const x2 = x1 + r1 + r2
  return (
    <Frame caption="Meshing gears share the same tooth speed, so a smaller driver gear turns a larger one more slowly but with more torque. What you gain in torque you give up in speed. Power (torque × speed) stays the same, apart from small losses.">
      <svg viewBox="0 0 640 240" className="wsvg" role="img" aria-label="Meshing gears">
        <g transform={`translate(${x1},${y}) rotate(${a1})`}>
          <polygon points={gearPath(n1, r1 + mod * 0.45, r1 - mod * 0.45)} className="w-body" />
          <circle r={r1 * 0.22} className="w-ground-fill" />
          <line x1={0} y1={0} x2={r1 * 0.7} y2={0} className="w-curve" />
        </g>
        <g transform={`translate(${x2},${y}) rotate(${a2})`}>
          <polygon points={gearPath(n2, r2 + mod * 0.45, r2 - mod * 0.45)} className="w-body alt" />
          <circle r={r2 * 0.12} className="w-ground-fill" />
          <line x1={0} y1={0} x2={r2 * 0.7} y2={0} className="w-curve" />
        </g>
        <text x={x1} y={y + r1 + 40} textAnchor="middle" className="w-t sm">driver {n1} teeth</text>
        <text x={x2} y={y + r2 + 40 > 230 ? 232 : y + r2 + 40} textAnchor="middle" className="w-t sm">driven {n2} teeth</text>
      </svg>
      <div className="widget-controls">
        <div className="two-col">
          <LinSlider label="Driver teeth" value={n1} min={8} max={40} onChange={setN1} fmt={(v) => `${v}`} />
          <LinSlider label="Driven teeth" value={n2} min={8} max={40} onChange={setN2} fmt={(v) => `${v}`} />
          <LinSlider label="Driver speed" value={rpm} min={20} max={300} step={10} onChange={setRpm} fmt={(v) => `${v} rpm`} />
          <LinSlider label="Driver torque" value={tq} min={1} max={50} onChange={setTq} fmt={(v) => `${v} N·m`} />
        </div>
        <Readouts items={[
          ['Gear ratio  N₂ / N₁', ratio.toFixed(2), ratio > 1 ? 'speed reduction' : ratio < 1 ? 'speed increase' : 'one to one'],
          ['Output speed', `${(rpm / ratio).toFixed(0)} rpm`, 'n₂ = n₁ N₁ / N₂'],
          ['Output torque', `${(tq * ratio).toFixed(1)} N·m`, 'ideal, no losses'],
          ['Power in = out', `${formatSI((tq * rpm * 2 * Math.PI) / 60, 'W')}`],
        ]} />
      </div>
    </Frame>
  )
}

/* ---------- Spring-mass-damper ---------- */
export function Spring() {
  const [m, setM] = useState(1), [k, setK] = useState(40), [c, setC] = useState(0.5)
  const sim = useRef({ x: 1, v: 0, t: 0, hist: [] as number[] })
  const [, tick] = useState(0)
  const reset = () => { sim.current = { x: 1, v: 0, t: 0, hist: [] } }
  useFrame((dt) => {
    const s = sim.current
    const steps = 10, h = dt / steps
    for (let i = 0; i < steps; i++) {
      const a = (-k * s.x - c * s.v) / m
      s.v += a * h
      s.x += s.v * h
    }
    s.hist.push(s.x)
    if (s.hist.length > 300) s.hist.shift()
    tick((n) => n + 1)
  })
  const wn = Math.sqrt(k / m), zeta = c / (2 * Math.sqrt(k * m))
  const s = sim.current
  const bx = 120, top = 20, rest = 120
  const my = rest + s.x * 40
  const coil: string[] = []
  const len = my - top - 24, turns = 9
  for (let i = 0; i <= turns * 2; i++) coil.push(`${bx + (i % 2 ? 14 : -14)},${top + (i / (turns * 2)) * len}`)
  const GX = 260, GY = 100, GW = 360, GH = 80
  const trace = s.hist.map((x, i) => `${GX + (i / 300) * GW},${GY - x * GH * 0.45}`).join(' ')
  return (
    <Frame caption="Every mass on a spring has a natural frequency set only by stiffness and mass. Damping removes energy: light damping rings down gradually, critical damping returns fastest without overshoot, and heavy damping creeps back slowly.">
      <svg viewBox="0 0 640 210" className="wsvg" role="img" aria-label="Mass on a spring">
        <line x1={bx - 40} x2={bx + 40} y1={top} y2={top} className="w-pipe thick" />
        <polyline points={coil.join(' ')} className="w-pipe" />
        <rect x={bx - 24} y={my - 24} width={48} height={48} rx={4} className="w-body" />
        <line x1={GX} x2={GX + GW} y1={GY} y2={GY} className="w-axis" />
        <polyline points={trace} className="w-curve" />
        <text x={GX} y={GY - GH * 0.62} className="w-t sm">displacement over time</text>
      </svg>
      <div className="widget-controls">
        <div className="two-col">
          <LinSlider label="Mass" value={m} min={0.2} max={5} step={0.1} onChange={setM} fmt={(v) => `${v} kg`} />
          <LinSlider label="Stiffness" value={k} min={5} max={200} step={5} onChange={setK} fmt={(v) => `${v} N/m`} />
          <LinSlider label="Damping" value={c} min={0} max={20} step={0.25} onChange={setC} fmt={(v) => `${v} N·s/m`} />
        </div>
        <button className="btn" onClick={reset} style={{ width: 'fit-content' }}>Pull down and release</button>
        <Readouts items={[
          ['Natural frequency', `${(wn / (2 * Math.PI)).toFixed(2)} Hz`, 'f = (1/2π) √(k/m)'],
          ['Period', `${((2 * Math.PI) / wn).toFixed(2)} s`],
          ['Damping ratio ζ', zeta.toFixed(2), zeta === 0 ? 'undamped: never stops' : zeta < 1 ? 'underdamped: overshoots' : zeta < 1.02 ? 'critically damped' : 'overdamped: sluggish'],
        ]} />
      </div>
    </Frame>
  )
}

/* ---------- Pulley block and tackle ---------- */
export function Pulley() {
  const [n, setN] = useState(4), [W, setW] = useState(800), [lift, setLift] = useState(1)
  const effort = W / n
  const lx = 320, ty = 24
  const half = 18 * Math.max(1, n - 1)
  const ropes: number[] = []
  for (let i = 0; i < n; i++) ropes.push(lx - half + (2 * half * i) / Math.max(1, n - 1))
  const loadY = 150
  return (
    <Frame caption="A pulley system trades distance for force. If n rope segments share the load, the pull needed is W divided by n, but you must pull n times as much rope. The work you do stays the same.">
      <svg viewBox="0 0 640 230" className="wsvg" role="img" aria-label="Block and tackle">
        <rect x={lx - 90} y={ty - 10} width={180} height={10} className="w-body" />
        {ropes.map((x, i) => <line key={i} x1={x} y1={ty} x2={x} y2={loadY} className="w-pipe" />)}
        <rect x={lx - 50} y={loadY} width={100} height={40} rx={4} className="w-body" />
        <text x={lx} y={loadY + 25} textAnchor="middle" className="w-t sm">{W} N</text>
        <Arrow x1={lx + 130} y1={ty + 20} x2={lx + 130} y2={ty + 20 + Math.min(110, effort / 8)} cls="red" label={`${effort.toFixed(0)} N`} lx={8} ly={4} />
        <line x1={lx + half} y1={ty} x2={lx + 130} y2={ty} className="w-pipe" />
      </svg>
      <div className="widget-controls">
        <LinSlider label="Rope segments" value={n} min={1} max={8} onChange={setN} fmt={(v) => `${v}`} />
        <LinSlider label="Load" value={W} min={100} max={2000} step={100} onChange={setW} fmt={(v) => `${v} N`} />
        <LinSlider label="Lift height" value={lift} min={0.5} max={3} step={0.5} onChange={setLift} fmt={(v) => `${v} m`} />
        <Readouts items={[
          ['Mechanical advantage', `${n}`, 'load / effort'],
          ['Effort force', `${effort.toFixed(0)} N`],
          ['Rope you pull', `${(n * lift).toFixed(1)} m`, `to raise the load ${lift} m`],
          ['Work', `${(W * lift).toFixed(0)} J`, `effort × rope = ${(effort * n * lift).toFixed(0)} J`],
        ]} />
      </div>
    </Frame>
  )
}

/* ---------- Hydraulic press ---------- */
export function Hydraulic() {
  const [d1, setD1] = useState(2), [d2, setD2] = useState(10), [F1, setF1] = useState(100)
  const A1 = Math.PI * (d1 / 100) ** 2 / 4, A2 = Math.PI * (d2 / 100) ** 2 / 4
  const p = F1 / A1, F2 = p * A2
  const w1 = 12 + d1 * 6, w2 = 12 + d2 * 6
  return (
    <Frame caption="Pressure in an enclosed fluid is the same everywhere. A small force on a small piston makes the same pressure that pushes a big piston with a big force. The big piston moves proportionally less.">
      <svg viewBox="0 0 640 220" className="wsvg" role="img" aria-label="Hydraulic press">
        <path d={`M ${120 - w1 / 2} 80 L ${120 - w1 / 2} 170 L ${480 + w2 / 2} 170 L ${480 + w2 / 2} 80`} className="w-pipe thick" fill="none" />
        <rect x={120 - w1 / 2} y={100} width={w1} height={70} className="w-water" />
        <rect x={120 - w1 / 2} y={170 - 70} width={480 - 120 + w1 / 2 + w2 / 2} height={0} className="w-water" />
        <rect x={120 - w1 / 2 - 4} y={170 - 8} width={360 + w1 / 2 + w2 / 2 + 8} height={8} className="w-water" />
        <rect x={480 - w2 / 2} y={100} width={w2} height={70} className="w-water" />
        <rect x={120 - w1 / 2} y={92} width={w1} height={8} className="w-body" />
        <rect x={480 - w2 / 2} y={92} width={w2} height={8} className="w-body" />
        <Arrow x1={120} y1={30} x2={120} y2={88} cls="red" label={`${F1} N`} lx={8} ly={-10} />
        <Arrow x1={480} y1={30} x2={480} y2={88} cls="alt" label={formatSI(F2, 'N')} lx={8} ly={-10} />
        <text x={120} y={196} textAnchor="middle" className="w-t sm">small piston {d1} cm</text>
        <text x={480} y={196} textAnchor="middle" className="w-t sm">large piston {d2} cm</text>
      </svg>
      <div className="widget-controls">
        <LinSlider label="Small piston" value={d1} min={1} max={5} step={0.5} onChange={setD1} fmt={(v) => `${v} cm`} />
        <LinSlider label="Large piston" value={d2} min={5} max={20} step={1} onChange={setD2} fmt={(v) => `${v} cm`} />
        <LinSlider label="Input force" value={F1} min={10} max={500} step={10} onChange={setF1} fmt={(v) => `${v} N`} />
        <Readouts items={[
          ['Fluid pressure  p = F / A', formatSI(p, 'Pa')],
          ['Output force  F₂ = p A₂', formatSI(F2, 'N'), `multiplied by ${(A2 / A1).toFixed(1)}`],
          ['Distance ratio', `1 : ${(A2 / A1).toFixed(1)}`, 'push the small piston this much further'],
        ]} />
      </div>
    </Frame>
  )
}
