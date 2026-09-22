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
import { Input, PasswordInput, Select } from '../../../components/Input/Input'
import Pagination from '../../../components/Pagination/Pagination'
import EmptyState from '../../../components/EmptyState/EmptyState'
import ApiState from '../../../components/ApiState/ApiState'
import { norm } from '../../../utils/helpers'
import { Users, Plus, Eye, CheckCircle, Code, ChartBar, Prohibit, ArrowCounterClockwise, Warning } from 'phosphor-react'
import { useAuth } from '../../../contexts/AuthContext'
import { useApi } from '../../../lib/useApi'
import { usuarios, aprendices, fichas, centros, programas } from '../../../lib/recursos'
import { esEmailValido, esPasswordValida, MAX_NOMBRE } from '../../../utils/validation'
import { PAGINA_TABLA } from '../../../constants/pagination'

// Estilos reutilizados de las páginas originales (lista + formulario)
import s from '../../../components/ListaBase/ListaBase.module.css'
import nu from '../../../components/FormularioBase/FormularioBase.module.css'

const ITEMS_POR_PAGINA = PAGINA_TABLA

const ROL_VARIANT = { aprendiz: 'info', instructor: 'primary', admin: 'warning', superadmin: 'danger' }
const ROL_LABEL = { aprendiz: 'Aprendiz', instructor: 'Instructor', admin: 'Administrador', superadmin: 'Superadministrador' }
const ESTADO_VARIANT = { activo: 'success', suspendido: 'danger' }
const ESTADO_LABEL = { activo: 'Activo', suspendido: 'Suspendido' }

// Nombre completo -> { nombre, apellido } (la API exige ambos campos).
function splitNombre(texto) {
  const partes = String(texto || '').trim().split(/\s+/).filter(Boolean)
  const nombre = partes.shift() || ''
  return { nombre, apellido: partes.join(' ') || nombre }
}

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

