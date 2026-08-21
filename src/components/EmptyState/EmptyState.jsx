import s from './EmptyState.module.css'

export default function EmptyState({ icon = '📭', title, message, actionLabel, onAction, actionIcon, className = '' }) {
  return (
    <div className={`${s.empty} ${className}`}>
      {icon && <div className={s.icon} aria-hidden="true">{icon}</div>}
      {title && <h3 className={s.title}>{title}</h3>}
      {message && <p className={s.message}>{message}</p>}
      {actionLabel && onAction && (
        <button type="button" className={s.action} onClick={onAction}>
          {actionIcon && <span aria-hidden="true">{actionIcon}</span>}
          {actionLabel}
        </button>
      )}
    </div>
  )
}
