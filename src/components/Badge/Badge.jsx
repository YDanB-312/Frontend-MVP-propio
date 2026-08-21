import s from './Badge.module.css'

const VARIANTS = {
  success: s.success,
  warning: s.warning,
  danger: s.danger,
  info: s.info,
  neutral: s.neutral,
  primary: s.primary,
}

export default function Badge({ variant = 'neutral', children, className = '' }) {
  return <span className={`${s.badge} ${VARIANTS[variant] || s.neutral} ${className}`}>{children}</span>
}
