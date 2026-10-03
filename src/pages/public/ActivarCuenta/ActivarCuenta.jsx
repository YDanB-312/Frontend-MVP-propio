import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Warning, ArrowLeft, CheckCircle } from 'phosphor-react'
import AuthLayout from '../../../layouts/AuthLayout/AuthLayout'
import { useAuth } from '../../../contexts/AuthContext'
import FormField from '../../../components/FormField/FormField'
import Button from '../../../components/Button/Button'
import { Input } from '../../../components/Input/Input'
import { esEmailValido } from '../../../utils/validation'
import s from './ActivarCuenta.module.css'

// Activación de la cuenta recién registrada con el código de un solo uso.
export default function ActivarCuenta() {
  const { activarCuenta } = useAuth()
  const location = useLocation()
  const [correo, setCorreo] = useState(location.state?.correo || '')
  const [codigo, setCodigo] = useState(location.state?.codigo || '')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [listo, setListo] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!esEmailValido(correo.trim())) {
      setError('Ingresa tu correo institucional.')
      return
    }
    if (!/^\d{6}$/.test(codigo.trim())) {
      setError('El código de activación son 6 dígitos.')
      return
    }

    setCargando(true)
    try {
      const res = await activarCuenta(correo, codigo)
      if (res.exito) setListo(true)
      else setError(res.mensaje)
    } finally {
      setCargando(false)
    }
  }

  if (listo) {
    return (
      <AuthLayout>
        <div className={s.wrapper}>
          <CheckCircle size={48} weight="light" className={s.successIcon} aria-hidden="true" />
          <header className={s.header}>
            <h1 className={s.title}>Cuenta activada</h1>
            <p className={s.subtitle}>
              Ya puedes iniciar sesión con <strong>{correo.trim().toLowerCase()}</strong>.
            </p>
          </header>
          <div className={s.actions}>
            <Button as="link" to="/login">Ir al login</Button>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout showBack>
      <div className={s.wrapper}>
        <header className={s.header}>
          <h1 className={s.title}>Activar cuenta</h1>
          <p className={s.subtitle}>
            Ingresa el código de 6 dígitos que recibiste al registrarte. Es de un solo uso.
          </p>
        </header>

        <form className={s.form} onSubmit={handleSubmit} noValidate>
          {error && (
            <p className={s.error} role="alert">
              <Warning size={16} weight="fill" /> {error}
            </p>
          )}

          <FormField label="Correo institucional" required>
            <Input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="nombre.apellido@soy.sena.edu.co"
              autoComplete="email"
            />
          </FormField>

          <FormField label="Código de activación" help="6 dígitos, un solo uso" required>
            <Input
              type="text"
              inputMode="numeric"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              autoComplete="one-time-code"
              autoFocus
            />
          </FormField>

          <Button type="submit" size="lg" fullWidth disabled={cargando}>
            {cargando ? 'Activando…' : 'Activar cuenta'}
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
