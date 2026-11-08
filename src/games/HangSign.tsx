import { useState } from 'react'
import { deg, G, rad } from '../sim/format'
import { Arrow } from '../learn/widgets/svg'
import { Slider } from './Slider'
import { GameShell, Msg, useStats } from './ui'

interface Level { W: number; a: number; b: number }
const makeLevel = (n: number): Level => ({ W: (2 + Math.floor(Math.random() * 8)) * 10 * (n > 3 ? 2 : 1), a: 30 + Math.floor(Math.random() * 4) * 10, b: 30 + Math.floor(Math.random() * 4) * 10 })

export function HangSign() {
  const [stats, record, reset] = useStats('sign')
  const [n, setN] = useState(1)
  const [lv, setLv] = useState(() => { const l = makeLevel(1); return { ...l, b: l.a } })
  const [t1, setT1] = useState(100), [t2, setT2] = useState(100)
  const [done, setDone] = useState<null | boolean>(null)

  const a = rad(lv.a), b = rad(lv.b)
  const W = lv.W * G
  const nx = -t1 * Math.cos(a) + t2 * Math.cos(b)
  const ny = t1 * Math.sin(a) + t2 * Math.sin(b) - W
  const T1 = (W * Math.cos(b)) / Math.sin(a + b), T2 = (W * Math.cos(a)) / Math.sin(a + b)
  const resid = Math.hypot(nx, ny)
  const balanced = resid < 0.03 * W
  const cx = 320, cy = 170, k = 0.22
  const drift = { x: nx * 0.06, y: -ny * 0.06 }
  const sx = cx + Math.max(-40, Math.min(40, drift.x)), sy = cy + 60 + Math.max(-30, Math.min(30, drift.y))
  const check = () => { setDone(balanced); record(balanced) }
  const next = () => { const l = done ? n + 1 : n; setN(l); setLv(l < 2 ? (() => { const x = makeLevel(1); return { ...x, b: x.a } })() : makeLevel(l)); setT1(100); setT2(100); setDone(null) }
  return (
    <GameShell title="Hang the Sign" level={n} stats={stats} onReset={reset}
      how="A sign hangs from two cables. Set the tension in each cable so that all the forces cancel: the horizontal parts must match and the vertical parts must add up to the weight. The sign drifts while there is a net force."
    >
      <div className="card game-board">
        <svg viewBox="0 0 640 300" className="wsvg" role="img" aria-label="Sign hanging from two cables">
          <line x1={20} x2={620} y1={20} y2={20} className="w-pipe thick" />
          <g>
            <line x1={cx - (cy - 20) / Math.tan(a)} y1={20} x2={sx} y2={sy - 24} className="w-pipe" />
            <line x1={cx + (cy - 20) / Math.tan(b)} y1={20} x2={sx} y2={sy - 24} className="w-pipe" />
          </g>
          <rect x={sx - 60} y={sy - 24} width={120} height={50} rx={4} className="w-body alt" />
          <text x={sx} y={sy + 6} textAnchor="middle" className="w-t sm">{lv.W} kg</text>
          <Arrow x1={sx} y1={sy + 26} x2={sx} y2={sy + 26 + W * k * 0.35} cls="" label="W" lx={8} ly={8} />
          <Arrow x1={sx} y1={sy - 24} x2={sx - t1 * Math.cos(a) * k * 0.9} y2={sy - 24 - t1 * Math.sin(a) * k * 0.9} cls="red" label="T1" lx={-26} ly={-4} />
          <Arrow x1={sx} y1={sy - 24} x2={sx + t2 * Math.cos(b) * k * 0.9} y2={sy - 24 - t2 * Math.sin(b) * k * 0.9} cls="red" label="T2" lx={6} ly={-4} />
          <text x={30} y={46} className="w-t sm">left cable {lv.a}°</text>
          <text x={610} y={46} textAnchor="end" className="w-t sm">right cable {lv.b}°</text>
        </svg>
        <div className="game-controls">
          <Slider label="Left tension" min={0} max={Math.ceil((W * 3) / 50) * 50} step={5} value={t1} onChange={setT1} fmt={(v) => `${v} N`} disabled={done !== null} />
          <Slider label="Right tension" min={0} max={Math.ceil((W * 3) / 50) * 50} step={5} value={t2} onChange={setT2} fmt={(v) => `${v} N`} disabled={done !== null} />
          <dl className="readouts" style={{ margin: 0 }}>
            <div><dt>Net horizontal  ΣFx</dt><dd>{nx.toFixed(0)} N</dd></div>
            <div><dt>Net vertical  ΣFy</dt><dd>{ny.toFixed(0)} N</dd></div>
            <div><dt>Weight  W = m g</dt><dd>{W.toFixed(0)} N</dd></div>
          </dl>
          <div className="tool-row">
            <button className="btn primary" onClick={check} disabled={done !== null}>Check</button>
            {done !== null && <button className="btn primary" onClick={next}>{done ? 'Next level' : 'New puzzle'}</button>}
          </div>
          {balanced && done === null && <Msg kind="info">Forces nearly cancel. Press Check.</Msg>}
          {done === true && <Msg kind="good">Equilibrium. Tensions {T1.toFixed(0)} N and {T2.toFixed(0)} N.</Msg>}
          {done === false && <Msg kind="bad">Not in equilibrium (net force {resid.toFixed(0)} N). The solution is T1 = {T1.toFixed(0)} N and T2 = {T2.toFixed(0)} N, from ΣFx = 0 and ΣFy = 0 with angles {deg(a).toFixed(0)}° and {deg(b).toFixed(0)}°.</Msg>}
        </div>
      </div>
    </GameShell>
  )
}
