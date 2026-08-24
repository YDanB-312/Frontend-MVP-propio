import { useRef, useState } from 'react'
import { Camera, CheckCircle, IdentificationCard, PencilLine, Trash } from 'phosphor-react'
import PageHeader from '../PageHeader/PageHeader'
import DataPanel from '../DataPanel/DataPanel'
import Avatar from '../Avatar/Avatar'
import Badge from '../Badge/Badge'
import FormField from '../FormField/FormField'
import Alert from '../Alert/Alert'
import Actions from '../Actions/Actions'
import Button from '../Button/Button'
import StatCard from '../StatCard/StatCard'
import { Input } from '../Input/Input'
import Lightbox from '../Lightbox/Lightbox'
import { findUserById, updateUser, updateUserFoto, displayNames } from '../../data/mockData'
import { procesarFoto } from '../../utils/foto'
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
  const fileRef = useRef(null)
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  const [fotoError, setFotoError] = useState('')
  const [, setTick] = useState(0)
  const [viendoFoto, setViendoFoto] = useState(false)
  const [fotoMsg, setFotoMsg] = useState(null)
  const msgTimer = useRef(null)

  function mostrarFotoMsg(texto, tipo = 'ok') {
    setFotoMsg({ texto, tipo })
    if (msgTimer.current) clearTimeout(msgTimer.current)
    msgTimer.current = setTimeout(() => setFotoMsg(null), 2600)
  }

  async function alElegirFoto(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setSubiendoFoto(true)
    setFotoError('')
    try {
      const dataUrl = await procesarFoto(file)
      updateUserFoto(user.id, dataUrl)
      setTick((t) => t + 1)
      mostrarFotoMsg('Foto actualizada')
    } catch (err) {
      setFotoError(err.message || 'No fue posible actualizar la foto.')
    } finally {
      setSubiendoFoto(false)
    }
  }

  function quitarFoto() {
    updateUserFoto(user.id, null)
    setTick((t) => t + 1)
    mostrarFotoMsg('Foto eliminada')
  }

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
        <Alert>
          <CheckCircle size={14} /> Tus datos se actualizaron correctamente.
        </Alert>
      )}

      {stats.length > 0 && (
        <div className={s.stats}>
          {stats.map((st) => (
            <StatCard key={st.label} value={st.value} label={st.label} />
          ))}
        </div>
      )}

      <DataPanel
        title="Información personal"
        icon={<IdentificationCard />}
        action={
          !editando ? (
            <Button onClick={iniciarEdicion}>
            <PencilLine size={14} /> Editar perfil
          </Button>
          ) : undefined
        }
      >
        <div className={s.profile}>
          <div className={s.fotoCol}>
              <div className={s.fotoWrap}>
                <button
                  type="button"
                  className={`${s.fotoBtn} ${perfil?.fotoPerfil ? s.fotoBtnVer : ''}`}
                  title={perfil?.fotoPerfil ? 'Ver foto' : 'Subir foto de perfil'}
                  onClick={() => (perfil?.fotoPerfil ? setViendoFoto(true) : fileRef.current?.click())}
                  disabled={subiendoFoto}
                >
                  {subiendoFoto ? (
                    <span className={s.fotoOverlay}>
                      <span className={s.spinner} aria-hidden="true" />
                    </span>
                  ) : perfil?.fotoPerfil ? (
                    <Avatar key={perfil.fotoPerfil} name={nombre} src={perfil.fotoPerfil} size="xl" />
                  ) : (
                    <span className={s.fotoPlaceholder}>
                      <Camera size={28} />
                    </span>
                  )}
                </button>
                {perfil?.fotoPerfil && !subiendoFoto && (
                  <button
                    type="button"
                    className={s.fotoCam}
                    title="Cambiar foto de perfil"
                    onClick={() => fileRef.current?.click()}
                  >
                    <Camera size={14} />
                  </button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className={s.fotoInput}
                  onChange={alElegirFoto}
                  disabled={subiendoFoto}
                />
              </div>
              {perfil?.fotoPerfil && !subiendoFoto && (
                <button type="button" className={s.fotoQuitar} onClick={quitarFoto}>
                  <Trash size={12} /> Quitar foto
                </button>
              )}
          </div>

          {!editando ? (
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
          ) : (
            <form className={`${s.form} ${s.formGrow}`} onSubmit={guardar} noValidate>
            <FormField label="Nombre completo" required error={errors.name}>
              <Input
                type="text"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                autoFocus
              />
            </FormField>
            <FormField label="Correo electrónico" required error={errors.email}>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
              />
            </FormField>
            <FormField label="Teléfono" error={errors.telefono} help="Opcional">
              <Input
                type="tel"
                value={form.telefono}
                onChange={(e) => set('telefono', e.target.value)}
                placeholder="3001234567"
              />
            </FormField>
            <Actions form>
              <Button type="submit">
                Guardar cambios
              </Button>
              <Button variant="secondary" onClick={cancelar}>
                Cancelar
              </Button>
            </Actions>
            </form>
          )}
          </div>
      </DataPanel>

      {(fotoMsg || fotoError) && (
        <div className={`${s.snackbar} ${fotoError ? s.snackbarError : ''}`} role={fotoError ? 'alert' : 'status'}>
          {!fotoError && <CheckCircle size={14} weight="fill" />}
          {fotoError || fotoMsg.texto}
        </div>
      )}

      {viendoFoto && perfil?.fotoPerfil && (
        <Lightbox
          src={perfil.fotoPerfil}
          alt={`Foto de ${nombre}`}
          caption={nombre}
          onClose={() => setViendoFoto(false)}
        />
      )}
    </div>
  )
}
