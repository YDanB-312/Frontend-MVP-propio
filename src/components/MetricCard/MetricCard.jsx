import { Link } from 'react-router-dom'
import CountUp from '../CountUp/CountUp'
import s from './MetricCard.module.css'

export default function MetricCard({ icon, label, value, trend, trendDir, variant = 'primary', to, className = '', ...rest }) {
  const Comp = to ? Link : 'div'
  const base = variant === 'minimal' ? s.minimal : `${s.card} ${s[variant] || s.primary}`

  return (
    <Comp {...(to ? { to } : {})} className={`${base} ${to ? s.link : ''} ${className}`} {...rest}>
      {icon ? <div className={s.icono}>{icon}</div> : null}
      <div className={s.content}>
        <span className={s.value}><CountUp value={value} /></span>
        <span className={s.label}>{label}</span>
      </div>
      {trend && (
        <span className={`${s.trend} ${trendDir === 'up' ? s.up : trendDir === 'down' ? s.down : ''}`}>
          {trend}
        </span>
      )}
    </Comp>
  )
}
