import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle, Warning } from 'phosphor-react'
import AuthLayout from '../../../layouts/AuthLayout/AuthLayout'
import FormField from '../../../components/FormField/FormField'
import Button from '../../../components/Button/Button'
import { Input, PasswordInput } from '../../../components/Input/Input'
import { apiResetPassword } from '../../../lib/api'
import { esPasswordValida } from '../../../utils/validation'
import s from './RestablecerContrasena.module.css'

export default function RestablecerContrasena() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const correo = searchParams.get('correo') || ''

  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [exito, setExito] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!esPasswordValida(password)) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (password !== confirmar) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setEnviando(true)
    try {
      await apiResetPassword({ correo, token, password, password_confirmation: confirmar })
      setExito(true)
    } catch (err) {
      setError(err?.data?.message || 'El enlace es inválido o venció. Solicita uno nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  // Sin token no hay nada que restablecer: el enlace vino mal o ya se usó.
  if (!token || !correo) {
    return (
      <AuthLayout>
        <div className={s.wrapper}>
          <Warning size={48} weight="light" className={s.successIcon} />
          <header className={s.header}>
            <h1 className={s.title}>Enlace inválido</h1>
            <p className={s.subtitle}>
              Este enlace no es válido o ya se usó. Solicita uno nuevo para restablecer tu contraseña.
            </p>
          </header>
          <div className={s.actions}>
            <Button as="link" to="/recuperar-contrasena">
              Solicitar un nuevo enlace
            </Button>
          </div>
        </div>
      </AuthLayout>
    )
  }

  if (exito) {
    return (
      <AuthLayout>
        <div className={s.wrapper}>
          <CheckCircle size={48} weight="light" className={s.successIcon} />
          <header className={s.header}>
            <h1 className={s.title}>Contraseña restablecida</h1>
            <p className={s.subtitle}>
              Tu contraseña se actualizó correctamente. Ya puedes iniciar sesión con tus nuevas credenciales.
            </p>
          </header>
          <div className={s.actions}>
            <Button as="link" to="/login">
              Ir al login
            </Button>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className={s.wrapper}>
        <header className={s.header}>
          <h1 className={s.title}>Restablecer contraseña</h1>
          <p className={s.subtitle}>Crea una nueva contraseña para tu cuenta.</p>
        </header>

        <form className={s.form} onSubmit={handleSubmit} noValidate>
          {error && (
            <p className={s.error} role="alert">
              <Warning size={16} weight="fill" /> {error}
            </p>
          )}

          <FormField label="Correo electrónico">
            <Input type="email" value={correo} readOnly />
          </FormField>

          <FormField label="Nueva contraseña" help="Mínimo 6 caracteres" required>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </FormField>

          <FormField label="Confirmar nueva contraseña" required>
            <PasswordInput
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </FormField>

          <Button type="submit" size="lg" fullWidth disabled={enviando}>
            {enviando ? 'Guardando…' : 'Restablecer contraseña'}
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
