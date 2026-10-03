import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Key, Warning } from 'phosphor-react'
import AuthLayout from '../../../layouts/AuthLayout/AuthLayout'
import { useAuth } from '../../../contexts/AuthContext'
import FormField from '../../../components/FormField/FormField'
import Button from '../../../components/Button/Button'
import { PasswordInput } from '../../../components/Input/Input'
import { RUTA_POR_ROL } from '../../../constants/routes'
import { esPasswordValida } from '../../../utils/validation'
import s from './CambioObligatorio.module.css'

// Primer ingreso: la contraseña temporal debe reemplazarse antes de usar el
// sistema (el backend bloquea el resto de la API hasta el cambio).
export default function CambioObligatorio() {
  const { user, cambiarMiContrasena } = useAuth()
  const navigate = useNavigate()
  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!actual || !nueva || !confirmar) {
      setError('Completa todos los campos.')
      return
    }
    if (!esPasswordValida(nueva)) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (nueva !== confirmar) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setCargando(true)
    const res = await cambiarMiContrasena(actual, nueva)
    setCargando(false)
    if (!res.exito) {
      setError(res.mensaje)
      return
    }
    navigate(RUTA_POR_ROL[user?.rol] || '/', { replace: true })
  }

  return (
    <AuthLayout showBack>
      <div className={s.wrapper}>
        <header className={s.header}>
          <h1 className={s.title}>Cambia tu contraseña</h1>
          <p className={s.subtitle}>
            Entraste con una contraseña temporal. Define una nueva para continuar.
          </p>
        </header>

        <form className={s.form} onSubmit={handleSubmit} noValidate>
          {error && (
            <p className={s.error} role="alert">
              <Warning size={16} weight="fill" /> {error}
            </p>
          )}

          <FormField label="Contraseña temporal" required help="La que te entregó el administrador.">
            <PasswordInput
              value={actual}
              onChange={(e) => setActual(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              autoFocus
            />
          </FormField>

          <FormField label="Nueva contraseña" required help="Mínimo 6 caracteres.">
            <PasswordInput
              value={nueva}
              onChange={(e) => setNueva(e.target.value)}
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

          <Button type="submit" size="lg" fullWidth disabled={cargando}>
            <Key size={16} /> {cargando ? 'Guardando...' : 'Establecer contraseña'}
          </Button>
        </form>
      </div>
    </AuthLayout>
  )
}
