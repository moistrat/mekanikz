import { describe, expect, it } from 'vitest'
import { mulberry } from './format'
import { simulate, VACUUM } from './ballistics'
import { checkSuspension, HARD_TOPOS, kEq, leaf, makeSpringLevel, PAIR_TOPOS, staticDeflectionCm } from './springs'

describe('spring networks', () => {
  it('series and parallel combine correctly', () => {
    expect(kEq({ t: 'par', c: [leaf(0), leaf(1)] }, [100, 300])).toBeCloseTo(400)
    expect(kEq({ t: 'series', c: [leaf(0), leaf(1)] }, [100, 300])).toBeCloseTo(75)
    expect(kEq(HARD_TOPOS[2].net, [200, 200, 100])).toBeCloseTo((400 * 100) / 500)
    expect(kEq(HARD_TOPOS[3].net, [200, 200, 100])).toBeCloseTo(200)
  })
  it('Hooke: 10 kg on 981 N/m sags 10 cm', () => expect(staticDeflectionCm(10, 981)).toBeCloseTo(10))
  it('every generated level is solvable by its reference design', () => {
    for (let s = 1; s <= 300; s++) for (const d of ['easy', 'normal', 'hard'] as const) {
      const lv = makeSpringLevel(d, mulberry(s * 977))
      if (lv.kind === 'hold') {
        const topo = lv.refTopo === 'single' ? null : PAIR_TOPOS.find((t) => t.id === lv.refTopo)!
        const k = topo ? kEq(topo.net, lv.refKs) : lv.refKs[0]
        expect(Math.abs(staticDeflectionCm(lv.mass, k) - lv.targetCm)).toBeLessThan(1e-9)
      } else {
        const topo = HARD_TOPOS.find((t) => t.id === lv.ref.topo)!
        const res = checkSuspension(lv, kEq(topo.net, lv.ref.ks), lv.ref.c)
        expect(res.ok, JSON.stringify(res.items.filter((i) => !i.ok))).toBe(true)
      }
    }
  })
})

describe('ballistics', () => {
  it('matches the vacuum range formula', () => {
    const f = simulate(30, 40, 0, VACUUM)
    expect(f.landX).toBeCloseTo((30 * 30 * Math.sin((80 * Math.PI) / 180)) / 9.81, 0)
  })
  it('drag shortens the range and a tailwind lengthens it', () => {
    const base = simulate(40, 40, 0, VACUUM).landX
    expect(simulate(40, 40, 0, { drag: 0.0015, wind: 0 }).landX).toBeLessThan(base)
    const calm = simulate(40, 40, 0, { drag: 0.0015, wind: 0 }).landX
    expect(simulate(40, 40, 0, { drag: 0.0015, wind: 6 }).landX).toBeGreaterThan(calm)
    expect(simulate(40, 40, 0, { drag: 0.0015, wind: -6 }).landX).toBeLessThan(calm)
  })
  it('detects a wall and an unreachable platform', () => {
    expect(simulate(30, 30, 0, VACUUM, { x: 20, h: 30 }).hitWall).toBe(true)
    expect(simulate(10, 20, 8, VACUUM).short).toBe(true)
  })
})
