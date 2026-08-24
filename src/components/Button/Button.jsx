import { Link } from 'react-router-dom'
import s from './Button.module.css'

const SIZES = { sm: s.sm, md: s.md, lg: s.lg }
const VARIANTS = {
  primary: s.primary,
  secondary: s.secondary,
  ghost: s.ghost,
  danger: s.danger,
  dangerGhost: s.dangerGhost,
  success: s.success,
  warning: s.warning,
  info: s.info,
}

export default function Button({
  as = 'button',
  size = 'md',
  variant = 'primary',
  fullWidth = false,
  className = '',
  children,
  ...props
}) {
  const Comp = as === 'link' ? Link : as
  return (
    <Comp
      className={`${s.btn} ${SIZES[size] || s.md} ${fullWidth ? s.full : ''} ${VARIANTS[variant] || s.primary} ${className}`}
      {...props}
    >
      {children}
    </Comp>
  )
}
