import { ReactNode } from 'react'
import { deg } from '../../sim/format'
import { Frame } from './shared'
import { Arrow, Ground } from './svg'
import { gearPath } from './Machines'

const P = ({ x, y, title, children }: { x: number; y: number; title?: string; children: ReactNode }) => (
  <g transform={`translate(${x},${y})`}>{title && <text x={0} y={-4} className="w-t sm">{title}</text>}{children}</g>
)

/* ---------- The engineering method ---------- */
export function Process() {
  const steps = [['Define', 'loads, size, cost, safety'], ['Model', 'sketch, forces, assumptions'], ['Calculate', 'physics with units'], ['Check', 'reasonable? add margin'], ['Iterate', 'build, test, improve']]
  return (
    <Frame caption="Real design is a loop. Most first answers fail a check and send you back to the model, which is normal and healthy.">
      <svg viewBox="0 0 640 170" className="wsvg" role="img" aria-label="The engineering method as a loop">
        {steps.map(([t, s], i) => (
          <g key={t} transform={`translate(${14 + i * 124},40)`}>
            <rect width={108} height={64} rx={8} className={i === 1 ? 'w-body alt' : 'w-body'} />
            <text x={54} y={28} textAnchor="middle" className="w-t" style={{ fill: 'var(--text)' }}>{t}</text>
            <text x={54} y={46} textAnchor="middle" className="w-t sm">{s.length > 18 ? s.slice(0, s.lastIndexOf(' ', 18)) : s}</text>
            <text x={54} y={58} textAnchor="middle" className="w-t sm">{s.length > 18 ? s.slice(s.lastIndexOf(' ', 18) + 1) : ''}</text>
            {i < 4 && <Arrow x1={110} y1={32} x2={124} y2={32} cls="alt" head={7} />}
          </g>
        ))}
        <path d="M 592 114 C 592 160, 70 160, 70 114" className="w-ref" fill="none" />
        <Arrow x1={70} y1={122} x2={70} y2={112} cls="alt" head={8} />
        <text x={330} y={150} textAnchor="middle" className="w-t sm">not good enough yet: go round again</text>
      </svg>
    </Frame>
  )
}

/* ---------- Moment arm ---------- */
export function MomentArm() {
  const O = { x: 30, y: 100 }, T = { x: 170, y: 100 }
  const cases = [{ f: [0, 1], name: 'Perpendicular push' }, { f: [0.6, 0.8], name: 'Angled push' }, { f: [1, 0], name: 'Push along the arm' }]
  return (
    <Frame caption="Only the perpendicular distance from the pivot to the line of the force counts. The same push gives the full moment, a reduced moment, or none at all depending on its direction.">
      <svg viewBox="0 0 640 190" className="wsvg" role="img" aria-label="Moment arm for three force directions">
        {cases.map((c, i) => {
          const [fx, fy] = c.f
          const tx = T.x - 60 * fx, ty = T.y - 60 * fy
          const t = -((T.x - O.x) * fx + 0 * fy)
          const foot = { x: T.x + t * fx, y: T.y + t * fy }
          const d = Math.abs((T.x - O.x) * fy)
          return (
            <P key={i} x={i * 212 + 8} y={0}>
              <line x1={O.x} y1={O.y} x2={T.x} y2={T.y} className="w-pipe thick" style={{ strokeWidth: 5 }} />
              <circle cx={O.x} cy={O.y} r={6} className="w-joint" />
              <Arrow x1={i === 2 ? T.x + 50 : tx} y1={i === 2 ? T.y : ty} x2={i === 2 ? T.x + 6 : T.x} y2={i === 2 ? T.y : T.y} cls="red" label="F" lx={-18} ly={-4} />
              {d > 1 && <><line x1={O.x} y1={O.y} x2={foot.x} y2={foot.y} className="w-ref" /><text x={(O.x + foot.x) / 2 - 8} y={(O.y + foot.y) / 2 - 6} className="w-t sm accent">d</text></>}
              <text x={O.x - 6} y={150} className="w-t sm">{c.name}</text>
              <text x={O.x - 6} y={168} className="w-t sm accent">{i === 0 ? 'M = F × arm' : i === 1 ? 'M = F × (arm × sin θ)' : 'M = 0'}</text>
            </P>
          )
        })}
      </svg>
    </Frame>
  )
}

