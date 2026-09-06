import { useRef, useState } from 'react'
import { Camera, CheckCircle, IdentificationCard, LockKey, PencilLine, Trash } from 'phosphor-react'
import PageHeader from '../PageHeader/PageHeader'
import DataPanel from '../DataPanel/DataPanel'
import Avatar from '../Avatar/Avatar'
import FormField from '../FormField/FormField'
import Alert from '../Alert/Alert'
import Actions from '../Actions/Actions'
import Button from '../Button/Button'
import StatCard from '../StatCard/StatCard'
import { Input } from '../Input/Input'
import Lightbox from '../Lightbox/Lightbox'
import { findUserById, updateUser, updateUserFoto, displayNames } from '../../data/mockData'
import { useAuth } from '../../contexts/AuthContext'
import { procesarFoto } from '../../utils/foto'
import s from './PerfilBase.module.css'

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

export default function PerfilBase({
  user,
  role = 'aprendiz',
  detalles = [],
  stats = [],
  soloLectura = false,
  titulo = 'Mi Perfil',
  subtitulo = null,
  breadcrumb = null,
}) {
  const { cambiarMiContrasena } = useAuth()
  const perfil = findUserById(user?.id)
  const [editando, setEditando] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [form, setForm] = useState(() => ({
    name: perfil?.name || '',
    email: perfil?.email || '',
  }))
  const [errors, setErrors] = useState({})
  const fileRef = useRef(null)
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  const [fotoError, setFotoError] = useState('')
  const [, setTick] = useState(0)
  const [viendoFoto, setViendoFoto] = useState(false)
  const [fotoMsg, setFotoMsg] = useState(null)
  const msgTimer = useRef(null)
  const [cambiandoPass, setCambiandoPass] = useState(false)
  const [passForm, setPassForm] = useState({ actual: '', nueva: '', confirmar: '' })
  const [passErrors, setPassErrors] = useState({})
  const [passMsg, setPassMsg] = useState(null)
  const passTimer = useRef(null)

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
    // El nombre es inmutable: identifica propuestas, equipos y fichas por valor
    const errs = {}
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.email = 'Ingresa un correo electrónico válido.'
    }
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    updateUser({
      id: perfil.id,
      name: perfil.name,
      email: form.email.trim().toLowerCase(),
    })
    sincronizarSesion(perfil.name, form.email.trim().toLowerCase())
    setEditando(false)
    setGuardado(true)
  }

  function mostrarPassMsg(texto, tipo = 'ok') {
    setPassMsg({ texto, tipo })
    if (passTimer.current) clearTimeout(passTimer.current)
    passTimer.current = setTimeout(() => setPassMsg(null), 3000)
  }

  function alCambiarPass(campo, valor) {
    setPassForm((f) => ({ ...f, [campo]: valor }))
    setPassErrors((errs) => ({ ...errs, [campo]: undefined }))
  }

  function iniciarCambioPass() {
    setPassForm({ actual: '', nueva: '', confirmar: '' })
    setPassErrors({})
    setCambiandoPass(true)
  }

  function cancelarCambioPass() {
    setPassErrors({})
    setCambiandoPass(false)
  }

  function guardarPass(e) {
    e.preventDefault()
    const errs = {}
    if (!passForm.actual) errs.actual = 'Ingresa tu contraseña actual.'
    if (!passForm.nueva || passForm.nueva.length < 6) {
      errs.nueva = 'La nueva contraseña debe tener al menos 6 caracteres.'
    }
    if (passForm.confirmar !== passForm.nueva) {
      errs.confirmar = 'Las contraseñas no coinciden.'
    }
    setPassErrors(errs)
    if (Object.keys(errs).length > 0) return

    const res = cambiarMiContrasena(passForm.actual, passForm.nueva)
    if (!res.exito) {
      setPassErrors({ actual: res.mensaje })
      return
    }
    setCambiandoPass(false)
    mostrarPassMsg('Contraseña actualizada correctamente.')
  }

  const nombre = perfil?.name || user?.nombre || ''
  const rolLabel = displayNames.userRole[perfil?.role] || role

  return (
    <div className={s.wrapper}>
      <PageHeader
        title={titulo}
        subtitle={subtitulo || SUBTITULOS[role] || SUBTITULOS.aprendiz}
        icon={<IdentificationCard />}
        breadcrumb={breadcrumb || undefined}
      />

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
          !soloLectura && !editando ? (
            <Button onClick={iniciarEdicion}>
            <PencilLine size={14} /> Editar perfil
          </Button>
          ) : undefined
        }
      >
        <div className={s.profile}>
          <div className={s.fotoCol}>
              <div className={s.fotoWrap}>
                {!soloLectura ? (
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
                ) : (
                  <div className={`${s.fotoBtn} ${perfil?.fotoPerfil ? s.fotoBtnVer : ''}`} title={perfil?.fotoPerfil ? 'Ver foto' : undefined} onClick={perfil?.fotoPerfil ? () => setViendoFoto(true) : undefined} role={perfil?.fotoPerfil ? 'button' : undefined}>
                    {perfil?.fotoPerfil ? (
                      <Avatar key={perfil.fotoPerfil} name={nombre} src={perfil.fotoPerfil} size="xl" />
                    ) : (
                      <span className={s.fotoPlaceholder}>
                        <Camera size={28} />
                      </span>
                    )}
                  </div>
                )}
                {!soloLectura && perfil?.fotoPerfil && !subiendoFoto && (
                  <button
                    type="button"
                    className={s.fotoCam}
                    title="Cambiar foto de perfil"
                    onClick={() => fileRef.current?.click()}
                  >
                    <Camera size={14} />
                  </button>
                )}
                {!soloLectura && (
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className={s.fotoInput}
                    aria-label="Cambiar foto de perfil"
                    onChange={alElegirFoto}
                    disabled={subiendoFoto}
                  />
                )}
              </div>
              {!soloLectura && perfil?.fotoPerfil && !subiendoFoto && (
                <button type="button" className={s.fotoQuitar} onClick={quitarFoto}>
                  <Trash size={12} /> Quitar foto
                </button>
              )}
          </div>

          <div className={s.profileInfo}>
            {!editando && (
              <>
                <h2 className={s.profileName}>{nombre}</h2>
                <p className={s.profileEmail}>{perfil?.email || user?.correo}</p>
              </>
            )}
            {!editando && detalles.length > 0 && (
              <dl className={s.detailList}>
                {detalles.map((d) => (
                  <div key={d.label} className={s.detailRow}>
                    <dt>{d.label}</dt>
                    <dd>{d.value}</dd>
                  </div>
                ))}
              </dl>
            )}
            {editando && (
              <form className={`${s.form} ${s.formGrow}`} onSubmit={guardar} noValidate>
                <FormField label="Rol">
                  <Input type="text" value={rolLabel} readOnly />
                </FormField>
                <FormField label="Nombre completo" help="El nombre identifica tus propuestas y equipos; no se puede cambiar.">
                  <Input
                    type="text"
                    value={perfil?.name || ''}
                    readOnly
                  />
                </FormField>
                <FormField label="Correo electrónico" required error={errors.email}>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
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
          </div>
      </DataPanel>

      {!soloLectura && (
        <DataPanel title="Seguridad" icon={<LockKey />}>
          {!cambiandoPass ? (
          <div className={s.seguridadRow}>
            <p className={s.seguridadTexto}>
              Usa una contraseña única de al menos 6 caracteres para proteger tu cuenta.
            </p>
            <Button type="button" variant="secondary" onClick={iniciarCambioPass}>
              <LockKey size={14} /> Cambiar contraseña
            </Button>
          </div>
        ) : (
          <form className={s.form} onSubmit={guardarPass} noValidate>
            <FormField label="Contraseña actual" required error={passErrors.actual}>
              <Input
                type="password"
                value={passForm.actual}
                onChange={(e) => alCambiarPass('actual', e.target.value)}
                autoComplete="current-password"
              />
            </FormField>
            <FormField label="Nueva contraseña" required error={passErrors.nueva} help="Mínimo 6 caracteres">
              <Input
                type="password"
                value={passForm.nueva}
                onChange={(e) => alCambiarPass('nueva', e.target.value)}
                autoComplete="new-password"
              />
            </FormField>
            <FormField label="Confirmar nueva contraseña" required error={passErrors.confirmar}>
              <Input
                type="password"
                value={passForm.confirmar}
                onChange={(e) => alCambiarPass('confirmar', e.target.value)}
                autoComplete="new-password"
              />
            </FormField>
            <Actions form>
              <Button type="submit">
                <CheckCircle size={14} /> Actualizar contraseña
              </Button>
              <Button variant="secondary" onClick={cancelarCambioPass}>
                Cancelar
              </Button>
            </Actions>
          </form>
        )}
        {passMsg && <Alert variant={passMsg.tipo === 'ok' ? 'success' : 'danger'}>{passMsg.texto}</Alert>}
        </DataPanel>
      )}

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
