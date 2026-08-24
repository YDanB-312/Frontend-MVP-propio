import { useState } from 'react'
import Actions from '../Actions/Actions'
import s from './FilterBar.module.css'

export default function FilterBar({ title = 'Filtros', children, actions, defaultOpen = true, className = '' }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section className={`${s.bar} ${className}`}>
      <button
        type="button"
        className={s.toggle}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="filterbar-content"
      >
        <span className={s.icon} aria-hidden="true">⚙</span>
        <span className={s.title}>{title}</span>
        <span className={`${s.chevron} ${open ? s.open : ''}`} aria-hidden="true">▾</span>
      </button>
      {open && (
        <div id="filterbar-content" className={s.content}>
          <div className={s.filters}>{children}</div>
          {actions && <Actions className={s.actions}>{actions}</Actions>}
        </div>
      )}
    </section>
  )
}
