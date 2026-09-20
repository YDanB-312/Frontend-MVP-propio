import CountUp from '../CountUp/CountUp'
import s from './StatChip.module.css'

// Chip de dato estilo consola (hardware canirun): etiqueta + valor mono.
export default function StatChip({ icon, label, value, className = '' }) {
  return (
    <span className={`${s.chip} ${className}`}>
      {icon ? <span className={s.icon} aria-hidden="true">{icon}</span> : null}
      <span className={s.label}>{label}</span>
      <strong className={`mono ${s.value}`}><CountUp value={value} /></strong>
    </span>
  )
}
