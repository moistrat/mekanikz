import { Joint, Truss } from '../sim/truss'

export type Tool = 'joint' | 'member' | 'pin' | 'roller' | 'load' | 'erase'

export interface Ctx {
  truss: Truss
  tool: Tool
  sel: { kind: 'm' | 'j'; id: number } | null
  solved: boolean
  historyLen: number
}
export interface Api {
  commit: (t: Truss, nextId: number) => void
  truss: Truss
  nextId: number
  setTool: (t: Tool) => void
  undo: () => void
}
export interface Guide { points: [number, number][]; lines: [[number, number], [number, number]][] }

export interface Step {
  id: string
  title: string
  body: string
  info?: boolean
  focus?: string
  setup?: (api: Api) => void
  guide?: (ctx: Ctx) => Guide | undefined
  done?: (ctx: Ctx) => boolean
  hint?: (ctx: Ctx) => string | undefined
  autofill?: (api: Api) => void
}

type P = [number, number]
const A: P = [3, 3], B: P = [9, 3], C: P = [6, 6]
const at = (t: Truss, p: P): Joint | undefined => t.joints.find((j) => j.x === p[0] && j.y === p[1])
const hasMember = (t: Truss, p: P, q: P) => {
  const a = at(t, p), b = at(t, q)
  return !!a && !!b && t.members.some((m) => (m.a === a.id && m.b === b.id) || (m.a === b.id && m.b === a.id))
}
const addJoints = (api: Api, pts: P[]) => {
  let id = api.nextId
  const joints = [...api.truss.joints]
  for (const p of pts) if (!joints.some((j) => j.x === p[0] && j.y === p[1])) joints.push({ id: id++, x: p[0], y: p[1] })
  api.commit({ ...api.truss, joints }, id)
}
const patch = (api: Api, p: P, f: (j: Joint) => Joint) =>
  api.commit({ ...api.truss, joints: api.truss.joints.map((j) => (j.x === p[0] && j.y === p[1] ? f(j) : j)) }, api.nextId)
const SIDES: [P, P][] = [[A, B], [A, C], [B, C]]

export const STEPS: Step[] = [
  { id: 'welcome', title: 'Build a truss in two minutes', body: 'A truss is a frame of straight bars that carries a load. You will build the simplest one, see the force in each bar, and learn to read the colours. Nothing you do here touches your saved work.', info: true },
  {
    id: 'joints', title: 'Place three joints', focus: '.toolbox',
    body: 'Joints are the pins where bars meet. The Joint tool is selected: click each dashed circle on the grid.',
    setup: ({ setTool }) => setTool('joint'),
    guide: ({ truss }) => ({ points: [A, B, C].filter((p) => !at(truss, p)), lines: [] }),
    done: ({ truss }) => [A, B, C].every((p) => at(truss, p)),
    hint: ({ truss }) => (truss.joints.length > 0 && ![A, B, C].every((p) => at(truss, p)) ? 'Click right on a dashed circle. Undo with Ctrl/Cmd+Z if you misplaced one.' : undefined),
    autofill: (api) => addJoints(api, [A, B, C]),
  },
  {
    id: 'members', title: 'Connect them with bars', focus: '.toolbox',
    body: 'Choose the Member tool, click one joint, then click another. Connect all three joints into a triangle. Triangles are rigid, which is why trusses are made of them.',
    setup: ({ setTool }) => setTool('member'),
    guide: ({ truss }) => ({ points: [], lines: SIDES.filter(([p, q]) => !hasMember(truss, p, q)) }),
    done: ({ truss }) => SIDES.every(([p, q]) => hasMember(truss, p, q)),
    hint: ({ truss }) => (truss.members.length > 0 ? 'Click a joint, then a second joint. The dashed lines show the bars still missing.' : undefined),
    autofill: (api) => {
      const ids = [A, B, C].map((p) => at(api.truss, p)!.id)
      let id = api.nextId
      const members = [...api.truss.members]
      for (const [p, q] of SIDES) if (!hasMember(api.truss, p, q)) members.push({ id: id++, a: at(api.truss, p)!.id, b: at(api.truss, q)!.id })
      void ids
      api.commit({ ...api.truss, members }, id)
    },
  },
  {
    id: 'pin', title: 'Pin the left corner', focus: '.toolbox',
    body: 'A structure must be held in place. A pin support stops the joint moving in any direction. Pick Pin support and click the bottom-left joint.',
    setup: ({ setTool }) => setTool('pin'),
    guide: ({ truss }) => ({ points: at(truss, A)?.support === 'pin' ? [] : [A], lines: [] }),
    done: ({ truss }) => at(truss, A)?.support === 'pin',
    autofill: (api) => patch(api, A, (j) => ({ ...j, support: 'pin' })),
  },
  {
    id: 'roller', title: 'Add a roller on the right', focus: '.toolbox',
    body: 'A roller holds up but lets the joint slide sideways, so the truss can expand with heat without building up stress. One pin plus one roller makes a stable support.',
    setup: ({ setTool }) => setTool('roller'),
    guide: ({ truss }) => ({ points: at(truss, B)?.support === 'roller' ? [] : [B], lines: [] }),
    done: ({ truss }) => at(truss, B)?.support === 'roller',
    autofill: (api) => patch(api, B, (j) => ({ ...j, support: 'roller' })),
  },
  {
    id: 'load', title: 'Hang a load on the top', focus: '.toolbox',
    body: 'Pick the Load tool and click the top joint. Each click adds 5 kN downward. Shift-click removes 5 kN.',
    setup: ({ setTool }) => setTool('load'),
    guide: ({ truss }) => ({ points: (at(truss, C)?.load ?? 0) > 0 ? [] : [C], lines: [] }),
    done: ({ truss }) => (at(truss, C)?.load ?? 0) > 0,
    autofill: (api) => patch(api, C, (j) => ({ ...j, load: 10 })),
  },
  {
    id: 'read', title: 'Read the forces', info: true, focus: '.canvas-wrap',
    body: 'The structure is solved instantly. Numbers on the bars are forces in kN. Blue bars are in compression (being squeezed), red bars are in tension (being stretched), and thicker bars carry more. The numbers under the supports are the reactions holding the structure up.',
    setup: ({ setTool }) => setTool('member'),
  },
  {
    id: 'inspect', title: 'Inspect a member', focus: '.side',
    body: 'Click any bar to see its force, its capacity and how much of that capacity it uses. Long compression bars have a lower capacity, because they buckle.',
    done: ({ sel }) => sel?.kind === 'm',
    hint: () => 'Click directly on one of the bars.',
  },
  {
    id: 'break', title: 'Break it on purpose', focus: '.toolbox',
    body: 'Pick the Erase tool and click one of the bars. Remove one side of the triangle and watch the structure become an unstable mechanism.',
    setup: ({ setTool }) => setTool('erase'),
    done: ({ truss }) => truss.members.length < 3,
    autofill: (api) => api.commit({ ...api.truss, members: api.truss.members.slice(1) }, api.nextId),
  },
  {
    id: 'undo', title: 'Undo the damage', focus: '.toolbox',
    body: 'Press Ctrl/Cmd+Z or the Undo button to bring the bar back.',
    setup: ({ setTool }) => setTool('member'),
    done: ({ truss, solved }) => truss.members.length === 3 && solved,
    autofill: (api) => api.undo(),
  },
  {
    id: 'finish', title: 'You are ready', info: true,
    body: 'Next, try the Footbridge, River crossing and Heavy haul challenges in the Mode list: strong enough, within budget. Or learn why it all works in the Learn tab, play the Games, or test yourself in the Quiz.',
  },
]
