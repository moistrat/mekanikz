import { WidgetId } from '../types'
import { Collision, Energy, Kinematics, Projectile } from './Dynamics'
import { Gears, Hydraulic, Pulley, Spring } from './Machines'
import { Beam, StressStrain, Torsion } from './Materials'
import { Incline, Lever, Truss, Vectors } from './Statics'
import { Bernoulli, Carnot } from './Thermo'
import { Units } from './Units'
import { Fbd, Cables, Flywheel, Column, Gas, Resonance, Engine, Depth, Impulse } from './Interactive2'
import { FrictionGraph, GearTypes, KinGraphs, Loads, Machines6, MomentArm, Process, StressTypes, Supports, TrussJoint } from './Diagrams'

export function Widget({ id }: { id: WidgetId }) {
  switch (id) {
    case 'vectors': return <Vectors />
    case 'incline': return <Incline />
    case 'lever': return <Lever />
    case 'truss': return <Truss />
    case 'kinematics': return <Kinematics />
    case 'projectile': return <Projectile />
    case 'energy': return <Energy />
    case 'collision': return <Collision />
    case 'stressstrain': return <StressStrain />
    case 'beam': return <Beam />
    case 'torsion': return <Torsion />
    case 'gears': return <Gears />
    case 'spring': return <Spring />
    case 'hydraulic': return <Hydraulic />
    case 'pulley': return <Pulley />
    case 'carnot': return <Carnot />
    case 'bernoulli': return <Bernoulli />
    case 'units': return <Units />
    case 'process': return <Process />
    case 'momentarm': return <MomentArm />
    case 'supports': return <Supports />
    case 'stresstypes': return <StressTypes />
    case 'loads': return <Loads />
    case 'machines6': return <Machines6 />
    case 'geartypes': return <GearTypes />
    case 'frictiongraph': return <FrictionGraph />
    case 'kingraphs': return <KinGraphs />
    case 'trussjoint': return <TrussJoint />
    case 'fbd': return <Fbd />
    case 'cables': return <Cables />
    case 'flywheel': return <Flywheel />
    case 'column': return <Column />
    case 'gas': return <Gas />
    case 'resonance': return <Resonance />
    case 'engine': return <Engine />
    case 'depth': return <Depth />
    case 'impulse': return <Impulse />
  }
}
