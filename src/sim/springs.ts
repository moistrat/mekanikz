import { between, G, mulberry, pick, Rng } from './format'

/** Spring networks: leaves are springs by index, composites are series or parallel. */
export type Net = { t: 'k'; i: number } | { t: 'series' | 'par'; c: Net[] }
export const leaf = (i: number): Net => ({ t: 'k', i })

export function kEq(n: Net, ks: number[]): number {
  if (n.t === 'k') return ks[n.i]
  const parts = n.c.map((c) => kEq(c, ks))
  return n.t === 'par' ? parts.reduce((a, b) => a + b, 0) : 1 / parts.reduce((a, b) => a + 1 / b, 0)
}

export const HARD_TOPOS: { id: string; name: string; net: Net }[] = [
  { id: 'par3', name: 'All three in parallel', net: { t: 'par', c: [leaf(0), leaf(1), leaf(2)] } as Net },
  { id: 'ser3', name: 'All three in series', net: { t: 'series', c: [leaf(0), leaf(1), leaf(2)] } as Net },
  { id: 'parser', name: '1 and 2 in parallel, then in series with 3', net: { t: 'series', c: [{ t: 'par', c: [leaf(0), leaf(1)] }, leaf(2)] } as Net },
  { id: 'serpar', name: '1 and 2 in series, then in parallel with 3', net: { t: 'par', c: [{ t: 'series', c: [leaf(0), leaf(1)] }, leaf(2)] } as Net },
]
export const PAIR_TOPOS: { id: string; name: string; net: Net }[] = [
  { id: 'series', name: 'Series', net: { t: 'series', c: [leaf(0), leaf(1)] } as Net },
  { id: 'par', name: 'Parallel', net: { t: 'par', c: [leaf(0), leaf(1)] } as Net },
]

export const CATALOG = [100, 150, 200, 300, 400, 600, 800, 1200] // N/m
export const EASY_CATALOG = [200, 400, 800, 1600]

export type Diff = 'easy' | 'normal' | 'hard'

export interface HoldLevel { kind: 'hold'; diff: 'easy' | 'normal'; mass: number; targetCm: number; refKs: number[]; refTopo: string }
export interface SuspLevel {
  kind: 'susp'; diff: 'hard'
  mEmpty: number; mLoaded: number
  travelMaxCm: number; sagMinCm: number; fLo: number; fHi: number; zLo: number; zHi: number
  fade: number
  ref: { topo: string; ks: number[]; c: number }
}
export type SpringLevel = HoldLevel | SuspLevel

export const staticDeflectionCm = (m: number, k: number) => ((m * G) / k) * 100
export const naturalHz = (k: number, m: number) => Math.sqrt(k / m) / (2 * Math.PI)
export const dampingRatio = (c: number, k: number, m: number) => c / (2 * Math.sqrt(k * m))

export function makeSpringLevel(diff: Diff, r: Rng = mulberry(Math.floor(Math.random() * 1e9))): SpringLevel {
  if (diff === 'easy') {
    const k = pick(r, EASY_CATALOG), mass = pick(r, [2, 4, 5, 8, 10])
    return { kind: 'hold', diff, mass, targetCm: staticDeflectionCm(mass, k), refKs: [k], refTopo: 'single' }
  }
  if (diff === 'normal') {
    const ks = [pick(r, CATALOG), pick(r, CATALOG)], topo = pick(r, PAIR_TOPOS)
    const mass = pick(r, [2, 3, 5, 8, 10, 15])
    return { kind: 'hold', diff, mass, targetCm: staticDeflectionCm(mass, kEq(topo.net, ks)), refKs: ks, refTopo: topo.id }
  }
  const ks = [pick(r, CATALOG), pick(r, CATALOG), pick(r, CATALOG)], topo = pick(r, HARD_TOPOS)
  const k = kEq(topo.net, ks)
  const mEmpty = between(r, 150, 300, 10), mLoaded = Math.round(mEmpty * (1.4 + r() * 0.5))
  const z = 0.4 + r() * 0.15
  const fade = 0.8
  return {
    kind: 'susp', diff: 'hard', mEmpty, mLoaded, fade,
    travelMaxCm: 1.15 * staticDeflectionCm(mLoaded, k),
    sagMinCm: 0.85 * staticDeflectionCm(mEmpty, k),
    fLo: 0.8 * naturalHz(k, mEmpty), fHi: 1.25 * naturalHz(k, mEmpty),
    zLo: 0.25, zHi: 0.8,
    ref: { topo: topo.id, ks, c: 2 * z * Math.sqrt(k * mLoaded) },
  }
}

export interface SuspCheck { ok: boolean; items: { label: string; value: string; ok: boolean }[] }
export function checkSuspension(lv: SuspLevel, k: number, c: number): SuspCheck {
  const dL = staticDeflectionCm(lv.mLoaded, k), dE = staticDeflectionCm(lv.mEmpty, k)
  const fE = naturalHz(k, lv.mEmpty), fL = naturalHz(k, lv.mLoaded)
  const zN = dampingRatio(c, k, lv.mLoaded), zH = dampingRatio(c * lv.fade, k, lv.mLoaded)
  const items = [
    { label: `Loaded sag at most ${lv.travelMaxCm.toFixed(1)} cm`, value: `${dL.toFixed(1)} cm`, ok: dL <= lv.travelMaxCm },
    { label: `Empty sag at least ${lv.sagMinCm.toFixed(1)} cm`, value: `${dE.toFixed(1)} cm`, ok: dE >= lv.sagMinCm },
    { label: `Empty frequency ${lv.fLo.toFixed(2)} to ${lv.fHi.toFixed(2)} Hz`, value: `${fE.toFixed(2)} Hz`, ok: fE >= lv.fLo && fE <= lv.fHi },
    { label: `Loaded frequency above ${(lv.fLo * 0.7).toFixed(2)} Hz`, value: `${fL.toFixed(2)} Hz`, ok: fL >= lv.fLo * 0.7 },
    { label: `Damping ratio ${lv.zLo} to ${lv.zHi} (cold)`, value: zN.toFixed(2), ok: zN >= lv.zLo && zN <= lv.zHi },
    { label: `Damping ratio ${lv.zLo} to ${lv.zHi} (damper hot, ${Math.round((1 - lv.fade) * 100)}% weaker)`, value: zH.toFixed(2), ok: zH >= lv.zLo && zH <= lv.zHi },
  ]
  return { ok: items.every((i) => i.ok), items }
}
