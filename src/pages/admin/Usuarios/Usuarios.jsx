import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PageHeader from '../../../components/PageHeader/PageHeader'
import FilterBar from '../../../components/FilterBar/FilterBar'
import DataTable from '../../../components/DataTable/DataTable'
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
import { norm } from '../../../utils/helpers'
import { Users, Plus, Eye, CheckCircle, Code, ChartBar, Prohibit, ArrowCounterClockwise } from 'phosphor-react'
import { useAuth } from '../../../contexts/AuthContext'
import {
  getAllUsers,
  findFichaById,
  findCentroById,
  getAllFichas,
  getCentros,
  createUser,
  setUserEstado,
  emailExists,
  REDES,
  displayNames,
} from '../../../data/mockData'
import { esEmailValido, esPasswordValida } from '../../../utils/validation'
import { PAGINA_TABLA } from '../../../constants/pagination'
// Estilos reutilizados de las páginas originales (lista + formulario)
import s from '../../../components/ListaBase/ListaBase.module.css'
import nu from '../../../components/FormularioBase/FormularioBase.module.css'

const ITEMS_POR_PAGINA = PAGINA_TABLA

const ROL_VARIANT = { aprendiz: 'info', instructor: 'primary', admin: 'warning' }
const ESTADO_VARIANT = { activo: 'success', suspendido: 'danger' }

