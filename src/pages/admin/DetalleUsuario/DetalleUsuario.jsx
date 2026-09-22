import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FolderOpen, MagnifyingGlass, ChartBar, Users, PencilSimple, Prohibit, Key, Trash, CheckCircle, Warning } from 'phosphor-react'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PerfilBase from '../../../components/PerfilBase/PerfilBase'
import DataPanel from '../../../components/DataPanel/DataPanel'
import Badge from '../../../components/Badge/Badge'
import GradeBadge from '../../../components/GradeBadge/GradeBadge'
import Button from '../../../components/Button/Button'
import EmptyState from '../../../components/EmptyState/EmptyState'
import ConfirmModal from '../../../components/ConfirmModal/ConfirmModal'
import MotivoBloqueo from '../../../components/MotivoBloqueo/MotivoBloqueo'
import Alert from '../../../components/Alert/Alert'
import FormField from '../../../components/FormField/FormField'
import { Input, PasswordInput, Select } from '../../../components/Input/Input'
import Actions from '../../../components/Actions/Actions'
import ApiState from '../../../components/ApiState/ApiState'
import { useAuth } from '../../../contexts/AuthContext'
import { useApi } from '../../../lib/useApi'
import { usuarios, aprendices, fichas, proyectos, similitudes } from '../../../lib/recursos'
import { esEmailValido } from '../../../utils/validation'
import { PROJECT_ESTADO_VARIANT } from '../../../constants/badgeVariants'
import { fechaDesdeApi } from '../../../utils/helpers'

import s from '../../../components/PersonaDetalleBase/PersonaDetalleBase.module.css'
import formStyles from '../../../components/FormularioBase/FormularioBase.module.css'

const ROL_LABEL = { aprendiz: 'Aprendiz', instructor: 'Instructor', admin: 'Administrador', superadmin: 'Superadministrador' }
const PROYECTO_ESTADO_LABEL = { pendiente: 'Pendiente', aprobado: 'Aprobado', rechazado: 'Rechazado' }

// Campos que acepta PUT /general-users (requiere los escalares obligatorios).
function payloadCuenta(cuenta, extra = {}) {
  return {
    nombre: cuenta.nombre,
    apellido: cuenta.apellido,
    correo: cuenta.correo,
    rol: cuenta.rol,
    estado: cuenta.estado,
    ...extra,
  }
}

// Concatena nombre + apellido de un general_user.
function nombreCompleto(usuario) {
  return [usuario?.nombre, usuario?.apellido].filter(Boolean).join(' ').trim()
}

// Contraseña temporal legible para el reinicio del admin: sena-xxxxxx.
function passwordTemporal() {
  const abc = 'abcdefghijkmnpqrstuvwxyz23456789'
  let out = ''
  for (let i = 0; i < 6; i++) out += abc[Math.floor(Math.random() * abc.length)]
  return `sena-${out}`
}