/* ---------- Support types ---------- */
export function Supports() {
  return (
    <Frame caption="The type of support decides how many reaction forces appear in the free-body diagram. Each blocked movement is one unknown force (or moment).">
      <svg viewBox="0 0 640 210" className="wsvg" role="img" aria-label="Pin, roller and fixed supports with their reactions">
        <P x={20} y={0} title="Pin: 2 reactions">
          <rect x={30} y={60} width={110} height={8} className="w-body" />
          <polygon points="85,68 70,100 100,100" className="w-body" />
          <Ground x={55} y={100} w={60} />
          <Arrow x1={85} y1={150} x2={85} y2={104} cls="red" label="Ry" lx={8} ly={14} />
          <Arrow x1={20} y1={64} x2={60} y2={64} cls="red" label="Rx" lx={-30} ly={-8} />
        </P>
        <P x={230} y={0} title="Roller: 1 reaction">
          <rect x={30} y={60} width={110} height={8} className="w-body" />
          <polygon points="85,68 70,96 100,96" className="w-body" />
          <circle cx={76} cy={101} r={5} className="w-body" /><circle cx={94} cy={101} r={5} className="w-body" />
          <Ground x={55} y={106} w={60} />
          <Arrow x1={85} y1={156} x2={85} y2={110} cls="red" label="Ry" lx={8} ly={14} />
          <text x={30} y={190} className="w-t sm">free to slide sideways</text>
        </P>
        <P x={440} y={0} title="Fixed: 3 reactions">
          <rect x={30} y={30} width={14} height={110} className="w-body" />
          {Array.from({ length: 8 }, (_, i) => <line key={i} x1={30} y1={34 + i * 14} x2={18} y2={46 + i * 14} className="w-ground" stroke="var(--text-faint)" strokeWidth={2} />)}
          <rect x={44} y={72} width={130} height={8} className="w-body" />
          <Arrow x1={20} y1={96} x2={20} y2={60} cls="red" label="Ry" lx={-26} ly={8} />
          <Arrow x1={60} y1={118} x2={32} y2={118} cls="red" label="Rx" lx={-4} ly={16} />
          <path d="M 70 126 A 22 22 0 1 1 70 160" className="w-arrowpath" />
          <text x={78} y={150} className="w-t sm accent">M</text>
          <text x={30} y={190} className="w-t sm">no move, no turn</text>
        </P>
      </svg>
    </Frame>
  )
}

/* ---------- Stress types ---------- */
export function StressTypes() {
  const lab = (t: string, s: string) => <><text x={60} y={150} textAnchor="middle" className="w-t" style={{ fill: 'var(--text)' }}>{t}</text><text x={60} y={168} textAnchor="middle" className="w-t sm">{s}</text></>
  return (
    <Frame caption="Five basic ways to load a part. Real parts usually see a mixture, and engineers check each one.">
      <svg viewBox="0 0 640 190" className="wsvg" role="img" aria-label="Tension, compression, shear, bending and torsion">
        <P x={6} y={0}><rect x={30} y={50} width={60} height={34} className="w-body" /><Arrow x1={92} y1={67} x2={118} y2={67} cls="red" /><Arrow x1={28} y1={67} x2={2} y2={67} cls="red" />{lab('Tension', 'stretches')}</P>
        <P x={132} y={0}><rect x={30} y={50} width={60} height={34} className="w-body" /><Arrow x1={2} y1={67} x2={28} y2={67} cls="red" /><Arrow x1={118} y1={67} x2={92} y2={67} cls="red" />{lab('Compression', 'squeezes')}</P>
        <P x={258} y={0}><rect x={24} y={44} width={72} height={20} className="w-body" /><rect x={24} y={64} width={72} height={20} className="w-body alt" /><Arrow x1={60} y1={30} x2={110} y2={30} cls="red" /><Arrow x1={60} y1={100} x2={10} y2={100} cls="red" />{lab('Shear', 'slices')}</P>
        <P x={384} y={0}><path d="M 12 70 Q 60 96 108 70" className="w-pipe thick" style={{ strokeWidth: 12 }} fill="none" /><polygon points="12,84 4,98 20,98" className="w-body" /><polygon points="108,84 100,98 116,98" className="w-body" /><Arrow x1={60} y1={30} x2={60} y2={80} cls="red" />{lab('Bending', 'curves')}</P>
        <P x={510} y={0}><rect x={22} y={52} width={80} height={32} className="w-body" /><path d="M 26 56 L 98 80 M 50 52 L 98 66" className="w-ref" /><path d="M 12 46 A 16 22 0 0 1 12 90" className="w-arrowpath" /><path d="M 112 90 A 16 22 0 0 1 112 46" className="w-arrowpath" />{lab('Torsion', 'twists')}</P>
      </svg>
    </Frame>
  )
}

