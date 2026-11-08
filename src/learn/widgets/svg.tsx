import { ReactNode } from 'react'

/** Arrow from (x1,y1) to (x2,y2) with a filled head. Class picks the colour. */
export function Arrow({ x1, y1, x2, y2, cls = '', label, lx = 0, ly = -6, head = 9 }: {
  x1: number; y1: number; x2: number; y2: number; cls?: string; label?: ReactNode; lx?: number; ly?: number; head?: number
}) {
  const dx = x2 - x1, dy = y2 - y1
  const len = Math.hypot(dx, dy)
  if (len < 2) return null
  const ux = dx / len, uy = dy / len
  const h = Math.min(head, len * 0.6)
  const bx = x2 - ux * h, by = y2 - uy * h
  return (
    <g className={`w-arrow ${cls}`}>
      <line x1={x1} y1={y1} x2={bx} y2={by} />
      <polygon points={`${x2},${y2} ${bx - uy * h * 0.42},${by + ux * h * 0.42} ${bx + uy * h * 0.42},${by - ux * h * 0.42}`} />
      {label !== undefined && <text x={x2 + lx} y={y2 + ly} className="w-t sm arrow-t">{label}</text>}
    </g>
  )
}

export function Ground({ x, y, w }: { x: number; y: number; w: number }) {
  const hatches = []
  for (let i = 0; i <= w; i += 10) hatches.push(<line key={i} x1={x + i} y1={y} x2={x + i - 8} y2={y + 8} />)
  return (
    <g className="w-ground">
      <line x1={x} y1={y} x2={x + w} y2={y} />
      {hatches}
    </g>
  )
}

export const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x))
