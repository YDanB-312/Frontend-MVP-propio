import { Link, useLocation } from 'react-router-dom'
import { ArrowLeft } from 'phosphor-react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import s from './AuthLayout.module.css'

// Título de pestaña para las vistas de autenticación (comparten este layout).
const TITULOS = {
  '/login': 'Iniciar sesión',
  '/register': 'Crear cuenta',
  '/recuperar-contrasena': 'Recuperar contraseña',
  '/restablecer-contrasena': 'Restablecer contraseña',
  '/confirmacion': 'Cuenta creada',
  '/activar-cuenta': 'Activar cuenta',
  '/cambiar-contrasena': 'Cambiar contraseña',
}

export default function AuthLayout({ children, showBack = false, wide = false, lateral = null }) {
  const { pathname } = useLocation()
  useDocumentTitle(TITULOS[pathname])

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
