import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { IdentificationCard, Warning, ArrowLeft } from 'phosphor-react'
import AuthLayout from '../../../layouts/AuthLayout/AuthLayout'
import { useAuth } from '../../../contexts/AuthContext'
import FormField from '../../../components/FormField/FormField'
import Button from '../../../components/Button/Button'
import { Input, PasswordInput, Select } from '../../../components/Input/Input'
import { apiValidarPadron } from '../../../lib/api'
import s from './Register.module.css'
import { esEmailValido } from '../../../utils/validation'

const TIPOS_DOCUMENTO = [
  { valor: 'CC', texto: 'Cédula de ciudadanía' },
  { valor: 'TI', texto: 'Tarjeta de identidad' },
  { valor: 'CE', texto: 'Cédula de extranjería' },
  { valor: 'PA', texto: 'Pasaporte' },
]

const ROL_LABEL = { aprendiz: 'Aprendiz', instructor: 'Instructor', admin: 'Administrador' }

// Registro institucional en dos pasos: (1) validar la identidad contra el
// padrón del SENA — como el "Validar" de SOFIA Plus — y (2) definir la clave.
// El rol y la ficha los asigna el padrón, nunca el formulario.
export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [paso, setPaso] = useState(1)
  const [identidad, setIdentidad] = useState({ tipo_documento: 'CC', numero_documento: '', correo: '' })
  const [persona, setPersona] = useState(null)
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [error, setError] = useState('')
  const [errores, setErrores] = useState({})
  const [cargando, setCargando] = useState(false)

  function setIdent(campo, valor) {
    setIdentidad((i) => ({ ...i, [campo]: valor }))
    setErrores((e) => ({ ...e, [campo]: undefined }))
  }

  async function validarIdentidad(e) {
    e.preventDefault()
    setError('')

    const errs = {}
    if (!/^\d{6,11}$/.test(identidad.numero_documento.trim())) {
      errs.numero_documento = 'Ingresa tu número de documento (6 a 11 dígitos).'
    }
    if (!esEmailValido(identidad.correo.trim())) errs.correo = 'Ingresa un correo electrónico válido.'
    setErrores(errs)
    if (Object.keys(errs).length > 0) return

    setCargando(true)
    try {
      const datos = await apiValidarPadron({
        tipo_documento: identidad.tipo_documento,
        numero_documento: identidad.numero_documento.trim(),
        correo: identidad.correo.trim().toLowerCase(),
      })
      setPersona({ nombre: datos.nombre, apellido: datos.apellido, rol: datos.rol })
      setPaso(2)
    } catch (err) {
      setError(err?.data?.message || 'No pudimos validar tus datos con la matrícula del SENA.')
    } finally {
      setCargando(false)
    }
  }

  async function crearCuenta(e) {
    e.preventDefault()
    setError('')

    const errs = {}
    if (password.length < 8) errs.password = 'La contraseña debe tener al menos 8 caracteres.'
    if (confirmar !== password) errs.confirmar = 'Las contraseñas no coinciden.'
    setErrores(errs)
    if (Object.keys(errs).length > 0) return

    setCargando(true)
    try {
      const res = await register({
        tipo_documento: identidad.tipo_documento,
        numero_documento: identidad.numero_documento,
        correo: identidad.correo,
        password,
      })
      if (res.exito) {
        navigate('/confirmacion', { state: { correo: res.correo, codigo: res.codigo } })
      } else {
        setError(res.mensaje)
        if (res.errores) setErrores(res.errores)
      }
    } finally {
      setCargando(false)
    }
  }

  return (
    <AuthLayout showBack>
      <div className={s.wrapper}>
        <header className={s.header}>
          <h1 className={s.title}>Crear cuenta</h1>
          <p className={s.subtitle}>
            {paso === 1
              ? 'Valida tu identidad con los datos de tu matrícula en el SENA.'
              : 'Tu identidad está verificada. Define tu contraseña de acceso.'}
          </p>
        </header>

        {error && (
          <p className={s.error} role="alert">
            <Warning size={16} weight="fill" /> {error}
          </p>
        )}

        {paso === 1 ? (
          <form className={s.form} onSubmit={validarIdentidad} noValidate>
            <div className={s.grid2}>
              <FormField label="Tipo de documento" required>
                <Select
                  value={identidad.tipo_documento}
                  onChange={(e) => setIdent('tipo_documento', e.target.value)}
                >
                  {TIPOS_DOCUMENTO.map((t) => (
                    <option key={t.valor} value={t.valor}>{t.texto}</option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Número de documento" error={errores.numero_documento} required>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={identidad.numero_documento}
                  onChange={(e) => setIdent('numero_documento', e.target.value.replace(/\D/g, '').slice(0, 11))}
                  placeholder="Ej. 1012345678"
                  autoComplete="off"
                  autoFocus
                />
              </FormField>
            </div>

            <FormField
              label="Correo institucional"
              error={errores.correo}
              help="El mismo correo de tu matrícula (@soy.sena.edu.co o @sena.edu.co)."
              required
            >
              <Input
                type="email"
                value={identidad.correo}
                onChange={(e) => setIdent('correo', e.target.value)}
                placeholder="nombre.apellido@soy.sena.edu.co"
                autoComplete="email"
              />
            </FormField>

            <Button type="submit" size="lg" fullWidth disabled={cargando}>
              {cargando ? 'Validando…' : 'Validar mis datos'}
            </Button>
          </form>
        ) : (
          <form className={s.form} onSubmit={crearCuenta} noValidate>
            <div className={s.persona} aria-live="polite">
              <IdentificationCard size={22} aria-hidden="true" />
              <div>
                <p className={s.personaNombre}>{persona.nombre} {persona.apellido}</p>
                <p className={s.personaMeta}>
                  {ROL_LABEL[persona.rol] || persona.rol} · {identidad.correo.trim().toLowerCase()}
                </p>
              </div>
            </div>

            <div className={s.grid2}>
              <FormField label="Contraseña" error={errores.password} help="Mínimo 8 caracteres" required>
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </FormField>
              <FormField label="Confirmar contraseña" error={errores.confirmar} required>
                <PasswordInput
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </FormField>
            </div>

            <Button type="submit" size="lg" fullWidth disabled={cargando}>
              {cargando ? 'Creando cuenta…' : 'Crear cuenta'}
            </Button>
            <Button type="button" variant="secondary" fullWidth onClick={() => setPaso(1)} disabled={cargando}>
              <ArrowLeft size={16} /> Volver a validar
            </Button>
          </form>
        )}

        <p className={s.footer}>
          ¿Ya tienes una cuenta?{' '}
          <Link to="/login" className={s.link}>
            Inicia sesión
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
