import { useRef, useState } from 'react'
import { deg, G, formatSI, rad } from '../../sim/format'
import { Frame, LinSlider, Readouts, useFrame } from './shared'
import { Arrow, clamp, Ground } from './svg'

/* ---------- Free-body diagram: push a block ---------- */
export function Fbd() {
  const [m, setM] = useState(20), [F, setF] = useState(120), [mu, setMu] = useState(0.4)
  const [x, setX] = useState(0)
  const W = m * G, N = W, fmax = mu * N
  const moving = F > fmax
  const f = moving ? fmax : F
  const a = moving ? (F - fmax) / m : 0
  const v = useRef(0)
  useFrame((dt) => {
    v.current = moving ? v.current + a * dt : 0
    setX((p) => { const n = p + v.current * dt * 30; return n > 260 ? 0 : n })
    if (!moving) setX((p) => p)
  })
  const bx = 200 + x, by = 150, k = 0.28
  return (
    <Frame caption="The free-body diagram of the crate: weight pulls down, the floor pushes up, you push right, friction pushes left. Add the arrows along each axis. Friction can only match your push up to μN, after which the crate accelerates.">
      <svg viewBox="0 0 640 250" className="wsvg" role="img" aria-label="Free-body diagram of a pushed crate">
        <Ground x={20} y={by + 30} w={600} />
        <rect x={bx - 36} y={by - 36} width={72} height={66} rx={3} className="w-body" />
        <text x={bx} y={by + 4} textAnchor="middle" className="w-t sm">{m} kg</text>
        <Arrow x1={bx} y1={by} x2={bx} y2={by + clamp(W * k * 0.5, 20, 80) + 30} cls="" label="W" lx={8} ly={4} />
        <Arrow x1={bx} y1={by} x2={bx} y2={by - clamp(N * k * 0.5, 20, 80) - 36} cls="alt" label="N" lx={8} ly={-2} />
        <Arrow x1={bx - 36} y1={by - 10} x2={bx - 36 - clamp(f * k, 4, 90)} y2={by - 10} cls="alt" label="f" lx={-4} ly={-8} />
        <Arrow x1={bx + 36} y1={by - 10} x2={bx + 36 + clamp(F * k, 4, 110)} y2={by - 10} cls="red" label="F" lx={4} ly={-8} />
        <text x={30} y={32} className={`w-t ${moving ? 'bad' : 'accent'}`}>{moving ? `ACCELERATING at ${a.toFixed(2)} m/s²` : 'AT REST: forces balance'}</text>
      </svg>
      <div className="widget-controls">
        <LinSlider label="Mass" value={m} min={5} max={60} onChange={(v) => { setM(v); setX(0) }} fmt={(v) => `${v} kg`} />
        <LinSlider label="Your push" value={F} min={0} max={400} step={10} onChange={(v) => { setF(v); setX(0) }} fmt={(v) => `${v} N`} />
        <LinSlider label="Friction μ" value={mu} min={0} max={0.8} step={0.05} onChange={(v) => { setMu(v); setX(0) }} fmt={(v) => v.toFixed(2)} />
        <Readouts items={[
          ['Vertical  ΣFy = N − W', `${(N - W).toFixed(0)} N`, `N = W = ${W.toFixed(0)} N`],
          ['Horizontal  ΣFx = F − f', `${(F - f).toFixed(1)} N`, moving ? 'a = ΣF / m' : 'friction = your push'],
          ['Largest friction  μN', `${fmax.toFixed(1)} N`],
        ]} />
      </div>
    </Frame>
  )
}

