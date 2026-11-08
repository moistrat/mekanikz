export function Slider({ label, value, min, max, step = 1, onChange, fmt, disabled }: {
  label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; fmt: (v: number) => string; disabled?: boolean
}) {
  return (
    <label className="slider">
      <span className="slider-label">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} disabled={disabled} onChange={(e) => onChange(Number(e.target.value))} />
      <span className="slider-value">{fmt(value)}</span>
    </label>
  )
}
