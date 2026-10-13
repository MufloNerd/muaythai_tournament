interface Props {
  value: number
  min: number
  max: number
  label: string
  hint?: string
  onChange: (value: number) => void
}

export function Stepper({ value, min, max, label, hint, onChange }: Props) {
  const set = (n: number) => onChange(Math.min(max, Math.max(min, n)))
  return (
    <div className="stepper">
      <button
        type="button"
        className="btn btn-ghost"
        aria-label={`Diminuisci ${label}`}
        disabled={value <= min}
        onClick={() => set(value - 1)}
      >
        −
      </button>
      <output aria-label={label}>{value}</output>
      <button
        type="button"
        className="btn btn-ghost"
        aria-label={`Aumenta ${label}`}
        disabled={value >= max}
        onClick={() => set(value + 1)}
      >
        +
      </button>
      {hint && <small>{hint}</small>}
    </div>
  )
}
