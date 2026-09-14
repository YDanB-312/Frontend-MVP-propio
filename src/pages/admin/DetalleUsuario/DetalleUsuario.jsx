import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FolderOpen, MagnifyingGlass, ChartBar, Users, PencilSimple, Prohibit, Key, Trash, CheckCircle } from 'phosphor-react'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PerfilBase from '../../../components/PerfilBase/PerfilBase'
import DataPanel from '../../../components/DataPanel/DataPanel'
import Badge from '../../../components/Badge/Badge'
import GradeBadge from '../../../components/GradeBadge/GradeBadge'
import Button from '../../../components/Button/Button'
import EmptyState from '../../../components/EmptyState/EmptyState'
import ConfirmModal from '../../../components/ConfirmModal/ConfirmModal'
import Alert from '../../../components/Alert/Alert'
import FormField from '../../../components/FormField/FormField'
import { Input, Select } from '../../../components/Input/Input'
import Actions from '../../../components/Actions/Actions'
import { useAuth } from '../../../contexts/AuthContext'
import {
  findUserById,
  findFichaById,
  findCentroById,
  getProjectsByStudent,
  getSimilitudesValidas,
  updateUser,
  deleteUser,
  setUserEstado,
  resetUserPassword,
  setUserFicha,
  getActiveFichas,
  getRedDePrograma,
  emailExists,
  displayNames,
} from '../../../data/mockData'
import { esEmailValido } from '../../../utils/validation'
import { PROJECT_ESTADO_VARIANT } from '../../../constants/badgeVariants'
import s from '../../../components/PersonaDetalleBase/PersonaDetalleBase.module.css'
import formStyles from '../../../components/FormularioBase/FormularioBase.module.css'
import { getSimilitudInfo as similitudInfo } from '../../../utils/similitudInfo'



