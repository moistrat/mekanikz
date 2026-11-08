import { Joint, Member, Truss } from './truss'

type P = [number, number]
export interface Challenge {
  id: string
  title: string
  blurb: string
  budget: number
  /** locked joints: supports and loaded deck points */
  fixed: Omit<Joint, 'id' | 'locked'>[]
  /** a worked solution as extra joint positions and member pairs of coordinates */
  solution: { joints: P[]; members: [P, P][] }
}

const chain = (pts: P[]): [P, P][] => pts.slice(1).map((p, i) => [pts[i], p])

export const CHALLENGES: Challenge[] = [
  {
    id: 'footbridge', title: 'Footbridge', budget: 3500,
    blurb: 'Span 8 m. Carry 12 kN at the middle of the deck.',
    fixed: [{ x: 4, y: 3, support: 'pin' }, { x: 12, y: 3, support: 'roller' }, { x: 8, y: 3, load: 12 }],
    solution: { joints: [[8, 6]], members: [[[4, 3], [8, 3]], [[8, 3], [12, 3]], [[4, 3], [8, 6]], [[8, 6], [12, 3]], [[8, 3], [8, 6]]] },
  },
  {
    id: 'river', title: 'River crossing', budget: 6500,
    blurb: 'Span 12 m. Two 12 kN loads on the deck. Keep it light.',
    fixed: [{ x: 2, y: 3, support: 'pin' }, { x: 14, y: 3, support: 'roller' }, { x: 6, y: 3, load: 12 }, { x: 10, y: 3, load: 12 }],
    solution: {
      joints: [[4, 6], [8, 6], [12, 6]],
      members: [
        ...chain([[2, 3], [6, 3], [10, 3], [14, 3]]), ...chain([[4, 6], [8, 6], [12, 6]]),
        ...chain([[2, 3], [4, 6], [6, 3], [8, 6], [10, 3], [12, 6], [14, 3]]),
      ],
    },
  },
  {
    id: 'heavy', title: 'Heavy haul', budget: 10000,
    blurb: 'Span 16 m. Three 20 kN loads. Long members buckle, so keep compression members short and the truss deep.',
    fixed: [{ x: 2, y: 2, support: 'pin' }, { x: 18, y: 2, support: 'roller' }, { x: 6, y: 2, load: 20 }, { x: 10, y: 2, load: 20 }, { x: 14, y: 2, load: 20 }],
    solution: {
      joints: [[4, 6], [8, 6], [12, 6], [16, 6]],
      members: [
        ...chain([[2, 2], [6, 2], [10, 2], [14, 2], [18, 2]]), ...chain([[4, 6], [8, 6], [12, 6], [16, 6]]),
        ...chain([[2, 2], [4, 6], [6, 2], [8, 6], [10, 2], [12, 6], [14, 2], [16, 6], [18, 2]]),
      ],
    },
  },
]

/** Start a challenge: locked joints only. */
export function challengeStart(c: Challenge): { truss: Truss; nextId: number } {
  const joints: Joint[] = c.fixed.map((j, i) => ({ ...j, id: i + 1, locked: true }))
  return { truss: { joints, members: [] }, nextId: joints.length + 1 }
}

/** The reference solution as a truss, for hints and tests. */
export function challengeSolution(c: Challenge): { truss: Truss; nextId: number } {
  const { truss } = challengeStart(c)
  let id = truss.joints.length + 1
  const find = ([x, y]: P) => truss.joints.find((j) => j.x === x && j.y === y)
  const ensure = (p: P) => find(p) ?? (truss.joints.push({ id: id++, x: p[0], y: p[1] }), truss.joints[truss.joints.length - 1])
  c.solution.joints.forEach(ensure)
  let mid = 1
  const members: Member[] = c.solution.members.map(([a, b]) => ({ id: mid++, a: ensure(a).id, b: ensure(b).id }))
  return { truss: { joints: truss.joints, members }, nextId: id }
}