/* ---------- Two cables and a weight ---------- */
export function Cables() {
  const [Wn, setWn] = useState(500), [a, setA] = useState(40), [b, setB] = useState(40)
  const A = rad(a), B = rad(b)
  const T1 = (Wn * Math.cos(B)) / Math.sin(A + B), T2 = (Wn * Math.cos(A)) / Math.sin(A + B)
  const cx = 320, cy = 160, k = 0.18
  return (
    <Frame caption="Flatter cables carry much more tension for the same weight. Make the angles unequal and the cable at the steeper angle takes less of the load. At each joint the horizontal parts match and the vertical parts add up to the weight.">
      <svg viewBox="0 0 640 260" className="wsvg" role="img" aria-label="Weight hanging from two cables">
        <line x1={10} x2={630} y1={20} y2={20} className="w-pipe thick" />
        <line x1={clamp(cx - (cy - 20) / Math.tan(A), 12, cx)} y1={clamp(cy - Math.tan(A) * (cx - 12), 20, cy)} x2={cx} y2={cy} className="w-pipe" />
        <line x1={clamp(cx + (cy - 20) / Math.tan(B), cx, 628)} y1={clamp(cy - Math.tan(B) * (628 - cx), 20, cy)} x2={cx} y2={cy} className="w-pipe" />
        <circle cx={cx} cy={cy} r={6} className="w-joint" /><rect x={cx - 38} y={cy + 20} width={76} height={36} rx={3} className="w-body alt" /><line x1={cx} y1={cy + 6} x2={cx} y2={cy + 20} className="w-pipe" />
        <text x={cx} y={cy + 43} textAnchor="middle" className="w-t sm">{Wn} N</text>
        <Arrow x1={cx} y1={cy} x2={cx - T1 * Math.cos(A) * k} y2={cy - T1 * Math.sin(A) * k} cls="red" label={`T1 ${T1.toFixed(0)}`} lx={-60} ly={-4} />
        <Arrow x1={cx} y1={cy} x2={cx + T2 * Math.cos(B) * k} y2={cy - T2 * Math.sin(B) * k} cls="red" label={`T2 ${T2.toFixed(0)}`} lx={6} ly={-4} />
      </svg>
      <div className="widget-controls">
        <LinSlider label="Weight" value={Wn} min={100} max={1500} step={50} onChange={setWn} fmt={(v) => `${v} N`} />
        <LinSlider label="Left angle" value={a} min={10} max={80} onChange={setA} fmt={(v) => `${v}°`} />
        <LinSlider label="Right angle" value={b} min={10} max={80} onChange={setB} fmt={(v) => `${v}°`} />
        <Readouts items={[
          ['ΣFx = 0', `${(T1 * Math.cos(A)).toFixed(0)} N left = ${(T2 * Math.cos(B)).toFixed(0)} N right`, 'T1 cos α = T2 cos β'],
          ['ΣFy = 0', `${(T1 * Math.sin(A) + T2 * Math.sin(B)).toFixed(0)} N up = ${Wn} N down`],
          ['Tension ratio to weight', `${(Math.max(T1, T2) / Wn).toFixed(2)} ×`, 'grows as the cables flatten'],
        ]} />
      </div>
    </Frame>
  )
}

