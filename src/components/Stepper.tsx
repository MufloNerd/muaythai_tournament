interface Props {
  value: number
  min: number
  max: number
  label: string
  hint?: string
  step?: number
  format?: (value: number) => string
  onChange: (value: number) => void
}

export function Stepper({ value, min, max, label, hint, step = 1, format = String, onChange }: Props) {
  const set = (n: number) => onChange(Math.min(max, Math.max(min, n)))
  return (
    <div className="stepper">
      <button
        type="button"
        className="btn btn-ghost"
        aria-label={`Diminuisci ${label}`}
        disabled={value <= min}
        onClick={() => set(value - step)}
      >
        −
      </button>
      <output aria-label={label}>{format(value)}</output>
      <button
        type="button"
        className="btn btn-ghost"
        aria-label={`Aumenta ${label}`}
        disabled={value >= max}
        onClick={() => set(value + step)}
      >
        +
      </button>
      {hint && <small>{hint}</small>}
    </div>
  )
}