/* ---------- Loads on a beam ---------- */
export function Loads() {
  return (
    <Frame caption="Three common ways a beam is loaded. A distributed load can be replaced by one equal resultant acting at the centre of the load, which is how you take moments or find reactions.">
      <svg viewBox="0 0 640 190" className="wsvg" role="img" aria-label="Point load, distributed load and couple">
        <P x={8} y={0} title="Point load P">
          <rect x={10} y={90} width={180} height={8} className="w-body" /><polygon points="20,98 10,120 30,120" className="w-body" /><circle cx={180} cy={124} r={6} className="w-body" />
          <Arrow x1={100} y1={36} x2={100} y2={88} cls="red" label="P" lx={8} ly={-4} />
          <text x={10} y={160} className="w-t sm">acts at one point (N)</text>
        </P>
        <P x={218} y={0} title="Distributed load w">
          <rect x={10} y={90} width={180} height={8} className="w-body" /><polygon points="20,98 10,120 30,120" className="w-body" /><circle cx={180} cy={124} r={6} className="w-body" />
          <line x1={20} y1={40} x2={180} y2={40} className="w-ref" stroke="var(--accent)" />
          {Array.from({ length: 9 }, (_, i) => <Arrow key={i} x1={20 + i * 20} y1={40} x2={20 + i * 20} y2={86} cls="red" head={6} />)}
          <Arrow x1={100} y1={126} x2={100} y2={102} cls="alt" head={6} />
          <text x={10} y={160} className="w-t sm">spread over length (N/m)</text>
          <text x={10} y={176} className="w-t sm accent">resultant W = w × L at centre</text>
        </P>
        <P x={428} y={0} title="Couple (pure moment)">
          <rect x={10} y={90} width={180} height={8} className="w-body" /><polygon points="20,98 10,120 30,120" className="w-body" /><circle cx={180} cy={124} r={6} className="w-body" />
          <Arrow x1={70} y1={44} x2={70} y2={86} cls="red" /><Arrow x1={130} y1={142} x2={130} y2={102} cls="red" />
          <text x={10} y={160} className="w-t sm">equal and opposite forces,</text>
          <text x={10} y={176} className="w-t sm">turning with no net push: M = F d</text>
        </P>
      </svg>
    </Frame>
  )
}

/* ---------- Six simple machines ---------- */
export function Machines6() {
  const tag = (t: string) => <text x={50} y={142} textAnchor="middle" className="w-t sm">{t}</text>
  return (
    <Frame caption="The six classical simple machines. Every one trades force for distance; none creates energy.">
      <svg viewBox="0 0 640 170" className="wsvg" role="img" aria-label="Lever, pulley, wheel and axle, inclined plane, wedge and screw">
        <P x={4} y={0}><line x1={8} y1={96} x2={92} y2={70} className="w-pipe thick" style={{ strokeWidth: 5 }} /><polygon points="50,84 40,108 60,108" className="w-body" /><Arrow x1={8} y1={50} x2={8} y2={86} cls="red" head={7} />{tag('Lever')}</P>
        <P x={110} y={0}><circle cx={50} cy={60} r={20} className="w-body" /><line x1={30} y1={60} x2={30} y2={110} className="w-pipe" /><line x1={70} y1={60} x2={70} y2={90} className="w-pipe" /><rect x={58} y={90} width={24} height={20} className="w-body alt" /><line x1={50} y1={20} x2={50} y2={40} className="w-pipe" />{tag('Pulley')}</P>
        <P x={216} y={0}><circle cx={50} cy={64} r={34} className="w-body" /><circle cx={50} cy={64} r={12} className="w-body alt" /><line x1={16} y1={64} x2={16} y2={110} className="w-pipe" /><Arrow x1={16} y1={80} x2={16} y2={108} cls="red" head={7} />{tag('Wheel and axle')}</P>
        <P x={322} y={0}><polygon points="8,108 92,108 92,64" className="w-body" /><rect x={42} y={70} width={22} height={20} className="w-body alt" transform="rotate(-27 53 80)" />{tag('Inclined plane')}</P>
        <P x={428} y={0}><rect x={10} y={44} width={80} height={14} className="w-body" /><polygon points="50,60 36,108 64,108" className="w-body alt" /><Arrow x1={50} y1={14} x2={50} y2={42} cls="red" head={7} />{tag('Wedge')}</P>
        <P x={534} y={0}><rect x={36} y={30} width={28} height={78} className="w-body" />{Array.from({ length: 6 }, (_, i) => <line key={i} x1={36} y1={40 + i * 12} x2={64} y2={32 + i * 12} className="w-ref" />)}<rect x={26} y={22} width={48} height={8} className="w-body" />{tag('Screw')}</P>
      </svg>
    </Frame>
  )
}

