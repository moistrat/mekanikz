/** Pin-jointed truss solver using the direct stiffness method (handles determinate and indeterminate trusses). */

export interface Joint { id: number; x: number; y: number; support?: 'pin' | 'roller'; load?: number /* kN, downward */; locked?: boolean }
export interface Member { id: number; a: number; b: number }
export interface Truss { joints: Joint[]; members: Member[] }

export interface TrussResult {
  ok: boolean
  /** why not ok: mechanism, no support, etc. */
  problem?: string
  /** axial force per member id; + tension, - compression (kN) */
  force: Map<number, number>
  /** support reaction per joint id [Rx, Ry] in kN */
  reaction: Map<number, [number, number]>
}

export const TENSION_CAP = 60 // kN
export const compressionCap = (len: number) => Math.min(TENSION_CAP, 900 / (len * len)) // crude Euler buckling: long members carry less
export const memberLength = (t: Truss, m: Member) => {
  const a = t.joints.find((j) => j.id === m.a)!, b = t.joints.find((j) => j.id === m.b)!
  return Math.hypot(b.x - a.x, b.y - a.y)
}
export const capacity = (len: number, force: number) => (force >= 0 ? TENSION_CAP : compressionCap(len))
export const MEMBER_COST = 120 // $ per metre
export const JOINT_COST = 60
export const trussCost = (t: Truss) =>
  t.members.reduce((s, m) => s + memberLength(t, m) * MEMBER_COST, 0) + t.joints.filter((j) => t.members.some((m) => m.a === j.id || m.b === j.id)).length * JOINT_COST

/** Solve K u = f by Gaussian elimination with partial pivoting. Returns null if singular. */
export function solveLinear(A: number[][], b: number[]): number[] | null {
  const n = b.length
  const M = A.map((r, i) => [...r, b[i]])
  let scale = 0
  for (const r of A) for (const v of r) scale = Math.max(scale, Math.abs(v))
  for (let c = 0; c < n; c++) {
    let p = c
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r
    if (Math.abs(M[p][c]) < 1e-9 * scale) return null
    ;[M[c], M[p]] = [M[p], M[c]]
    for (let r = c + 1; r < n; r++) {
      const f = M[r][c] / M[c][c]
      if (f !== 0) for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]
    }
  }
  const x = new Array(n).fill(0)
  for (let r = n - 1; r >= 0; r--) {
    let s = M[r][n]
    for (let k = r + 1; k < n; k++) s -= M[r][k] * x[k]
    x[r] = s / M[r][r]
  }
  return x
}

export function solveTruss(t: Truss): TrussResult {
  const empty: TrussResult = { ok: false, force: new Map(), reaction: new Map() }
  if (t.members.length === 0) return { ...empty, problem: 'Add members between joints.' }
  const used = new Set<number>()
  t.members.forEach((m) => { used.add(m.a); used.add(m.b) })
  const nodes = t.joints.filter((j) => used.has(j.id))
  const idx = new Map(nodes.map((j, i) => [j.id, i]))
  if (!nodes.some((j) => j.support)) return { ...empty, problem: 'Add a pin or roller support.' }
  const n = nodes.length * 2
  const EA = 1e5
  const K = Array.from({ length: n }, () => new Array(n).fill(0))
  const geom = new Map<number, { c: number; s: number; L: number }>()
  for (const m of t.members) {
    const a = nodes[idx.get(m.a)!], b = nodes[idx.get(m.b)!]
    const L = Math.hypot(b.x - a.x, b.y - a.y)
    if (L < 1e-9) return { ...empty, problem: 'A member has zero length.' }
    const c = (b.x - a.x) / L, s = (b.y - a.y) / L
    geom.set(m.id, { c, s, L })
    const k = EA / L
    const dof = [idx.get(m.a)! * 2, idx.get(m.a)! * 2 + 1, idx.get(m.b)! * 2, idx.get(m.b)! * 2 + 1]
    const v = [-c, -s, c, s]
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) K[dof[i]][dof[j]] += k * v[i] * v[j]
  }
  const f = new Array(n).fill(0)
  for (const j of nodes) f[idx.get(j.id)! * 2 + 1] = -(j.load ?? 0)
  const fixed = new Set<number>()
  for (const j of nodes) {
    if (j.support) fixed.add(idx.get(j.id)! * 2 + 1)
    if (j.support === 'pin') fixed.add(idx.get(j.id)! * 2)
  }
  const free = [...Array(n).keys()].filter((d) => !fixed.has(d))
  const u = new Array(n).fill(0)
  if (free.length) {
    const Kff = free.map((r) => free.map((c) => K[r][c]))
    const sol = solveLinear(Kff, free.map((r) => f[r]))
    if (!sol) return { ...empty, problem: 'Unstable: the structure can move like a mechanism. Add triangles and make sure it is supported.' }
    free.forEach((d, i) => { u[d] = sol[i] })
  }
  const force = new Map<number, number>()
  for (const m of t.members) {
    const g = geom.get(m.id)!
    const ia = idx.get(m.a)! * 2, ib = idx.get(m.b)! * 2
    const elong = g.c * (u[ib] - u[ia]) + g.s * (u[ib + 1] - u[ia + 1])
    force.set(m.id, (EA / g.L) * elong)
  }
  const reaction = new Map<number, [number, number]>()
  for (const j of nodes) {
    if (!j.support) continue
    const i = idx.get(j.id)! * 2
    const r = [0, 0]
    for (let d = 0; d < 2; d++) {
      let s = 0
      for (let c = 0; c < n; c++) s += K[i + d][c] * u[c]
      r[d] = s - f[i + d]
    }
    reaction.set(j.id, [r[0], r[1]])
  }
  return { ok: true, force, reaction }
}