/* ---------- Flywheel shapes ---------- */
const SHAPES: { id: string; name: string; c: number }[] = [
  { id: 'disc', name: 'Solid disc', c: 0.5 }, { id: 'ring', name: 'Thin ring', c: 1 }, { id: 'sphere', name: 'Solid sphere', c: 0.4 },
]
export function Flywheel() {
  const [shape, setShape] = useState('disc'), [m, setM] = useState(10), [r, setR] = useState(0.3), [tq, setTq] = useState(8)
  const t = useRef(0)
  const [, tick] = useState(0)
  const sel = SHAPES.find((s) => s.id === shape)!
  const I = sel.c * m * r * r, alpha = tq / I
  useFrame((dt) => { t.current = (t.current + dt) % 5; tick((n) => n + 1) })
  const w = alpha * t.current
  const ang = useRef(0)
  ang.current += deg(clamp(w, 0, 25)) * 0.016
  const R = 20 + r * 90
  const bar = (v: number) => clamp((v / Math.max(...SHAPES.map((s) => tq / (s.c * m * r * r)))) * 150, 3, 150)
  return (
    <Frame caption="Same mass, same radius, same torque: the shape that keeps its mass far from the axle is the hardest to spin up. The wheel restarts from rest every five seconds so you can compare how fast each reaches speed.">
      <svg viewBox="0 0 640 220" className="wsvg" role="img" aria-label="Flywheel spin-up">
        <g transform="translate(130,110)">
          <g transform={`rotate(${ang.current})`}>
            {shape === 'sphere' ? <circle r={R} className="w-body" /> : <circle r={R} className="w-body" style={shape === 'ring' ? { fill: 'none', strokeWidth: 8 } : undefined} />}
            {shape !== 'sphere' && [0, 60, 120].map((a) => <line key={a} x1={-R} x2={R} y1={0} y2={0} transform={`rotate(${a})`} className="w-ref" />)}
            <circle r={4} className="w-dot" /><circle cx={R * 0.8} r={4} className="w-dot" style={{ fill: 'var(--accent)' }} />
          </g>
        </g>
        <g transform="translate(330,50)">
          <text x={0} y={-8} className="w-t sm">angular acceleration α = τ / I (rad/s²)</text>
          {SHAPES.map((s, i) => { const al = tq / (s.c * m * r * r); return (
            <g key={s.id} transform={`translate(0,${i * 44})`}>
              <rect width={bar(al)} height={22} rx={3} className="w-bar a" opacity={s.id === shape ? 1 : 0.35} />
              <text x={bar(al) + 8} y={16} className="w-t sm">{al.toFixed(1)}</text>
              <text x={0} y={38} className="w-t sm">{s.name}</text>
            </g>) })}
        </g>
      </svg>
      <div className="widget-controls">
        <div className="seg" role="group" aria-label="Shape">{SHAPES.map((s) => <button key={s.id} className={s.id === shape ? 'on' : ''} onClick={() => setShape(s.id)}>{s.name}</button>)}</div>
        <div className="two-col">
          <LinSlider label="Mass" value={m} min={1} max={50} onChange={setM} fmt={(v) => `${v} kg`} />
          <LinSlider label="Radius" value={r} min={0.1} max={0.6} step={0.05} onChange={setR} fmt={(v) => `${v} m`} />
          <LinSlider label="Torque" value={tq} min={1} max={30} onChange={setTq} fmt={(v) => `${v} N·m`} />
        </div>
        <Readouts items={[
          ['Moment of inertia I', `${I.toFixed(3)} kg·m²`, `${sel.name}: ${sel.c} m r²`],
          ['Angular acceleration', `${alpha.toFixed(1)} rad/s²`],
          ['Speed now', `${w.toFixed(1)} rad/s`, `${((w * 60) / (2 * Math.PI)).toFixed(0)} rpm after ${t.current.toFixed(1)} s`],
        ]} />
      </div>
    </Frame>
  )
}

/* ---------- Euler buckling of a column ---------- */
const ENDS = [{ name: 'Pinned-pinned', K: 1 }, { name: 'Fixed-free (flagpole)', K: 2 }, { name: 'Fixed-fixed', K: 0.5 }]
export function Column() {
  const [L, setL] = useState(1.5), [d, setD] = useState(20), [end, setEnd] = useState(0), [P, setP] = useState(8)
  const E = 200e9, I = (Math.PI * (d / 1000) ** 4) / 64, A = (Math.PI * (d / 1000) ** 2) / 4
  const K = ENDS[end].K
  const Pcr = (Math.PI ** 2 * E * I) / (K * L) ** 2 / 1000 // kN
  const Pyield = (250e6 * A) / 1000
  const buckles = Pcr < Pyield
  const fail = P >= Math.min(Pcr, Pyield)
  const ratio = P / Pcr
  const amp = fail ? (buckles ? 40 : 0) : 16 * Math.pow(Math.min(ratio, 1), 5)
  const top = 30, hgt = 170 + L * 8
  const pts = Array.from({ length: 41 }, (_, i) => { const f = i / 40; return `${220 + amp * Math.sin(Math.PI * f) * (K === 2 ? f : 1)},${top + f * hgt}` }).join(' ')
  return (
    <Frame caption="Long slender columns do not crush: they bow sideways and collapse at the Euler load, which falls with the square of the length. Stocky columns reach the material's crushing load first. Raise the load past the limit to watch what happens.">
      <svg viewBox="0 0 640 260" className="wsvg" role="img" aria-label="Column buckling">
        <Ground x={150} y={top + hgt + 6} w={140} />
        <rect x={190} y={top - 12} width={60} height={10} className="w-body" />
        <Arrow x1={220} y1={top - 52} x2={220} y2={top - 14} cls="red" label={`${P} kN`} lx={8} ly={-4} />
        <polyline points={pts} className="w-curve" style={{ stroke: fail ? 'var(--danger)' : 'var(--accent)', strokeWidth: 3 + d / 8 }} />
        <text x={340} y={80} className="w-t sm">Euler buckling load  P_cr = π² E I / (K L)²</text>
        <text x={340} y={104} className="w-t accent">{Pcr.toFixed(1)} kN</text>
        <text x={340} y={134} className="w-t sm">Crushing load  σ_y A (250 MPa)</text>
        <text x={340} y={158} className="w-t">{Pyield.toFixed(1)} kN</text>
        <text x={340} y={192} className={`w-t ${fail ? 'bad' : 'accent'}`}>{fail ? (buckles ? 'BUCKLED sideways' : 'CRUSHED') : `safe: ${(Math.min(Pcr, Pyield) / P).toFixed(2)} × margin`}</text>
      </svg>
      <div className="widget-controls">
        <div className="seg" role="group" aria-label="End conditions">{ENDS.map((e, i) => <button key={e.name} className={i === end ? 'on' : ''} onClick={() => setEnd(i)}>{e.name}</button>)}</div>
        <div className="two-col">
          <LinSlider label="Length" value={L} min={0.3} max={4} step={0.1} onChange={setL} fmt={(v) => `${v} m`} />
          <LinSlider label="Diameter" value={d} min={8} max={50} onChange={setD} fmt={(v) => `${v} mm`} />
          <LinSlider label="Load" value={P} min={1} max={120} onChange={setP} fmt={(v) => `${v} kN`} />
        </div>
        <Readouts items={[
          ['Slenderness  K L / d', (K * L * 1000 / d).toFixed(0), 'above about 100 means buckling dominates'],
          ['Governing failure', buckles ? 'buckling' : 'crushing'],
        ]} />
      </div>
    </Frame>
  )
}

