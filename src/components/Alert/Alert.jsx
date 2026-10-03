import s from './Alert.module.css'

const VARIANTS = {
  success: s.success,
  danger: s.danger,
  warning: s.warning,
  info: s.info,
}

export default function Alert({ variant = 'success', className = '', children, ...props }) {
  return (
    <div className={`${s.alert} ${VARIANTS[variant] || s.success} ${className}`} role="status" {...props}>
      {children}
    </div>
  )
}
