import s from './DataPanel.module.css'

export default function DataPanel({ title, icon, action, children, className = '' }) {
  return (
    <section className={`${s.panel} ${className}`}>
      {(title || action) && (
        <header className={s.header}>
          <div className={s.titleWrap}>
            {icon && <span className={s.icon} aria-hidden="true">{icon}</span>}
            {title && <h2 className={s.title}>{title}</h2>}
          </div>
          {action && <div className={s.action}>{action}</div>}
        </header>
      )}
      <div className={s.body}>{children}</div>
    </section>
  )
}