/* ---------- Heating a gas: first law ---------- */
export function Gas() {
  const [Q, setQ] = useState(600), [fixed, setFixed] = useState(false)
  const n = 0.5, R = 8.314, T0 = 300, p0 = 100e3
  const dT = fixed ? Q / (1.5 * n * R) : Q / (2.5 * n * R)
  const W = fixed ? 0 : n * R * dT, dU = 1.5 * n * R * dT
  const T = T0 + dT, V0 = (n * R * T0) / p0
  const V = fixed ? V0 : (n * R * T) / p0, p = fixed ? (n * R * T) / V0 : p0
  const h = 60 + (V / V0 - 1) * 110
  return (
    <Frame caption="Heat added to a gas can raise its temperature (internal energy ΔU), push the piston out (work W), or both. With the piston free some of the heat becomes work; with the piston locked all of it goes into temperature. That is ΔU = Q − W.">
      <svg viewBox="0 0 640 240" className="wsvg" role="img" aria-label="Gas in a piston heated at constant pressure or volume">
        <rect x={80} y={30} width={120} height={180} className="w-fill w-outline" style={{ fill: 'none' }} />
        <rect x={82} y={210 - h - 20} width={116} height={h + 18} className="w-water" opacity={0.7} style={{ fill: `color-mix(in srgb, #ff5a3d ${clamp(((T - 300) / 400) * 100, 0, 100)}%, #5aa9ff)` }} />
        <rect x={80} y={210 - h - 30} width={120} height={10} className="w-body alt" />
        <line x1={140} y1={210 - h - 30} x2={140} y2={210 - h - 60} className="w-pipe thick" />
        {fixed && <><rect x={72} y={24} width={136} height={8} className="w-body" /><text x={140} y={20} textAnchor="middle" className="w-t sm">piston locked</text></>}
        <Arrow x1={140} y1={238} x2={140} y2={214} cls="red" label={`Q = ${Q} J`} lx={8} ly={10} />
        <g transform="translate(300,56)">
          <text x={0} y={-12} className="w-t sm">where the heat goes</text>
          <rect x={0} y={0} width={300} height={26} rx={3} className="w-fill" />
          <rect x={0} y={0} width={(dU / Q) * 300} height={26} rx={3} className="w-bar b" />
          <rect x={(dU / Q) * 300} y={0} width={(W / Q) * 300} height={26} className="w-bar a" />
          <text x={4} y={44} className="w-t sm" fill="#5aa9ff">ΔU = {dU.toFixed(0)} J (hotter)</text>
          <text x={296} y={44} textAnchor="end" className="w-t sm accent">W = {W.toFixed(0)} J (work)</text>
          <text x={0} y={90} className="w-t sm">T = {T.toFixed(0)} K   V = {(V * 1000).toFixed(1)} L   p = {(p / 1000).toFixed(0)} kPa</text>
        </g>
      </svg>
      <div className="widget-controls">
        <div className="seg" role="group" aria-label="Process"><button className={!fixed ? 'on' : ''} onClick={() => setFixed(false)}>Piston free (constant pressure)</button><button className={fixed ? 'on' : ''} onClick={() => setFixed(true)}>Piston locked (constant volume)</button></div>
        <LinSlider label="Heat added" value={Q} min={0} max={3000} step={100} onChange={setQ} fmt={(v) => `${v} J`} />
        <Readouts items={[
          ['First law  ΔU = Q − W', `${dU.toFixed(0)} = ${Q} − ${W.toFixed(0)}`, 'joules'],
          ['Ideal gas  pV = nRT', `${((p * V) / (n * R)).toFixed(0)} K`, 'matches the temperature above'],
        ]} />
      </div>
    </Frame>
  )
}

