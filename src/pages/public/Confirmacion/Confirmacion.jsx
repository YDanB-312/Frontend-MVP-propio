import { Link, useLocation } from 'react-router-dom'
import { CheckCircle, ArrowLeft } from 'phosphor-react'
import AuthLayout from '../../../layouts/AuthLayout/AuthLayout'
import Button from '../../../components/Button/Button'
import s from './Confirmacion.module.css'

export default function Confirmacion() {
  const location = useLocation()
  const correo = location.state?.correo

  return (
    <AuthLayout>
      <div className={s.wrapper}>
        <div className={s.iconWrap} aria-hidden="true">
          <CheckCircle size={48} weight="light" className={s.icon} />
        </div>
        <header className={s.header}>
          <h1 className={s.title}>¡Cuenta creada con éxito!</h1>
          <p className={s.subtitle}>
            {correo ? (
              <>
                Enviamos un correo de confirmación a <strong>{correo}</strong>. Verifica tu bandeja de entrada para
                activar tu cuenta.
              </>
            ) : (
              'Tu cuenta fue registrada correctamente. Verifica tu bandeja de entrada para activarla.'
            )}
          </p>
        </header>
        <div className={s.actions}>
          <Button as="link" to="/login">
            Ir al login
          </Button>
        </div>
        <p className={s.footer}>
          <Link to="/" className={s.link}>
            <ArrowLeft size={16} /> Volver al inicio
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
