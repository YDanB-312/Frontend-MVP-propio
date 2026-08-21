import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, CheckCircle, Code, ChartBar, Users } from 'phosphor-react'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PageHeader from '../../../components/PageHeader/PageHeader'
import DataPanel from '../../../components/DataPanel/DataPanel'
import FormField from '../../../components/FormField/FormField'
import {
  createUser,
  getAllFichas,
  emailExists,
} from '../../../data/mockData'
import s from './NuevoUsuario.module.css'

export default function NuevoUsuario() {
  const navigate = useNavigate()
  const fichas = getAllFichas()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'aprendiz',
    fichaId: '',
  })
  const [errores, setErrores] = useState({})

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    setErrores((err) => ({ ...err, [name]: undefined, fichaId: undefined }))
  }

  const validar = () => {
    const err = {}
    if (!form.name.trim()) err.name = 'El nombre es obligatorio.'
    else if (form.name.trim().length < 3) err.name = 'El nombre debe tener al menos 3 caracteres.'

    if (!form.email.trim()) err.email = 'El correo es obligatorio.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      err.email = 'Ingresa un correo válido.'
    else if (emailExists(form.email.trim().toLowerCase()))
      err.email = 'Ya existe un usuario con este correo.'

    if (!form.password) err.password = 'La contraseña es obligatoria.'
    else if (form.password.length < 6)
      err.password = 'La contraseña debe tener al menos 6 caracteres.'

    if (!form.role) err.role = 'Selecciona un rol.'
    return err
  }

  const onSubmit = (e) => {
    e.preventDefault()
    const err = validar()
    if (Object.keys(err).length) {
      setErrores(err)
      return
    }
    const ficha = form.fichaId ? getAllFichas().find((f) => f.id === Number(form.fichaId)) : null
    createUser({
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      role: form.role,
      password: form.password,
      estado: 1,
      fichaId: ficha ? ficha.id : null,
      programa: ficha ? ficha.programa : null,
      areaEncargada: form.role === 'instructor' ? ficha?.programa || null : null,
    })
    navigate('/admin/gestion-usuarios')
  }

  return (
    <DashboardLayout role="admin" titulo="Nuevo Usuario">
      <div className={s.page}>
        <PageHeader
          title="Crear Nuevo Usuario"
          subtitle="Registra una cuenta de aprendiz, instructor o administrador en la plataforma."
          icon={<Plus />}
          breadcrumb={[
            { label: 'Dashboard', to: '/admin/dashboard', icon: <ChartBar size={14} /> },
            { label: 'Gestión de Usuarios', to: '/admin/gestion-usuarios', icon: <Users size={14} /> },
            { label: 'Nuevo Usuario' },
          ]}
        />

        <DataPanel title="Datos del usuario" icon={<Code />}>
          <form className={s.form} onSubmit={onSubmit} noValidate>
            <div className={s.row}>
              <FormField label="Nombre completo" required error={errores.name}>
                <input
                  className={s.input}
                  name="name"
                  value={form.name}
                  onChange={onChange}
                  placeholder="Ej. María González"
                  maxLength={80}
                />
              </FormField>

              <FormField label="Correo electrónico" required error={errores.email}>
                <input
                  className={s.input}
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={onChange}
                  placeholder="usuario@sena.edu.co"
                />
              </FormField>
            </div>

            <div className={s.row}>
              <FormField
                label="Contraseña temporal"
                required
                error={errores.password}
                help="Mínimo 6 caracteres. El usuario podrá cambiarla después."
              >
                <input
                  className={s.input}
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={onChange}
                  placeholder="••••••"
                  autoComplete="new-password"
                />
              </FormField>

              <FormField label="Rol" required error={errores.role}>
                <select className={s.select} name="role" value={form.role} onChange={onChange}>
                  <option value="aprendiz">Aprendiz</option>
                  <option value="instructor">Instructor</option>
                  <option value="admin">Administrador</option>
                </select>
              </FormField>
            </div>

            <FormField
              label="Ficha de formación"
              help={
                form.role === 'aprendiz'
                  ? 'Opcional, pero recomendada para aprendices.'
                  : 'Opcional. Asocia al usuario con una ficha existente.'
              }
              error={errores.fichaId}
            >
              <select
                className={s.select}
                name="fichaId"
                value={form.fichaId}
                onChange={onChange}
              >
                <option value="">Sin ficha</option>
                {fichas.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.codigo} — {f.nombre}
                  </option>
                ))}
              </select>
            </FormField>

            <div className={s.formActions}>
              <button type="submit" className={`${s.btn} ${s.primary}`}>
                <CheckCircle size={14} /> Crear usuario
              </button>
              <button
                type="button"
                className={`${s.btn} ${s.secondary}`}
                onClick={() => navigate('/admin/gestion-usuarios')}
              >
                Cancelar
              </button>
            </div>
          </form>
        </DataPanel>
      </div>
    </DashboardLayout>
  )
}
