import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GraduationCap, ChalkboardTeacher } from 'phosphor-react'
import AuthLayout from '../../../layouts/AuthLayout/AuthLayout'
import { useAuth } from '../../../contexts/AuthContext'
import FormField from '../../../components/FormField/FormField'
import Button from '../../../components/Button/Button'
import { Input, PasswordInput } from '../../../components/Input/Input'
import s from './Register.module.css'
import { esEmailValido, esPasswordValida } from '../../../utils/validation'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ nombre: '', apellido: '', correo: '', password: '', confirmar: '' })
  const [rol, setRol] = useState('aprendiz')
  const [errors, setErrors] = useState({})
  const [cargando, setCargando] = useState(false)

  function set(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }))
    setErrors((e) => ({ ...e, [campo]: undefined }))
  }

  function validar() {
    const errs = {}
    if (form.nombre.trim().length < 2) errs.nombre = 'Ingresa tus nombres.'
    if (form.apellido.trim().length < 2) errs.apellido = 'Ingresa tus apellidos.'
    if (!esEmailValido(form.correo.trim())) {
      errs.correo = 'Ingresa un correo electrónico válido.'
    }
    if (!esPasswordValida(form.password)) errs.password = 'La contraseña debe tener al menos 6 caracteres.'
    if (form.confirmar !== form.password) errs.confirmar = 'Las contraseñas no coinciden.'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validar()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setCargando(true)
    try {
      const res = await register({
        nombre: form.nombre,
        apellido: form.apellido,
        correo: form.correo,
        password: form.password,
        rol,
      })
      if (res.exito) {
        navigate('/confirmacion', { state: { correo: form.correo.trim().toLowerCase() } })
      } else {
        setErrors({ correo: res.mensaje })
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
          <p className={s.subtitle}>Regístrate con tu correo electrónico</p>
        </header>

        <form className={s.form} onSubmit={handleSubmit} noValidate>
          <div className={s.grid2}>
            <FormField label="Nombres" error={errors.nombre} required>
              <Input
                type="text"
                value={form.nombre}
                onChange={(e) => set('nombre', e.target.value)}
                placeholder="María José"
                autoComplete="given-name"
                autoFocus
              />
            </FormField>
            <FormField label="Apellidos" error={errors.apellido} required>
              <Input
                type="text"
                value={form.apellido}
                onChange={(e) => set('apellido', e.target.value)}
                placeholder="González Ruiz"
                autoComplete="family-name"
              />
            </FormField>
          </div>

          <FormField label="Correo electrónico" error={errors.correo} required>
            <Input
              type="email"
              value={form.correo}
              onChange={(e) => set('correo', e.target.value)}
              placeholder="Correo electrónico"
              autoComplete="email"
            />
          </FormField>

          <div className={s.grid2}>
            <FormField label="Contraseña" error={errors.password} help="Mínimo 6 caracteres" required>
              <PasswordInput
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </FormField>
            <FormField label="Confirmar contraseña" error={errors.confirmar} required>
              <PasswordInput
                value={form.confirmar}
                onChange={(e) => set('confirmar', e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </FormField>
          </div>

          <fieldset className={s.roleGroup}>
            <legend className={s.roleLegend}>Tipo de cuenta *</legend>
            <div className={s.roleOptions} role="radiogroup" aria-label="Tipo de cuenta">
              <button
                type="button"
                role="radio"
                aria-checked={rol === 'aprendiz'}
                className={`${s.roleOption} ${rol === 'aprendiz' ? s.roleActive : ''}`}
                onClick={() => setRol('aprendiz')}
              >
                <GraduationCap size={16} /> Aprendiz
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={rol === 'instructor'}
                className={`${s.roleOption} ${rol === 'instructor' ? s.roleActive : ''}`}
                onClick={() => setRol('instructor')}
              >
                <ChalkboardTeacher size={16} /> Instructor
              </button>
            </div>
          </fieldset>

          <Button type="submit" size="lg" fullWidth disabled={cargando}>
            {cargando ? 'Creando cuenta...' : 'Crear Cuenta'}
          </Button>
        </form>

        <p className={s.footer}>
          ¿Ya tienes una cuenta?{' '}
          <Link to="/login" className={s.link}>
            Ya tengo cuenta
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
