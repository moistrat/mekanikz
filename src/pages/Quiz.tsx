import { useEffect, useRef, useState } from 'react'
import { checkAnswer, generateQuestion, LEVELS, Question, Topic, TOPICS } from '../sim/quizGen'
import { formatSI } from '../sim/format'
import { load, save } from '../state/storage'
import { Round, SectionPicker } from './Practice'
import { scopeById } from '../sim/practice'

interface Score { answered: number; correct: number; streak: number; best: number }
const EMPTY: Score = { answered: 0, correct: 0, streak: 0, best: 0 }

function QuizCard({ q, onResult, onNext }: { q: Question; onResult: (ok: boolean) => void; onNext: () => void }) {
  const [text, setText] = useState('')
  const [state, setState] = useState<'ask' | 'right' | 'wrong' | 'revealed'>('ask')
  const [tries, setTries] = useState(0)
  const [note, setNote] = useState('')
  const [hint, setHint] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => { setText(''); setState('ask'); setTries(0); setNote(''); setHint(false); input.current?.focus() }, [q.id])

  const done = state === 'right' || state === 'revealed'
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (done) return onNext()
    const guess = Number(text.trim().replace(/,/g, ''))
    if (!text.trim() || !isFinite(guess)) { setNote('Enter a number, for example 12.5 or 3e4.'); return }
    if (checkAnswer(q, guess)) { setState('right'); setNote(''); if (tries === 0) onResult(true) }
    else {
      if (tries === 0) onResult(false)
      setTries(tries + 1); setState('wrong')
      const ratio = guess / q.answer, mag = Math.log10(Math.abs(ratio))
      setNote(ratio > 0 && Math.abs(mag - Math.round(mag)) < 0.03 && Math.round(mag) !== 0
        ? 'The digits are right but the power of ten is off. Check your unit conversion.'
        : ratio > 1 ? 'Too high. Try again.' : 'Too low. Try again.')
    }
  }
  return (
    <form className={`card quiz-card ${state}`} onSubmit={submit}>
      <p className="eyebrow">{TOPICS.find((t) => t.id === q.topic)?.name}</p>
      <p className="q-prompt">{q.prompt}</p>
      <div className="q-row">
        <input ref={input} value={text} onChange={(e) => { setText(e.target.value); if (state === 'wrong') setState('ask') }} placeholder="Your answer" inputMode="decimal" autoComplete="off" aria-label="Your answer" disabled={done} />
        <span className="unit">{q.unit}</span>
        {!done ? <button className="btn primary" type="submit">Check</button> : <button className="btn primary" type="submit" autoFocus>Next question</button>}
      </div>
      {note && state !== 'right' && <p className="q-note">{note}</p>}
      {state === 'right' && <p className="q-good">Correct. {formatSI(q.answer, q.unit)}</p>}
      {!done && (
        <div className="q-actions">
          <button type="button" className="btn ghost" onClick={() => setHint(!hint)}>{hint ? 'Hide hint' : 'Hint'}</button>
          {tries >= 1 && <button type="button" className="btn ghost" onClick={() => { setState('revealed'); setNote('') }}>Show answer</button>}
        </div>
      )}
      {hint && !done && <p className="muted small" style={{ marginTop: '.5rem' }}>{q.hint}</p>}
      {done && (
        <div className="q-explain">
          {state === 'revealed' && <p className="q-bad">Answer: <b>{formatSI(q.answer, q.unit)}</b></p>}
          <ol>{q.explanation.map((s, i) => <li key={i}>{s}</li>)}</ol>
        </div>
      )}
    </form>
  )
}

export function Quiz({ arg }: { arg?: string }) {
  const scope = scopeById(arg)
  const section = !!scope || arg === 'sections'
  const switcher = (
    <div className="seg mode-seg" role="group" aria-label="Quiz mode">
      <button className={!section ? 'on' : ''} onClick={() => { location.hash = '#/quiz' }}>Free practice</button>
      <button className={section ? 'on' : ''} onClick={() => { location.hash = '#/quiz/sections' }}>Section practice</button>
    </div>
  )
  if (section) return <div className="page quiz">{switcher}{scope ? <Round scopeId={scope.id} /> : <SectionPicker />}</div>
  return <FreeQuiz switcher={switcher} />
}

function FreeQuiz({ switcher }: { switcher: React.ReactNode }) {
  const [topic, setTopic] = useState<Topic | 'all'>(() => load('mekanikz.quiz.topic', 'all'))
  const [level, setLevel] = useState(() => load<number>('mekanikz.quiz.level', 1))
  const [score, setScore] = useState<Score>(() => load('mekanikz.quiz.score', EMPTY))
  const [q, setQ] = useState(() => generateQuestion(topic, level))

  const change = (t: Topic | 'all', l: number) => { setTopic(t); setLevel(l); save('mekanikz.quiz.topic', t); save('mekanikz.quiz.level', l); setQ(generateQuestion(t, l)) }
  const onResult = (ok: boolean) => {
    const next: Score = { answered: score.answered + 1, correct: score.correct + (ok ? 1 : 0), streak: ok ? score.streak + 1 : 0, best: Math.max(score.best, ok ? score.streak + 1 : 0) }
    setScore(next); save('mekanikz.quiz.score', next)
  }
  return (
    <div className="page quiz">
      {switcher}
      <div className="quiz-top">
        <div className="levels" role="tablist" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
          {LEVELS.map((l) => (
            <button key={l.level} role="tab" aria-selected={l.level === level} className={`level ${l.level === level ? 'active' : ''}`} onClick={() => change(topic, l.level)}>
              <b>{l.level}. {l.name}</b><small>{l.blurb}</small>
            </button>
          ))}
        </div>
        <div className="scoreboard card">
          <div><b>{score.correct}</b><small>/ {score.answered} correct</small></div>
          <div><b>{score.streak}</b><small>streak</small></div>
          <div><b>{score.best}</b><small>best</small></div>
          <button className="btn ghost" onClick={() => { setScore(EMPTY); save('mekanikz.quiz.score', EMPTY) }}>Reset</button>
        </div>
      </div>
      <div className="seg topic-seg" role="group" aria-label="Topic">
        {TOPICS.map((t) => <button key={t.id} className={t.id === topic ? 'on' : ''} onClick={() => change(t.id, level)}>{t.name}</button>)}
      </div>
      <div className="quiz-one"><QuizCard q={q} onResult={onResult} onNext={() => setQ(generateQuestion(topic, level))} /></div>
    </div>
  )
}
