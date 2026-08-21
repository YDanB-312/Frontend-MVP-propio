import s from './MetricCard.module.css'

export default function MetricCard({ icon, label, value, trend, trendDir, variant = 'primary' }) {
  return (
    <div className={`${s.card} ${s[variant] || s.primary}`}>
      <div className={s.icono}>{icon}</div>
      <div className={s.content}>
        <span className={s.value}>{value}</span>
        <span className={s.label}>{label}</span>
      </div>
      {trend && (
        <span className={`${s.trend} ${trendDir === 'up' ? s.up : trendDir === 'down' ? s.down : ''}`}>
          {trend}
        </span>
      )}
    </div>
  )
}
