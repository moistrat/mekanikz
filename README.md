# Mekanikz

An interactive website for learning and experimenting with mechanical engineering. It is the sibling of Cirkitz (same layout and dark theme, with an orange accent instead of mint).

- **Learn** – a 23-lesson, ordered course in six units: foundations (units, forces and vectors, Newton's laws), statics (equilibrium, moments, trusses, friction), dynamics (kinematics, projectiles, energy, momentum, rotation), mechanics of materials (stress and strain, beams, torsion, failure and safety factors), machines and design (simple machines, gears, vibrations) and fluids and thermal systems (pressure and hydraulics, Bernoulli, the first law, heat engines). Every lesson has worked examples, check questions, progress tracking and, where it helps, a live interactive figure (18 in total).
- **Tutorial** – an optional playable walkthrough (offered on the first Sandbox visit, reopen from the header) on a scratch board: place joints, connect bars, add supports and a load, read the forces, break it and undo it, with a "Do it for me" option on every step. Your saved work is untouched.
- **Sandbox** – a truss builder. Place joints, connect members, add pin and roller supports and loads. A direct-stiffness solver shows the force in every member (red tension, blue compression, bright red overloaded; long compression bars buckle sooner), the support reactions and the cost. Three bridge challenges (Footbridge, River crossing, Heavy haul) give a budget and a load, each with a worked solution to peek at.
- **Games** – Bridge Builder (above), Balance the Beam (moments), Hang the Sign (equilibrium), Cannon Range (projectiles), Loop the Loop (energy), Gear Train (ratios and direction) and Concept Sprint (a 60-second timed round drawn from every lesson's questions). Levels get harder as you win and streaks are saved in the browser.
- **Quiz** – generated numeric questions with worked solutions, filterable by topic (statics, dynamics, materials, machines, fluids and heat) and three difficulty levels, with hints.

Sandbox shortcuts: `1`–`6` pick a tool, `Ctrl/⌘Z` undo, `Esc` cancel a member.

## Develop

```bash
npm install
npm run dev     # http://localhost:5173
npm test        # solver, bridge solutions, course content and quiz generator tests
npm run build   # type-check and production build into dist/
```

Pushing to `main` deploys to GitHub Pages via `.github/workflows/deploy.yml`.

## How it works

- `src/learn/content/` holds the course as typed data (paragraphs, formulas, examples, tables, widgets and check questions). `src/learn/widgets/` has the interactive figures.
- `src/sim/truss.ts` assembles a stiffness matrix for the pin-jointed truss and solves it with Gaussian elimination, so determinate and indeterminate trusses both work and mechanisms are detected. `src/sim/bridges.ts` defines the challenges, and the tests prove every reference solution is within capacity and budget.
- `src/sim/quizGen.ts` has about 30 problem generators; tests run each one across many random seeds.
- `src/games/` has one component per game.

Limitations: the truss is 2D with ideal pin joints and a single member size (capacity 60 kN in tension, buckling-limited in compression, no self-weight). Fluids and thermodynamics are introductory. Physics in games and figures ignores air resistance unless stated.