export default function DetalleUsuario() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user: sesion } = useAuth()
  const [modalEliminar, setModalEliminar] = useState(false)
  const [, setTick] = useState(0)
  const refrescar = () => setTick((t) => t + 1)

  // Edición
  const [editando, setEditando] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', fichaId: '', role: 'aprendiz' })
  const [errores, setErrores] = useState({})
  const [guardado, setGuardado] = useState(false)
  const [claveTemporal, setClaveTemporal] = useState(null)

  const usuario = findUserById(id)
  const proyectos = usuario && usuario.role === 'aprendiz' ? getProjectsByStudent(usuario.id) : []
  const similitudes = getSimilitudesValidas()

  if (!usuario) {
    return (
      <DashboardLayout role="admin" titulo="Detalle de Usuario">
        <div className={s.wrapper}>
          <EmptyState
            icon={<MagnifyingGlass />}
            title="Usuario no encontrado"
            message="El usuario que buscas no existe o fue eliminado."
            actionLabel="Volver a usuarios"
            onAction={() => navigate('/admin/usuarios')}
          />
        </div>
      </DashboardLayout>
    )
  }

  const ficha = usuario.fichaId ? findFichaById(usuario.fichaId) : null

  const confirmarEliminar = () => {
    deleteUser(usuario.id)
    navigate('/admin/usuarios')
  }

  const iniciarEdicion = () => {
    setForm({
      name: usuario.name || '',
      email: usuario.email || '',
      fichaId: usuario.fichaId ? String(usuario.fichaId) : '',
      role: usuario.role || 'aprendiz',
    })
    setErrores({})
    setGuardado(false)
    setClaveTemporal(null)
    setEditando(true)
  }

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    setErrores((err) => ({ ...err, [name]: undefined }))
  }

  const validar = () => {
    const err = {}
    // Nombre de solo lectura: no se valida ni se guarda
    if (Number(sesion?.id) === Number(usuario.id) && form.role !== 'admin') {
      err.role = 'No puedes quitarte tu propio rol de administrador.'
    }
    if (!form.email.trim()) err.email = 'El correo es obligatorio.'
    else if (!esEmailValido(form.email.trim()))
      err.email = 'Ingresa un correo válido.'
    else if (form.email.trim().toLowerCase() !== usuario.email.toLowerCase() && emailExists(form.email.trim().toLowerCase()))
      err.email = 'Ya existe un usuario con este correo.'

    return err
  }

  const onSubmitEdicion = (e) => {
    e.preventDefault()
    const err = validar()
    if (Object.keys(err).length) {
      setErrores(err)
      return
    }
    const nuevoNombre = form.name.trim()
    const nuevoEmail = form.email.trim().toLowerCase()
    if (nuevoNombre !== usuario.name || nuevoEmail !== usuario.email || form.role !== usuario.role) {
      updateUser({ id: usuario.id, name: nuevoNombre, email: nuevoEmail, role: form.role })
    }
    if (usuario.role === 'aprendiz') {
      const actual = usuario.fichaId ? String(usuario.fichaId) : ''
      if (form.fichaId !== actual) {
        // '' explícito = quitar ficha; si ya estaba sin ficha no hay nada que guardar
        setUserFicha(usuario.id, form.fichaId === '' ? null : Number(form.fichaId))
      }
    }
    setEditando(false)
    setGuardado(true)
    refrescar()
    setTimeout(() => setGuardado(false), 3500)
  }

  const fichasActivas = getActiveFichas()

  const detalles =
    usuario.role === 'aprendiz'
      ? [
          { label: 'Rol', value: displayNames.userRole[usuario.role] || usuario.role },
          { label: 'Estado', value: displayNames.userStatus[usuario.estado] || 'Activo' },
          { label: 'Ficha', value: ficha ? `${ficha.nombre} (${ficha.codigo})` : 'Sin ficha asignada' },
          { label: 'Programa', value: usuario.programa || 'No asignado' },
        ]
      : [
          { label: 'Rol', value: displayNames.userRole[usuario.role] || usuario.role },
          { label: 'Estado', value: displayNames.userStatus[usuario.estado] || 'Activo' },
          { label: 'Ficha', value: ficha ? `${ficha.nombre} (${ficha.codigo})` : 'Sin ficha asignada' },
        ]

  const esMiCuenta = Number(sesion?.id) === Number(usuario.id)

  const restablecerClave = () => {
    const temporal = resetUserPassword(usuario.id)
    setClaveTemporal(temporal)
    setGuardado(false)
    refrescar()
  }

  return (
    <DashboardLayout role="admin" titulo="Detalle de Usuario">
      <div className={s.wrapper}>
        <PerfilBase
          user={usuario}
          role={usuario.role}
          soloLectura
          titulo={usuario.name}
          subtitulo={`Cuenta ${displayNames.userRole[usuario.role] || usuario.role}`}
          breadcrumb={[
            { label: 'Dashboard', to: '/admin/dashboard', icon: <ChartBar size={14} /> },
            { label: 'Usuarios', to: '/admin/usuarios', icon: <Users size={14} /> },
            { label: usuario.name },
          ]}
          detalles={detalles}
        />

        <div className={s.barraInspector}>
        <Actions align="start" wrap>
          <Button type="button" variant="secondary" onClick={iniciarEdicion}>
            <PencilSimple size={14} /> Editar
          </Button>
          {usuario.estado === 'suspendido' ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => { setUserEstado(usuario.id, 'activo'); refrescar() }}
            >
              <CheckCircle size={14} /> Activar cuenta
            </Button>
          ) : (
            <Button
              type="button"
              variant="secondary"
              title={esMiCuenta ? 'No puedes suspender tu propia cuenta' : 'Suspender cuenta'}
              disabled={esMiCuenta}
              onClick={() => { setUserEstado(usuario.id, 'suspendido'); refrescar() }}
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
            disabled={proyectos.length > 0}
            title={proyectos.length > 0 ? 'No se puede eliminar: tiene propuestas asociadas' : undefined}
            onClick={() => setModalEliminar(true)}
          >
            <Trash size={14} /> Eliminar
          </Button>
        </Actions>
        </div>

        {claveTemporal && (
          <Alert>
            <Key size={14} /> Nueva contraseña temporal: <strong>{claveTemporal}</strong>. Compártela con el usuario por un canal seguro.
          </Alert>
        )}

        {guardado && (
          <Alert><CheckCircle size={14} /> Usuario actualizado correctamente.</Alert>
        )}

        {editando && (
          <DataPanel title="Editar usuario" icon={<PencilSimple />}>
            <form className={formStyles.form} onSubmit={onSubmitEdicion} noValidate>
              <div className={formStyles.grid2}>
                <FormField label="Nombre completo" help="El nombre identifica propuestas y equipos; no se puede cambiar.">
                  <Input
                    name="name"
                    value={form.name}
                    readOnly
                  />
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
                  <option value="admin">Administrador</option>
                </Select>
              </FormField>
              {usuario.role === 'aprendiz' && (
                <FormField
                  label="Ficha"
                  help="Solo fichas activas, de cualquier centro o programa. Las propuestas conservan su ficha original."
                >
                  <Select name="fichaId" value={form.fichaId} onChange={onChange}>
                    <option value="">Sin ficha</option>
                    {fichasActivas.map((f) => {
                      const centro = f.centroId ? findCentroById(f.centroId) : null
                      return (
                        <option key={f.id} value={String(f.id)}>
                          {f.codigo} — {f.nombre}{centro ? ` (${centro.nombre})` : ''}
                        </option>
                      )
                    })}
                  </Select>
                </FormField>
              )}
              {usuario.role === 'aprendiz' && form.fichaId !== '' && (() => {
                const destino = findFichaById(form.fichaId)
                const actual = usuario.fichaId ? findFichaById(usuario.fichaId) : null
                if (!destino || (actual && destino.id === actual.id)) return null
                const avisos = []
                if (destino.programa !== usuario.programa) {
                  avisos.push(`cambia de programa (${usuario.programa || '—'} → ${destino.programa})`)
                }
                const centroD = destino.centroId ? findCentroById(destino.centroId) : null
                const centroA = actual?.centroId ? findCentroById(actual.centroId) : null
                if ((centroD?.id || null) !== (centroA?.id || null)) {
                  avisos.push(`cambia de centro (${centroA?.nombre || '—'} → ${centroD?.nombre || '—'})`)
                }
                if (actual && getRedDePrograma(destino.programa) !== getRedDePrograma(actual.programa)) {
                  avisos.push('cambia de red de conocimiento')
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

        {usuario.role === 'aprendiz' && (
          <DataPanel title={`Propuestas del aprendiz (${proyectos.length})`} icon={<FolderOpen />}>
            {proyectos.length === 0 ? (
              <EmptyState
                icon={<FolderOpen />}
                title="Sin propuestas"
                message="Este aprendiz aún no ha registrado ninguna propuesta."
              />
            ) : (
              <ul className={s.list}>
                {proyectos.map((p) => {
                  const info = similitudInfo(similitudes, p.id)
                  return (
                    <li key={p.id}>
                      <Link to={`/admin/detalle-proyecto/${p.id}`} className={s.row}>
                        <span className={s.rowInfo}>
                          <span className={s.rowTitle}>{p.title}</span>
                          <span className={s.rowMeta}>Enviado el {p.createdAt}</span>
                        </span>
                        {info && (
                          <span title={`${info.pct}% · ${info.count} coincidencia${info.count !== 1 ? 's' : ''}`}>
                            <GradeBadge score={info.pct} size="sm" />
                          </span>
                        )}
                        <Badge variant={PROJECT_ESTADO_VARIANT[p.estado] || 'neutral'}>
                          {displayNames.projectStatus[p.estado] || p.estado}
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
        mensaje={`¿Seguro que deseas eliminar a "${usuario.name}"? Se eliminará su cuenta y no se podrá recuperar. Esta acción no se puede deshacer.`}
        textoConfirmar="Sí, eliminar"
        textoCancelar="Cancelar"
        onConfirmar={confirmarEliminar}
        onCancelar={() => setModalEliminar(false)}
      />
    </DashboardLayout>
  )
}
