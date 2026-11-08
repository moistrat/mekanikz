import { useState } from 'react'
import { Frame, Readouts } from './shared'

const Q: Record<string, { label: string; units: [string, number][] }> = {
  force: { label: 'Force', units: [['N', 1], ['kN', 1e3], ['lbf', 4.4482216], ['kgf', 9.80665]] },
  length: { label: 'Length', units: [['m', 1], ['mm', 1e-3], ['in', 0.0254], ['ft', 0.3048]] },
  pressure: { label: 'Pressure', units: [['Pa', 1], ['kPa', 1e3], ['MPa', 1e6], ['bar', 1e5], ['psi', 6894.757], ['atm', 101325]] },
  energy: { label: 'Energy', units: [['J', 1], ['kJ', 1e3], ['kWh', 3.6e6], ['ft·lbf', 1.3558179], ['BTU', 1055.056]] },
  power: { label: 'Power', units: [['W', 1], ['kW', 1e3], ['hp', 745.69987], ['BTU/h', 0.29307107]] },
  mass: { label: 'Mass', units: [['kg', 1], ['g', 1e-3], ['lb', 0.45359237], ['slug', 14.593903]] },
}

export function Units() {
  const [q, setQ] = useState('pressure')
  const [val, setVal] = useState(100)
  const [from, setFrom] = useState(0)
  const set = Q[q]
  const base = val * set.units[from][1]
  return (
    <Frame caption="Convert any quantity to the SI base unit first, then to the target. Always carry units through a calculation; if they do not combine into the unit you expect, something is wrong.">
      <div className="widget-controls">
        <div className="seg" role="group" aria-label="Quantity">
          {Object.entries(Q).map(([k, v]) => <button key={k} className={k === q ? 'on' : ''} onClick={() => { setQ(k); setFrom(0) }}>{v.label}</button>)}
        </div>
        <div className="q-row">
          <input value={val} type="number" onChange={(e) => setVal(Number(e.target.value))} aria-label="Value" style={{ maxWidth: 160 }} className="num-in" />
          <select value={from} onChange={(e) => setFrom(Number(e.target.value))} aria-label="From unit" style={{ maxWidth: 120 }}>
            {set.units.map(([u], i) => <option key={u} value={i}>{u}</option>)}
          </select>
        </div>
        <Readouts items={set.units.map(([u, f]) => [u, Number((base / f).toPrecision(5)).toLocaleString('en-US', { maximumSignificantDigits: 6 })] as [string, string])} />
      </div>
    </Frame>
  )
}
