import { useState } from 'react'
import { deg, G, rad } from '../sim/format'
import { Arrow } from '../learn/widgets/svg'
import { Slider } from './Slider'
import { Diff, GameShell, Msg, Props, useStats } from './ui'

interface Level { W: number; a: number; b: number; wind: number; ice: number; tol: number }
const makeLevel = (n: number, d: Diff): Level => {
  const a = 30 + Math.floor(Math.random() * 4) * 10
  const W = (2 + Math.floor(Math.random() * 8)) * 10 * (n > 3 ? 2 : 1)
  if (d === 'easy') return { W, a, b: a, wind: 0, ice: 0, tol: 0.05 }
  const b = d === 'normal' && n < 2 ? a : 30 + Math.floor(Math.random() * 4) * 10
  if (d === 'normal') return { W, a, b, wind: 0, ice: 0, tol: 0.03 }
  const ice = [0, 0.15, 0.25, 0.4][Math.min(3, Math.floor(Math.random() * 4))]
  const wind = (Math.random() < 0.5 ? -1 : 1) * (0.1 + Math.random() * 0.2)
  return { W, a, b, wind, ice, tol: 0.03 }
}
/** Equilibrium: -T1 cos a + T2 cos b + Fw = 0 and T1 sin a + T2 sin b = Wt. */
const solve = (a: number, b: number, Wt: number, Fw: number) => ({
  T1: (Wt * Math.cos(b) + Fw * Math.sin(b)) / Math.sin(a + b),
  T2: (Wt * Math.cos(a) - Fw * Math.sin(a)) / Math.sin(a + b),
})

export function HangSign({ difficulty, onDifficulty }: Props) {
  const [stats, record, reset] = useStats(`sign.${difficulty}`)
  const [n, setN] = useState(1)
  const [lv, setLv] = useState(() => makeLevel(1, difficulty))
  const [t1, setT1] = useState(100), [t2, setT2] = useState(100)
  const [done, setDone] = useState<null | boolean>(null)

  const a = rad(lv.a), b = rad(lv.b)
  const Wt = lv.W * G * (1 + lv.ice)
  const Fw = lv.wind * lv.W * G
  const nx = -t1 * Math.cos(a) + t2 * Math.cos(b) + Fw
  const ny = t1 * Math.sin(a) + t2 * Math.sin(b) - Wt
  const { T1, T2 } = solve(a, b, Wt, Fw)
  const resid = Math.hypot(nx, ny)
  const balanced = resid < lv.tol * Wt
  const cx = 320, cy = 170, k = 0.22
  const sx = cx + Math.max(-40, Math.min(40, nx * 0.06)), sy = cy + 60 + Math.max(-30, Math.min(30, -ny * 0.06))
  const check = () => { setDone(balanced); record(balanced) }
  const next = () => { const l = done ? n + 1 : n; setN(l); setLv(makeLevel(l, difficulty)); setT1(100); setT2(100); setDone(null) }
  const hard = difficulty === 'hard'
  const max = Math.ceil((Wt * 3) / 50) * 50
  return (
    <GameShell title="Hang the Sign" level={n} stats={stats} onReset={reset} difficulty={difficulty} onDifficulty={onDifficulty}
      factors={hard ? [lv.ice ? `Ice adds ${Math.round(lv.ice * 100)}% to the weight` : 'Clear weather', `Wind pushes the sign ${lv.wind > 0 ? 'right' : 'left'} with ${Math.round(Math.abs(Fw))} N`, 'Different cable angles'] : undefined}
      how="A sign hangs from two cables. Set the tension in each cable so that all the forces cancel: the horizontal parts must match and the vertical parts must add up to the weight. The sign drifts while there is a net force. In Real world mode ice and wind change the loads."
    >
      <div className="card game-board">
        <svg viewBox="0 0 640 300" className="wsvg" role="img" aria-label="Sign hanging from two cables">
          <line x1={20} x2={620} y1={20} y2={20} className="w-pipe thick" />
          <line x1={cx - (cy - 20) / Math.tan(a)} y1={20} x2={sx} y2={sy - 24} className="w-pipe" />
          <line x1={cx + (cy - 20) / Math.tan(b)} y1={20} x2={sx} y2={sy - 24} className="w-pipe" />
          <rect x={sx - 60} y={sy - 24} width={120} height={50} rx={4} className="w-body alt" />
          <text x={sx} y={sy + 6} textAnchor="middle" className="w-t sm">{lv.W} kg{lv.ice ? ' + ice' : ''}</text>
          <Arrow x1={sx} y1={sy + 26} x2={sx} y2={sy + 26 + Wt * k * 0.35} cls="" label="W" lx={8} ly={8} />
          {Fw !== 0 && <Arrow x1={sx - Math.sign(Fw) * 60} y1={sy} x2={sx - Math.sign(Fw) * 60 + Fw * k * 0.5} y2={sy} cls="alt" label="wind" lx={Fw > 0 ? 6 : -34} ly={-8} />}
          <Arrow x1={sx} y1={sy - 24} x2={sx - t1 * Math.cos(a) * k * 0.9} y2={sy - 24 - t1 * Math.sin(a) * k * 0.9} cls="red" label="T1" lx={-26} ly={-4} />
          <Arrow x1={sx} y1={sy - 24} x2={sx + t2 * Math.cos(b) * k * 0.9} y2={sy - 24 - t2 * Math.sin(b) * k * 0.9} cls="red" label="T2" lx={6} ly={-4} />
          <text x={30} y={46} className="w-t sm">left cable {lv.a}°</text>
          <text x={610} y={46} textAnchor="end" className="w-t sm">right cable {lv.b}°</text>
        </svg>
        <div className="game-controls">
          <Slider label="Left tension" min={0} max={max} step={5} value={t1} onChange={setT1} fmt={(v) => `${v} N`} disabled={done !== null} />
          <Slider label="Right tension" min={0} max={max} step={5} value={t2} onChange={setT2} fmt={(v) => `${v} N`} disabled={done !== null} />
          <dl className="readouts" style={{ margin: 0 }}>
            <div><dt>Net horizontal  ΣFx</dt><dd>{nx.toFixed(0)} N</dd></div>
            <div><dt>Net vertical  ΣFy</dt><dd>{ny.toFixed(0)} N</dd></div>
            <div><dt>Total weight{lv.ice ? ' (with ice)' : ''}</dt><dd>{Wt.toFixed(0)} N</dd></div>
          </dl>
          <div className="tool-row">
            <button className="btn primary" onClick={check} disabled={done !== null}>Check</button>
            {done !== null && <button className="btn primary" onClick={next}>{done ? 'Next level' : 'New puzzle'}</button>}
          </div>
          {balanced && done === null && <Msg kind="info">Forces nearly cancel (within {Math.round(lv.tol * 100)}%). Press Check.</Msg>}
          {done === true && <Msg kind="good">Equilibrium. Tensions {T1.toFixed(0)} N and {T2.toFixed(0)} N.</Msg>}
          {done === false && <Msg kind="bad">Not in equilibrium (net force {resid.toFixed(0)} N). The solution is T1 = {T1.toFixed(0)} N and T2 = {T2.toFixed(0)} N, from ΣFx = 0 and ΣFy = 0 with angles {deg(a).toFixed(0)}° and {deg(b).toFixed(0)}°{Fw ? ' and the wind force' : ''}.</Msg>}
        </div>
      </div>
    </GameShell>
  )
}
