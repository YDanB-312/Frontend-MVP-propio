import { useId, useState } from 'react'
import Actions from '../Actions/Actions'
import s from './FilterBar.module.css'

// Barra de filtros plegable. `activeCount` resume cuántos filtros hay activos
// incluso con el panel cerrado (patrón de "drawer" de filtros).
export default function FilterBar({
  title = 'Filtros',
  children,
  actions,
  defaultOpen = true,
  activeCount = 0,
  chips = [],
  className = '',
}) {
  const [open, setOpen] = useState(defaultOpen)
  const contentId = useId()

  return (
    <section className={`${s.bar} ${className}`}>
      <button
        type="button"
        className={s.toggle}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={contentId}
      >
        <span className={s.icon} aria-hidden="true">⚙</span>
        <span className={s.title}>{title}</span>
        {activeCount > 0 && (
          <span className={s.badge} aria-label={`${activeCount} filtros activos`}>{activeCount}</span>
        )}
        <span className={`${s.chevron} ${open ? s.open : ''}`} aria-hidden="true">▾</span>
      </button>
      {activeCount > 0 && chips.length > 0 && (
        <ul className={s.chips} aria-label="Filtros activos">
          {chips.map((c) => (
            <li key={c} className={s.chip}>{c}</li>
          ))}
        </ul>
      )}
      <div id={contentId} className={s.content} hidden={!open}>
        <div className={s.filters}>{children}</div>
        {actions && <Actions className={s.actions}>{actions}</Actions>}
      </div>
    </section>
  )
}
