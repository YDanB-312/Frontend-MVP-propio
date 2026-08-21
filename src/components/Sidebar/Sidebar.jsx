import { NavLink } from 'react-router-dom'
import s from './Sidebar.module.css'

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

export default function Sidebar({ isOpen = false, onClose, role = '', links = [] }) {
  return (
    <>
      {isOpen && <div className={s.overlay} onClick={onClose} aria-hidden="true" />}

      <aside className={`${s.sidebar} ${isOpen ? s.isOpen : ''}`} aria-label={`Navegación principal (${role})`}>
        <button type="button" className={s.closeBtn} onClick={onClose} aria-label="Cerrar menú">
          <CloseIcon />
        </button>

        <nav className={s.menu}>
          {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end
              onClick={onClose}
              className={({ isActive }) => (isActive ? `${s.link} ${s.linkActive}` : s.link)}
            >
              <span className={s.icon}>{link.icon}</span>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}
