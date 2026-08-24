import s from './Tag.module.css'

const VARIANTS = {
  default: s.default,
  primary: s.primary,
  danger: s.danger,
  warning: s.warning,
  success: s.success,
  info: s.info,
  a: s.a,
  b: s.b,
}

export default function Tag({ variant = 'default', className = '', children, ...props }) {
  return (
    <span className={`${s.tag} ${VARIANTS[variant] || s.default} ${className}`} {...props}>
      {children}
    </span>
  )
}
