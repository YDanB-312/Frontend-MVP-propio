import { useState } from 'react'
import { CheckCircle, IdentificationCard, PencilLine } from 'phosphor-react'
import PageHeader from '../PageHeader/PageHeader'
import DataPanel from '../DataPanel/DataPanel'
import Avatar from '../Avatar/Avatar'
import Badge from '../Badge/Badge'
import FormField from '../FormField/FormField'
import { findUserById, updateUser, displayNames } from '../../data/mockData'
import s from './PerfilBase.module.css'

const BADGE_ROL = { aprendiz: 'primary', instructor: 'primary', admin: 'warning' }

const SUBTITULOS = {
  aprendiz: 'Consulta y administra tu información personal',
  instructor: 'Consulta y actualiza tu información personal como instructor.',
  admin: 'Consulta y actualiza tu información personal como administrador.',
}

function sincronizarSesion(nombre, correo) {
  try {
    const enLocal = !!localStorage.getItem('auth_user')
    const destino = enLocal ? localStorage : sessionStorage
    const raw = destino.getItem('auth_user')
    if (!raw) return
    const sesion = JSON.parse(raw)
    destino.setItem('auth_user', JSON.stringify({ ...sesion, nombre, correo }))
  } catch {
    return
  }
}

export default function PerfilBase({ user, role = 'aprendiz', detalles = [], stats = [] }) {
  const perfil = findUserById(user?.id)
  const [editando, setEditando] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [form, setForm] = useState(() => ({
    name: perfil?.name || '',
    email: perfil?.email || '',
    telefono: perfil?.telefono || '',
  }))
  const [errors, setErrors] = useState({})

  function set(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }))
    setErrors((e) => ({ ...e, [campo]: undefined }))
    setGuardado(false)
  }

  function iniciarEdicion() {
    setForm({
      name: perfil?.name || '',
      email: perfil?.email || '',
      telefono: perfil?.telefono || '',
    })
    setErrors({})
    setEditando(true)
  }

  function cancelar() {
    setErrors({})
    setEditando(false)
  }

  function guardar(e) {
    e.preventDefault()
    const errs = {}
    if (form.name.trim().length < 3) errs.name = 'El nombre debe tener al menos 3 caracteres.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.email = 'Ingresa un correo electrónico válido.'
    }
    if (form.telefono && !/^[\d\s+-]{7,15}$/.test(form.telefono.trim())) {
      errs.telefono = 'Ingresa un teléfono válido.'
    }
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    updateUser({
      id: perfil.id,
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      telefono: form.telefono.trim() || null,
    })
    sincronizarSesion(form.name.trim(), form.email.trim().toLowerCase())
    setEditando(false)
    setGuardado(true)
  }

  const nombre = perfil?.name || user?.nombre || ''
  const rolLabel = displayNames.userRole[perfil?.role] || role

  return (
    <div className={s.wrapper}>
      <PageHeader title="Mi Perfil" subtitle={SUBTITULOS[role] || SUBTITULOS.aprendiz} icon={<IdentificationCard />} />

      {guardado && (
        <p className={s.saved} role="status">
          <CheckCircle size={14} /> Tus datos se actualizaron correctamente.
        </p>
      )}

      {stats.length > 0 && (
        <div className={s.stats}>
          {stats.map((st) => (
            <article key={st.label} className={s.stat}>
              <span className={s.statValue}>{st.value}</span>
              <span className={s.statLabel}>{st.label}</span>
            </article>
          ))}
        </div>
      )}

      <DataPanel
        title="Información personal"
        icon={<IdentificationCard />}
        action={
          !editando ? (
            <button type="button" className={`${s.btn} ${s.primary}`} onClick={iniciarEdicion}>
              <PencilLine size={14} /> Editar perfil
            </button>
          ) : undefined
        }
      >
        {!editando ? (
          <div className={s.profile}>
            <Avatar name={nombre} size="lg" />
            <div className={s.profileInfo}>
              <h2 className={s.profileName}>{nombre}</h2>
              <p className={s.profileEmail}>{perfil?.email || user?.correo}</p>
              <div className={s.tags}>
                <Badge variant={BADGE_ROL[role] || 'primary'}>{rolLabel}</Badge>
                {perfil?.estado === 1 ? (
                  <Badge variant="success">Activo</Badge>
                ) : (
                  <Badge variant="danger">Inactivo</Badge>
                )}
              </div>
              {perfil?.telefono && <p className={s.profileMeta}>{perfil.telefono}</p>}
              {detalles.length > 0 && (
                <dl className={s.detailList}>
                  {detalles.map((d) => (
                    <div key={d.label} className={s.detailRow}>
                      <dt>{d.label}</dt>
                      <dd>{d.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </div>
        ) : (
          <form className={s.form} onSubmit={guardar} noValidate>
            <FormField label="Nombre completo" required error={errors.name}>
              <input
                type="text"
                className={s.input}
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                autoFocus
              />
            </FormField>
            <FormField label="Correo electrónico" required error={errors.email}>
              <input
                type="email"
                className={s.input}
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
              />
            </FormField>
            <FormField label="Teléfono" error={errors.telefono} help="Opcional">
              <input
                type="tel"
                className={s.input}
                value={form.telefono}
                onChange={(e) => set('telefono', e.target.value)}
                placeholder="3001234567"
              />
            </FormField>
            <div className={s.formActions}>
              <button type="submit" className={`${s.btn} ${s.primary}`}>
                Guardar cambios
              </button>
              <button type="button" className={`${s.btn} ${s.secondary}`} onClick={cancelar}>
                Cancelar
              </button>
            </div>
          </form>
        )}
      </DataPanel>
    </div>
  )
}
