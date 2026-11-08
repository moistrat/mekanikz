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