export default function Usuarios() {
  const { user } = useAuth()
  const esSuperadmin = user?.rol === 'superadmin'
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
  const [accionMsg, setAccionMsg] = useState(null)
  const msgTimer = useRef(null)

  /* ---------- Lista ---------- */
  const [busqueda, setBusqueda] = useState('')
  const [filtroRol, setFiltroRol] = useState('todos')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroCentro, setFiltroCentro] = useState('todos')
  const [filtroFicha, setFiltroFicha] = useState('todos')
  const [filtroPrograma, setFiltroPrograma] = useState('todos')
  const [pagina, setPagina] = useState(1)

  // Fuente única: la API. Se traen usuarios y los catálogos que resuelven ficha/centro/programa.
  const { data, cargando, error, recargar } = useApi(
    async () => {
      const [listaUsuarios, listaAprendices, listaFichas, listaCentros, listaProgramas] = await Promise.all([
        usuarios.listar(),
        aprendices.listar('generalUser,classGroup.program,classGroup.trainingCenter'),
        fichas.listar('program,trainingCenter', {}),
        centros.listar(),
        programas.listar(),
      ])
      return { listaUsuarios, listaAprendices, listaFichas, listaCentros, listaProgramas }
    },
    [],
    { inicial: null }
  )

  const usuariosLista = data?.listaUsuarios || []
  const aprendicesLista = data?.listaAprendices || []
  const fichasLista = data?.listaFichas || []
  const centrosLista = data?.listaCentros || []
  const programasLista = data?.listaProgramas || []

  // Índices para resolver relaciones sin recorrer arrays en cada celda.
  const aprendicesPorUsuario = new Map(aprendicesLista.map((a) => [Number(a.id_usuario), a]))
  const fichasPorId = new Map(fichasLista.map((f) => [Number(f.id), f]))
  const centrosPorId = new Map(centrosLista.map((c) => [Number(c.id), c]))

  const fichaDeUsuario = (usr) => {
    const perfil = aprendicesPorUsuario.get(Number(usr.id))
    if (!perfil) return null
    return perfil.classGroup || fichasPorId.get(Number(perfil.id_class_group)) || null
  }

  const fichasFiltro = filtroCentro === 'todos'
    ? fichasLista
    : fichasLista.filter((f) => String(f.training_center_id) === String(filtroCentro))
  const programasFiltro = [...new Set(programasLista.map((p) => p.nombre))].sort()

  const filtrados = usuariosLista.filter((usr) => {
    const q = norm(busqueda.trim())
    const nombreCompleto = `${usr.nombre || ''} ${usr.apellido || ''}`
    const coincideQ = !q || norm(nombreCompleto).includes(q) || norm(usr.correo).includes(q)
    const coincideRol = filtroRol === 'todos' || usr.rol === filtroRol
    const estado = usr.estado === false ? 'suspendido' : 'activo'
    const coincideEstado = filtroEstado === 'todos' || estado === filtroEstado
    const perfil = aprendicesPorUsuario.get(Number(usr.id))
    const ficha = fichaDeUsuario(usr)
    const coincideCentro = filtroCentro === 'todos' || (ficha && String(ficha.training_center_id) === String(filtroCentro))
    const coincideFicha = filtroFicha === 'todos' || String(perfil?.id_class_group || '') === String(filtroFicha)
    const programa = perfil?.program?.nombre || ficha?.program?.nombre || ''
    const coincidePrograma = filtroPrograma === 'todos' || programa === filtroPrograma
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
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'aprendiz' })
  const [errores, setErrores] = useState({})
  const [guardando, setGuardando] = useState(false)

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
    else if (!esEmailValido(form.email.trim())) err.email = 'Ingresa un correo válido.'

    if (!form.password) err.password = 'La contraseña es obligatoria.'
    else if (!esPasswordValida(form.password)) err.password = 'La contraseña debe tener al menos 6 caracteres.'

    if (!form.role) err.role = 'Selecciona un rol.'
    return err
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    const err = validar()
    if (Object.keys(err).length) {
      setErrores(err)
      return
    }
    const partes = splitNombre(form.name)
    setGuardando(true)
    try {
      await usuarios.crear({
        nombre: partes.nombre,
        apellido: partes.apellido,
        correo: form.email.trim().toLowerCase(),
        password: form.password,
        rol: form.role,
        estado: true,
      })
      await recargar()
      setForm({ name: '', email: '', password: '', role: 'aprendiz' })
      setErrores({})
      setCreando(false)
      mostrarCreado()
    } catch (error) {
      if (error?.status === 422) {
        setErrores({ email: 'Ya existe un usuario con este correo o los datos no son válidos.' })
        return
      }
      setErrores({ email: error?.data?.message || 'No se pudo crear el usuario.' })
    } finally {
      setGuardando(false)
    }
  }

  /* ---------- Estado (activar / suspender) ---------- */
  const cambiarEstado = async (usr, nuevoEstado) => {
    setAccionMsg(null)
    try {
      const cuenta = await usuarios.obtener(usr.id)
      await usuarios.actualizar(usr.id, payloadCuenta(cuenta, { estado: nuevoEstado }))
      await recargar()
    } catch (err2) {
      setAccionMsg(err2?.data?.message || 'No se pudo actualizar el estado del usuario.')
    }
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
                    maxLength={MAX_NOMBRE}
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
                  <PasswordInput
                    name="password"
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
                    {esSuperadmin && <option value="admin">Administrador</option>}
                    {esSuperadmin && <option value="superadmin">Superadministrador</option>}
                  </Select>
                </FormField>
              </div>

              <Actions form>
                <Button type="submit" disabled={guardando}>
                  <CheckCircle size={14} /> {guardando ? 'Creando…' : 'Crear usuario'}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setCreando(false)}>
                  Cancelar
                </Button>
              </Actions>
            </form>
          </DataPanel>
        ) : (
          <ApiState cargando={cargando} error={error} onReintentar={recargar}>
            {creadoMsg && (
              <Alert>
                <CheckCircle size={14} /> Usuario creado correctamente.
              </Alert>
            )}

            {accionMsg && (
              <Alert variant="danger">
                <Warning size={14} /> {accionMsg}
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
                  {esSuperadmin && <option value="superadmin">Superadministrador</option>}
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
                  {centrosLista.map((ct) => (
                    <option key={ct.id} value={String(ct.id)}>
                      {ct.name}
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
                  usuariosLista.length === 0
                    ? 'No hay usuarios registrados en la plataforma. Crea el primero para comenzar.'
                    : 'Ningún usuario coincide con los filtros aplicados.'
                }
                actionLabel={usuariosLista.length === 0 ? 'Crear primer usuario' : 'Limpiar filtros'}
                onAction={usuariosLista.length === 0 ? () => setCreando(true) : limpiarFiltros}
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
                          <Avatar name={`${usr.nombre || ''} ${usr.apellido || ''}`} src={usr.foto_url} size="sm" />
                          <span className={s.userName}>{`${usr.nombre || ''} ${usr.apellido || ''}`.trim()}</span>
                        </Link>
                      ),
                    },
                    { key: 'correo', header: 'Correo', render: (usr) => usr.correo },
                    {
                      key: 'rol',
                      header: 'Rol',
                      render: (usr) => (
                        <Badge variant={ROL_VARIANT[usr.rol] || 'neutral'}>
                          {ROL_LABEL[usr.rol] || usr.rol}
                        </Badge>
                      ),
                    },
                    {
                      key: 'ficha',
                      header: 'Ficha',
                      render: (usr) => {
                        const ficha = fichaDeUsuario(usr)
                        return ficha ? <code className={s.codigo}>{ficha.codigo}</code> : <span className={s.muted}>—</span>
                      },
                    },
                    {
                      key: 'centro',
                      header: 'Centro',
                      render: (usr) => {
                        const ficha = fichaDeUsuario(usr)
                        const centro = ficha?.training_center_id ? centrosPorId.get(Number(ficha.training_center_id)) : null
                        return centro?.name || <span className={s.muted}>—</span>
                      },
                    },
                    {
                      key: 'programa',
                      header: 'Programa',
                      render: (usr) => {
                        const perfil = aprendicesPorUsuario.get(Number(usr.id))
                        const ficha = fichaDeUsuario(usr)
                        return perfil?.program?.nombre || ficha?.program?.nombre || <span className={s.muted}>—</span>
                      },
                    },
                    {
                      key: 'estado',
                      header: 'Estado',
                      render: (usr) => {
                        const estado = usr.estado === false ? 'suspendido' : 'activo'
                        return (
                          <Badge variant={ESTADO_VARIANT[estado] || 'neutral'}>
                            {ESTADO_LABEL[estado]}
                          </Badge>
                        )
                      },
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
                          {usr.estado === false ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              title="Reactivar cuenta"
                              onClick={() => cambiarEstado(usr, true)}
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
                              onClick={() => cambiarEstado(usr, false)}
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
          </ApiState>
        )}
      </div>
    </DashboardLayout>
  )
}
