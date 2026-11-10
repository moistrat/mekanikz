import { useRef, useState } from 'react'
import { gearPath } from '../learn/widgets/Machines'
import { useFrame } from '../learn/widgets/shared'
import { Diff, GameShell, Msg, Props, useStats } from './ui'

interface Level { rpmIn: number; torqueIn: number; target: number; want: null | 'same' | 'opposite'; stages: 1 | 2; teeth: number[]; eta: number; minTorque: number | null }
const TEETH = [10, 12, 15, 16, 20, 24, 30, 36, 40, 48, 60]
const MESH_ETA = 0.97
const sample = <T,>(xs: T[], k: number): T[] => [...xs].sort(() => Math.random() - 0.5).slice(0, k)

function makeLevel(n: number, d: Diff): Level {
  const hard = d === 'hard'
  const stages: 1 | 2 = d === 'easy' ? 1 : hard ? 2 : n >= 3 ? 2 : 1
  const teeth = hard ? sample(TEETH, 6).sort((a, b) => a - b) : TEETH
  const pairs: [number, number][] = []
  for (const a of teeth) for (const b of teeth) pairs.push([a, b])
  const ratioOf = (p: [number, number]) => p[1] / p[0]
  let target = 1
  for (let guard = 0; guard < 200; guard++) {
    if (stages === 1) {
      const ok = pairs.filter((q) => ratioOf(q) !== 1 && ratioOf(q) >= (d === 'easy' ? 1.5 : 0.25) && ratioOf(q) <= 5)
      if (!ok.length) continue
      target = ratioOf(ok[Math.floor(Math.random() * ok.length)])
      break
    }
    const a = pairs[Math.floor(Math.random() * pairs.length)], b = pairs[Math.floor(Math.random() * pairs.length)]
    target = ratioOf(a) * ratioOf(b)
    if (target <= 25 && target >= 1.5) break
    target = 6
  }
  const want = d === 'easy' ? null : (hard && n >= 1) || n >= 5 ? (Math.random() < 0.5 ? 'same' : 'opposite') : null
  const torqueIn = [5, 8, 10, 15, 20][Math.floor(Math.random() * 5)]
  const idlerNeeded = want !== null && ((stages === 1 && want === 'same') || (stages === 2 && want === 'opposite'))
  const minTorque = hard ? torqueIn * target * Math.pow(MESH_ETA, stages + (idlerNeeded ? 1 : 0)) * 0.995 : null
  return { rpmIn: [600, 900, 1200, 1800][Math.floor(Math.random() * 4)], torqueIn, target: Number(target.toFixed(3)), want, stages, teeth, eta: hard ? MESH_ETA : 1, minTorque }
}

