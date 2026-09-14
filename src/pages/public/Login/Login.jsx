import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Warning, Key, CaretDown } from 'phosphor-react'
import AuthLayout from '../../../layouts/AuthLayout/AuthLayout'
import { useAuth } from '../../../contexts/AuthContext'
import FormField from '../../../components/FormField/FormField'
import Button from '../../../components/Button/Button'
import { Input } from '../../../components/Input/Input'
import s from './Login.module.css'

import { RUTA_POR_ROL } from '../../../constants/routes'

const CUENTAS_PRUEBA = [
  { rol: 'Aprendiz', email: 'maria.gonzalez@soy.sena.edu.co', password: '123456' },
  { rol: 'Instructor', email: 'carlos.ruiz@sena.edu.co', password: '123456' },
  { rol: 'Admin', email: 'admin@sena.edu.co', password: 'admin123' },
]

export default function Login() {
  const { user, login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [recordarme, setRecordarme] = useState(false)
  const [error, setError] = useState('')
  const [verCreds, setVerCreds] = useState(false)
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(RUTA_POR_ROL[user.rol] || '/', { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password) {
      setError('Ingresa tu correo y contraseña.')
      return
    }

    setCargando(true)
    const resultado = login(email, password, recordarme)
    setCargando(false)

    if (resultado.exito) {
      navigate(resultado.ruta, { replace: true })
    } else {
      setError(resultado.mensaje)
    }
  }

  function llenarCredenciales(cuenta) {
    setEmail(cuenta.email)
    setPassword(cuenta.password)
    setError('')
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
            <Input
              type="password"
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

        <section className={s.creds}>
          <button
            type="button"
            className={s.credsToggle}
            onClick={() => setVerCreds((v) => !v)}
            aria-expanded={verCreds}
          >
            <span><Key size={14} /> Credenciales de prueba</span>
            <CaretDown size={14} className={`${s.chevron} ${verCreds ? s.open : ''}`} />
          </button>
          {verCreds && (
            <ul className={s.credsList}>
              {CUENTAS_PRUEBA.map((c) => (
                <li key={c.email}>
                  <button type="button" className={s.credsItem} onClick={() => llenarCredenciales(c)}>
                    <span className={s.credsRol}>{c.rol}</span>
                    <span className={s.credsEmail}>{c.email}</span>
                    <span className={s.credsPass}>Contraseña: {c.password}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AuthLayout>
  )
}
