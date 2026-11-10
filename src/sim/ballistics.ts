import { G, rad } from './format'

export interface Env {
  /** quadratic drag coefficient k in a = -k |v_rel| v_rel (1/m); 0 = vacuum */
  drag: number
  /** steady horizontal wind in m/s, positive blows toward the target */
  wind: number
}
export interface Wall { x: number; h: number }
export interface Flight {
  /** sampled path every DT seconds */
  pts: { x: number; y: number }[]
  tEnd: number
  landX: number
  /** target height was never reached */
  short: boolean
  hitWall: boolean
}
export const DT = 0.02
export const VACUUM: Env = { drag: 0, wind: 0 }

/** Integrate a projectile (semi-implicit Euler, 2 ms steps). Lands when it comes down through height ty. */
export function simulate(v0: number, angDeg: number, ty: number, env: Env, wall?: Wall): Flight {
  const h = 0.002
  let x = 0, y = 0, vx = v0 * Math.cos(rad(angDeg)), vy = v0 * Math.sin(rad(angDeg))
  let t = 0, above = false, nextSample = 0
  const pts = [{ x, y }]
  let hitWall = false, short = false, landX = 0
  for (let i = 0; i < 200000; i++) {
    const rx = vx - env.wind, ry = vy
    const sp = Math.hypot(rx, ry)
    vx += -env.drag * sp * rx * h
    vy += (-G - env.drag * sp * ry) * h
    const px = x, py = y
    x += vx * h; y += vy * h; t += h
    if (wall && px < wall.x && x >= wall.x) {
      const f = (wall.x - px) / (x - px || 1)
      if (py + (y - py) * f < wall.h) { hitWall = true; landX = wall.x; break }
    }
    if (y >= ty) above = true
    if (above && vy < 0 && y <= ty) {
      const f = (py - ty) / (py - y || 1)
      landX = px + (x - px) * f
      break
    }
    if (y < 0 && vy < 0) { short = !above && ty > 0; landX = x; break }
    if (t >= nextSample) { pts.push({ x, y }); nextSample += DT }
  }
  pts.push({ x: landX, y: hitWall ? y : above ? ty : Math.max(y, 0) })
  return { pts, tEnd: t, landX, short, hitWall }
}
