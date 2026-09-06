import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FolderOpen, MagnifyingGlass, ChartBar, Users, PencilSimple, Trash, CheckCircle } from 'phosphor-react'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PerfilBase from '../../../components/PerfilBase/PerfilBase'
import DataPanel from '../../../components/DataPanel/DataPanel'
import Badge from '../../../components/Badge/Badge'
import Button from '../../../components/Button/Button'
import EmptyState from '../../../components/EmptyState/EmptyState'
import ConfirmModal from '../../../components/ConfirmModal/ConfirmModal'
import Alert from '../../../components/Alert/Alert'
import FormField from '../../../components/FormField/FormField'
import { Input, Select } from '../../../components/Input/Input'
import Actions from '../../../components/Actions/Actions'
import {
  findUserById,
  findFichaById,
  getProjectsByStudent,
  getSimilitudesValidas,
  updateUser,
  deleteUser,
  setUserFicha,
  getActiveFichas,
  emailExists,
  displayNames,
} from '../../../data/mockData'
import s from '../../../components/PersonaDetalleBase/PersonaDetalleBase.module.css'
import formStyles from '../../../components/FormularioBase/FormularioBase.module.css'

const ESTADO_VARIANT = {
  pendiente: 'warning',
  aprobado: 'success',
  rechazado: 'danger',
}

function similitudInfo(similitudes, projectId) {
  const propias = similitudes.filter((x) => x.projectId1 === projectId || x.projectId2 === projectId)
  if (propias.length === 0) return null
  return {
    pct: Math.max(...propias.map((x) => Math.round(x.similitud * 100))),
    count: propias.length,
  }
}

export default function DetalleUsuario() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [modalEliminar, setModalEliminar] = useState(false)
  const [, setTick] = useState(0)
  const refrescar = () => setTick((t) => t + 1)

  // Edición
  const [editando, setEditando] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', fichaId: '' })
  const [errores, setErrores] = useState({})
  const [guardado, setGuardado] = useState(false)

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
    })
    setErrores({})
    setGuardado(false)
    setEditando(true)
  }

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    setErrores((err) => ({ ...err, [name]: undefined }))
  }

  const validar = () => {
    const err = {}
    if (!form.name.trim()) err.name = 'El nombre es obligatorio.'
    else if (form.name.trim().length < 3) err.name = 'El nombre debe tener al menos 3 caracteres.'

    if (!form.email.trim()) err.email = 'El correo es obligatorio.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
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
    if (nuevoNombre !== usuario.name || nuevoEmail !== usuario.email) {
      updateUser({ id: usuario.id, name: nuevoNombre, email: nuevoEmail })
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
          { label: 'Ficha', value: ficha ? `${ficha.nombre} (${ficha.codigo})` : 'Sin ficha asignada' },
          { label: 'Programa', value: usuario.programa || 'No asignado' },
        ]
      : [
          { label: 'Rol', value: displayNames.userRole[usuario.role] || usuario.role },
          { label: 'Ficha', value: ficha ? `${ficha.nombre} (${ficha.codigo})` : 'Sin ficha asignada' },
        ]

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

        <Actions align="start" wrap>
          <Button type="button" variant="secondary" onClick={iniciarEdicion}>
            <PencilSimple size={14} /> Editar
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
              {usuario.role === 'aprendiz' && (
                <FormField label="Ficha" help="Solo fichas activas. Opcional.">
                  <Select name="fichaId" value={form.fichaId} onChange={onChange}>
                    <option value="">Sin ficha</option>
                    {fichasActivas.map((f) => (
                      <option key={f.id} value={String(f.id)}>
                        {f.codigo} — {f.nombre}
                      </option>
                    ))}
                  </Select>
                </FormField>
              )}
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
                          <Badge variant={info.pct >= 60 ? 'danger' : info.pct >= 40 ? 'warning' : 'success'}>
                            <MagnifyingGlass size={12} /> {info.pct}% · {info.count}
                          </Badge>
                        )}
                        <Badge variant={ESTADO_VARIANT[p.estado] || 'neutral'}>
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