/* ---------- Gear types ---------- */
export function GearTypes() {
  const lab = (t: string, s: string, x: number) => <><text x={x} y={142} textAnchor="middle" className="w-t" style={{ fill: 'var(--text)' }}>{t}</text><text x={x} y={158} textAnchor="middle" className="w-t sm">{s}</text></>
  return (
    <Frame caption="Four common gear arrangements. Spur gears are the simplest, a rack turns rotation into straight-line motion, bevel gears turn the axis through a corner, and a worm gives a very large reduction.">
      <svg viewBox="0 0 640 170" className="wsvg" role="img" aria-label="Spur, rack and pinion, bevel and worm gears">
        <g transform="translate(58,72)"><polygon points={gearPath(12, 24, 19)} className="w-body" /></g>
        <g transform="translate(110,72)"><polygon points={gearPath(10, 20, 15)} className="w-body alt" transform="rotate(18)" /></g>
        {lab('Spur gears', 'parallel shafts', 85)}
        <g transform="translate(240,52)"><polygon points={gearPath(12, 24, 19)} className="w-body" /></g>
        <polyline points={Array.from({ length: 11 }, (_, i) => `${196 + i * 12},${84}  ${196 + i * 12 + 4},${92} ${196 + i * 12 + 8},${92} ${196 + i * 12 + 12},${84}`).join(' ')} className="w-pipe" />
        <rect x={196} y={92} width={132} height={14} className="w-body" />
        <Arrow x1={330} y1={99} x2={360} y2={99} cls="red" head={7} />
        {lab('Rack and pinion', 'turning into sliding', 262)}
        <polygon points="440,40 480,52 480,92 440,104" className="w-body" /><polygon points="484,56 530,68 530,112 484,98" className="w-body alt" transform="rotate(0)" />
        {lab('Bevel gears', 'angled shafts', 485)}
        <rect x={552} y={58} width={70} height={26} rx={3} className="w-body" />{Array.from({ length: 6 }, (_, i) => <line key={i} x1={566 + i * 11} y1={58} x2={574 + i * 11} y2={84} className="w-ref" />)}
        <polygon points="552,92 626,92 626,110 552,110" className="w-body alt" />
        {lab('Worm gear', 'big reduction', 590)}
      </svg>
    </Frame>
  )
}

/* ---------- Friction vs applied force ---------- */
export function FrictionGraph() {
  const X = (v: number) => 60 + v * 5, Y = (v: number) => 190 - v * 1.4
  return (
    <Frame caption="Push gently and friction rises to match you exactly, so nothing moves. At the breakaway point it reaches the static maximum, then drops to the smaller sliding value.">
      <svg viewBox="0 0 640 220" className="wsvg" role="img" aria-label="Friction force against applied force">
        <line x1={60} x2={600} y1={190} y2={190} className="w-axis" /><line x1={60} x2={60} y1={20} y2={190} className="w-axis" />
        <polyline points={`${X(0)},${Y(0)} ${X(100)},${Y(100)} ${X(104)},${Y(70)} ${X(106)},${Y(70)} ${X(108)},${Y(70)} 590,${Y(70)}`} className="w-curve" />
        <line x1={60} x2={X(100)} y1={Y(100)} y2={Y(100)} className="w-ref" /><line x1={X(100)} x2={X(100)} y1={Y(100)} y2={190} className="w-ref" />
        <text x={66} y={Y(100) - 6} className="w-t sm">μₛ N (maximum static friction)</text>
        <text x={X(120)} y={Y(70) - 8} className="w-t sm accent">sliding: f = μₖ N (constant)</text>
        <text x={X(24)} y={Y(40)} className="w-t sm">holding: f = applied force</text>
        <text x={X(100)} y={206} textAnchor="middle" className="w-t sm">breakaway</text>
        <text x={600} y={206} textAnchor="end" className="w-t sm">applied force</text>
        <text x={66} y={30} className="w-t sm">friction force</text>
      </svg>
    </Frame>
  )
}

