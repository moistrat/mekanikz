import { useState } from 'react'
import { formatSI } from '../../sim/format'
import { Frame, LinSlider, Readouts } from './shared'

/* ---------- Carnot cycle on log-log P-V axes ---------- */
export function Carnot() {
  const [Th, setTh] = useState(600), [Tc, setTc] = useState(300)
  const g = 1.4, nR = 1 // normalised so P V = T
  const V1 = 1, V2 = 2
  const r = Math.pow(Th / Tc, 1 / (g - 1))
  const V3 = V2 * r, V4 = V1 * r
  const pv = (V: number, T: number) => nR * T / V
  const pts = [[V1, pv(V1, Th)], [V2, pv(V2, Th)], [V3, pv(V3, Tc)], [V4, pv(V4, Tc)]]
  const lx = (V: number) => 70 + (Math.log(V) / Math.log(40)) * 520
  const ly = (P: number) => 230 - ((Math.log(P) - Math.log(10)) / (Math.log(1000) - Math.log(10))) * 200
  const iso = (Va: number, Vb: number, T: number) => Array.from({ length: 31 }, (_, i) => { const V = Va * Math.pow(Vb / Va, i / 30); return `${lx(V)},${ly(pv(V, T))}` }).join(' ')
  const adi = (Va: number, Pa: number, Vb: number) => Array.from({ length: 31 }, (_, i) => { const V = Va * Math.pow(Vb / Va, i / 30); return `${lx(V)},${ly(Pa * Math.pow(Va / V, g))}` }).join(' ')
  const eta = 1 - Tc / Th
  const Qin = nR * Th * Math.log(V2 / V1), W = Qin * eta
  return (
    <Frame caption="The Carnot cycle is the most efficient engine possible between a hot and a cold reservoir: heat in during the top expansion, heat rejected during the bottom compression, joined by two insulated (adiabatic) steps. The enclosed area is the work per cycle. Only the temperatures set the efficiency.">
      <svg viewBox="0 0 640 260" className="wsvg" role="img" aria-label="Carnot cycle on a pressure-volume graph">
        <line x1={70} x2={600} y1={230} y2={230} className="w-axis" />
        <line x1={70} x2={70} y1={20} y2={230} className="w-axis" />
        <polygon points={`${iso(V1, V2, Th)} ${adi(V2, pts[1][1], V3)} ${iso(V3, V4, Tc)} ${adi(V4, pts[3][1], V1)}`} className="w-area" />
        <polyline points={iso(V1, V2, Th)} className="w-curve" />
        <polyline points={adi(V2, pts[1][1], V3)} className="w-curve alt" />
        <polyline points={iso(V3, V4, Tc)} className="w-curve" style={{ stroke: '#5aa9ff' }} />
        <polyline points={adi(V4, pts[3][1], V1)} className="w-curve alt" />
        {pts.map(([V, P], i) => <g key={i}><circle cx={lx(V)} cy={ly(P)} r={4} className="w-dot" /><text x={lx(V) + 8} y={ly(P) - 6} className="w-t sm">{i + 1}</text></g>)}
        <text x={600} y={250} textAnchor="end" className="w-t sm">volume (log scale)</text>
        <text x={76} y={30} className="w-t sm">pressure (log)</text>
      </svg>
      <div className="widget-controls">
        <LinSlider label="Hot side" value={Th} min={400} max={1200} step={25} onChange={(v) => setTh(Math.max(v, Tc + 50))} fmt={(v) => `${v} K`} />
        <LinSlider label="Cold side" value={Tc} min={250} max={600} step={25} onChange={(v) => setTc(Math.min(v, Th - 50))} fmt={(v) => `${v} K`} />
        <Readouts items={[
          ['Efficiency  η = 1 − Tc/Th', `${(eta * 100).toFixed(1)} %`, 'temperatures in kelvin, never °C'],
          ['Heat in : work out : heat rejected', `${Qin.toFixed(0)} : ${W.toFixed(0)} : ${(Qin - W).toFixed(0)}`, 'relative units'],
        ]} />
      </div>
    </Frame>
  )
}

/* ---------- Bernoulli / continuity in a pipe ---------- */
export function Bernoulli() {
  const [d1, setD1] = useState(10), [d2, setD2] = useState(5), [Q, setQ] = useState(2)
  const rho = 1000
  const A1 = Math.PI * (d1 / 200) ** 2, A2 = Math.PI * (d2 / 200) ** 2
  const q = Q / 1000
  const v1 = q / A1, v2 = q / A2
  const dP = 0.5 * rho * (v2 * v2 - v1 * v1) // drop from section 1 to 2
  const h1 = 110 // manometer height in px for P1 baseline
  const hh = (dp: number) => clamp(dp / 400, 0, 90) // 1 px per 400 Pa? scaled
  const r1 = 12 + d1 * 2.4, r2 = 12 + d2 * 2.4
  const cy = 160
  return (
    <Frame caption="Water is incompressible, so the same volume per second must squeeze through every section: a narrow pipe means faster flow (continuity). Faster flow carries more kinetic energy, which comes out of pressure, so the narrow section reads lower pressure (Bernoulli).">
      <svg viewBox="0 0 640 250" className="wsvg" role="img" aria-label="Pipe with a narrowing section and pressure columns">
        <path d={`M 40 ${cy - r1} L 220 ${cy - r1} L 300 ${cy - r2} L 400 ${cy - r2} L 480 ${cy - r1} L 600 ${cy - r1} L 600 ${cy + r1} L 480 ${cy + r1} L 400 ${cy + r2} L 300 ${cy + r2} L 220 ${cy + r1} L 40 ${cy + r1} Z`} className="w-water" stroke="var(--text-dim)" strokeWidth={2.5} />
        {[[120, 0, r1], [350, dP, r2]].map(([x, drop, r], i) => (
          <g key={i}>
            <rect x={(x as number) - 7} y={cy - (r as number) - 16 - (h1 - hh(drop as number))} width={14} height={h1 - hh(drop as number) + 16} className="w-water" stroke="var(--text-dim)" strokeWidth={2} />
            <text x={x as number} y={cy - (r as number) - 24 - (h1 - hh(drop as number))} textAnchor="middle" className="w-t sm">{i === 0 ? 'high p' : 'low p'}</text>
          </g>
        ))}
        <text x={120} y={cy + 4} textAnchor="middle" className="w-t sm">{v1.toFixed(2)} m/s</text>
        <text x={350} y={cy + 4} textAnchor="middle" className="w-t sm">{v2.toFixed(2)} m/s</text>
      </svg>
      <div className="widget-controls">
        <LinSlider label="Wide pipe" value={d1} min={6} max={14} onChange={(v) => setD1(Math.max(v, d2))} fmt={(v) => `${v} cm`} />
        <LinSlider label="Narrow pipe" value={d2} min={2} max={10} onChange={(v) => setD2(Math.min(v, d1))} fmt={(v) => `${v} cm`} />
        <LinSlider label="Flow rate" value={Q} min={0.5} max={10} step={0.5} onChange={setQ} fmt={(v) => `${v} L/s`} />
        <Readouts items={[
          ['Speed in wide pipe  v = Q / A', `${v1.toFixed(2)} m/s`],
          ['Speed in narrow pipe', `${v2.toFixed(2)} m/s`, `${(A1 / A2).toFixed(1)}× faster`],
          ['Pressure drop', formatSI(dP, 'Pa'), '½ρ(v₂² − v₁²), horizontal pipe'],
        ]} />
      </div>
    </Frame>
  )
}
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x))
