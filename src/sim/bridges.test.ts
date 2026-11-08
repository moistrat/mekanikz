import { describe, expect, it } from 'vitest'
import { CHALLENGES, challengeSolution } from './bridges'
import { capacity, memberLength, solveTruss, trussCost, solveLinear } from './truss'

describe('truss solver', () => {
  it('matches the hand solution for the symmetric triangle (10 kN rafters, 8 kN chord)', () => {
    const truss = {
      joints: [
        { id: 1, x: 0, y: 0, support: 'pin' as const }, { id: 2, x: 8, y: 0, support: 'roller' as const }, { id: 3, x: 4, y: 3, load: 12 },
      ],
      members: [{ id: 1, a: 1, b: 2 }, { id: 2, a: 1, b: 3 }, { id: 3, a: 2, b: 3 }],
    }
    const r = solveTruss(truss)
    expect(r.ok).toBe(true)
    expect(r.force.get(1)!).toBeCloseTo(8, 6)
    expect(r.force.get(2)!).toBeCloseTo(-10, 6)
    expect(r.force.get(3)!).toBeCloseTo(-10, 6)
    expect(r.reaction.get(1)![1]).toBeCloseTo(6, 6)
    expect(r.reaction.get(2)![1]).toBeCloseTo(6, 6)
    expect(r.reaction.get(1)![0]).toBeCloseTo(0, 6)
  })
  it('detects a four-bar mechanism', () => {
    const truss = {
      joints: [{ id: 1, x: 0, y: 0, support: 'pin' as const }, { id: 2, x: 4, y: 0, support: 'roller' as const }, { id: 3, x: 4, y: 3, load: 5 }, { id: 4, x: 0, y: 3 }],
      members: [{ id: 1, a: 1, b: 2 }, { id: 2, a: 2, b: 3 }, { id: 3, a: 3, b: 4 }, { id: 4, a: 4, b: 1 }],
    }
    expect(solveTruss(truss).ok).toBe(false)
  })
  it('requires a support', () => {
    const r = solveTruss({ joints: [{ id: 1, x: 0, y: 0 }, { id: 2, x: 1, y: 0 }], members: [{ id: 1, a: 1, b: 2 }] })
    expect(r.ok).toBe(false)
  })
  it('solves a linear system', () => {
    const x = solveLinear([[2, 1], [1, 3]], [5, 10])!
    expect(x[0]).toBeCloseTo(1); expect(x[1]).toBeCloseTo(3)
  })
})

describe('bridge challenges', () => {
  for (const c of CHALLENGES) {
    it(`${c.title}: the reference solution passes within budget`, () => {
      const { truss } = challengeSolution(c)
      const r = solveTruss(truss)
      expect(r.ok, r.problem).toBe(true)
      for (const m of truss.members) {
        const f = r.force.get(m.id)!
        expect(Math.abs(f), `member ${m.id}`).toBeLessThanOrEqual(capacity(memberLength(truss, m), f))
      }
      expect(trussCost(truss)).toBeLessThanOrEqual(c.budget)
    })
  }
})
