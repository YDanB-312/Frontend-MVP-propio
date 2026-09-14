import { useEffect, useId, useState } from 'react'
import { gradeForScore } from '../GradeBadge/grade'
import { reduceMovimiento } from '../../utils/viewTransition'
import s from './ScoreDial.module.css'

const R = 54
const CIRC = 2 * Math.PI * R

// Dial de veredicto: anillo SVG + grado + porcentaje mono.
export default function ScoreDial({ value = 0, size = 132, label = 'Coincidencia', className = '' }) {
  const n = Number(value)
  const pct = Number.isFinite(n) ? Math.max(0, Math.min(100, n <= 1 ? Math.round(n * 100) : Math.round(n))) : 0
  const { grade } = gradeForScore(pct)
  const gid = useId()
  const [animado, setAnimado] = useState(() => reduceMovimiento())

  useEffect(() => {
    if (reduceMovimiento()) return
    const t = requestAnimationFrame(() => setAnimado(true))
    return () => cancelAnimationFrame(t)
  }, [])

  return (
    <div className={`${s.wrap} ${className}`} role="img" aria-label={`${label}: ${pct}% (grado ${grade})`}>
      <svg className={`${s.dial} ${s[grade.toLowerCase()]}`} viewBox="0 0 120 120" width={size} height={size} aria-hidden="true">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="currentColor" stopOpacity=".55" />
            <stop offset="1" stopColor="currentColor" />
          </linearGradient>
        </defs>
        <circle className={s.track} cx="60" cy="60" r={R} />
        <circle
          className={s.arc}
          cx="60" cy="60" r={R}
          stroke={`url(#${gid})`}
          strokeDasharray={CIRC}
          strokeDashoffset={animado ? CIRC * (1 - pct / 100) : CIRC}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div className={s.center}>
        <span className={s.grade} aria-hidden="true">{grade}</span>
        <span className={`mono ${s.pct}`} aria-hidden="true">{pct}%</span>
      </div>
    </div>
  )
}
