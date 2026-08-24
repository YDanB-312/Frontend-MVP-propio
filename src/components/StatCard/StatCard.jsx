import s from './StatCard.module.css'

export default function StatCard({ value, label, centered, className = '', children, ...props }) {
  return (
    <div className={`${s.card} ${centered ? s.centered : ''} ${className}`} {...props}>
      {value !== undefined && <span className={s.value}>{value}</span>}
      {label && <span className={s.label}>{label}</span>}
      {children}
    </div>
  )
}
