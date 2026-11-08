import { useEffect, useMemo, useRef, useState } from 'react'
import { CHALLENGES, challengeSolution, challengeStart } from '../sim/bridges'
import { capacity, Joint, memberLength, solveTruss, Truss, trussCost } from '../sim/truss'
import { load, save } from '../state/storage'
import { Tutorial } from '../tutorial/Tutorial'
import { STEPS, Tool } from '../tutorial/steps'

const TOUR_SEEN = 'mekanikz.tutorial.seen'
const TOOLS: { id: Tool; label: string; key: string; hint: string }[] = [
  { id: 'joint', label: 'Joint', key: '1', hint: 'Click an empty grid point to add a joint.' },
  { id: 'member', label: 'Member', key: '2', hint: 'Click a joint, then another joint, to connect them with a bar.' },
  { id: 'pin', label: 'Pin support', key: '3', hint: 'Click a joint to pin it to the ground (holds in both directions).' },
  { id: 'roller', label: 'Roller support', key: '4', hint: 'Click a joint to add a roller (holds up only, slides sideways).' },
  { id: 'load', label: 'Load', key: '5', hint: 'Click a joint to add 5 kN downward. Shift-click removes 5 kN.' },
  { id: 'erase', label: 'Erase', key: '6', hint: 'Click a joint or member to remove it.' },
]
const COLS = 20, ROWS = 10, S = 40, PAD = 30
const px = (x: number) => PAD + x * S
const py = (y: number) => PAD + (ROWS - y) * S
const STORE = 'mekanikz.sandbox.v1'

interface Saved { truss: Truss; nextId: number; mode: string }
const DEFAULT: Saved = {
  mode: 'free', nextId: 4,
  truss: {
    joints: [{ id: 1, x: 6, y: 3, support: 'pin' }, { id: 2, x: 14, y: 3, support: 'roller' }, { id: 3, x: 10, y: 6, load: 15 }],
    members: [{ id: 1, a: 1, b: 2 }, { id: 2, a: 1, b: 3 }, { id: 3, a: 2, b: 3 }],
  },
}

function utilColor(force: number, util: number): string {
  if (util > 1) return '#ff3b4d'
  const base = force >= 0 ? [240, 97, 109] : [90, 169, 255]
  const k = 0.35 + 0.65 * Math.min(1, util)
  return `rgb(${base.map((c) => Math.round(70 + (c - 70) * k)).join(',')})`
}

