import { Link } from 'react-router-dom'
import Button from '../Button/Button'
import s from './LandingHeader.module.css'

export default function LandingHeader() {
  return (
    <header className={s.header}>
      <div className={s.container}>
        <Link to="/" viewTransition className={s.logo} aria-label="ProyecTwin SENA">
          <img src="/images/Logo-ProyecTwin.png" alt="ProyecTwin SENA" />
        </Link>

        <div className={s.right}>
          <span className={s.senaWrap}>
            <img className={s.senaLogo} src="/images/logo-sena-blanco.png" alt="SENA" />
          </span>
          <Button as="link" to="/login" variant="ghost" viewTransition>Iniciar Sesión</Button>
          <Button as="link" to="/register" viewTransition>Crear Cuenta</Button>
        </div>
      </div>
    </header>
  )
}
