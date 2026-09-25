import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Envelope, Warning } from 'phosphor-react'
import AuthLayout from '../../../layouts/AuthLayout/AuthLayout'
import FormField from '../../../components/FormField/FormField'
import Button from '../../../components/Button/Button'
import { Input } from '../../../components/Input/Input'
import { apiForgotPassword } from '../../../lib/api'
import { esEmailValido } from '../../../utils/validation'
import s from './RecuperarContrasena.module.css'
import lateral from '../../../layouts/AuthLayout/AuthLayout.module.css'

const PASOS_LATERAL = ['Escribe tu correo registrado', 'Abre el enlace que te enviamos', 'Crea tu nueva clave']

function LateralRecuperar() {
  return (
    <>
      <p className={lateral.lateralTitulo}>Recupera tu acceso</p>
      <p className={lateral.lateralTexto}>
        Te enviamos un enlace con vigencia limitada para que restablezcas tu contraseña sin ayuda.
      </p>
      <ol className={lateral.pasos}>
        {PASOS_LATERAL.map((texto, i) => (
          <li key={texto} className={lateral.paso}>
            <span className={lateral.pasoNum} aria-hidden="true">{i + 1}</span>
            <span className={lateral.pasoTexto}>{texto}</span>
          </li>
        ))}
      </ol>
    </>
  )
}

export default function RecuperarContrasena() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(null) // { resetUrl }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!esEmailValido(email.trim())) {
      setError('Ingresa un correo electrónico válido.')
      return
    }

    setEnviando(true)
    try {
      const res = await apiForgotPassword(email.trim().toLowerCase())
      setEnviado({ resetUrl: res?.reset_url || null })
    } catch {
      setError('No se pudo procesar la solicitud. Intenta de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  if (enviado) {
    return (
      <AuthLayout wide lateral={<LateralRecuperar />}>
        <div className={s.wrapper}>
          <Envelope size={48} weight="light" className={s.successIcon} />
          <header className={s.header}>
            <h1 className={s.title}>Revisa tu correo</h1>
            <p className={s.subtitle}>
              Si <strong>{email.trim()}</strong> está registrado, te enviamos un enlace para restablecer tu
              contraseña. El enlace vence en 60 minutos.
            </p>
          </header>

          {/* En local no hay servidor de correo: se muestra el enlace para probar. */}
          {enviado.resetUrl && (
            <p className={s.subtitle}>
              <strong>Modo local:</strong>{' '}
              <a className={s.link} href={enviado.resetUrl}>abrir enlace de restablecimiento</a>
            </p>
          )}

          <div className={s.actions}>
            <Button as="link" to="/login">
              Volver al login
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setEnviado(null)
                setEmail('')
              }}
            >
              Usar otro correo
            </Button>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout wide lateral={<LateralRecuperar />}>
      <div className={s.wrapper}>
        <header className={s.header}>
          <h1 className={s.title}>Recuperar contraseña</h1>
          <p className={s.subtitle}>
            Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
          </p>
        </header>

        <form className={s.form} onSubmit={handleSubmit} noValidate>
          {error && (
            <p className={s.error} role="alert">
              <Warning size={16} weight="fill" /> {error}
            </p>
          )}
          <FormField label="Correo electrónico" required>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Correo electrónico"
              autoComplete="email"
              autoFocus
            />
          </FormField>
          <Button type="submit" size="lg" fullWidth disabled={enviando}>
            {enviando ? 'Enviando…' : 'Enviar enlace'}
          </Button>
        </form>

        <p className={s.footer}>
          <Link to="/login" className={s.link}>
            <ArrowLeft size={16} /> Volver al login
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
