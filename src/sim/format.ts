const PREFIXES: [number, string][] = [
  [1e9, 'G'], [1e6, 'M'], [1e3, 'k'], [1, ''], [1e-3, 'm'], [1e-6, 'µ'],
]

/** 1234 N -> "1.23 kN". */
export function formatSI(value: number, unit = '', digits = 3): string {
  if (!isFinite(value)) return `∞ ${unit}`.trim()
  const abs = Math.abs(value)
  if (abs < 1e-12) return `0 ${unit}`.trim()
  let [scale, prefix] = PREFIXES[PREFIXES.length - 1]
  for (const [s, p] of PREFIXES) if (abs >= s * 0.9995) { scale = s; prefix = p; break }
  return `${Number((value / scale).toPrecision(digits)).toString()} ${prefix}${unit}`.trim()
}

/** Fixed decimals with a real minus sign. */
export const fix = (x: number, d = 2) => (x < 0 ? '−' : '') + Math.abs(x).toFixed(d)
export const deg = (r: number) => (r * 180) / Math.PI
export const rad = (d: number) => (d * Math.PI) / 180
export const G = 9.81

export type Rng = () => number
export const mulberry = (seed: number): Rng => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
export const pick = <T,>(r: Rng, xs: T[]) => xs[Math.floor(r() * xs.length)]
export const between = (r: Rng, lo: number, hi: number, step = 1) => lo + Math.floor((r() * (hi - lo)) / step + 0.5) * step
