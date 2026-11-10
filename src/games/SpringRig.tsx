import { ReactElement, useEffect, useRef, useState } from 'react'
import { G } from '../sim/format'
import { useFrame } from '../learn/widgets/shared'
import { checkSuspension, CATALOG, dampingRatio, EASY_CATALOG, HARD_TOPOS, kEq, makeSpringLevel, naturalHz, Net, PAIR_TOPOS, SpringLevel, staticDeflectionCm } from '../sim/springs'
import { Slider } from './Slider'
import { Diff, GameShell, Msg, Props, useStats } from './ui'

/** Draw a spring network inside a box. Series splits the height, parallel splits the width. */
function drawNet(n: Net, ks: number[], x0: number, x1: number, y0: number, y1: number, key: string): ReactElement {
  if (n.t === 'k') {
    const cx = (x0 + x1) / 2, len = y1 - y0, coils = Math.max(4, Math.min(12, Math.round(len / 9)))
    const pts = [`${cx},${y0}`, `${cx},${y0 + len * 0.12}`]
    for (let i = 0; i < coils * 2; i++) pts.push(`${cx + (i % 2 ? 11 : -11)},${y0 + len * 0.12 + ((i + 0.5) / (coils * 2)) * len * 0.76}`)
    pts.push(`${cx},${y0 + len * 0.88}`, `${cx},${y1}`)
    return <g key={key}><polyline points={pts.join(' ')} className="w-pipe" /><text x={cx + 16} y={(y0 + y1) / 2 + 4} className="w-t sm">{ks[n.i]}</text></g>
  }
  const m = n.c.length
  if (n.t === 'par') {
    const w = (x1 - x0) / m
    return <g key={key}>
      <line x1={x0 + w / 2} x2={x1 - w / 2} y1={y0} y2={y0} className="w-pipe thick" /><line x1={x0 + w / 2} x2={x1 - w / 2} y1={y1} y2={y1} className="w-pipe thick" />
      {n.c.map((c, i) => drawNet(c, ks, x0 + i * w, x0 + (i + 1) * w, y0, y1, `${key}${i}`))}
    </g>
  }
  const h = (y1 - y0) / m
  return <g key={key}>{n.c.map((c, i) => drawNet(c, ks, x0, x1, y0 + i * h, y0 + (i + 1) * h, `${key}${i}`))}</g>
}

