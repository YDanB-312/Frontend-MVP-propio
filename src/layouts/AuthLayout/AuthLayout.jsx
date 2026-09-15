import { Link } from 'react-router-dom'
import { ArrowLeft } from 'phosphor-react'
import s from './AuthLayout.module.css'

export default function AuthLayout({ children, showBack = false, wide = false, lateral = null }) {
  return (
    <div className={s.layout}>
      <div className={`${s.card} ${wide ? s.cardWide : ''}`}>
        {wide && lateral && (
          <aside className={s.lateral} aria-label="Información">
            {lateral}
          </aside>
        )}
        <div className={s.contenido}>
          {showBack && (
            <Link to="/" className={s.backBtn} aria-label="Volver al inicio">
              <ArrowLeft size={16} weight="bold" /> Inicio
            </Link>
          )}
          <img
            className={s.logo}
            src="/images/Logo-ProyecTwin.png"
            alt="ProyecTwin SENA"
          />
          {children}
        </div>
      </div>
    </div>
  )
}