export default function DetalleUsuario() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user: sesion, sincronizarSesion } = useAuth()
  const esSuperadmin = sesion?.rol === 'superadmin'
  const [modalEliminar, setModalEliminar] = useState(false)
  // Cambio del propio correo: exige la contraseña actual del admin.
  const [correoPendiente, setCorreoPendiente] = useState(null)
  const [correoPass, setCorreoPass] = useState('')
  const [correoError, setCorreoError] = useState('')
  const [guardandoCorreo, setGuardandoCorreo] = useState(false)

  // Edición
  const [editando, setEditando] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', fichaId: '', role: 'aprendiz' })
  const [errores, setErrores] = useState({})
  const [guardado, setGuardado] = useState(false)
  const [accionMsg, setAccionMsg] = useState(null)
  const [claveTemporal, setClaveTemporal] = useState(null)

  // Fuente única: la API. Usuario + relaciones + propuestas/similitudes del aprendiz.
  const { data, cargando, error, recargar } = useApi(
    async () => {
      const [usuario, listaAprendices, listaFichas, listaProyectos, listaSimilitudes] = await Promise.all([
        usuarios.obtener(id),
        aprendices.listar('generalUser,classGroup.program,classGroup.trainingCenter'),
        fichas.listar('program,trainingCenter,instructor', {}),
        proyectos.listar({ included: 'creator,classGroup.program,apprentices.generalUser' }),
        similitudes.listar(),
      ])
      return { usuario, listaAprendices, listaFichas, listaProyectos, listaSimilitudes }
    },
    [id],
    { inicial: null }
  )

  if (cargando || error || !data?.usuario) {
    return (
      <DashboardLayout role="admin" titulo="Detalle de Usuario">
        <div className={s.wrapper}>
          {error ? (
            <EmptyState
              icon={<MagnifyingGlass />}
              title="No se pudo cargar el usuario"
              message={error.message || 'Ocurrió un error al consultar la API.'}
              actionLabel="Reintentar"
              onAction={recargar}
            />
          ) : cargando ? (
            <ApiState cargando error={null} />
          ) : (
            <EmptyState
              icon={<MagnifyingGlass />}
              title="Usuario no encontrado"
              message="El usuario que buscas no existe o fue eliminado."
              actionLabel="Volver a usuarios"
              onAction={() => navigate('/admin/usuarios')}
            />
          )}
        </div>
      </DashboardLayout>
    )
  }

  const usuario = data.usuario
  const listaFichas = data.listaFichas || []
  const listaSimilitudes = data.listaSimilitudes || []
  const nombre = nombreCompleto(usuario)

  // Perfil de aprendiz (si aplica) y su ficha dentro del catálogo.
  const perfilAprendiz = (data.listaAprendices || []).find((a) => Number(a.id_usuario) === Number(usuario.id)) || null
  const ficha = perfilAprendiz?.classGroup
    || (perfilAprendiz?.id_class_group ? listaFichas.find((f) => Number(f.id) === Number(perfilAprendiz.id_class_group)) : null)
    || null

  // Propuestas del aprendiz: creador O integrante del equipo (misma regla que
  // usa el propio aprendiz en su dashboard, para que los conteos coincidan).
  const proyectosDelUsuario = usuario.rol === 'aprendiz'
    ? (data.listaProyectos || []).filter((p) =>
        Number(p.id_creador) === Number(usuario.id)
        || (p.apprentices || []).some((a) => Number(a.generalUser?.id) === Number(usuario.id))
      )
    : []

  // Fichas a cargo (instructores): bloquean el borrado, igual que el backend (409).
  const fichasACargo = usuario.rol === 'instructor' && usuario.instructor
    ? listaFichas.filter((f) => Number(f.instructor?.id) === Number(usuario.instructor.id))
    : []

  // El borrado también se bloquea por historial académico (espejo del backend).
  const listaProyectos = data.listaProyectos || []
  const propuestasCreadas = listaProyectos.filter((p) => Number(p.id_creador) === Number(usuario.id))
  const propuestasAsignadas = usuario.rol === 'instructor' && usuario.instructor
    ? listaProyectos.filter((p) => Number(p.id_instructor_asignado) === Number(usuario.instructor.id))
    : []
  const propuestasEnEquipo = usuario.rol === 'aprendiz'
    ? listaProyectos.filter(
        (p) => Number(p.id_creador) !== Number(usuario.id)
          && (p.apprentices || []).some((a) => Number(a.generalUser?.id) === Number(usuario.id))
      )
    : []

  const motivoNoEliminar = propuestasCreadas.length > 0
    ? `No se puede eliminar: es autor de ${propuestasCreadas.length} propuesta(s). Suspende la cuenta para conservar el historial.`
    : propuestasAsignadas.length > 0
      ? `No se puede eliminar: tiene ${propuestasAsignadas.length} propuesta(s) asignada(s). Reasígnalas primero.`
      : propuestasEnEquipo.length > 0
        ? `No se puede eliminar: participa en ${propuestasEnEquipo.length} propuesta(s). Suspende la cuenta para conservar el historial.`
        : fichasACargo.length > 0
          ? `No se puede eliminar: tiene ${fichasACargo.length} ficha(s) a cargo. Reasígnalas primero.`
          : ''
  const noEliminable = motivoNoEliminar !== ''

  // Máximo porcentaje y conteo de coincidencias de una propuesta.
  const similitudInfoDe = (projectId) => {
    const propias = listaSimilitudes.filter(
      (sim) => Number(sim.id_proyecto_1) === Number(projectId) || Number(sim.id_proyecto_2) === Number(projectId)
    )
    if (propias.length === 0) return null
    return {
      pct: Math.max(...propias.map((sim) => Math.round(Number(sim.porcentaje) || 0))),
      count: propias.length,
    }
  }

  const estado = usuario.estado === false ? 'suspendido' : 'activo'
  const esMiCuenta = Number(sesion?.id) === Number(usuario.id)

  const detalles =
    usuario.rol === 'aprendiz'
      ? [
          { label: 'Rol', value: ROL_LABEL[usuario.rol] || usuario.rol },
          { label: 'Estado', value: estado === 'suspendido' ? 'Suspendido' : 'Activo' },
          { label: 'Ficha', value: ficha ? `${ficha.nombre} (${ficha.codigo})` : 'Sin ficha asignada' },
          { label: 'Programa', value: perfilAprendiz?.program?.nombre || ficha?.program?.nombre || 'No asignado' },
        ]
      : [
          { label: 'Rol', value: ROL_LABEL[usuario.rol] || usuario.rol },
          { label: 'Estado', value: estado === 'suspendido' ? 'Suspendido' : 'Activo' },
          { label: 'Ficha', value: ficha ? `${ficha.nombre} (${ficha.codigo})` : 'Sin ficha asignada' },
        ]

  const confirmarEliminar = async () => {
    try {
      await usuarios.eliminar(usuario.id)
      navigate('/admin/usuarios')
    } catch (err) {
      setModalEliminar(false)
      setAccionMsg(err?.data?.message || 'No se pudo eliminar el usuario.')
    }
  }

  const iniciarEdicion = () => {
    setForm({
      name: nombre,
      email: usuario.correo || '',
      fichaId: perfilAprendiz?.id_class_group ? String(perfilAprendiz.id_class_group) : '',
      role: usuario.rol || 'aprendiz',
    })
    setErrores({})
    setGuardado(false)
    setClaveTemporal(null)
    setAccionMsg(null)
    setEditando(true)
  }

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    setErrores((err) => ({ ...err, [name]: undefined }))
  }

  const validar = () => {
    const err = {}
    if (esMiCuenta && form.role !== 'admin') {
      err.role = 'No puedes quitarte tu propio rol de administrador.'
    }
    if (!form.email.trim()) err.email = 'El correo es obligatorio.'
    else if (!esEmailValido(form.email.trim())) err.email = 'Ingresa un correo válido.'
    return err
  }

  const onSubmitEdicion = async (e) => {
    e.preventDefault()
    const err = validar()
    if (Object.keys(err).length) {
      setErrores(err)
      return
    }
    const nuevoEmail = form.email.trim().toLowerCase()
    // Cambiar el correo propio (usuario de acceso) exige la contraseña actual.
    if (esMiCuenta && nuevoEmail !== usuario.correo) {
      setCorreoPendiente(nuevoEmail)
      setCorreoPass('')
      setCorreoError('')
      return
    }
    await guardarCambios(nuevoEmail)
  }

  const confirmarCambioCorreo = async () => {
    if (!correoPass) {
      setCorreoError('Ingresa tu contraseña actual.')
      return
    }
    setGuardandoCorreo(true)
    setCorreoError('')
    try {
      await usuarios.cambiarCorreo(correoPendiente, correoPass)
      sincronizarSesion(null, correoPendiente)
      setCorreoPendiente(null)
      setCorreoPass('')
      await recargar()
      setEditando(false)
      setGuardado(true)
    } catch (err) {
      setCorreoError(err?.data?.message || 'No fue posible cambiar el correo.')
    } finally {
      setGuardandoCorreo(false)
    }
  }

  const guardarCambios = async (nuevoEmail) => {
    try {
      // El correo propio nunca se cambia por aquí: solo con contraseña.
      const correoAEnviar = esMiCuenta ? usuario.correo : nuevoEmail
      if (correoAEnviar !== usuario.correo || form.role !== usuario.rol) {
        await usuarios.actualizar(usuario.id, payloadCuenta(usuario, { correo: correoAEnviar, rol: form.role }))
      }
      // 2) Ficha del aprendiz: solo si ya tiene perfil y cambió la selección.
      if (usuario.rol === 'aprendiz' && perfilAprendiz) {
        const actual = perfilAprendiz.id_class_group ? String(perfilAprendiz.id_class_group) : ''
        const destino = form.fichaId ? listaFichas.find((f) => Number(f.id) === Number(form.fichaId)) : null
        if (form.fichaId !== actual) {
          // '' = quitar ficha; con ficha destino se hereda su programa.
          await aprendices.actualizar(perfilAprendiz.id, {
            codigo: perfilAprendiz.codigo,
            id_class_group: destino ? Number(destino.id) : null,
            id_usuario: perfilAprendiz.id_usuario,
            id_programa: destino ? destino.id_programa : perfilAprendiz.id_programa,
          })
        }
      }
      await recargar()
      setEditando(false)
      setGuardado(true)
    } catch (err2) {
      const campos = err2?.data?.errors || {}
      // El backend responde en inglés para `unique`; se traduce al mensaje de la UI.
      const correoDuplicado = campos.correo || campos.email
      setErrores({
        email: correoDuplicado
          ? 'Ya existe un usuario con este correo.'
          : (err2?.data?.message || 'No se pudo actualizar el usuario.'),
      })
    }
  }

  const restablecerClave = async () => {
    const temporal = passwordTemporal()
    try {
      await usuarios.actualizar(usuario.id, payloadCuenta(usuario, { password: temporal }))
      setClaveTemporal(temporal)
      setGuardado(false)
      setAccionMsg(null)
    } catch (err) {
      setAccionMsg(err?.data?.message || 'No se pudo restablecer la contraseña.')
    }
  }

  const cambiarEstado = async (nuevo) => {
    setAccionMsg(null)
    try {
      await usuarios.actualizar(usuario.id, payloadCuenta(usuario, { estado: nuevo }))
      await recargar()
    } catch (err) {
      setAccionMsg(err?.data?.message || 'No se pudo actualizar el estado.')
    }
  }

  const fichasActivas = listaFichas.filter((f) => f.estado === 'activo')

  return (
    <DashboardLayout role="admin" titulo="Detalle de Usuario">
      <div className={s.wrapper}>
        <PerfilBase
          user={usuario}
          role={usuario.rol}
          soloLectura
          titulo={nombre}
          subtitulo={`Cuenta ${ROL_LABEL[usuario.rol] || usuario.rol}`}
          breadcrumb={[
            { label: 'Dashboard', to: '/admin/dashboard', icon: <ChartBar size={14} /> },
            { label: 'Usuarios', to: '/admin/usuarios', icon: <Users size={14} /> },
            { label: nombre },
          ]}
          detalles={detalles}
        />

        <div className={s.barraInspector}>
          <Actions align="start" wrap>
            <Button type="button" variant="secondary" onClick={iniciarEdicion}>
              <PencilSimple size={14} /> Editar
            </Button>
            {estado === 'suspendido' ? (
              <Button type="button" variant="secondary" onClick={() => cambiarEstado(true)}>
                <CheckCircle size={14} /> Activar cuenta
              </Button>
            ) : (
              <Button
                type="button"
                variant="secondary"
                title={esMiCuenta ? 'No puedes suspender tu propia cuenta' : 'Suspender cuenta'}
                disabled={esMiCuenta}
                onClick={() => cambiarEstado(false)}
              >
                <Prohibit size={14} /> Suspender
              </Button>
            )}
            <Button type="button" variant="secondary" onClick={restablecerClave}>
              <Key size={14} /> Restablecer contraseña
            </Button>
            <Button
              type="button"
              variant="dangerGhost"
              disabled={esMiCuenta || noEliminable}
              aria-describedby={noEliminable ? 'motivo-eliminar-usuario' : undefined}
              title={
                esMiCuenta
                  ? 'No puedes eliminar tu propia cuenta'
                  : noEliminable
                    ? motivoNoEliminar
                    : undefined
              }
              onClick={() => setModalEliminar(true)}
            >
              <Trash size={14} /> Eliminar
            </Button>
          </Actions>
        </div>

        {/* Por qué no se puede eliminar: el backend responde 409 en estos casos. */}
        {motivoNoEliminar && (
          <MotivoBloqueo id="motivo-eliminar-usuario">{motivoNoEliminar}</MotivoBloqueo>
        )}

        {claveTemporal && (
          <Alert>
            <Key size={14} /> Nueva contraseña temporal: <strong>{claveTemporal}</strong>. Compártela con el usuario por un canal seguro.
          </Alert>
        )}

        {accionMsg && (
          <Alert variant="danger"><Warning size={14} /> {accionMsg}</Alert>
        )}

        {guardado && (
          <Alert><CheckCircle size={14} /> Usuario actualizado correctamente.</Alert>
        )}

        {editando && (
          <DataPanel title="Editar usuario" icon={<PencilSimple />}>
            <form className={formStyles.form} onSubmit={onSubmitEdicion} noValidate>
              <div className={formStyles.grid2}>
                <FormField label="Nombre completo" help="El nombre identifica propuestas y equipos; no se puede cambiar.">
                  <Input name="name" value={form.name} readOnly />
                </FormField>
                <FormField label="Correo electrónico" required error={errores.email}>
                  <Input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={onChange}
                    placeholder="usuario@ejemplo.com"
                  />
                </FormField>
              </div>
              <FormField
                label="Rol"
                required
                error={errores.role}
                help={esMiCuenta ? 'No puedes quitarte tu propio rol de administrador.' : 'Cambiar el rol ajusta los permisos de la cuenta.'}
              >
                <Select name="role" value={form.role} onChange={onChange} disabled={esMiCuenta}>
                  <option value="aprendiz">Aprendiz</option>
                  <option value="instructor">Instructor</option>
                  {esSuperadmin && <option value="admin">Administrador</option>}
                  {esSuperadmin && <option value="superadmin">Superadministrador</option>}
                </Select>
              </FormField>
              {usuario.rol === 'aprendiz' && perfilAprendiz && (
                <FormField
                  label="Ficha"
                  help="Solo fichas activas. Las propuestas conservan su ficha original."
                >
                  <Select name="fichaId" value={form.fichaId} onChange={onChange}>
                    <option value="">Sin ficha</option>
                    {fichasActivas.map((f) => (
                      <option key={f.id} value={String(f.id)}>
                        {f.codigo} — {f.nombre}{f.trainingCenter ? ` (${f.trainingCenter.name})` : ''}
                      </option>
                    ))}
                  </Select>
                </FormField>
              )}
              {/* Aviso de traslado: qué cambia al mover al aprendiz de ficha */}
              {usuario.rol === 'aprendiz' && perfilAprendiz && form.fichaId !== '' && (() => {
                const destino = listaFichas.find((f) => Number(f.id) === Number(form.fichaId))
                const actual = perfilAprendiz.id_class_group
                  ? listaFichas.find((f) => Number(f.id) === Number(perfilAprendiz.id_class_group))
                  : null
                if (!destino || (actual && Number(destino.id) === Number(actual.id))) return null
                const avisos = []
                if ((destino.program?.nombre || null) !== (actual?.program?.nombre || null)) {
                  avisos.push(`cambia de programa (${actual?.program?.nombre || '—'} → ${destino.program?.nombre || '—'})`)
                }
                if ((destino.trainingCenter?.id || null) !== (actual?.trainingCenter?.id || null)) {
                  avisos.push(`cambia de centro (${actual?.trainingCenter?.name || '—'} → ${destino.trainingCenter?.name || '—'})`)
                }
                if (avisos.length === 0) return null
                return <Alert>Este traslado {avisos.join(' · ')}.</Alert>
              })()}
              <Actions form>
                <Button type="submit"><CheckCircle size={14} /> Guardar cambios</Button>
                <Button type="button" variant="secondary" onClick={() => setEditando(false)}>Cancelar</Button>
              </Actions>
            </form>
          </DataPanel>
        )}

        {usuario.rol === 'aprendiz' && (
          <DataPanel title={`Propuestas del aprendiz (${proyectosDelUsuario.length})`} icon={<FolderOpen />}>
            {proyectosDelUsuario.length === 0 ? (
              <EmptyState
                icon={<FolderOpen />}
                title="Sin propuestas"
                message="Este aprendiz aún no ha registrado ninguna propuesta."
              />
            ) : (
              <ul className={s.list}>
                {proyectosDelUsuario.map((p) => {
                  const info = similitudInfoDe(p.id)
                  return (
                    <li key={p.id}>
                      <Link to={`/admin/detalle-proyecto/${p.id}`} className={s.row}>
                        <span className={s.rowInfo}>
                          <span className={s.rowTitle}>{p.titulo}</span>
                          <span className={s.rowMeta}>Enviado el {fechaDesdeApi(p.created_at)}</span>
                        </span>
                        {info && (
                          <span title={`${info.pct}% · ${info.count} coincidencia${info.count !== 1 ? 's' : ''}`}>
                            <GradeBadge score={info.pct} size="sm" />
                          </span>
                        )}
                        <Badge variant={PROJECT_ESTADO_VARIANT[p.estado] || 'neutral'}>
                          {PROYECTO_ESTADO_LABEL[p.estado] || p.estado}
                        </Badge>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </DataPanel>
        )}
      </div>

      <ConfirmModal
        open={!!modalEliminar}
        titulo="Eliminar usuario"
        mensaje={`¿Seguro que deseas eliminar a "${nombre}"? Se eliminará su cuenta y no se podrá recuperar. Esta acción no se puede deshacer.`}
        textoConfirmar="Sí, eliminar"
        textoCancelar="Cancelar"
        onConfirmar={confirmarEliminar}
        onCancelar={() => setModalEliminar(false)}
      />

      <ConfirmModal
        open={!!correoPendiente}
        titulo="Cambiar correo electrónico"
        mensaje={`Vas a cambiar tu correo de "${usuario.correo}" a "${correoPendiente}". Confirma tu identidad con la contraseña actual.`}
        textoConfirmar={guardandoCorreo ? 'Guardando…' : 'Cambiar correo'}
        textoCancelar="Cancelar"
        onConfirmar={confirmarCambioCorreo}
        onCancelar={() => setCorreoPendiente(null)}
      >
        <FormField label="Contraseña actual" required error={correoError}>
          <PasswordInput
            value={correoPass}
            onChange={(e) => { setCorreoPass(e.target.value); setCorreoError('') }}
            autoComplete="current-password"
          />
        </FormField>
      </ConfirmModal>
    </DashboardLayout>
  )
}