export function SpringRig({ difficulty, onDifficulty }: Props) {
  const [stats, record, reset] = useStats(`spring.${difficulty}`)
  const [n, setN] = useState(1)
  const [lv, setLv] = useState<SpringLevel>(() => makeSpringLevel(difficulty))
  const [pick, setPick] = useState<number[]>([0, 1, 2])
  const [topo, setTopo] = useState(0)
  const [c, setC] = useState(600)
  const [loaded, setLoaded] = useState(true)
  const [done, setDone] = useState<null | boolean>(null)
  const recorded = useRef(false)
  const [msg, setMsg] = useState('')
  const sim = useRef({ x: 0, v: 0, trace: [] as number[] })
  const [, tick] = useState(0)

  const cat = difficulty === 'easy' ? EASY_CATALOG : CATALOG
  const hard = lv.kind === 'susp'
  const nSprings = lv.kind === 'susp' ? 3 : difficulty === 'easy' ? 1 : 2
  const topos = lv.kind === 'susp' ? HARD_TOPOS : PAIR_TOPOS
  const ks = pick.slice(0, nSprings).map((i) => cat[Math.min(i, cat.length - 1)])
  const net: Net = difficulty === 'easy' ? { t: 'k', i: 0 } : topos[Math.min(topo, topos.length - 1)].net
  const k = kEq(net, ks)
  const m = lv.kind === 'susp' ? (loaded ? lv.mLoaded : lv.mEmpty) : lv.mass
  const cEff = lv.kind === 'susp' ? c : 0.18 * 2 * Math.sqrt(k * m) // gentle fixed damping so the hang settles
  const xEq = (m * G) / k

  // the mass dynamics (restart from the free length / a bump)
  const reload = (kind: 'drop' | 'bump') => { sim.current = { x: kind === 'drop' ? 0 : xEq + 0.07, v: 0, trace: [] }; if (kind === 'drop') sim.current.x = 0 }
  useEffect(() => { reload(lv.kind === 'susp' ? 'bump' : 'drop') }, [lv, loaded]) // eslint-disable-line react-hooks/exhaustive-deps
  useFrame((dt) => {
    const s = sim.current
    const steps = 20, h = Math.min(dt, 0.05) / steps
    for (let i = 0; i < steps; i++) { const a = G - (k * s.x + cEff * s.v) / m; s.v += a * h; s.x += s.v * h }
    s.trace.push(s.x); if (s.trace.length > 240) s.trace.shift()
    tick((q) => q + 1)
  })

  // scale: put the reference line (target or travel limit) at ~130 px
  const refCm = lv.kind === 'hold' ? lv.targetCm : lv.travelMaxCm
  const pxPerM = 130 / ((refCm / 100) * (hard ? 1 : 1))
  const top = 36, base = 56
  const y1 = top + base + sim.current.x * pxPerM - 20
  const clampY = (y: number) => Math.max(top + 24, Math.min(y, 270))
  const massY = clampY(y1 + 20)

  const newLevel = (won: boolean | null) => {
    const l = won ? n + 1 : n
    setN(l); setLv(makeSpringLevel(difficulty)); setPick([0, 1, 2]); setTopo(0); setC(600); setDone(null); setMsg(''); recorded.current = false; setLoaded(true)
  }
  const submit = () => {
    let ok = false, text = ''
    if (lv.kind === 'hold') {
      const dcm = staticDeflectionCm(lv.mass, k)
      ok = Math.abs(dcm - lv.targetCm) / lv.targetCm <= 0.04
      text = ok ? `Stretch ${dcm.toFixed(1)} cm hits the ${lv.targetCm.toFixed(1)} cm line. k = ${k.toFixed(0)} N/m.` : `Your rig stretches ${dcm.toFixed(1)} cm (k = ${k.toFixed(0)} N/m). The line is at ${lv.targetCm.toFixed(1)} cm: you need k ≈ ${((lv.mass * G) / (lv.targetCm / 100)).toFixed(0)} N/m.`
      reload('drop')
    } else {
      const r = checkSuspension(lv, k, c)
      ok = r.ok
      text = ok ? 'Every spec is met. Smooth, stable and safe.' : `Failed: ${r.items.filter((i) => !i.ok).map((i) => i.label).join('; ')}.`
    }
    setMsg(text)
    if (ok) setDone(true)
    if (!recorded.current) { recorded.current = true; record(ok) }
  }
  const check = lv.kind === 'susp' ? checkSuspension(lv, k, c) : null
  const pretty = (d: Diff) => d
  void pretty
  const trace = sim.current.trace
  const gx = 360, gy = 150, gw = 250, gh = 60

  return (
    <GameShell title="Spring Rig" level={n} stats={stats} onReset={reset} difficulty={difficulty} onDifficulty={onDifficulty}
      factors={lv.kind === 'susp' ? ['Empty and loaded vehicle', `Damper fades ${Math.round((1 - lv.fade) * 100)}% when hot`, 'Travel limit and comfort band', '3 springs, 4 layouts'] : undefined}
      how={difficulty === 'easy' ? 'Hooke’s law: F = k x. A spring stretches until its pull equals the weight, so the stretch is x = m g / k. Pick the spring that lets the mass settle on the dashed line.' : difficulty === 'normal' ? 'Springs combine like resistors in reverse: in parallel the stiffnesses add (k = k₁ + k₂), in series the softnesses add (1/k = 1/k₁ + 1/k₂). Pick two springs and a layout so the mass settles on the dashed line.' : 'Design a suspension. Choose three springs, a layout and a damper so the car sits at a sensible ride height whether empty or loaded, rides at a comfortable frequency, and is well damped even when the damper is hot. All specs must pass.'}>
      <div className="spring-grid">
        <div className="card game-board" style={{ maxWidth: 'none' }}>
          <svg viewBox="0 0 640 300" className="wsvg" role="img" aria-label="Spring rig">
            <line x1={60} x2={300} y1={top} y2={top} className="w-pipe thick" />
            {drawNet(net, ks, 100, 260, top, massY - 24, 'n')}
            <rect x={110} y={massY - 24} width={140} height={48} rx={4} className="w-body alt" />
            <text x={180} y={massY + 5} textAnchor="middle" className="w-t sm">{m} kg</text>
            {lv.kind === 'hold' && <g><line x1={20} x2={300} y1={top + base + (lv.targetCm / 100) * pxPerM + 4} y2={top + base + (lv.targetCm / 100) * pxPerM + 4} className="w-ref" /><text x={22} y={top + base + (lv.targetCm / 100) * pxPerM - 2} className="w-t sm accent">target {lv.targetCm.toFixed(1)} cm</text></g>}
            {lv.kind === 'susp' && <g>
              <line x1={20} x2={300} y1={top + base + (lv.travelMaxCm / 100) * pxPerM + 4} y2={top + base + (lv.travelMaxCm / 100) * pxPerM + 4} className="w-ref" />
              <text x={22} y={top + base + (lv.travelMaxCm / 100) * pxPerM - 2} className="w-t sm accent">max sag (loaded)</text>
            </g>}
            <line x1={gx} x2={gx + gw} y1={gy} y2={gy} className="w-axis" />
            <polyline points={trace.map((v, i) => `${gx + (i / 240) * gw},${gy + 0 - (v - xEq) * 320}`).join(' ')} className="w-curve" />
            <text x={gx} y={gy - gh} className="w-t sm">motion about rest height</text>
            <text x={gx} y={gy + 24} className="w-t sm">k = {k.toFixed(0)} N/m · rest sag {(xEq * 100).toFixed(1)} cm</text>
            <text x={gx} y={gy + 40} className="w-t sm">f = {naturalHz(k, m).toFixed(2)} Hz{lv.kind === 'susp' ? ` · ζ = ${dampingRatio(c, k, m).toFixed(2)}` : ''}</text>
          </svg>
        </div>
        <div className="card game-board" style={{ maxWidth: 'none' }}>
          <p className="q-prompt" style={{ margin: 0 }}>{lv.kind === 'hold'
            ? <>Hang a <b>{lv.mass} kg</b> mass so it settles <b>{lv.targetCm.toFixed(1)} cm</b> below the free length.</>
            : <>A car corner carries <b>{lv.mEmpty} kg</b> empty and <b>{lv.mLoaded} kg</b> loaded. Build a suspension that meets every spec below.</>}</p>
          <div className="two-col">
            {Array.from({ length: nSprings }, (_, i) => (
              <label className="field" key={i}>Spring {i + 1}
                <select value={pick[i]} disabled={done !== null} onChange={(e) => setPick(pick.map((v, q) => (q === i ? Number(e.target.value) : v)))}>
                  {cat.map((v, j) => <option key={v} value={j}>{v} N/m</option>)}
                </select>
              </label>
            ))}
          </div>
          {difficulty !== 'easy' && (
            <label className="field">Layout
              <select value={topo} disabled={done !== null} onChange={(e) => setTopo(Number(e.target.value))}>
                {topos.map((t, i) => <option key={t.id} value={i}>{t.name}</option>)}
              </select>
            </label>
          )}
          {lv.kind === 'susp' && (
            <>
              <Slider label="Damper" min={100} max={3500} step={50} value={c} onChange={setC} fmt={(v) => `${v} N·s/m`} disabled={done !== null} />
              <div className="seg" role="group" aria-label="Load case">
                <button className={loaded ? 'on' : ''} onClick={() => setLoaded(true)}>Loaded {lv.mLoaded} kg</button>
                <button className={!loaded ? 'on' : ''} onClick={() => setLoaded(false)}>Empty {lv.mEmpty} kg</button>
              </div>
              <button className="btn" style={{ width: 'fit-content' }} onClick={() => reload('bump')}>Hit a bump</button>
              <ul className="check-list">{check!.items.map((i) => <li key={i.label} className={i.ok ? 'ok' : ''}><span>{i.ok ? '✓' : '✗'} {i.label}</span><b>{i.value}</b></li>)}</ul>
            </>
          )}
          {lv.kind === 'hold' && <button className="btn" style={{ width: 'fit-content' }} onClick={() => reload('drop')}>Hang the mass</button>}
          <div className="tool-row">
            <button className="btn primary" onClick={submit} disabled={done !== null}>{lv.kind === 'susp' ? 'Submit design' : 'Check'}</button>
            {(done !== null || msg) && <button className="btn primary" onClick={() => newLevel(done)}>{done ? 'Next level' : 'Skip to new puzzle'}</button>}
          </div>
          {msg && <Msg kind={done ? 'good' : 'bad'}>{msg}</Msg>}
          <p className="hint">{difficulty === 'easy' ? 'x = m g / k, so a stiffer spring stretches less.' : difficulty === 'normal' ? 'Parallel springs share the load (stiffer). Series springs share the stretch (softer than either).' : 'Stiffer springs mean less sag but a higher frequency. A lighter load (empty) rides at a higher frequency than a heavier one. More damping helps until it is too harsh.'}</p>
        </div>
      </div>
    </GameShell>
  )
}
