import { WidgetId } from '../types'
import { Collision, Energy, Kinematics, Projectile } from './Dynamics'
import { Gears, Hydraulic, Pulley, Spring } from './Machines'
import { Beam, StressStrain, Torsion } from './Materials'
import { Incline, Lever, Truss, Vectors } from './Statics'
import { Bernoulli, Carnot } from './Thermo'
import { Units } from './Units'

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
  }
}
