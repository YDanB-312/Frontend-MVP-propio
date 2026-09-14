import { gradeForScore, NIVEL_GRADO } from './grade'
import s from './GradeBadge.module.css'

export default function GradeBadge({ score = 0, showPct = true, size = 'md', className = '' }) {
  const { grade, pct } = gradeForScore(score)
  return (
    <span
      role="img"
      className={`${s.badge} ${s[grade.toLowerCase()]} ${s[size] || ''} ${className}`}
      aria-label={`Coincidencia ${NIVEL_GRADO[grade]}: ${pct}%`}
      title={`Coincidencia ${NIVEL_GRADO[grade]} (${pct}%)`}
    >
      <span className={s.letter} aria-hidden="true">{grade}</span>
      {showPct ? <span className={`mono ${s.pct}`}>{pct}%</span> : null}
    </span>
  )
}