export default function Usuarios() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [creando, setCreando] = useState(() => searchParams.get('crear') === '1')

  // Reacciona si se navega a ?crear=1 ya estando en la lista
  useEffect(() => {
    if (searchParams.get('crear') === '1') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCreando(true)
    }
  }, [searchParams])
  const [creadoMsg, setCreadoMsg] = useState(false)
  const msgTimer = useRef(null)

  /* ---------- Lista ---------- */
  const [busqueda, setBusqueda] = useState('')
  const [filtroRol, setFiltroRol] = useState('todos')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroCentro, setFiltroCentro] = useState('todos')
  const [filtroFicha, setFiltroFicha] = useState('todos')
  const [filtroPrograma, setFiltroPrograma] = useState('todos')
  const [pagina, setPagina] = useState(1)
  const [, setTick] = useState(0)
  const refrescar = () => setTick((t) => t + 1)

  const usuarios = getAllUsers()

  const centros = getCentros()
  const fichasFiltro = filtroCentro === 'todos'
    ? getAllFichas()
    : getAllFichas().filter((f) => String(f.centroId) === String(filtroCentro))
  const programasFiltro = [...new Set(REDES.flatMap((r) => r.programas))].sort()

  const filtrados = usuarios.filter((u) => {
    const q = norm(busqueda.trim())
    const coincideQ =
      !q || norm(u.name).includes(q) || norm(u.email).includes(q)
    const coincideRol = filtroRol === 'todos' || u.role === filtroRol
    const coincideEstado = filtroEstado === 'todos' || (u.estado || 'activo') === filtroEstado
    const fichaU = u.fichaId ? findFichaById(u.fichaId) : null
    const coincideCentro = filtroCentro === 'todos' || (fichaU && String(fichaU.centroId) === String(filtroCentro))
    const coincideFicha = filtroFicha === 'todos' || String(u.fichaId || '') === String(filtroFicha)
    const coincidePrograma = filtroPrograma === 'todos' || (u.programa || '') === filtroPrograma
    return coincideQ && coincideRol && coincideEstado && coincideCentro && coincideFicha && coincidePrograma
  })

  const paginados = filtrados.slice(
    (pagina - 1) * ITEMS_POR_PAGINA,
    pagina * ITEMS_POR_PAGINA
  )

  const limpiarFiltros = () => {
    setBusqueda('')
    setFiltroRol('todos')
    setFiltroEstado('todos')
    setFiltroCentro('todos')
    setFiltroFicha('todos')
    setFiltroPrograma('todos')
    setPagina(1)
  }

  useEffect(() => () => { if (msgTimer.current) clearTimeout(msgTimer.current) }, [])

  function mostrarCreado() {
    setCreadoMsg(true)
    if (msgTimer.current) clearTimeout(msgTimer.current)
    msgTimer.current = setTimeout(() => setCreadoMsg(false), 3500)
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
    else if (!esEmailValido(form.email.trim()))
      err.email = 'Ingresa un correo válido.'
    else if (emailExists(form.email.trim().toLowerCase()))
      err.email = 'Ya existe un usuario con este correo.'

    if (!form.password) err.password = 'La contraseña es obligatoria.'
    else if (!esPasswordValida(form.password))
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
          breadcrumb={
            creando
              ? [
                  { label: 'Dashboard', to: '/admin/dashboard', icon: <ChartBar size={14} /> },
                  { label: 'Usuarios', icon: <Users size={14} />, onClick: () => setCreando(false) },
                  { label: 'Nuevo usuario' },
                ]
              : []
          }
          onBack={creando ? () => setCreando(false) : undefined}
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
                    placeholder="usuario@ejemplo.com"
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

            <FilterBar
              title="Buscar y filtrar"
              actions={
                filtrados.length > 0 && (
                  <Button type="button" variant="secondary" size="sm" onClick={limpiarFiltros}>
                    Limpiar filtros
                  </Button>
                )
              }
            >
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
              <label className={s.field}>
                <span className={s.label}>Centro</span>
                <Select
                  value={filtroCentro}
                  onChange={(e) => {
                    setFiltroCentro(e.target.value)
                    setFiltroFicha('todos')
                    setPagina(1)
                  }}
                >
                  <option value="todos">Todos</option>
                  {centros.map((ct) => (
                    <option key={ct.id} value={String(ct.id)}>
                      {ct.nombre}
                    </option>
                  ))}
                </Select>
              </label>
              <label className={s.field}>
                <span className={s.label}>Estado</span>
                <Select
                  value={filtroEstado}
                  onChange={(e) => {
                    setFiltroEstado(e.target.value)
                    setPagina(1)
                  }}
                >
                  <option value="todos">Todos</option>
                  <option value="activo">Activo</option>
                  <option value="suspendido">Suspendido</option>
                </Select>
              </label>
              <label className={s.field}>
                <span className={s.label}>Ficha</span>
                <Select
                  value={filtroFicha}
                  onChange={(e) => {
                    setFiltroFicha(e.target.value)
                    setPagina(1)
                  }}
                >
                  <option value="todos">Todas</option>
                  {fichasFiltro.map((f) => (
                    <option key={f.id} value={String(f.id)}>
                      {f.codigo} · {f.nombre}
                    </option>
                  ))}
                </Select>
              </label>
              <label className={s.field}>
                <span className={s.label}>Programa</span>
                <Select
                  value={filtroPrograma}
                  onChange={(e) => {
                    setFiltroPrograma(e.target.value)
                    setPagina(1)
                  }}
                >
                  <option value="todos">Todos</option>
                  {programasFiltro.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
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
                actionLabel={usuarios.length === 0 ? 'Crear primer usuario' : 'Limpiar filtros'}
                onAction={usuarios.length === 0 ? () => setCreando(true) : limpiarFiltros}
              />
            ) : (
              <>
                <DataTable
                  ariaLabel="Usuarios registrados"
                  columns={[
                    {
                      key: 'usuario',
                      header: 'Usuario',
                      render: (usr) => (
                        <Link to={`/admin/detalle-usuario/${usr.id}`} viewTransition className={s.userCell}>
                          <Avatar name={usr.name} src={usr.fotoPerfil} size="sm" />
                          <span className={s.userName}>{usr.name}</span>
                        </Link>
                      ),
                    },
                    { key: 'email', header: 'Correo' },
                    {
                      key: 'role',
                      header: 'Rol',
                      render: (usr) => (
                        <Badge variant={ROL_VARIANT[usr.role] || 'neutral'}>
                          {displayNames.userRole[usr.role] || usr.role}
                        </Badge>
                      ),
                    },
                    {
                      key: 'ficha',
                      header: 'Ficha',
                      render: (usr) => {
                        const ficha = usr.fichaId ? findFichaById(usr.fichaId) : null
                        return ficha ? (
                          <code className={s.codigo}>{ficha.codigo}</code>
                        ) : (
                          <span className={s.muted}>—</span>
                        )
                      },
                    },
                    {
                      key: 'centro',
                      header: 'Centro',
                      render: (usr) => {
                        const ficha = usr.fichaId ? findFichaById(usr.fichaId) : null
                        const centro = ficha?.centroId ? findCentroById(ficha.centroId) : null
                        return centro?.nombre || <span className={s.muted}>—</span>
                      },
                    },
                    {
                      key: 'programa',
                      header: 'Programa',
                      render: (usr) => {
                        const ficha = usr.fichaId ? findFichaById(usr.fichaId) : null
                        return usr.programa || ficha?.programa || <span className={s.muted}>—</span>
                      },
                    },
                    {
                      key: 'estado',
                      header: 'Estado',
                      render: (usr) => (
                        <Badge variant={ESTADO_VARIANT[usr.estado] || 'neutral'}>
                          {displayNames.userStatus[usr.estado] || usr.estado || 'Activo'}
                        </Badge>
                      ),
                    },
                    {
                      key: 'acciones',
                      header: 'Acciones',
                      align: 'end',
                      render: (usr) => (
                        <div className={s.actions}>
                          <Button
                            as="link"
                            to={`/admin/detalle-usuario/${usr.id}`}
                            viewTransition
                            size="sm"
                            variant="secondary"
                          >
                            <Eye size={14} /> Ver
                          </Button>
                          {usr.estado === 'suspendido' ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              title="Reactivar cuenta"
                              onClick={() => { setUserEstado(usr.id, 'activo'); refrescar() }}
                            >
                              <ArrowCounterClockwise size={14} /> Activar
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              variant="dangerGhost"
                              title={Number(user?.id) === Number(usr.id) ? 'No puedes suspender tu propia cuenta' : 'Suspender cuenta'}
                              disabled={Number(user?.id) === Number(usr.id)}
                              onClick={() => { setUserEstado(usr.id, 'suspendido'); refrescar() }}
                            >
                              <Prohibit size={14} /> Suspender
                            </Button>
                          )}
                        </div>
                      ),
                    },
                  ]}
                  rows={paginados}
                  keyOf={(usr) => usr.id}
                />

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
    </DashboardLayout>
  )
}
