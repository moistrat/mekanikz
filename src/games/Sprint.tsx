import { useEffect, useMemo, useRef, useState } from 'react'
import { LESSONS } from '../learn/content'
import { load, save } from '../state/storage'
import { inline } from '../learn/Blocks'
import { GameShell, Msg, Props, useStats } from './ui'

interface Q { q: string; options: string[]; correct: number; explain: string; lesson: string }
const POOL: Q[] = LESSONS.flatMap((l) => l.blocks.flatMap((b) => (b.t === 'check' ? [{ q: b.q, options: b.options, correct: b.correct, explain: b.explain, lesson: l.title }] : [])))
const shuffle = <T,>(xs: T[]) => { const a = [...xs]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] } return a }
const MODES = { easy: { time: 90, goal: 6, penalty: 0 }, normal: { time: 60, goal: 8, penalty: 0 }, hard: { time: 45, goal: 10, penalty: 5 } } as const

export function Sprint({ difficulty, onDifficulty }: Props) {
  const mode = MODES[difficulty]
  const TIME = mode.time
  const [stats, record, reset] = useStats(`sprint.${difficulty}`)
  const [best, setBest] = useState<number>(() => load(`mekanikz.sprint.best.${difficulty}`, 0))
  const [phase, setPhase] = useState<'idle' | 'run' | 'over'>('idle')
  const [left, setLeft] = useState<number>(TIME)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [asked, setAsked] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const deck = useRef<Q[]>([])
  const [cur, setCur] = useState<Q | null>(null)
  const scoreRef = useRef(0)
  scoreRef.current = score

  const draw = () => {
    if (!deck.current.length) deck.current = shuffle(POOL)
    const q = deck.current.pop()!
    const idx = shuffle(q.options.map((_, i) => i))
    setCur({ ...q, options: idx.map((i) => q.options[i]), correct: idx.indexOf(q.correct) })
    setPicked(null)
  }
  const start = () => { deck.current = shuffle(POOL); setScore(0); setStreak(0); setAsked(0); setLeft(TIME); setPhase('run'); draw() }

  useEffect(() => {
    if (phase !== 'run') return
    const id = window.setInterval(() => setLeft((t) => t - 1), 1000)
    return () => window.clearInterval(id)
  }, [phase])
  useEffect(() => {
    if (phase === 'run' && left <= 0) {
      setPhase('over')
      const s = scoreRef.current
      if (s > best) { setBest(s); save(`mekanikz.sprint.best.${difficulty}`, s) }
      record(s >= mode.goal)
    }
  }, [left, phase]) // eslint-disable-line react-hooks/exhaustive-deps

  const answer = (i: number) => {
    if (picked !== null || !cur) return
    setPicked(i); setAsked((a) => a + 1)
    const ok = i === cur.correct
    if (ok) { setScore((s) => s + 1 + Math.min(streak, 4)); setStreak((s) => s + 1) } else { setStreak(0); if (mode.penalty) { setLeft((t) => t - mode.penalty); setScore((s) => Math.max(0, s - 1)) } }
    window.setTimeout(() => { if (phase === 'run') draw() }, ok ? 650 : 1500)
  }
  const bar = useMemo(() => Math.max(0, left / TIME) * 100, [left])
  return (
    <GameShell title="Concept Sprint" stats={stats} onReset={reset} difficulty={difficulty} onDifficulty={onDifficulty}
      factors={difficulty === 'hard' ? ['Wrong answer costs 5 seconds and a point', 'Shorter clock'] : undefined}
      how={`${TIME} seconds. Answer as many concept questions as you can from every lesson in the course. Correct answers score a point, and streaks add bonus points. Reach ${mode.goal} points to count the round as solved.`}>
      <div className="card game-board sprint">
        {phase === 'idle' && (
          <div className="sprint-start"><p className="muted">{POOL.length} questions in the pool, drawn at random. Best score: <b>{best}</b></p><button className="btn primary" onClick={start}>Start the clock</button></div>
        )}
        {phase === 'over' && (
          <div className="sprint-start"><h3>Time</h3><p className="readout-big">{score} points</p><p className="muted">{asked} questions answered. Best: {best}</p><button className="btn primary" onClick={start}>Play again</button></div>
        )}
        {phase === 'run' && cur && (
          <>
            <div className="sprint-top"><b className="mono">{Math.max(0, left)}s</b><div className="cp-bar" style={{ flex: 1 }}><i style={{ width: `${bar}%` }} /></div><span className="mono">{score} pts</span><span className="muted small">streak {streak}</span></div>
            <p className="eyebrow">{cur.lesson}</p>
            <p className="cq">{inline(cur.q)}</p>
            <div className="opts">
              {cur.options.map((o, i) => (
                <button key={i} className={`opt btn-opt ${picked !== null && i === cur.correct ? 'is-right' : ''} ${picked === i && i !== cur.correct ? 'is-wrong' : ''}`} onClick={() => answer(i)} disabled={picked !== null}>{inline(o)}</button>
              ))}
            </div>
            {picked !== null && <Msg kind={picked === cur.correct ? 'good' : 'bad'}>{picked === cur.correct ? 'Correct.' : inline(cur.explain)}</Msg>}
          </>
        )}
      </div>
    </GameShell>
  )
}
