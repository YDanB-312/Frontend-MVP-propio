import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Envelope, Warning, ArrowLeft } from 'phosphor-react'
import AuthLayout from '../../../layouts/AuthLayout/AuthLayout'
import FormField from '../../../components/FormField/FormField'
import Button from '../../../components/Button/Button'
import { Input } from '../../../components/Input/Input'
import s from './RecuperarContrasena.module.css'

export default function RecuperarContrasena() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [enviado, setEnviado] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Ingresa un correo electrónico válido.')
      return
    }

    setEnviado(true)
  }

  if (enviado) {
    return (
      <AuthLayout>
        <div className={s.wrapper}>
          <Envelope size={48} weight="light" className={s.successIcon} />
          <header className={s.header}>
            <h1 className={s.title}>Revisa tu correo</h1>
            <p className={s.subtitle}>
              Si <strong>{email.trim()}</strong> está registrado, te enviaremos un enlace para restablecer tu
              contraseña en los próximos minutos.
            </p>
          </header>
          <div className={s.actions}>
            <Button as="link" to="/login">
              Volver al login
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setEnviado(false)
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
    <AuthLayout>
      <div className={s.wrapper}>
        <header className={s.header}>
          <h1 className={s.title}>Recuperar contraseña</h1>
          <p className={s.subtitle}>
            Ingresa tu correo institucional y te enviaremos un enlace para restablecer tu contraseña.
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
              placeholder="nombre.correo@soy.sena.edu.co"
              autoComplete="email"
              autoFocus
            />
          </FormField>
          <Button type="submit" size="lg" fullWidth>
            Enviar enlace
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
