import s from './Alert.module.css'

const VARIANTS = {
  success: s.success,
  danger: s.danger,
  warning: s.warning,
  info: s.info,
}

export default function Alert({ variant = 'success', className = '', children, ...props }) {
  // Los errores se anuncian de inmediato; el resto, de forma cortés.
  const role = variant === 'danger' ? 'alert' : 'status'

  return (
    <div className={`${s.alert} ${VARIANTS[variant] || s.success} ${className}`} role={role} {...props}>
      {children}
    </div>
  )
}
