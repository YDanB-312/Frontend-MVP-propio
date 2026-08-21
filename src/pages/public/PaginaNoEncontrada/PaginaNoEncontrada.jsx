import { Link } from 'react-router-dom'
import LandingLayout from '../../../layouts/LandingLayout/LandingLayout'
import s from './PaginaNoEncontrada.module.css'

export default function PaginaNoEncontrada() {
  return (
    <LandingLayout>
      <main className={s.wrapper}>
        <div className={s.card}>
          <p className={s.code} aria-hidden="true">
            404
          </p>
          <h1 className={s.title}>Página no encontrada</h1>
          <p className={s.message}>
            Lo sentimos, la página que buscas no existe o fue movida. Verifica la dirección o vuelve al inicio.
          </p>
          <div className={s.actions}>
            <Link to="/" className={`${s.btn} ${s.primary}`}>
              Volver al inicio
            </Link>
            <Link to="/login" className={`${s.btn} ${s.secondary}`}>
              Iniciar sesión
            </Link>
          </div>
        </div>
      </main>
    </LandingLayout>
  )
}