/* ---------- Kinematics graph trio ---------- */
export function KinGraphs() {
  const W = 180, H = 110
  const grid = (x0: number, title: string, note: string, children: ReactNode) => (
    <g transform={`translate(${x0},30)`}>
      <text x={0} y={-10} className="w-t" style={{ fill: 'var(--text)' }}>{title}</text>
      <line x1={0} x2={W} y1={H} y2={H} className="w-axis" /><line x1={0} x2={0} y1={0} y2={H} className="w-axis" />
      {children}
      <text x={0} y={H + 20} className="w-t sm">{note}</text>
    </g>
  )
  const xt = Array.from({ length: 31 }, (_, i) => `${(i / 30) * W},${H - (i / 30) ** 2 * H * 0.9}`).join(' ')
  return (
    <Frame caption="Constant acceleration, three views of the same motion. Each graph is the slope of the one before it, or the area under the one after it.">
      <svg viewBox="0 0 640 190" className="wsvg" role="img" aria-label="Position, velocity and acceleration graphs">
        {grid(24, 'Position x', 'slope = velocity', <polyline points={xt} className="w-curve" />)}
        {grid(238, 'Velocity v', 'slope = acceleration, area = distance', <><polygon points={`0,${H} ${W},${H} ${W},${H - 100} 0,${H - 10}`} className="w-area" /><line x1={0} y1={H - 10} x2={W} y2={H - 100} className="w-curve" /></>)}
        {grid(452, 'Acceleration a', 'area = change in velocity', <><polygon points={`0,${H} ${W},${H} ${W},${H - 50} 0,${H - 50}`} className="w-area" /><line x1={0} y1={H - 50} x2={W} y2={H - 50} className="w-curve" /></>)}
        <text x={320} y={178} textAnchor="middle" className="w-t sm">time on every horizontal axis</text>
      </svg>
    </Frame>
  )
}

/* ---------- Method of joints ---------- */
export function TrussJoint() {
  const th = (36.87 * Math.PI) / 180
  const A = { x: 130, y: 150 }, B = { x: 330, y: 150 }, C = { x: 130 + 150, y: 150 - Math.tan(th) * 150 }
  return (
    <Frame caption="Cut around one joint and treat it as a particle. Draw every member force as a pull away from the joint (assume tension). A negative answer then means compression.">
      <svg viewBox="0 0 640 210" className="wsvg" role="img" aria-label="Free-body diagram of a truss joint">
        <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} className="w-pipe" /><line x1={A.x} y1={A.y} x2={C.x} y2={C.y} className="w-pipe" />
        <circle cx={A.x} cy={A.y} r={9} className="w-joint" />
        <Arrow x1={A.x} y1={A.y} x2={A.x + 70} y2={A.y} cls="alt" label="F_AB" lx={-24} ly={20} />
        <Arrow x1={A.x} y1={A.y} x2={A.x + 56} y2={A.y - 42} cls="alt" label="F_AC" lx={6} ly={-4} />
        <Arrow x1={A.x} y1={A.y + 52} x2={A.x} y2={A.y + 10} cls="red" label="Ry = 6 kN" lx={8} ly={16} />
        <path d={`M ${A.x + 34} ${A.y} A 34 34 0 0 0 ${A.x + 34 * Math.cos(th)} ${A.y - 34 * Math.sin(th)}`} className="w-ref" fill="none" /><text x={A.x + 40} y={A.y - 8} className="w-t sm">θ</text>
        <text x={380} y={50} className="w-t" style={{ fill: 'var(--text)' }}>Equilibrium of the joint</text>
        <text x={380} y={80} className="w-t sm">ΣFy = 0:  Ry + F_AC sin θ = 0</text>
        <text x={380} y={100} className="w-t sm accent">F_AC = −6 / 0.6 = −10 kN (compression)</text>
        <text x={380} y={130} className="w-t sm">ΣFx = 0:  F_AB + F_AC cos θ = 0</text>
        <text x={380} y={150} className="w-t sm accent">F_AB = +10 × 0.8 = +8 kN (tension)</text>
        <text x={380} y={180} className="w-t sm">θ = {deg(th).toFixed(1)}°: sin 0.6, cos 0.8</text>
      </svg>
    </Frame>
  )
}
