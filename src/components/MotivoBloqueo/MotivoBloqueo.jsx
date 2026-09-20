import { Warning } from 'phosphor-react'
import s from './MotivoBloqueo.module.css'

// Nota visible que explica por qué una acción está bloqueada.
export default function MotivoBloqueo({ id, compact = false, icon, children, className = '' }) {
  return (
    <p id={id} role="note" className={`${compact ? s.compact : s.nota} ${className}`}>
      {icon ?? <Warning size={compact ? 12 : 14} weight="fill" aria-hidden="true" />}
      <span>{children}</span>
    </p>
  )
}
