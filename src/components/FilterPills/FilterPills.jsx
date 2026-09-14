import { useRef } from 'react'
import s from './FilterPills.module.css'

// Grupo de pills excluyentes (radiogroup APG): flechas mueven y seleccionan,
// roving tabindex para un solo punto de tabulación.
export default function FilterPills({ options = [], value, onChange, ariaLabel = 'Filtros', className = '' }) {
  const refs = useRef([])

  const elegir = (index) => {
    const o = options[index]
    if (!o) return
    refs.current[index]?.focus()
    if (o.value !== value) onChange?.(o.value)
  }

  return (
    <div className={`${s.pills} ${className}`} role="radiogroup" aria-label={ariaLabel}>
      {options.map((o, i) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            ref={(el) => { refs.current[i] = el }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active || (value == null && i === 0) ? 0 : -1}
            className={`${s.pill} ${active ? s.active : ''}`}
            onClick={() => onChange?.(o.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); elegir((i + 1) % options.length) }
              else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); elegir((i - 1 + options.length) % options.length) }
            }}
          >
            {o.label}
            {o.count != null ? <span className={`mono ${s.count}`}>{o.count}</span> : null}
          </button>
        )
      })}
    </div>
  )
}
