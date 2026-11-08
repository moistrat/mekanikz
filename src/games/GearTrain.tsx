import { useRef, useState } from 'react'
import { gearPath } from '../learn/widgets/Machines'
import { useFrame } from '../learn/widgets/shared'
import { GameShell, Msg, useStats } from './ui'

interface Level { rpmIn: number; target: number; want: null | 'same' | 'opposite'; stages: 1 | 2; teeth: number[] }
const TEETH = [10, 12, 15, 16, 20, 24, 30, 36, 40, 48, 60]
function makeLevel(n: number): Level {
  const stages = n >= 3 ? 2 : 1
  const pairs: [number, number][] = []
  for (const a of TEETH) for (const b of TEETH) pairs.push([a, b])
  const ratioOf = (p: [number, number]) => p[1] / p[0]
  let target = 1
  if (stages === 1) {
    const p = pairs.filter((q) => ratioOf(q) !== 1 && ratioOf(q) >= 0.25 && ratioOf(q) <= 5)[Math.floor(Math.random() * 40)] ?? [10, 30]
    target = ratioOf(p)
  } else {
    const a = pairs[Math.floor(Math.random() * pairs.length)], b = pairs[Math.floor(Math.random() * pairs.length)]
    target = ratioOf(a) * ratioOf(b)
    if (target > 25 || target < 0.1) target = 6
  }
  const rpmIn = [600, 900, 1200, 1800][Math.floor(Math.random() * 4)]
  return { rpmIn, target: Number(target.toFixed(3)), want: n >= 5 ? (Math.random() < 0.5 ? 'same' : 'opposite') : null, stages, teeth: TEETH }
}

export function GearTrain() {
  const [stats, record, reset] = useStats('gears')
  const [n, setN] = useState(1)
  const [lv, setLv] = useState(() => makeLevel(1))
  const [sel, setSel] = useState([12, 36, 12, 36])
  const [idler, setIdler] = useState(false)
  const [done, setDone] = useState<null | boolean>(null)
  const ang = useRef(0)
  const [, tick] = useState(0)
  useFrame((dt) => { ang.current += dt * 40; tick((k) => k + 1) })

  const ratio = (lv.stages === 1 ? 1 : sel[2] ? sel[3] / sel[2] : 1) * (sel[1] / sel[0])
  const out = lv.rpmIn / ratio
  const targetOut = lv.rpmIn / lv.target
  // direction: each external mesh reverses direction. stage count: 2 meshes per stage pair, idler adds one
  const meshes = lv.stages + (idler ? 1 : 0)
  const reversed = meshes % 2 === 1
  const close = Math.abs(ratio - lv.target) / lv.target < 0.02
  const check = () => {
    const ok = close && (lv.want === null || reversed === (lv.want === 'opposite'))
    setDone(ok); record(ok)
  }
  const next = () => { const l = done ? n + 1 : n; setN(l); setLv(makeLevel(l)); setSel([12, 36, 12, 36]); setIdler(false); setDone(null) }
  const mod = 3.4
  const gear = (cx: number, N: number, spin: number, key: string, alt = false) => (
    <g key={key} transform={`translate(${cx},95) rotate(${spin})`}>
      <polygon points={gearPath(N, (N * mod) / 2 + 2, (N * mod) / 2 - 2)} className={`w-body ${alt ? 'alt' : ''}`} />
      <circle r={4} className="w-ground-fill" />
      <line x1={0} y1={0} x2={(N * mod) / 2 - 6} y2={0} className="w-curve" />
    </g>
  )
  const a = ang.current
  const picker = (i: number, label: string) => (
    <label className="field" key={i}>{label}
      <select value={sel[i]} disabled={done !== null} onChange={(e) => setSel(sel.map((v, k) => (k === i ? Number(e.target.value) : v)))}>
        {lv.teeth.map((t) => <option key={t} value={t}>{t} teeth</option>)}
      </select>
    </label>
  )
  // layout: driver at x, driven touching
  const r = (N: number) => (N * mod) / 2
  const x1 = 70, x2 = x1 + r(sel[0]) + r(sel[1])
  const s1 = a, s2 = -(a * sel[0]) / sel[1]
  return (
    <GameShell title="Gear Train" level={n} stats={stats} onReset={reset}
      how="Pick tooth counts so the gear train gives exactly the required overall ratio. Ratio = driven teeth ÷ driver teeth for each pair, and the stage ratios multiply. Level 5 and later demand a particular output direction: every meshing pair reverses it, and an idler adds one more."
    >
      <div className="card game-board">
        <svg viewBox="0 0 640 190" className="wsvg" role="img" aria-label="Gear pair">
          {gear(x1, sel[0], s1, 'a')}
          {gear(x2, sel[1], s2, 'b', true)}
          {lv.stages === 2 && <text x={560} y={95} className="w-t sm" textAnchor="end">+ second stage</text>}
        </svg>
        <div className="game-controls">
          <p className="q-prompt" style={{ margin: 0 }}>Input {lv.rpmIn} rpm. Required overall ratio <b>{lv.target}</b> : 1 (output {targetOut.toFixed(0)} rpm){lv.want ? `, output turning the ${lv.want === 'same' ? 'same way as' : 'opposite way to'} the input` : ''}.</p>
          <div className="two-col">
            {picker(0, 'Stage 1 driver')}{picker(1, 'Stage 1 driven')}
            {lv.stages === 2 && picker(2, 'Stage 2 driver')}{lv.stages === 2 && picker(3, 'Stage 2 driven')}
          </div>
          {lv.want && <label className="check"><input type="checkbox" checked={idler} disabled={done !== null} onChange={(e) => setIdler(e.target.checked)} /> Add an idler gear (flips direction, ratio unchanged)</label>}
          <dl className="readouts" style={{ margin: 0 }}>
            <div><dt>Your ratio</dt><dd>{ratio.toFixed(3)} : 1</dd></div>
            <div><dt>Output speed</dt><dd>{out.toFixed(0)} rpm<small>output torque is {ratio.toFixed(2)}× the input torque</small></dd></div>
            <div><dt>Output direction</dt><dd>{reversed ? 'opposite to input' : 'same as input'}</dd></div>
          </dl>
          <div className="tool-row">
            <button className="btn primary" onClick={check} disabled={done !== null}>Check</button>
            {done !== null && <button className="btn primary" onClick={next}>{done ? 'Next level' : 'New puzzle'}</button>}
          </div>
          {done === true && <Msg kind="good">Correct. Ratio {ratio.toFixed(2)} matches the target.</Msg>}
          {done === false && <Msg kind="bad">{!close ? `Ratio ${ratio.toFixed(2)} is not within 2% of ${lv.target}.` : 'The ratio is right but the output turns the wrong way. Each meshing gear flips the direction, so try adding or removing an idler.'}</Msg>}
        </div>
      </div>
    </GameShell>
  )
}