export function GearTrain({ difficulty, onDifficulty }: Props) {
  const [stats, record, reset] = useStats(`gears.${difficulty}`)
  const [n, setN] = useState(1)
  const [lv, setLv] = useState(() => makeLevel(1, difficulty))
  const [sel, setSel] = useState(() => { const t = lv.teeth; return [t[0], t[1], t[0], t[1]] })
  const [idler, setIdler] = useState(false)
  const [done, setDone] = useState<null | boolean>(null)
  const ang = useRef(0)
  const [, tick] = useState(0)
  useFrame((dt) => { ang.current += dt * 40; tick((k) => k + 1) })

  const ratio = (lv.stages === 1 ? 1 : sel[2] ? sel[3] / sel[2] : 1) * (sel[1] / sel[0])
  const out = lv.rpmIn / ratio
  const meshes = lv.stages + (idler ? 1 : 0)
  const reversed = meshes % 2 === 1
  const outTorque = lv.torqueIn * ratio * Math.pow(lv.eta, meshes)
  const close = Math.abs(ratio - lv.target) / lv.target < 0.02
  const dirOk = lv.want === null || reversed === (lv.want === 'opposite')
  const torqueOk = lv.minTorque === null || outTorque >= lv.minTorque
  const check = () => { const ok = close && dirOk && torqueOk; setDone(ok); record(ok) }
  const next = () => {
    const l = done ? n + 1 : n; const nl = makeLevel(l, difficulty)
    setN(l); setLv(nl); setSel([nl.teeth[0], nl.teeth[1], nl.teeth[0], nl.teeth[1]]); setIdler(false); setDone(null)
  }
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
  const r = (N: number) => (N * mod) / 2
  const x1 = 70, x2 = x1 + r(sel[0]) + r(sel[1])
  const hard = difficulty === 'hard'
  return (
    <GameShell title="Gear Train" level={n} stats={stats} onReset={reset} difficulty={difficulty} onDifficulty={onDifficulty}
      factors={hard ? ['Only 6 gear sizes in stock', `${Math.round((1 - MESH_ETA) * 100)}% power lost at every mesh`, 'Minimum output torque spec', 'Required direction'] : undefined}
      how="Pick tooth counts so the gear train gives the required overall ratio. Ratio = driven teeth ÷ driver teeth for each pair, and the stage ratios multiply. When a direction is demanded, every meshing pair reverses it and an idler adds one more. In Real world mode each mesh wastes 3% of the power, so extra gears cost torque."
    >
      <div className="card game-board">
        <svg viewBox="0 0 640 190" className="wsvg" role="img" aria-label="Gear pair">
          {gear(x1, sel[0], a, 'a')}
          {gear(x2, sel[1], -(a * sel[0]) / sel[1], 'b', true)}
          {lv.stages === 2 && <text x={560} y={95} className="w-t sm" textAnchor="end">+ second stage</text>}
        </svg>
        <div className="game-controls">
          <p className="q-prompt" style={{ margin: 0 }}>Input {lv.rpmIn} rpm at {lv.torqueIn} N·m. Required overall ratio <b>{lv.target}</b> : 1 (output {(lv.rpmIn / lv.target).toFixed(0)} rpm){lv.want ? `, output turning the ${lv.want === 'same' ? 'same way as' : 'opposite way to'} the input` : ''}.{lv.minTorque !== null && <> The load needs at least <b>{lv.minTorque.toFixed(1)} N·m</b> out.</>}</p>
          <div className="two-col">
            {picker(0, 'Stage 1 driver')}{picker(1, 'Stage 1 driven')}
            {lv.stages === 2 && picker(2, 'Stage 2 driver')}{lv.stages === 2 && picker(3, 'Stage 2 driven')}
          </div>
          {lv.want && <label className="check"><input type="checkbox" checked={idler} disabled={done !== null} onChange={(e) => setIdler(e.target.checked)} /> Add an idler gear (flips direction, ratio unchanged{hard ? ', costs another 3%' : ''})</label>}
          <dl className="readouts" style={{ margin: 0 }}>
            <div><dt>Your ratio</dt><dd>{ratio.toFixed(3)} : 1</dd></div>
            <div><dt>Output speed</dt><dd>{out.toFixed(0)} rpm</dd></div>
            <div><dt>Output torque</dt><dd>{outTorque.toFixed(1)} N·m<small>{hard ? `${meshes} meshes at ${(lv.eta * 100).toFixed(0)}% each` : 'ideal, no losses'}</small></dd></div>
            <div><dt>Output direction</dt><dd>{reversed ? 'opposite to input' : 'same as input'}</dd></div>
          </dl>
          <div className="tool-row">
            <button className="btn primary" onClick={check} disabled={done !== null}>Check</button>
            {done !== null && <button className="btn primary" onClick={next}>{done ? 'Next level' : 'New puzzle'}</button>}
          </div>
          {done === true && <Msg kind="good">Correct. Ratio {ratio.toFixed(2)} matches the target{lv.minTorque !== null ? ` and ${outTorque.toFixed(1)} N·m meets the spec` : ''}.</Msg>}
          {done === false && <Msg kind="bad">{!close ? `Ratio ${ratio.toFixed(2)} is not within 2% of ${lv.target}.` : !dirOk ? 'The ratio is right but the output turns the wrong way. Each meshing gear flips the direction, so try adding or removing an idler.' : `Only ${outTorque.toFixed(1)} N·m reaches the load, below the ${lv.minTorque!.toFixed(1)} N·m spec. Extra gears waste power.`}</Msg>}
        </div>
      </div>
    </GameShell>
  )
}
