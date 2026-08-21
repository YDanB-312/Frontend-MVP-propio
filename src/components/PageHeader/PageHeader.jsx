import { Link } from 'react-router-dom'
import s from './PageHeader.module.css'

function CrumbIcon({ icon }) {
  if (!icon) return null
  return typeof icon === 'string' ? <span aria-hidden="true">{icon}</span> : icon
}

export default function PageHeader({ title, subtitle, icon, actions, breadcrumb = [] }) {
  return (
    <header className={s.header}>
      {breadcrumb.length > 0 && (
        <nav aria-label="Breadcrumb">
          <ol className={s.breadcrumb}>
            {breadcrumb.map((item, i) => {
              const isLast = i === breadcrumb.length - 1
              return (
                <li key={i} className={isLast ? s.current : undefined} aria-current={isLast ? 'page' : undefined}>
                  {item.to && !isLast ? (
                    <Link to={item.to} className={s.crumb}>
                      <CrumbIcon icon={item.icon} />
                      {item.label}
                    </Link>
                  ) : (
                    <span className={s.crumb}>
                      <CrumbIcon icon={item.icon} />
                      {item.label}
                    </span>
                  )}
                  {!isLast && <span className={s.sep} aria-hidden="true">/</span>}
                </li>
              )
            })}
          </ol>
        </nav>
      )}
      <div className={s.row}>
        <div className={s.titleWrap}>
          {icon && (
            <span className={s.icon} aria-hidden="true">
              {typeof icon === 'string' ? icon : icon}
            </span>
          )}
          <div>
            <h1 className={s.title}>{title}</h1>
            {subtitle && <p className={s.subtitle}>{subtitle}</p>}
          </div>
        </div>
        {actions && <div className={s.actions}>{actions}</div>}
      </div>
    </header>
  )
}
