import { useState } from 'react'
import { deg, formatSI } from '../../sim/format'
import { Frame, LinSlider, Readouts } from './shared'
import { Arrow } from './svg'

/* ---------- Stress-strain curve ---------- */
interface Mat { name: string; E: number; sy: number; su: number; ef: number; brittle?: boolean }
export const MATS: Mat[] = [
  { name: 'Mild steel', E: 200e3, sy: 250, su: 400, ef: 0.25 },
  { name: 'Aluminium 6061-T6', E: 69e3, sy: 275, su: 310, ef: 0.12 },
  { name: 'Gray cast iron', E: 110e3, sy: 200, su: 200, ef: 0.0018, brittle: true },
]
const stress = (m: Mat, e: number) => {
  const ey = m.sy / m.E
  if (e <= ey) return m.E * e
  if (m.brittle) return Math.min(m.E * e, m.su)
  const eu = 0.7 * m.ef
  if (e <= eu) { const k = (e - ey) / (eu - ey); return m.sy + (m.su - m.sy) * (1 - (1 - k) ** 2) }
  const k = (e - eu) / (m.ef - eu)
  return m.su - 0.2 * m.su * k * k
}

export function StressStrain() {
  const [mi, setMi] = useState(0)
  const [pos, setPos] = useState(15)
  const m = MATS[mi]
  const e = (pos / 100) * m.ef
  const broken = e >= m.ef * 0.999
  const s = stress(m, e)
  const ey = m.sy / m.E
  const PX = 60, PY = 20, PW = 540, PH = 190, smax = m.su * 1.15
  const cx = (x: number) => PX + (x / (m.ef * 1.05)) * PW
  const cy = (y: number) => PY + PH - (y / smax) * PH
  const pts: string[] = []
  for (let i = 0; i <= 300; i++) { const x = (i / 300) * m.ef; pts.push(`${cx(x).toFixed(1)},${cy(stress(m, x)).toFixed(1)}`) }
  const regime = broken ? 'Fractured' : e <= ey * 0.999 ? 'Elastic: springs back' : e <= 0.7 * m.ef || m.brittle ? 'Plastic: permanent stretch' : 'Necking: weakening'
  const permanent = e <= ey ? 0 : Math.max(0, e - s / m.E)
  return (
    <Frame caption="Stress is force per area, strain is stretch per length. The straight start is elastic. Past the yield point the material stays permanently stretched. A ductile metal necks and thins before breaking, while brittle cast iron snaps with almost no warning.">
      <svg viewBox="0 0 640 250" className="wsvg" role="img" aria-label="Stress-strain curve">
        <line x1={PX} x2={PX + PW} y1={cy(0)} y2={cy(0)} className="w-axis" />
        <line x1={PX} x2={PX} y1={PY} y2={PY + PH} className="w-axis" />
        <polyline points={pts.join(' ')} className="w-curve" />
        <line x1={PX} x2={PX + PW} y1={cy(m.sy)} y2={cy(m.sy)} className="w-ref" />
        <text x={PX + PW} y={cy(m.sy) - 5} textAnchor="end" className="w-t sm">yield {m.sy} MPa</text>
        {!m.brittle && <text x={PX + PW} y={cy(m.su) - 5} textAnchor="end" className="w-t sm">ultimate {m.su} MPa</text>}
        <circle cx={cx(e)} cy={cy(s)} r={6} className="w-dot" />
        {broken && <text x={cx(e) - 8} y={cy(s) - 12} textAnchor="end" className="w-t bad">✕ fracture</text>}
        <text x={PX - 6} y={PY + 10} textAnchor="end" className="w-t sm">σ</text>
        <text x={PX + PW} y={cy(0) + 16} textAnchor="end" className="w-t sm">strain ε</text>
      </svg>
      <div className="widget-controls">
        <div className="seg" role="group" aria-label="Material">
          {MATS.map((x, i) => <button key={x.name} className={i === mi ? 'on' : ''} onClick={() => setMi(i)}>{x.name}</button>)}
        </div>
        <LinSlider label="Stretch" value={pos} min={0} max={100} onChange={setPos} fmt={(v) => `${v}%`} />
        <Readouts items={[
          ['Strain ε', `${(e * 100).toFixed(m.brittle ? 3 : 2)} %`, 'change in length / original length'],
          ['Stress σ', `${s.toFixed(0)} MPa`, 'force / area'],
          ['Young’s modulus E', `${(m.E / 1000).toFixed(0)} GPa`, 'slope of the elastic line'],
          ['State', regime, permanent > 0 ? `permanent strain ${(permanent * 100).toFixed(2)} %` : undefined],
        ]} />
      </div>
    </Frame>
  )
}

