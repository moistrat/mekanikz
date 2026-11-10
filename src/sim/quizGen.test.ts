import { describe, expect, it } from 'vitest'
import { checkAnswer, generateQuestion, GENERATORS, LEVELS, TOPICS } from './quizGen'

describe('quiz generator', () => {
  it('has generators for every topic at every level', () => {
    for (const t of TOPICS.filter((x) => x.id !== 'all')) for (const l of LEVELS) {
      expect(GENERATORS.some((g) => g.topic === t.id && g.level === l.level), `${t.id} L${l.level}`).toBe(true)
    }
  })
  it('every generator yields finite, checkable, explained questions across many seeds', () => {
    for (const t of TOPICS) for (const l of LEVELS) for (let s = 1; s <= 80; s++) {
      const q = generateQuestion(t.id, l.level, s * 7919)
      expect(isFinite(q.answer) && q.answer !== 0, q.prompt).toBe(true)
      expect(q.prompt).not.toMatch(/NaN|undefined|Infinity/)
      expect(q.explanation.join(' ')).not.toMatch(/NaN|undefined|Infinity/)
      expect(checkAnswer(q, q.answer)).toBe(true)
      expect(checkAnswer(q, q.answer * 1.2)).toBe(false)
      expect(q.explanation.length).toBeGreaterThan(0)
    }
  })
  it('known answers', () => {
    const hits: Record<string, number> = {}
    for (let s = 1; s < 400; s++) {
      const q = generateQuestion('statics', 1, s)
      if (/moment about the pivot/.test(q.prompt)) { const m = q.prompt.match(/A (\d+) N force.*?, ([\d.]+) m/)!; expect(q.answer).toBeCloseTo(Number(m[1]) * Number(m[2]), 6); hits.moment = 1 }
    }
    expect(hits.moment).toBe(1)
  })
})

describe('section practice', () => {
  it('every lesson has repeatable generators and a valid round', async () => {
    const { LESSONS, UNITS } = await import('../learn/content')
    const { generatorsForLesson, generateFromLessons } = await import('./quizGen')
    const { buildRound, SCOPES, scopeById } = await import('./practice')
    for (const l of LESSONS) {
      expect(generatorsForLesson(l.id).length, l.id).toBeGreaterThanOrEqual(3)
      for (let s = 1; s <= 30; s++) {
        const q = generateFromLessons([l.id], 1 + (s % 3), s * 31)
        expect(q.lesson).toBe(l.id)
        expect(isFinite(q.answer) && q.answer !== 0, q.prompt).toBe(true)
        expect(checkAnswer(q, q.answer)).toBe(true)
        expect(q.prompt + q.explanation.join(' ')).not.toMatch(/NaN|undefined|Infinity/)
      }
    }
    expect(SCOPES.length).toBe(LESSONS.length + UNITS.length)
    for (const sc of SCOPES) {
      expect(scopeById(sc.id)).toBeTruthy()
      for (let s = 1; s <= 10; s++) {
        const round = buildRound(sc.lessons, 10, s * 101)
        expect(round.length, sc.id).toBe(10)
        expect(round.filter((i) => i.kind === 'num').length, sc.id).toBeGreaterThanOrEqual(6)
        for (const it of round) {
          if (it.kind === 'mc') { expect(it.options[it.correct]).toBeTruthy(); expect(sc.lessons).toContain(it.lesson) }
          else expect(sc.lessons).toContain(it.q.lesson)
        }
      }
    }
  })
  it('rounds differ from each other (new numbers each time)', async () => {
    const { buildRound } = await import('./practice')
    const a = JSON.stringify(buildRound(['moments'], 10, 1)), b = JSON.stringify(buildRound(['moments'], 10, 2))
    expect(a).not.toBe(b)
  })
})