/* ---------- Resonance curve ---------- */
export function Resonance() {
  const [z, setZ] = useState(0.15), [rr, setRr] = useState(0.8)
  const t = useRef(0)
  const [, tick] = useState(0)
  useFrame((dt) => { t.current += dt; tick((n) => n + 1) })
  const M = (r: number) => 1 / Math.sqrt((1 - r * r) ** 2 + (2 * z * r) ** 2)
  const PX = 60, PY = 20, PW = 330, PH = 190, Mmax = 8
  const X = (r: number) => PX + (r / 2.5) * PW, Y = (m: number) => PY + PH - (Math.min(m, Mmax) / Mmax) * PH
  const pts = Array.from({ length: 200 }, (_, i) => { const r = 0.02 + (i / 199) * 2.48; return `${X(r)},${Y(M(r))}` }).join(' ')
  const amp = Math.min(M(rr), 8) * 7
  const shake = amp * Math.sin(t.current * 8 * Math.max(0.4, rr))
  return (
    <Frame caption="Push a vibrating system at its natural frequency (ratio 1) and the swings build up enormously, limited only by damping. Well away from resonance the motion stays small. This is why washing machines shake at one spin speed and why bridges and buildings need damping.">
      <svg viewBox="0 0 640 240" className="wsvg" role="img" aria-label="Resonance curve and shaking mass">
        <line x1={PX} x2={PX + PW} y1={PY + PH} y2={PY + PH} className="w-axis" /><line x1={PX} x2={PX} y1={PY} y2={PY + PH} className="w-axis" />
        <line x1={X(1)} x2={X(1)} y1={PY} y2={PY + PH} className="w-ref" />
        <polyline points={pts} className="w-curve" />
        <circle cx={X(rr)} cy={Y(M(rr))} r={6} className="w-dot" />
        <text x={PX + PW} y={PY + PH + 18} textAnchor="end" className="w-t sm">driving frequency ÷ natural frequency</text>
        <text x={PX + 6} y={PY + 12} className="w-t sm">amplification</text>
        <text x={X(1) + 6} y={PY + PH - 6} className="w-t sm">resonance</text>
        <g transform="translate(500,120)">
          <line x1={-70} x2={70} y1={70} y2={70} className="w-ground" stroke="var(--text-faint)" strokeWidth={2} />
          <rect x={-30 + shake} y={20} width={60} height={50} rx={4} className="w-body alt" />
          <line x1={-30 + shake} y1={45} x2={-70} y2={45} className="w-pipe" /><line x1={-70} y1={30} x2={-70} y2={70} className="w-pipe thick" />
          <text x={0} y={95} textAnchor="middle" className="w-t sm">swing ×{M(rr).toFixed(1)}</text>
        </g>
      </svg>
      <div className="widget-controls">
        <LinSlider label="Damping ζ" value={z} min={0.05} max={1} step={0.05} onChange={setZ} fmt={(v) => v.toFixed(2)} />
        <LinSlider label="Frequency ratio" value={rr} min={0.2} max={2.4} step={0.05} onChange={setRr} fmt={(v) => v.toFixed(2)} />
        <Readouts items={[
          ['Amplification at this frequency', `${M(rr).toFixed(2)} ×`],
          ['Peak near resonance', `${(1 / (2 * z)).toFixed(1)} ×`, '1 / (2ζ): more damping lowers the peak'],
        ]} />
      </div>
    </Frame>
  )
}

