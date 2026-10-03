import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { CheckCircle, ArrowLeft, Copy, Check } from 'phosphor-react'
import AuthLayout from '../../../layouts/AuthLayout/AuthLayout'
import Button from '../../../components/Button/Button'
import s from './Confirmacion.module.css'

// Cierre del registro: la cuenta existe pero está pendiente de activación.
// En local/demo el código llega en el state; en producción viaja por correo.
export default function Confirmacion() {
  const location = useLocation()
  const correo = location.state?.correo
  const codigo = location.state?.codigo
  const [copiado, setCopiado] = useState(false)

  async function copiar() {
    try {
      await navigator.clipboard.writeText(codigo)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      /* el usuario puede copiarlo a mano */
    }
  }

  return (
    <AuthLayout>
      <div className={s.wrapper}>
        <div className={s.iconWrap} aria-hidden="true">
          <CheckCircle size={48} weight="light" className={s.icon} />
        </div>
        <header className={s.header}>
          <h1 className={s.title}>¡Cuenta creada!</h1>
          {codigo ? (
            <p className={s.subtitle}>
              Guarda tu código de activación{codigo && correo ? <> de <strong>{correo}</strong></> : null}. Es de
              un solo uso y vence en 72 horas.
            </p>
          ) : (
            <p className={s.subtitle}>
              {correo ? (
                <>Enviamos el código de activación a <strong>{correo}</strong>.</>
              ) : (
                'Revisa tu correo para activar la cuenta.'
              )}
            </p>
          )}
        </header>

        {codigo && (
          <div className={s.codigoCaja}>
            <p className={s.codigoLabel}>Código de activación</p>
            <p className={s.codigo} aria-label={`Código de activación ${codigo}`}>{codigo}</p>
            <Button type="button" variant="secondary" size="sm" onClick={copiar}>
              {copiado ? <><Check size={14} /> Copiado</> : <><Copy size={14} /> Copiar código</>}
            </Button>
          </div>
        )}

        <div className={s.actions}>
          <Button as="link" to="/activar-cuenta" state={{ correo, codigo }}>
            Activar mi cuenta
          </Button>
          <Button as="link" to="/login" variant="secondary">
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
