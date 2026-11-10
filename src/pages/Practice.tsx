import { useEffect, useRef, useState } from 'react'
import { inline } from '../learn/Blocks'
import { UNITS } from '../learn/content'
import { formatSI } from '../sim/format'
import { buildRound, RoundItem, scopeById, unitScopeId } from '../sim/practice'
import { checkAnswer } from '../sim/quizGen'
import { load, save } from '../state/storage'

interface Best { best: number; rounds: number }
const key = (id: string) => `mekanikz.practice.${id}`
const SIZE = 10

export function SectionPicker() {
  return (
    <div className="section-picker">
      <p className="lead" style={{ maxWidth: '62ch' }}>Pick a unit or a single lesson for a 10-question round: about two thirds calculations with fresh random numbers every time, the rest concept questions. Repeat as often as you like.</p>
      {UNITS.map((u, ui) => {
        const ub = load<Best | null>(key(unitScopeId(u.id)), null)
        return (
          <div key={u.id} className="card picker-unit">
            <div className="picker-head">
              <div><p className="eyebrow">Unit {ui + 1}</p><h3>{u.title}</h3></div>
              <a className="btn primary" href={`#/quiz/${unitScopeId(u.id)}`}>Whole unit{ub ? ` (best ${ub.best}/${SIZE})` : ''}</a>
            </div>
            <div className="picker-lessons">
              {u.lessons.map((l) => {
                const b = load<Best | null>(key(l.id), null)
                return (
                  <a key={l.id} className={`picker-lesson ${b && b.best >= 9 ? 'mastered' : ''}`} href={`#/quiz/${l.id}`}>
                    <b>{l.title}</b>
                    <small>{b ? `best ${b.best}/${SIZE} · ${b.rounds} round${b.rounds > 1 ? 's' : ''}` : 'not tried yet'}</small>
                  </a>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

type Answer = { ok: boolean; given: string }

export function Round({ scopeId }: { scopeId: string }) {
  const scope = scopeById(scopeId)!
  const [items, setItems] = useState<RoundItem[]>(() => buildRound(scope.lessons, SIZE))
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [text, setText] = useState('')
  const [pick, setPick] = useState<number | null>(null)
  const [fb, setFb] = useState<null | { ok: boolean }>(null)
  const [best, setBest] = useState<Best>(() => load(key(scope.id), { best: 0, rounds: 0 }))
  const input = useRef<HTMLInputElement>(null)

  const item = items[idx]
  const done = idx >= items.length
  useEffect(() => { setText(''); setPick(null); setFb(null); input.current?.focus() }, [idx, items])
  useEffect(() => { setItems(buildRound(scope.lessons, SIZE)); setIdx(0); setAnswers([]); setBest(load(key(scope.id), { best: 0, rounds: 0 })) }, [scopeId]) // eslint-disable-line react-hooks/exhaustive-deps

  const score = answers.filter((a) => a.ok).length
  useEffect(() => {
    if (!done || answers.length !== items.length) return
    const nb = { best: Math.max(best.best, score), rounds: best.rounds + 1 }
    setBest(nb); save(key(scope.id), nb)
  }, [done]) // eslint-disable-line react-hooks/exhaustive-deps

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (fb) { setAnswers((a) => a); setIdx((i) => i + 1); return }
    let ok = false, given = ''
    if (item.kind === 'num') {
      const g = Number(text.trim().replace(/,/g, ''))
      if (!text.trim() || !isFinite(g)) return
      ok = checkAnswer(item.q, g); given = text.trim()
    } else {
      if (pick === null) return
      ok = pick === item.correct; given = item.options[pick]
    }
    setFb({ ok }); setAnswers((a) => [...a, { ok, given }])
  }
  const again = () => { setItems(buildRound(scope.lessons, SIZE)); setIdx(0); setAnswers([]) }

  if (done) {
    const missed = items.map((it, i) => ({ it, a: answers[i] })).filter((x) => x.a && !x.a.ok)
    return (
      <div className="practice">
        <div className="card round-result">
          <p className="eyebrow">{scope.label}</p>
          <h2 className="rr-score">{score} / {items.length}</h2>
          <p className="muted">{score === items.length ? 'Perfect round.' : score >= 8 ? 'Strong. Review the misses below, then go again.' : score >= 5 ? 'Getting there. Read the explanations and try a fresh round.' : 'Revisit the lesson, then try again. The numbers change every round.'} Best: {best.best} / {SIZE}, rounds played: {best.rounds}.</p>
          <div className="tool-row">
            <button className="btn primary" onClick={again}>New round</button>
            {scope.kind === 'lesson' && <a className="btn" href={`#/learn/${scope.id}`}>Review the lesson</a>}
            <a className="btn" href="#/quiz/sections">All sections</a>
          </div>
        </div>
        {missed.length > 0 && (
          <div className="card" style={{ marginTop: '1rem' }}>
            <h2>Review: what you missed</h2>
            {missed.map(({ it, a }, i) => (
              <div key={i} className="missed">
                <p className="q-prompt">{it.kind === 'num' ? it.q.prompt : inline(it.q)}</p>
                <p className="small muted">Your answer: {a.given}. Correct: <b>{it.kind === 'num' ? formatSI(it.q.answer, it.q.unit) : it.options[it.correct]}</b></p>
                {it.kind === 'num' ? <ol className="small muted">{it.q.explanation.map((s, k) => <li key={k}>{s}</li>)}</ol> : <p className="small muted">{inline(it.explain)}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="practice">
      <div className="round-top">
        <a className="link small" href="#/quiz/sections">All sections</a>
        <b>{scope.label}</b>
        <span className="mono">{idx + 1} / {items.length}</span>
        <span className="muted small">{score} correct</span>
      </div>
      <div className="cp-bar" style={{ marginBottom: '1rem' }}><i style={{ width: `${(idx / items.length) * 100}%` }} /></div>
      <form className={`card quiz-card ${fb ? (fb.ok ? 'right' : 'wrong') : ''}`} onSubmit={submit}>
        <p className="eyebrow">{item.kind === 'num' ? `Calculation · level ${item.q.level}` : 'Concept check'}</p>
        {item.kind === 'num' ? (
          <>
            <p className="q-prompt">{item.q.prompt}</p>
            <div className="q-row">
              <input ref={input} value={text} onChange={(e) => setText(e.target.value)} placeholder="Your answer" inputMode="decimal" autoComplete="off" aria-label="Your answer" disabled={!!fb} />
              <span className="unit">{item.q.unit}</span>
              <button className="btn primary" type="submit">{fb ? (idx === items.length - 1 ? 'See results' : 'Next') : 'Check'}</button>
            </div>
            {!fb && <p className="muted small" style={{ marginTop: '.6rem' }}>Hint: {item.q.hint}</p>}
            {fb && <p className={fb.ok ? 'q-good' : 'q-bad'}>{fb.ok ? 'Correct. ' : 'Not quite. '}Answer: <b>{formatSI(item.q.answer, item.q.unit)}</b></p>}
            {fb && <div className="q-explain"><ol>{item.q.explanation.map((s, i) => <li key={i}>{s}</li>)}</ol></div>}
          </>
        ) : (
          <>
            <p className="q-prompt">{inline(item.q)}</p>
            <div className="opts" role="radiogroup">
              {item.options.map((o, i) => (
                <label key={i} className={`opt ${fb && i === item.correct ? 'is-right' : ''} ${fb && pick === i && i !== item.correct ? 'is-wrong' : ''}`}>
                  <input type="radio" name="mc" checked={pick === i} disabled={!!fb} onChange={() => setPick(i)} /><span>{inline(o)}</span>
                </label>
              ))}
            </div>
            <div className="check-row"><button className="btn primary" type="submit" disabled={pick === null && !fb}>{fb ? (idx === items.length - 1 ? 'See results' : 'Next') : 'Check'}</button></div>
            {fb && <p className="explain muted">{inline(item.explain)}</p>}
          </>
        )}
      </form>
    </div>
  )
}