/* ---------- Heat engine energy flow ---------- */
export function Engine() {
  const [Th, setTh] = useState(800), [Tc, setTc] = useState(300), [q, setQ] = useState(60)
  const eta = Math.max(0, (q / 100) * (1 - Tc / Th))
  const QH = 100, W = QH * eta, QC = QH - W
  const wid = (v: number) => Math.max(3, v * 0.7)
  return (
    <Frame caption="Energy in equals energy out. Of the heat taken from the hot source, only the fraction η becomes work, and the rest has to be thrown away to the cold sink. The wider the temperature gap and the better the engine, the wider the work arrow.">
      <svg viewBox="0 0 640 260" className="wsvg" role="img" aria-label="Heat engine energy flow">
        <rect x={230} y={10} width={180} height={34} rx={6} className="w-body alt" /><text x={320} y={32} textAnchor="middle" className="w-t sm">Hot source {Th} K</text>
        <rect x={230} y={216} width={180} height={34} rx={6} className="w-body" style={{ stroke: '#5aa9ff' }} /><text x={320} y={238} textAnchor="middle" className="w-t sm">Cold sink {Tc} K</text>
        <circle cx={320} cy={130} r={42} className="w-body" /><text x={320} y={135} textAnchor="middle" className="w-t sm">Engine</text>
        <rect x={320 - wid(QH) / 2} y={44} width={wid(QH)} height={44} fill="var(--accent)" opacity={0.8} /><text x={340 + wid(QH) / 2} y={70} className="w-t sm accent">Q_H = 100</text>
        <rect x={320 - wid(QC) / 2} y={172} width={wid(QC)} height={44} fill="#5aa9ff" opacity={0.8} /><text x={340 + wid(QC) / 2} y={198} className="w-t sm" fill="#5aa9ff">Q_C = {QC.toFixed(0)}</text>
        <rect x={362} y={130 - wid(W) / 2} width={150} height={wid(W)} fill="var(--text)" opacity={0.85} /><text x={520} y={134} className="w-t sm" style={{ fill: 'var(--text)' }}>W = {W.toFixed(0)}</text>
      </svg>
      <div className="widget-controls">
        <div className="two-col">
          <LinSlider label="Hot side" value={Th} min={400} max={1200} step={25} onChange={(v) => setTh(Math.max(v, Tc + 50))} fmt={(v) => `${v} K`} />
          <LinSlider label="Cold side" value={Tc} min={250} max={600} step={25} onChange={(v) => setTc(Math.min(v, Th - 50))} fmt={(v) => `${v} K`} />
          <LinSlider label="Engine quality" value={q} min={10} max={100} step={5} onChange={setQ} fmt={(v) => `${v}% of ideal`} />
        </div>
        <Readouts items={[
          ['Carnot limit', `${((1 - Tc / Th) * 100).toFixed(1)} %`, 'the best any engine could do'],
          ['This engine  η = W / Q_H', `${(eta * 100).toFixed(1)} %`],
        ]} />
      </div>
    </Frame>
  )
}

