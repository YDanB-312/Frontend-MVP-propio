import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PageHeader from '../../../components/PageHeader/PageHeader'
import FilterBar from '../../../components/FilterBar/FilterBar'
import DataPanel from '../../../components/DataPanel/DataPanel'
import FormField from '../../../components/FormField/FormField'
import Badge from '../../../components/Badge/Badge'
import Avatar from '../../../components/Avatar/Avatar'
import Alert from '../../../components/Alert/Alert'
import Button from '../../../components/Button/Button'
import Actions from '../../../components/Actions/Actions'
import { Input, Select } from '../../../components/Input/Input'
import Pagination from '../../../components/Pagination/Pagination'
import EmptyState from '../../../components/EmptyState/EmptyState'
import ConfirmModal from '../../../components/ConfirmModal/ConfirmModal'
import { Users, Plus, Eye, Pause, Play, CheckCircle, Code } from 'phosphor-react'
import {
  getAllUsers,
  findFichaById,
  setUserActive,
  createUser,
  emailExists,
  displayNames,
} from '../../../data/mockData'
// Estilos reutilizados de las páginas originales (lista + formulario)
import s from '../../../components/ListaBase/ListaBase.module.css'
import nu from '../../../components/FormularioBase/FormularioBase.module.css'

const ITEMS_POR_PAGINA = 8

const ROL_VARIANT = { aprendiz: 'info', instructor: 'primary', admin: 'warning' }

