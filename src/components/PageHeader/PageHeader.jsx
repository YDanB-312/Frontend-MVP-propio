import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'phosphor-react'
import Actions from '../Actions/Actions'
import s from './PageHeader.module.css'

function CrumbIcon({ icon }) {
  if (!icon) return null
  return typeof icon === 'string' ? <span aria-hidden="true">{icon}</span> : icon
}

export default function PageHeader({ title, subtitle, icon, actions, breadcrumb = [], showBack = true, onBack }) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (typeof onBack === 'function') {
      onBack()
      return
    }
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      const parent = breadcrumb.find(c => c.to)
      if (parent) navigate(parent.to)
    }
  }

  return (
    <header className={s.header}>
      {breadcrumb.length > 0 && (
        <nav className={s.breadcrumbNav} aria-label="Breadcrumb">
          {showBack && (
            <button type="button" className={s.backBtn} onClick={handleBack} aria-label="Volver">
              <ArrowLeft size={16} weight="bold" />
            </button>
          )}
          <ol className={s.breadcrumb}>
            {breadcrumb.map((item, i) => {
              const isLast = i === breadcrumb.length - 1
              return (
                <li key={i} className={isLast ? s.current : undefined} aria-current={isLast ? 'page' : undefined}>
                  {item.onClick && !isLast ? (
                    <button type="button" className={s.crumb} onClick={item.onClick}>
                      <CrumbIcon icon={item.icon} />
                      {item.label}
                    </button>
                  ) : item.to && !isLast ? (
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
        {actions && <Actions className={s.actions}>{actions}</Actions>}
      </div>
    </header>
  )
}
