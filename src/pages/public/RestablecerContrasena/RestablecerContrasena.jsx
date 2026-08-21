import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle, Warning, ArrowLeft } from 'phosphor-react'
import AuthLayout from '../../../layouts/AuthLayout/AuthLayout'
import { useAuth } from '../../../contexts/AuthContext'
import FormField from '../../../components/FormField/FormField'
import s from './RestablecerContrasena.module.css'

export default function RestablecerContrasena() {
  const { cambiarContrasena } = useAuth()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Ingresa un correo electrónico válido.')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (password !== confirmar) {
      setError('Las contraseñas no coinciden.')
      return
    }

    const actualizada = cambiarContrasena(email, password)
    if (!actualizada) {
      setError('No encontramos una cuenta registrada con ese correo.')
      return
    }
    setExito(true)
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
            <Link to="/login" className={`${s.btn} ${s.primary}`}>
              Ir al login
            </Link>
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

          <FormField label="Correo electrónico" required>
            <input
              type="email"
              className={s.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre.correo@soy.sena.edu.co"
              autoComplete="email"
            />
          </FormField>

          <FormField label="Nueva contraseña" help="Mínimo 6 caracteres" required>
            <input
              type="password"
              className={s.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </FormField>

          <FormField label="Confirmar nueva contraseña" required>
            <input
              type="password"
              className={s.input}
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </FormField>

          <button type="submit" className={`${s.btn} ${s.primary}`}>
            Restablecer contraseña
          </button>
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
