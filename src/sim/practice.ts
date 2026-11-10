import { LESSONS, UNITS } from '../learn/content'
import { generateFromLessons, Question } from './quizGen'
import { mulberry, Rng } from './format'

export interface Scope { id: string; label: string; lessons: string[]; kind: 'unit' | 'lesson' }
export const unitScopeId = (unitId: string) => `unit-${unitId}`
export const SCOPES: Scope[] = [
  ...UNITS.map((u): Scope => ({ id: unitScopeId(u.id), label: `Unit: ${u.title}`, lessons: u.lessons.map((l) => l.id), kind: 'unit' })),
  ...LESSONS.map((l): Scope => ({ id: l.id, label: l.title, lessons: [l.id], kind: 'lesson' })),
]
export const scopeById = (id?: string) => SCOPES.find((s) => s.id === id)

export interface McItem { kind: 'mc'; lesson: string; q: string; options: string[]; correct: number; explain: string }
export interface NumItem { kind: 'num'; q: Question }
export type RoundItem = NumItem | McItem

const concepts = (lessonIds: string[]): Omit<McItem, 'kind'>[] =>
  LESSONS.filter((l) => lessonIds.includes(l.id)).flatMap((l) => l.blocks.flatMap((b) => (b.t === 'check' ? [{ lesson: l.id, q: b.q, options: b.options, correct: b.correct, explain: b.explain }] : [])))

function shuffle<T>(xs: T[], r: Rng): T[] {
  const a = [...xs]
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
}

/** A fresh round: mixed difficulty, new numbers every time, no repeated problem type where avoidable. */
export function buildRound(lessonIds: string[], size = 10, seed = Math.floor(Math.random() * 1e9)): RoundItem[] {
  const r = mulberry(seed)
  const mcPool = shuffle(concepts(lessonIds), r)
  const mcCount = Math.min(mcPool.length, Math.max(2, Math.round(size * 0.3)))
  const numCount = size - mcCount
  const levels = Array.from({ length: numCount }, (_, i) => (i < numCount * 0.35 ? 1 : i < numCount * 0.7 ? 2 : 3))
  const used = new Set<number>()
  const nums: RoundItem[] = levels.map((lv) => {
    const q = generateFromLessons(lessonIds, lv, Math.floor(r() * 1e9), used)
    used.add(q.gen!)
    return { kind: 'num', q }
  })
  const mcs: RoundItem[] = mcPool.slice(0, mcCount).map((m) => {
    const order = shuffle(m.options.map((_, i) => i), r)
    return { kind: 'mc', lesson: m.lesson, q: m.q, options: order.map((i) => m.options[i]), correct: order.indexOf(m.correct), explain: m.explain }
  })
  // interleave: numeric problems in order of difficulty, concept questions spread between them
  const out: RoundItem[] = []
  const gap = Math.max(1, Math.floor(nums.length / (mcs.length + 1)))
  let mi = 0
  nums.forEach((n, i) => { out.push(n); if ((i + 1) % gap === 0 && mi < mcs.length) out.push(mcs[mi++]) })
  while (mi < mcs.length) out.push(mcs[mi++])
  return out
}