export function Sandbox({ tutorialRequest = 0 }: { tutorialRequest?: number }) {
  const init = useMemo(() => {
    const s = load<Saved | null>(STORE, null)
    return s && s.truss?.joints ? s : DEFAULT
  }, [])
  const [truss, setTruss] = useState<Truss>(init.truss)
  const [nextId, setNextId] = useState(init.nextId)
  const [mode, setMode] = useState(init.mode)
  const [history, setHistory] = useState<{ truss: Truss; nextId: number }[]>([])
  const [tool, setTool] = useState<Tool>('member')
  const [from, setFrom] = useState<number | null>(null)
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null)
  const [sel, setSel] = useState<{ kind: 'm' | 'j'; id: number } | null>(null)

  const [tour, setTour] = useState<number | null>(() => (!load<boolean>(TOUR_SEEN, false) ? 0 : null))
  const backup = useRef<Saved | null>(null)
  const challenge = CHALLENGES.find((c) => c.id === mode)
  const result = useMemo(() => solveTruss(truss), [truss])
  const cost = trussCost(truss)

  useEffect(() => { if (tour === null) save(STORE, { truss, nextId, mode }) }, [truss, nextId, mode, tour])

  // The tutorial runs on a scratch board; the user's own work is restored afterwards.
  const beginScratch = () => {
    if (!backup.current) backup.current = { truss, nextId, mode }
    setTruss({ joints: [], members: [] }); setNextId(1); setMode('free'); setHistory([]); setFrom(null); setSel(null)
  }
  const startTour = () => { beginScratch(); setTour(0) }
  const endTour = () => {
    save(TOUR_SEEN, true)
    const b = backup.current
    backup.current = null
    if (b) { setTruss(b.truss); setNextId(b.nextId); setMode(b.mode); setHistory([]); setFrom(null); setSel(null) }
    setTour(null); setTool('member')
  }
  useEffect(() => { if (tour === 0 && !backup.current) beginScratch() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const lastReq = useRef(tutorialRequest)
  useEffect(() => { if (tutorialRequest !== lastReq.current) { lastReq.current = tutorialRequest; startTour() } }) // eslint-disable-line react-hooks/exhaustive-deps

  const commit = (t: Truss, id = nextId) => {
    setHistory((h) => [...h.slice(-40), { truss, nextId }])
    setTruss(t); setNextId(id)
  }
  const undo = () => {
    const h = history[history.length - 1]
    if (!h) return
    setHistory(history.slice(0, -1)); setTruss(h.truss); setNextId(h.nextId); setFrom(null)
  }
  const startMode = (m: string) => {
    setMode(m); setHistory([]); setFrom(null); setSel(null)
    const c = CHALLENGES.find((x) => x.id === m)
    if (c) { const s = challengeStart(c); setTruss(s.truss); setNextId(s.nextId) } else { setTruss(DEFAULT.truss); setNextId(DEFAULT.nextId) }
  }
  const showSolution = () => {
    if (!challenge) return
    const s = challengeSolution(challenge)
    commit(s.truss, s.nextId)
  }

  const jointAt = (x: number, y: number) => truss.joints.find((j) => j.x === x && j.y === y)
  const click = (gx: number, gy: number, shift: boolean) => {
    const j = jointAt(gx, gy)
    setSel(j ? { kind: 'j', id: j.id } : null)
    if (tool === 'joint') {
      if (!j) commit({ ...truss, joints: [...truss.joints, { id: nextId, x: gx, y: gy }] }, nextId + 1)
    } else if (tool === 'member') {
      if (!j) { setFrom(null); return }
      if (from === null) setFrom(j.id)
      else if (from === j.id) setFrom(null)
      else {
        const dup = truss.members.some((m) => (m.a === from && m.b === j.id) || (m.a === j.id && m.b === from))
        if (!dup) commit({ ...truss, members: [...truss.members, { id: nextId, a: from, b: j.id }] }, nextId + 1)
        setFrom(j.id)
      }
    } else if (!j) {
      return
    } else if (tool === 'pin' || tool === 'roller') {
      if (j.locked) return
      commit({ ...truss, joints: truss.joints.map((k) => (k.id === j.id ? { ...k, support: k.support === tool ? undefined : tool } : k)) })
    } else if (tool === 'load') {
      if (j.locked) return
      const l = Math.max(0, (j.load ?? 0) + (shift ? -5 : 5))
      commit({ ...truss, joints: truss.joints.map((k) => (k.id === j.id ? { ...k, load: l || undefined } : k)) })
    } else if (tool === 'erase') {
      if (j.locked) return
      commit({ joints: truss.joints.filter((k) => k.id !== j.id), members: truss.members.filter((m) => m.a !== j.id && m.b !== j.id) })
    }
  }
  const clickMember = (id: number) => {
    if (tool === 'erase') commit({ ...truss, members: truss.members.filter((m) => m.id !== id) })
    else setSel({ kind: 'm', id })
  }

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return
      const t = TOOLS.find((x) => x.key === e.key)
      if (t) { setTool(t.id); setFrom(null) }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); undo() }
      if (e.key === 'Escape') setFrom(null)
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  })

  // evaluation
  const stats = useMemo(() => {
    let maxU = 0, failing = 0
    if (result.ok) for (const m of truss.members) {
      const f = result.force.get(m.id) ?? 0
      const u = Math.abs(f) / capacity(memberLength(truss, m), f)
      maxU = Math.max(maxU, u); if (u > 1.0001) failing++
    }
    return { maxU, failing }
  }, [result, truss])

  let verdict: { ok: boolean; text: string } | null = null
  if (challenge) {
    const used = new Set<number>(); truss.members.forEach((m) => { used.add(m.a); used.add(m.b) })
    const missing = truss.joints.filter((j) => j.locked && !used.has(j.id)).length
    if (!result.ok) verdict = { ok: false, text: result.problem ?? 'Not solvable yet.' }
    else if (missing) verdict = { ok: false, text: `${missing} required joint${missing > 1 ? 's are' : ' is'} not connected yet.` }
    else if (stats.failing) verdict = { ok: false, text: `${stats.failing} member${stats.failing > 1 ? 's are' : ' is'} overloaded (shown bright red). Add bracing, use a deeper truss, or shorten compression members.` }
    else if (cost > challenge.budget) verdict = { ok: false, text: `Strong enough, but over budget by $${Math.round(cost - challenge.budget)}.` }
    else verdict = { ok: true, text: `Success. Strongest member at ${(stats.maxU * 100).toFixed(0)}% of capacity, cost $${Math.round(cost)} of $${challenge.budget}.` }
  }

  const guide = tour !== null ? STEPS[tour].guide?.({ truss, tool, sel, solved: result.ok, historyLen: history.length }) : undefined
  const selJoint = sel?.kind === 'j' ? truss.joints.find((j) => j.id === sel.id) : undefined
  const selMember = sel?.kind === 'm' ? truss.members.find((m) => m.id === sel.id) : undefined
  const fmt = (n: number) => (Math.abs(n) < 0.005 ? '0.00' : n.toFixed(2))
  const preview: Joint | undefined = from !== null ? truss.joints.find((j) => j.id === from) : undefined

  return (
    <div className="page sandbox">
      <aside className="card toolbox">
        <h2>Tools</h2>
        {TOOLS.map((t) => (
          <button key={t.id} className={`part-btn ${tool === t.id ? 'active' : ''}`} onClick={() => { setTool(t.id); setFrom(null) }}>
            <span>{t.label}<kbd>{t.key}</kbd></span>
          </button>
        ))}
        <h2>Mode</h2>
        <button className={`part-btn ${mode === 'free' ? 'active' : ''}`} onClick={() => startMode('free')}><span>Free build</span></button>
        {CHALLENGES.map((c) => (
          <button key={c.id} className={`part-btn ${mode === c.id ? 'active' : ''}`} onClick={() => startMode(c.id)}><span>{c.title}</span></button>
        ))}
        <div className="tool-row" style={{ marginTop: '.6rem' }}>
          <button className="btn" disabled={!history.length} onClick={undo}>Undo</button>
          <button className="btn danger" onClick={() => startMode(mode)}>Reset</button>
        </div>
      </aside>

      <section className="stage">
        <div className="card toolbar">
          <span className="muted small">{TOOLS.find((t) => t.id === tool)!.hint}</span>
          <span className="spacer" />
          <span className="legend"><i style={{ background: '#f0616d' }} /> tension <i style={{ background: '#5aa9ff' }} /> compression <i style={{ background: '#ff3b4d', outline: '2px solid #fff3' }} /> overloaded</span>
        </div>
        <div className="card canvas-wrap">
          <svg viewBox={`0 0 ${PAD * 2 + COLS * S} ${PAD * 2 + ROWS * S}`} className="canvas truss-canvas" role="img" aria-label="Truss editor"
            onMouseLeave={() => setHover(null)}
            onMouseMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect()
              const k = (PAD * 2 + COLS * S) / r.width
              const gx = Math.round(((e.clientX - r.left) * k - PAD) / S), gy = ROWS - Math.round(((e.clientY - r.top) * k - PAD) / S)
              setHover(gx >= 0 && gx <= COLS && gy >= 0 && gy <= ROWS ? { x: gx, y: gy } : null)
            }}
            onClick={(e) => { if (hover) click(hover.x, hover.y, e.shiftKey) }}>
            <g className="grid-dots">
              {Array.from({ length: (COLS + 1) * (ROWS + 1) }, (_, i) => <circle key={i} cx={px(i % (COLS + 1))} cy={py(Math.floor(i / (COLS + 1)))} r={2} />)}
            </g>
            {challenge && <text x={PAD} y={18} className="lbl-sub">{challenge.title}: budget ${challenge.budget}</text>}
            {truss.members.map((m) => {
              const a = truss.joints.find((j) => j.id === m.a)!, b = truss.joints.find((j) => j.id === m.b)!
              const f = result.ok ? result.force.get(m.id) ?? 0 : 0
              const L = memberLength(truss, m)
              const util = result.ok ? Math.abs(f) / capacity(L, f) : 0
              const color = result.ok ? utilColor(f, util) : '#6b7480'
              const mx = (px(a.x) + px(b.x)) / 2, my = (py(a.y) + py(b.y)) / 2
              return (
                <g key={m.id} onClick={(e) => { e.stopPropagation(); clickMember(m.id) }} style={{ cursor: tool === 'erase' ? 'not-allowed' : 'pointer' }}>
                  <line x1={px(a.x)} y1={py(a.y)} x2={px(b.x)} y2={py(b.y)} stroke="transparent" strokeWidth={16} />
                  <line x1={px(a.x)} y1={py(a.y)} x2={px(b.x)} y2={py(b.y)} stroke={color} strokeLinecap="round"
                    strokeWidth={sel?.kind === 'm' && sel.id === m.id ? 9 : 5 + Math.min(1, util) * 3} strokeDasharray={util > 1 ? '6 5' : undefined} />
                  {result.ok && Math.abs(f) > 0.05 && <text x={mx} y={my - 7} textAnchor="middle" className="truss-lbl" fill={color}>{fmt(Math.abs(f))}</text>}
                </g>
              )
            })}
            {guide?.lines.map(([a, b], i) => <line key={`gl${i}`} x1={px(a[0])} y1={py(a[1])} x2={px(b[0])} y2={py(b[1])} className="guide-wire" />)}
            {guide?.points.map(([x, y], i) => <circle key={`gp${i}`} cx={px(x)} cy={py(y)} r={15} className="guide-ring" />)}
            {preview && hover && <line x1={px(preview.x)} y1={py(preview.y)} x2={px(hover.x)} y2={py(hover.y)} className="wire-preview" />}
            {truss.joints.map((j) => {
              const r = result.reaction.get(j.id)
              return (
                <g key={j.id}>
                  {j.support === 'pin' && <polygon points={`${px(j.x)},${py(j.y) + 6} ${px(j.x) - 13},${py(j.y) + 28} ${px(j.x) + 13},${py(j.y) + 28}`} className="support" />}
                  {j.support === 'roller' && <><polygon points={`${px(j.x)},${py(j.y) + 6} ${px(j.x) - 13},${py(j.y) + 24} ${px(j.x) + 13},${py(j.y) + 24}`} className="support" /><circle cx={px(j.x) - 7} cy={py(j.y) + 29} r={4} className="support" /><circle cx={px(j.x) + 7} cy={py(j.y) + 29} r={4} className="support" /></>}
                  {j.load ? (
                    <g className="load-arrow"><line x1={px(j.x)} y1={py(j.y) - 46} x2={px(j.x)} y2={py(j.y) - 9} /><polygon points={`${px(j.x)},${py(j.y) - 6} ${px(j.x) - 5},${py(j.y) - 16} ${px(j.x) + 5},${py(j.y) - 16}`} /><text x={px(j.x) + 9} y={py(j.y) - 34}>{j.load} kN</text></g>
                  ) : null}
                  {r && <text x={px(j.x)} y={py(j.y) + 46} textAnchor="middle" className="lbl-sub">↑ {fmt(r[1])}{Math.abs(r[0]) > 0.005 ? `  → ${fmt(r[0])}` : ''}</text>}
                  <circle cx={px(j.x)} cy={py(j.y)} r={j.locked ? 7.5 : 6.5} className={`joint ${j.locked ? 'locked' : ''} ${from === j.id ? 'from' : ''} ${sel?.kind === 'j' && sel.id === j.id ? 'sel' : ''}`} />
                </g>
              )
            })}
            {hover && <circle cx={px(hover.x)} cy={py(hover.y)} r={9} className="hover-ring" />}
          </svg>
          {truss.joints.length === 0 && tour === null && <div className="empty-hint"><div><h3>Empty board</h3><p>Pick the Joint tool and click the grid.</p></div></div>}
        </div>
        {tour !== null && (
          <Tutorial index={tour} onAdvance={() => setTour((n) => (n === null ? n : Math.min(n + 1, STEPS.length - 1)))} onExit={endTour} onRestart={startTour}
            ctx={{ truss, tool, sel, solved: result.ok, historyLen: history.length }}
            api={{ commit: (t, id) => commit(t, id), truss, nextId, setTool, undo }} />
        )}
      </section>

      <aside className="side">
        {challenge && (
          <div className={`card ${verdict?.ok ? 'goal-ok' : ''}`}>
            <div className="card-head"><h2>Challenge</h2></div>
            <p className="muted">{challenge.blurb}</p>
            {verdict && <p className={verdict.ok ? 'q-good' : 'q-note'} style={{ marginTop: 0 }}>{verdict.text}</p>}
            <button className="btn ghost" onClick={showSolution}>Show a worked solution</button>
          </div>
        )}
        <div className="card">
          <div className="card-head"><h2>Structure</h2></div>
          <dl className="readouts" style={{ margin: 0 }}>
            <div><dt>Joints / members</dt><dd>{truss.joints.length} / {truss.members.length}</dd></div>
            <div><dt>Cost</dt><dd>${Math.round(cost)}{challenge && <small>budget ${challenge.budget}</small>}</dd></div>
            <div><dt>Strongest member</dt><dd>{result.ok ? `${(stats.maxU * 100).toFixed(0)} % of capacity` : 'n/a'}</dd></div>
            <div><dt>Total load</dt><dd>{truss.joints.reduce((s, j) => s + (j.load ?? 0), 0)} kN</dd></div>
          </dl>
          {!result.ok && <p className="warn"><b>Cannot solve</b>{result.problem}</p>}
        </div>
        <div className="card inspector">
          {selMember && result.ok ? (() => {
            const f = result.force.get(selMember.id) ?? 0, L = memberLength(truss, selMember), cap = capacity(L, f)
            return (<>
              <h2>Member {selMember.id}</h2>
              <p className="muted">{Math.abs(f) < 0.05 ? 'Carries almost no force' : f > 0 ? 'In tension' : 'In compression'}, length {L.toFixed(2)} m</p>
              <dl className="readouts"><div><dt>Force</dt><dd>{fmt(Math.abs(f))} kN</dd></div><div><dt>Capacity</dt><dd>{cap.toFixed(1)} kN<small>{f < 0 ? 'reduced by buckling for long bars' : 'tension limit'}</small></dd></div><div><dt>Used</dt><dd>{((Math.abs(f) / cap) * 100).toFixed(0)} %</dd></div></dl>
            </>)
          })() : selJoint ? (<>
            <h2>Joint {selJoint.id}</h2>
            <p className="muted">at ({selJoint.x} m, {selJoint.y} m){selJoint.support ? `, ${selJoint.support} support` : ''}</p>
          </>) : (<>
            <h2>Tips</h2>
            <ul className="tips">
              <li>Triangles are rigid. Squares fold flat.</li>
              <li>Numbers on bars are forces in kN.</li>
              <li>A truss needs a pin and a roller for stable support.</li>
              <li>Shortcuts: <b>1</b> to <b>6</b> pick a tool, Ctrl/⌘Z undoes.</li>
            </ul>
          </>)}
        </div>
      </aside>
    </div>
  )
}
