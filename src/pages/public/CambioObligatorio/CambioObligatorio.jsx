import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Warning, Key } from 'phosphor-react'
import AuthLayout from '../../../layouts/AuthLayout/AuthLayout'
import { useAuth } from '../../../contexts/AuthContext'
import FormField from '../../../components/FormField/FormField'
import Button from '../../../components/Button/Button'
import { PasswordInput } from '../../../components/Input/Input'
import { RUTA_POR_ROL } from '../../../constants/routes'
import { esPasswordValida } from '../../../utils/validation'
import s from './CambioObligatorio.module.css'

// Cuentas creadas o reiniciadas por el admin nacen con una clave temporal:
// aquí se cambia antes de entrar al resto de la aplicación.
export default function CambioObligatorio() {
  const { user, cambiarMiContrasena, marcarPasswordCambiada } = useAuth()
  const navigate = useNavigate()
  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!actual) {
      setError('Ingresa tu contraseña temporal actual.')
      return
    }
    if (!esPasswordValida(nueva)) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (nueva !== confirmar) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setCargando(true)
    try {
      const res = await cambiarMiContrasena(actual, nueva)
      if (res.exito) {
        marcarPasswordCambiada()
        navigate(RUTA_POR_ROL[user?.rol] || '/', { replace: true })
      } else {
        setError(res.mensaje)
      }
    } finally {
      setCargando(false)
    }
  }

  return (
    <AuthLayout>
      <div className={s.wrapper}>
        <span className={s.icono} aria-hidden="true"><Key size={32} weight="light" /></span>
        <header className={s.header}>
          <h1 className={s.title}>Cambia tu contraseña temporal</h1>
          <p className={s.subtitle}>
            Tu cuenta fue creada por un administrador. Define una contraseña propia antes de continuar.
          </p>
        </header>

        <form className={s.form} onSubmit={handleSubmit} noValidate>
          {error && (
            <p className={s.error} role="alert">
              <Warning size={16} weight="fill" /> {error}
            </p>
          )}

          <FormField label="Contraseña actual" help="La que te entregó el administrador" required>
            <PasswordInput
              value={actual}
              onChange={(e) => setActual(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </FormField>

          <FormField label="Nueva contraseña" help="Mínimo 8 caracteres" required>
            <PasswordInput
              value={nueva}
              onChange={(e) => setNueva(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </FormField>

          <FormField label="Confirmar contraseña" required>
            <PasswordInput
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </FormField>

          <Button type="submit" size="lg" fullWidth disabled={cargando}>
            {cargando ? 'Actualizando…' : 'Actualizar contraseña'}
          </Button>
        </form>
      </div>
    </AuthLayout>
  )
}