/* ---------- Simply supported beam ---------- */
export function Beam() {
  const [P, setP] = useState(20), [a, setA] = useState(3)
  const L = 10
  const R1 = (P * (L - a)) / L, R2 = (P * a) / L
  const Mmax = (R1 * a)
  const PX = 50, PW = 540
  const X = (m: number) => PX + (m / L) * PW
  const shear = (x: number) => (x < a ? R1 : R1 - P)
  const mom = (x: number) => (x < a ? R1 * x : R1 * x - P * (x - a))
  const vs = Math.max(R1, R2, 1), ms = Math.max(Mmax, 1)
  const vPath = `M ${X(0)} 150 L ${X(0)} ${150 - (R1 / vs) * 34} L ${X(a)} ${150 - (R1 / vs) * 34} L ${X(a)} ${150 + (R2 / vs) * 34} L ${X(L)} ${150 + (R2 / vs) * 34} L ${X(L)} 150 Z`
  const mp: string[] = []
  for (let i = 0; i <= 100; i++) { const x = (i / 100) * L; mp.push(`${X(x)},${255 + (mom(x) / ms) * 36}`) }
  void shear
  return (
    <Frame caption="A load on a beam creates internal shear force (the sideways slicing) and bending moment (the curvature). The moment is largest directly under the load, which is where a real beam would crack first.">
      <svg viewBox="0 0 640 310" className="wsvg" role="img" aria-label="Beam shear and moment diagrams">
        <rect x={X(0)} y={52} width={PW} height={8} className="w-body" />
        <polygon points={`${X(0)},62 ${X(0) - 10},80 ${X(0) + 10},80`} className="w-body" />
        <circle cx={X(L)} cy={70} r={8} className="w-body" />
        <Arrow x1={X(a)} y1={8} x2={X(a)} y2={50} cls="red" label={`${P} kN`} lx={8} ly={4} />
        <text x={X(0)} y={104} textAnchor="middle" className="w-t sm">R₁ {R1.toFixed(1)}</text>
        <text x={X(L)} y={104} textAnchor="middle" className="w-t sm">R₂ {R2.toFixed(1)}</text>
        <text x={PX} y={120} className="w-t sm">Shear force V (kN)</text>
        <line x1={PX} x2={PX + PW} y1={150} y2={150} className="w-axis" />
        <path d={vPath} className="w-area" stroke="var(--accent)" strokeWidth={2} />
        <text x={PX} y={226} className="w-t sm">Bending moment M (kN·m), peak {Mmax.toFixed(1)}</text>
        <line x1={PX} x2={PX + PW} y1={255} y2={255} className="w-axis" />
        <polyline points={`${X(0)},255 ${mp.join(' ')}`} className="w-curve" />
        <circle cx={X(a)} cy={255 + 36} r={5} className="w-dot" />
      </svg>
      <div className="widget-controls">
        <LinSlider label="Load" value={P} min={5} max={50} step={5} onChange={setP} fmt={(v) => `${v} kN`} />
        <LinSlider label="Position" value={a} min={0.5} max={9.5} step={0.5} onChange={setA} fmt={(v) => `${v} m`} />
        <Readouts items={[
          ['Reaction R₁ (left)', `${R1.toFixed(2)} kN`, 'P (L − a) / L'],
          ['Reaction R₂ (right)', `${R2.toFixed(2)} kN`, 'P a / L'],
          ['Maximum moment', `${Mmax.toFixed(2)} kN·m`, 'P a (L − a) / L, under the load'],
        ]} />
      </div>
    </Frame>
  )
}

/* ---------- Torsion of a round shaft ---------- */
export function Torsion() {
  const [T, setT] = useState(500), [d, setD] = useState(40), [L, setL] = useState(1)
  const Gm = 80e9
  const dm = d / 1000
  const J = (Math.PI * dm ** 4) / 32
  const tau = (T * (dm / 2)) / J
  const phi = (T * L) / (Gm * J)
  const lines = 12
  const twist = Math.min(phi * 6, 1.4)
  const X0 = 80, X1 = 560, cy = 100, r = 20 + d * 0.45
  return (
    <Frame caption="Twisting a round shaft shears the material. The stripe along the shaft bends into a spiral. Stress grows with the cube of the shaft's inverse diameter, so a slightly thicker shaft is far stronger.">
      <svg viewBox="0 0 640 200" className="wsvg" role="img" aria-label="Twisted shaft">
        <rect x={X0} y={cy - r} width={X1 - X0} height={2 * r} rx={4} className="w-fill w-outline" />
        {Array.from({ length: lines }, (_, i) => {
          const f = i / (lines - 1)
          const off = r * 0.9 * Math.sin(twist * f * 6)
          return <line key={i} x1={X0 + f * (X1 - X0)} x2={X0 + f * (X1 - X0)} y1={cy - r + 3 + (r - off) * 0.0 + off * 0.0} y2={cy + r - 3} className="w-ref" opacity={0.4} />
        })}
        <polyline points={Array.from({ length: 41 }, (_, i) => { const f = i / 40; return `${X0 + f * (X1 - X0)},${cy - Math.sin(twist * f * 6) * r * 0.85 - 0}` }).join(' ')} className="w-curve" />
        <rect x={X0 - 14} y={cy - r - 8} width={14} height={2 * r + 16} className="w-body" />
        <path d={`M ${X1 + 22} ${cy - r - 4} A ${r + 12} ${r + 12} 0 0 1 ${X1 + 22} ${cy + r + 4}`} className="w-arrowpath" />
        <text x={X1 + 38} y={cy + 4} className="w-t sm">T</text>
      </svg>
      <div className="widget-controls">
        <LinSlider label="Torque" value={T} min={100} max={2000} step={50} onChange={setT} fmt={(v) => `${v} N·m`} />
        <LinSlider label="Diameter" value={d} min={20} max={80} step={2} onChange={setD} fmt={(v) => `${v} mm`} />
        <LinSlider label="Length" value={L} min={0.5} max={3} step={0.25} onChange={setL} fmt={(v) => `${v} m`} />
        <Readouts items={[
          ['Max shear stress τ = Tr / J', `${formatSI(tau, 'Pa')}`, 'at the outer surface'],
          ['Angle of twist φ = TL / GJ', `${deg(phi).toFixed(2)}°`, 'steel, G = 80 GPa'],
          ['Polar moment J = πd⁴/32', `${(J * 1e8).toFixed(2)} × 10⁻⁸ m⁴`],
        ]} />
      </div>
    </Frame>
  )
}
