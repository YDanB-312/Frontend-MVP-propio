import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Warning } from 'phosphor-react'
import AuthLayout from '../../../layouts/AuthLayout/AuthLayout'
import { useAuth } from '../../../contexts/AuthContext'
import FormField from '../../../components/FormField/FormField'
import Button from '../../../components/Button/Button'
import { Input, PasswordInput } from '../../../components/Input/Input'
import s from './Login.module.css'

import { RUTA_POR_ROL } from '../../../constants/routes'

export default function Login() {
  const { user, login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [recordarme, setRecordarme] = useState(false)
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(RUTA_POR_ROL[user.rol] || '/', { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password) {
      setError('Ingresa tu correo y contraseña.')
      return
    }

    setCargando(true)
    try {
      const resultado = await login(email, password, recordarme)
      if (resultado.exito) {
        navigate(resultado.ruta, { replace: true })
      } else {
        setError(resultado.mensaje)
      }
    } catch {
      setError('No se pudo conectar con el servidor. Intenta de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <AuthLayout showBack>
      <div className={s.wrapper}>
        <header className={s.header}>
          <h1 className={s.title}>Bienvenido de nuevo</h1>
          <p className={s.subtitle}>Inicia sesión para acceder a tu espacio ProyecTwin</p>
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
              placeholder="tu.correo@ejemplo.com"
              autoComplete="email"
              autoFocus
            />
          </FormField>

          <FormField label="Contraseña" required>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </FormField>

          <div className={s.row}>
            <label className={s.check}>
              <input
                type="checkbox"
                checked={recordarme}
                onChange={(e) => setRecordarme(e.target.checked)}
              />
              <span>Recordarme</span>
            </label>
            <Link to="/recuperar-contrasena" className={s.link}>
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <Button type="submit" size="lg" fullWidth disabled={cargando}>
            {cargando ? 'Ingresando...' : 'Iniciar Sesión'}
          </Button>
        </form>

        <p className={s.footer}>
          ¿No tienes cuenta?{' '}
          <Link to="/register" className={s.link}>
            Crear cuenta
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
