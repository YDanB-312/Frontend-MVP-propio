import s from './DataPanel.module.css'

export default function DataPanel({ title, subtitle, icon, action, glow = false, children, className = '' }) {
  return (
    <section className={`${s.panel} ${glow ? s.glow : ''} ${className}`}>
      {(title || subtitle || action) && (
        <header className={s.header}>
          <div className={s.titleWrap}>
            {icon && <span className={s.icon} aria-hidden="true">{icon}</span>}
            <div className={s.titles}>
              {title && <h2 className={s.title}>{title}</h2>}
              {subtitle && <p className={s.subtitle}>{subtitle}</p>}
            </div>
          </div>
          {action && <div className={s.action}>{action}</div>}
        </header>
      )}
      <div className={s.body}>{children}</div>
    </section>
  )
}