export default function Usuarios() {
  const [searchParams] = useSearchParams()
  const [creando, setCreando] = useState(() => searchParams.get('crear') === '1')
  const [creadoMsg, setCreadoMsg] = useState(false)
  const msgTimer = useRef(null)

  /* ---------- Lista ---------- */
  const [busqueda, setBusqueda] = useState('')
  const [filtroRol, setFiltroRol] = useState('todos')
  const [pagina, setPagina] = useState(1)
  const [aDesactivar, setADesactivar] = useState(null)
  const [, setTick] = useState(0)
  const refrescar = () => setTick((t) => t + 1)

  const usuarios = getAllUsers()

  const filtrados = usuarios.filter((u) => {
    const q = busqueda.trim().toLowerCase()
    const coincideQ =
      !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    const coincideRol = filtroRol === 'todos' || u.role === filtroRol
    return coincideQ && coincideRol
  })

  const paginados = filtrados.slice(
    (pagina - 1) * ITEMS_POR_PAGINA,
    pagina * ITEMS_POR_PAGINA
  )

  useEffect(() => () => { if (msgTimer.current) clearTimeout(msgTimer.current) }, [])

  function mostrarCreado() {
    setCreadoMsg(true)
    if (msgTimer.current) clearTimeout(msgTimer.current)
    msgTimer.current = setTimeout(() => setCreadoMsg(false), 3500)
  }

  const confirmarDesactivar = () => {
    if (!aDesactivar) return
    setUserActive(aDesactivar.id, false)
    setADesactivar(null)
    refrescar()
  }

  const activar = (u) => {
    setUserActive(u.id, true)
    refrescar()
  }

  /* ---------- Creación ---------- */
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'aprendiz',
  })
  const [errores, setErrores] = useState({})

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
    createUser({
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      role: form.role,
      password: form.password,
      estado: 1,
    })
    setForm({ name: '', email: '', password: '', role: 'aprendiz' })
    setErrores({})
    setCreando(false)
    refrescar()
    mostrarCreado()
  }

  return (
    <DashboardLayout role="admin" titulo={creando ? 'Nuevo Usuario' : 'Usuarios'}>
      <div className={s.page}>
        <PageHeader
          title={creando ? 'Crear Nuevo Usuario' : 'Gestión de Usuarios'}
          subtitle={
            creando
              ? 'Registra una cuenta de aprendiz, instructor o administrador en la plataforma.'
              : 'Administra las cuentas de aprendices, instructores y administradores de la plataforma.'
          }
          icon={creando ? <Code /> : <Users />}
          actions={
            !creando ? (
              <Button
                type="button"
                onClick={() => { setCreadoMsg(false); setCreando(true) }}
              >
                <Plus size={14} /> Nuevo Usuario
              </Button>
            ) : undefined
          }
        />

        {creando ? (
          <DataPanel title="Datos del usuario" icon={<Code />}>
            <form className={nu.form} onSubmit={onSubmit} noValidate>
              <div className={nu.grid2}>
                <FormField label="Nombre completo" required error={errores.name}>
                  <Input
                    name="name"
                    value={form.name}
                    onChange={onChange}
                    placeholder="Ej. María González"
                    maxLength={80}
                  />
                </FormField>

                <FormField label="Correo electrónico" required error={errores.email}>
                  <Input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={onChange}
                    placeholder="usuario@sena.edu.co"
                  />
                </FormField>
              </div>

              <div className={nu.grid2}>
                <FormField
                  label="Contraseña temporal"
                  required
                  error={errores.password}
                  help="Mínimo 6 caracteres. El usuario podrá cambiarla después."
                >
                  <Input
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={onChange}
                    placeholder="••••••"
                    autoComplete="new-password"
                  />
                </FormField>

                <FormField label="Rol" required error={errores.role}>
                  <Select name="role" value={form.role} onChange={onChange}>
                    <option value="aprendiz">Aprendiz</option>
                    <option value="instructor">Instructor</option>
                    <option value="admin">Administrador</option>
                  </Select>
                </FormField>
              </div>

              <Actions form>
                <Button type="submit">
                  <CheckCircle size={14} /> Crear usuario
                </Button>
                <Button type="button" variant="secondary" onClick={() => setCreando(false)}>
                  Cancelar
                </Button>
              </Actions>
            </form>
          </DataPanel>
        ) : (
          <>
            {creadoMsg && (
              <Alert>
                <CheckCircle size={14} /> Usuario creado correctamente.
              </Alert>
            )}

            <FilterBar title="Buscar y filtrar">
              <label className={s.field}>
                <span className={s.label}>Buscar</span>
                <Input
                  value={busqueda}
                  onChange={(e) => {
                    setBusqueda(e.target.value)
                    setPagina(1)
                  }}
                  placeholder="Nombre o correo…"
                />
              </label>
              <label className={s.field}>
                <span className={s.label}>Rol</span>
                <Select
                  value={filtroRol}
                  onChange={(e) => {
                    setFiltroRol(e.target.value)
                    setPagina(1)
                  }}
                >
                  <option value="todos">Todos</option>
                  <option value="aprendiz">Aprendiz</option>
                  <option value="instructor">Instructor</option>
                  <option value="admin">Administrador</option>
                </Select>
              </label>
              <p className={s.info}>
                {filtrados.length} usuario{filtrados.length !== 1 ? 's' : ''}
              </p>
            </FilterBar>

            {paginados.length === 0 ? (
              <EmptyState
                icon={<Users />}
                title="Sin usuarios"
                message={
                  usuarios.length === 0
                    ? 'No hay usuarios registrados en la plataforma. Crea el primero para comenzar.'
                    : 'Ningún usuario coincide con los filtros aplicados.'
                }
                actionLabel={usuarios.length === 0 ? 'Crear primer usuario' : undefined}
                onAction={usuarios.length === 0 ? () => setCreando(true) : undefined}
              />
            ) : (
              <>
                <div className={s.tableWrap}>
                  <table className={s.table}>
                    <thead>
                      <tr>
                        <th>Usuario</th>
                        <th>Correo</th>
                        <th>Rol</th>
                        <th>Ficha</th>
                        <th>Estado</th>
                        <th className={s.colActions}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginados.map((u) => {
                        const ficha = u.fichaId ? findFichaById(u.fichaId) : null
                        const activo = u.estado === 1
                        return (
                          <tr key={u.id}>
                            <td data-label="Usuario">
                              <Link to={`/admin/detalle-usuario/${u.id}`} className={s.userCell}>
                                <Avatar name={u.name} src={u.fotoPerfil} size="sm" />
                                <span className={s.userName}>{u.name}</span>
                              </Link>
                            </td>
                            <td data-label="Correo" className={s.email}>{u.email}</td>
                            <td data-label="Rol">
                              <Badge variant={ROL_VARIANT[u.role] || 'neutral'}>
                                {displayNames.userRole[u.role] || u.role}
                              </Badge>
                            </td>
                            <td data-label="Ficha">
                              {ficha ? (
                                <code className={s.codigo}>{ficha.codigo}</code>
                              ) : (
                                <span className={s.muted}>—</span>
                              )}
                            </td>
                            <td data-label="Estado">
                              {activo ? (
                                <Badge variant="success">Activo</Badge>
                              ) : (
                                <Badge variant="danger">Inactivo</Badge>
                              )}
                            </td>
                            <td data-label="Acciones" className={s.colActions}>
                              <div className={s.actions}>
                                <Button
                                  as="link"
                                  to={`/admin/detalle-usuario/${u.id}`}
                                  size="sm"
                                  variant="secondary"
                                >
                                  <Eye size={14} /> Ver
                                </Button>
                                {activo ? (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="danger"
                                    onClick={() => setADesactivar(u)}
                                  >
                                    <Pause size={14} /> Desactivar
                                  </Button>
                                ) : (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="success"
                                    onClick={() => activar(u)}
                                  >
                                    <Play size={14} /> Activar
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                <Pagination
                  totalItems={filtrados.length}
                  itemsPerPage={ITEMS_POR_PAGINA}
                  paginaActual={pagina}
                  setPaginaActual={setPagina}
                  itemName="usuarios"
                  filteredCount={filtrados.length}
                />
              </>
            )}
          </>
        )}
      </div>

      <ConfirmModal
        open={!!aDesactivar}
        titulo="Desactivar usuario"
        mensaje={
          aDesactivar
            ? `¿Seguro que deseas desactivar la cuenta de "${aDesactivar.name}"? No podrá iniciar sesión hasta que la reactives.`
            : ''
        }
        textoConfirmar="Sí, desactivar"
        textoCancelar="Cancelar"
        onConfirmar={confirmarDesactivar}
        onCancelar={() => setADesactivar(null)}
      />
    </DashboardLayout>
  )
}
