import s from './StatusMark.module.css'

const TEXTO = {
  pending: 'Pendiente',
  running: 'En progreso',
  done: 'Completado',
  failed: 'Fallido',
  cancelled: 'Cancelado',
}

// Glifo de estado (ReactBits StatusMark, adaptado a CSS Modules + tokens).
export default function StatusMark({ status = 'pending', progress, label, size = 18, className = '' }) {
  const r = 9
  const C = 2 * Math.PI * r
  const avance = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : null
  const texto = TEXTO[status] || TEXTO.pending

  return (
    <span className={`${s.mark} ${className}`} data-status={status}>
      <svg
        className={s.glyph}
        viewBox="0 0 24 24"
        width={size}
        height={size}
        role={label ? undefined : 'img'}
        aria-label={label ? undefined : texto}
        aria-hidden={label ? true : undefined}
      >
        <circle className={s.ring} cx="12" cy="12" r={r} />
        <circle
          className={s.arc}
          cx="12"
          cy="12"
          r={r}
          strokeDasharray={C}
          strokeDashoffset={avance != null ? C * (1 - avance) : C * 0.32}
          transform="rotate(-90 12 12)"
        />
        <path className={s.check} d="M7.5 12.25 10.5 15.25 16.75 8.75" />
        <path className={s.cross} d="M8.5 8.5 15.5 15.5M15.5 8.5 8.5 15.5" />
      </svg>
      {label ? <span className={s.label}>{label}</span> : null}
    </span>
  )
}