/* ---------- Pressure with depth ---------- */
const FLUIDS = [{ name: 'Fresh water', rho: 1000 }, { name: 'Sea water', rho: 1025 }, { name: 'Oil', rho: 850 }, { name: 'Mercury', rho: 13600 }]
export function Depth() {
  const [h, setH] = useState(6), [fl, setFl] = useState(0)
  const rho = FLUIDS[fl].rho
  const gauge = rho * G * h
  const top = 40, H = 180
  const dY = top + (h / 20) * H
  const arrow = (d: number) => (rho * G * d) / (13600 * G * 20) * 600 + 6
  return (
    <Frame caption="Pressure grows steadily with depth because of the weight of fluid above, and at a given depth it pushes equally in every direction. Denser fluids build pressure faster, so mercury barometers are short.">
      <svg viewBox="0 0 640 250" className="wsvg" role="img" aria-label="Pressure increasing with depth in a tank">
        <rect x={80} y={top} width={160} height={H} className="w-water" opacity={0.55} stroke="var(--text-dim)" strokeWidth={2.5} />
        {[0, 5, 10, 15, 20].map((d) => <g key={d}><text x={70} y={top + (d / 20) * H + 4} textAnchor="end" className="w-t sm">{d} m</text><line x1={240} x2={250} y1={top + (d / 20) * H} y2={top + (d / 20) * H} className="w-axis" /></g>)}
        {[3, 6, 9, 12, 15, 18].map((d) => <Arrow key={d} x1={260 + 4} y1={top + (d / 20) * H} x2={260 + 4 + Math.min(arrow(d), 330) * 0.55} y2={top + (d / 20) * H} cls={d <= h ? 'red' : 'alt'} head={6} />)}
        <line x1={80} x2={240} y1={dY} y2={dY} className="w-ref" stroke="var(--accent)" />
        <circle cx={160} cy={dY} r={7} className="w-dot" />
        <text x={400} y={60} className="w-t sm">pressure arrows grow with depth</text>
        <text x={400} y={110} className="w-t accent">{(gauge / 1000).toFixed(1)} kPa gauge</text>
        <text x={400} y={138} className="w-t sm">{((gauge + 101325) / 1000).toFixed(1)} kPa absolute</text>
        <text x={400} y={166} className="w-t sm">p = ρ g h = {rho} × 9.81 × {h}</text>
      </svg>
      <div className="widget-controls">
        <div className="seg" role="group" aria-label="Fluid">{FLUIDS.map((f, i) => <button key={f.name} className={i === fl ? 'on' : ''} onClick={() => setFl(i)}>{f.name}</button>)}</div>
        <LinSlider label="Depth" value={h} min={0} max={20} step={0.5} onChange={setH} fmt={(v) => `${v} m`} />
        <Readouts items={[['Gauge pressure ρ g h', formatSI(gauge, 'Pa')], ['Atmospheres above surface', `${(gauge / 101325).toFixed(2)} atm`]]} />
      </div>
    </Frame>
  )
}

/* ---------- Impulse: force over time ---------- */
export function Impulse() {
  const [Fp, setFp] = useState(2000), [dt, setDt] = useState(10), [m, setM] = useState(0.4)
  const J = 0.5 * Fp * (dt / 1000)
  const PX = 60, PY = 20, PW = 380, PH = 170, Fmax = 6000, Tmax = 60
  const X = (t: number) => PX + (t / Tmax) * PW, Y = (f: number) => PY + PH - (f / Fmax) * PH
  return (
    <Frame caption="Impulse is the area under a force-time graph and equals the change in momentum. The same area can be a tall short spike or a low long push, which is the whole idea behind airbags and crumple zones: a longer stop means a smaller peak force.">
      <svg viewBox="0 0 640 230" className="wsvg" role="img" aria-label="Force over time during an impact">
        <line x1={PX} x2={PX + PW} y1={PY + PH} y2={PY + PH} className="w-axis" /><line x1={PX} x2={PX} y1={PY} y2={PY + PH} className="w-axis" />
        <polygon points={`${X(0)},${Y(0)} ${X(dt / 2)},${Y(Fp)} ${X(dt)},${Y(0)}`} className="w-area" stroke="var(--accent)" strokeWidth={2} />
        <text x={X(dt / 2) + 8} y={Y(Fp) + 4} className="w-t sm accent">{Fp} N peak</text>
        <text x={PX + PW} y={PY + PH + 18} textAnchor="end" className="w-t sm">time (ms)</text>
        <text x={PX + 6} y={PY + 12} className="w-t sm">force</text>
        <text x={470} y={70} className="w-t sm">area = impulse</text>
        <text x={470} y={96} className="w-t accent">{J.toFixed(2)} N·s</text>
      </svg>
      <div className="widget-controls">
        <LinSlider label="Peak force" value={Fp} min={200} max={6000} step={100} onChange={setFp} fmt={(v) => `${v} N`} />
        <LinSlider label="Duration" value={dt} min={1} max={60} onChange={setDt} fmt={(v) => `${v} ms`} />
        <LinSlider label="Mass" value={m} min={0.1} max={2} step={0.1} onChange={setM} fmt={(v) => `${v} kg`} />
        <Readouts items={[
          ['Impulse  J = ½ F_peak Δt', `${J.toFixed(2)} N·s`, 'triangular pulse'],
          ['Change in speed  Δv = J / m', `${(J / m).toFixed(1)} m/s`],
          ['Average force', `${(J / (dt / 1000)).toFixed(0)} N`, 'impulse / time'],
        ]} />
      </div>
    </Frame>
  )
}
