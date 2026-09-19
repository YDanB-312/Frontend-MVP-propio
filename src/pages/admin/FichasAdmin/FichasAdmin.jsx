import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PageHeader from '../../../components/PageHeader/PageHeader'
import FilterBar from '../../../components/FilterBar/FilterBar'
import DataPanel from '../../../components/DataPanel/DataPanel'
import FormField from '../../../components/FormField/FormField'
import Badge from '../../../components/Badge/Badge'
import Alert from '../../../components/Alert/Alert'
import Button from '../../../components/Button/Button'
import { Input, Select } from '../../../components/Input/Input'
import Actions from '../../../components/Actions/Actions'
import Pagination from '../../../components/Pagination/Pagination'
import EmptyState from '../../../components/EmptyState/EmptyState'
import DataTable from '../../../components/DataTable/DataTable'
import ApiState from '../../../components/ApiState/ApiState'
import ConfirmModal from '../../../components/ConfirmModal/ConfirmModal'
import { ArrowClockwise, Books, ChartBar, CheckCircle, Eye, Plus, Trash, Warning } from 'phosphor-react'
import { useApi } from '../../../lib/useApi'
import { fichas, centros, programas, redes, instructores, proyectos } from '../../../lib/recursos'
import { toFieldErrors } from '../../../lib/api'
import { norm, generarCodigoFicha, fechaDesdeApi } from '../../../utils/helpers'
import { FICHA_ESTADO_VARIANT as ESTADO_VARIANT } from '../../../constants/badgeVariants'
import s from '../../../components/ListaBase/ListaBase.module.css'
import c from '../../../components/FormularioBase/FormularioBase.module.css'
import { MAX_NOMBRE, MAX_NUMERO_FICHA } from '../../../utils/validation'
import { PAGINA_TABLA } from '../../../constants/pagination'

const ITEMS_POR_PAGINA = PAGINA_TABLA

const ESTADO_LABEL = {
  activo: 'Activo',
  inactivo: 'Inactivo',
  finalizado: 'Finalizado',
  archivado: 'Archivado',
}

// Concatena nombre + apellido de un general_user.
function nombreCompleto(usuario) {
  return [usuario?.nombre, usuario?.apellido].filter(Boolean).join(' ').trim()
}

export default function FichasAdmin() {
  const [searchParams] = useSearchParams()
  const [creando, setCreando] = useState(() => searchParams.get('crear') === '1')
  const [creadaMsg, setCreadaMsg] = useState(false)
  const [accionMsg, setAccionMsg] = useState(null)
  const msgTimer = useRef(null)

  /* ---------- Lista ---------- */
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroCentro, setFiltroCentro] = useState('todos')
  const [filtroInstructor, setFiltroInstructor] = useState('todos')
  const [pagina, setPagina] = useState(1)
  const [aEliminar, setAEliminar] = useState(null)

  // Fuente única: la API. Fichas + catálogos + propuestas (conteo).
  const { data, cargando, error, recargar } = useApi(
    async () => {
      const [listaFichas, listaCentros, listaProgramas, listaRedes, listaInstructores, listaProyectos] = await Promise.all([
        fichas.listar('program,trainingCenter,instructor.generalUser,apprentices.generalUser'),
        centros.listar(),
        programas.listar(),
        redes.listar(),
        instructores.listar('generalUser'),
        proyectos.listar(),
      ])
      return { listaFichas, listaCentros, listaProgramas, listaRedes, listaInstructores, listaProyectos }
    },
    [],
    { inicial: null }
  )

  const listaFichas = data?.listaFichas || []
  const listaCentros = data?.listaCentros || []
  const listaProgramas = data?.listaProgramas || []
  const listaRedes = data?.listaRedes || []
  const listaInstructores = data?.listaInstructores || []
  const listaProyectos = data?.listaProyectos || []

  // Propuestas por ficha (id_class_group).
  const propuestasPorFicha = new Map()
  for (const p of listaProyectos) {
    const key = Number(p.id_class_group)
    propuestasPorFicha.set(key, (propuestasPorFicha.get(key) || 0) + 1)
  }

  const centrosPorId = new Map(listaCentros.map((ct) => [Number(ct.id), ct]))

  const filtradas = listaFichas.filter((f) => {
    const q = norm(busqueda.trim())
    const instructorNombre = nombreCompleto(f.instructor?.generalUser)
    const coincideQ =
      !q ||
      norm(f.nombre).includes(q) ||
      norm(f.codigo).includes(q) ||
      norm(f.numero).includes(q) ||
      norm(f.program?.nombre).includes(q) ||
      norm(instructorNombre).includes(q)
    const coincideEstado = filtroEstado === 'todos' || f.estado === filtroEstado
    const coincideCentro = filtroCentro === 'todos' || String(f.training_center_id || '') === String(filtroCentro)
    const coincideInstructor = filtroInstructor === 'todos' || String(f.id_instructor || '') === String(filtroInstructor)
    return coincideQ && coincideEstado && coincideCentro && coincideInstructor
  })

  const paginadas = filtradas.slice(
    (pagina - 1) * ITEMS_POR_PAGINA,
    pagina * ITEMS_POR_PAGINA
  )

  const limpiarFiltros = () => {
    setBusqueda('')
    setFiltroEstado('todos')
    setFiltroCentro('todos')
    setFiltroInstructor('todos')
    setPagina(1)
  }

  useEffect(() => () => { if (msgTimer.current) clearTimeout(msgTimer.current) }, [])

  // Reacciona si se navega a ?crear=1 ya estando en la lista
  useEffect(() => {
    if (searchParams.get('crear') === '1') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCreando(true)
    }
  }, [searchParams])

  function mostrarCreada() {
    setCreadaMsg(true)
    if (msgTimer.current) clearTimeout(msgTimer.current)
    msgTimer.current = setTimeout(() => setCreadaMsg(false), 3500)
  }

  function abrirCreacion() {
    setCreadaMsg(false)
    setCodigo(generarCodigoFicha())
    setCreando(true)
  }

  const confirmarEliminar = async () => {
    if (!aEliminar) return
    setAccionMsg(null)
    try {
      await fichas.eliminar(aEliminar.id)
      setAEliminar(null)
      await recargar()
    } catch (err) {
      setAEliminar(null)
      setAccionMsg(err?.data?.message || 'No se pudo eliminar la ficha.')
    }
  }

  /* ---------- Creación ---------- */
  const [codigo, setCodigo] = useState(() => generarCodigoFicha())
  const [form, setForm] = useState({ red: '', programa: '', nombre: '', numero: '', centroId: '', instructorId: '' })
  const [errores, setErrores] = useState({})
  const [guardando, setGuardando] = useState(false)

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    setErrores((err) => ({ ...err, [name]: undefined }))
  }

  function alCambiarRed(e) {
    const { value } = e.target
    setForm((f) => ({ ...f, red: value, programa: '' }))
    setErrores((err) => ({ ...err, red: undefined, programa: undefined }))
  }

  const regenerarCodigo = () => setCodigo(generarCodigoFicha())

  const validar = () => {
    const err = {}
    if (!form.red) err.red = 'Selecciona la red de conocimiento.'
    if (!form.programa) err.programa = 'Selecciona el programa de formación.'
    if (!form.centroId) err.centroId = 'Selecciona el centro de formación.'
    if (!form.instructorId) err.instructorId = 'Asigna un instructor a cargo.'
    if (!form.nombre.trim()) err.nombre = 'El nombre de la ficha es obligatorio.'
    const numero = form.numero.trim()
    if (!numero) {
      err.numero = 'El número de ficha es obligatorio.'
    } else if (!/^\d{4,8}$/.test(numero)) {
      err.numero = 'Solo dígitos (4 a 8 caracteres).'
    }
    return err
  }

  const programasDeRed = form.red
    ? listaProgramas.filter((p) => Number(p.knowledge_network_id) === Number(form.red))
    : []
  const instructoresActivos = listaInstructores.filter((i) => i.generalUser?.estado !== false)

  const onSubmit = async (e) => {
    e.preventDefault()
    const err = validar()
    if (Object.keys(err).length) {
      setErrores(err)
      return
    }
    const payload = {
      numero: form.numero.trim(),
      nombre: form.nombre.trim(),
      estado: 'activo',
      id_programa: Number(form.programa),
      id_instructor: form.instructorId === '' ? null : Number(form.instructorId),
      training_center_id: form.centroId === '' ? null : Number(form.centroId),
    }
    setGuardando(true)
    try {
      let codigoEfectivo = codigo
      try {
        await fichas.crear({ ...payload, codigo: codigoEfectivo })
      } catch (error) {
        const campos = toFieldErrors(error?.data)
        if (campos.codigo) {
          // Colisión del código aleatorio: regenerar y reintentar una vez.
          codigoEfectivo = generarCodigoFicha()
          setCodigo(codigoEfectivo)
          await fichas.crear({ ...payload, codigo: codigoEfectivo })
        } else if (campos.numero) {
          setErrores({ numero: campos.numero })
          return
        } else if (campos.id_programa) {
          setErrores({ programa: 'El programa no existe en el servidor.' })
          return
        } else if (campos.training_center_id) {
          setErrores({ centroId: 'El centro no existe en el servidor.' })
          return
        } else {
          setErrores({ numero: error?.data?.message || 'No se pudo crear la ficha en el servidor.' })
          return
        }
      }
      await recargar()
      setForm({ red: '', programa: '', nombre: '', numero: '', centroId: '', instructorId: '' })
      setErrores({})
      setCodigo(generarCodigoFicha())
      setCreando(false)
      mostrarCreada()
    } catch (error) {
      setErrores({ numero: error?.data?.message || 'No se pudo crear la ficha en el servidor.' })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <DashboardLayout role="admin" titulo={creando ? 'Crear Ficha' : 'Fichas'}>
      <div className={s.page}>
        <PageHeader
          title={creando ? 'Crear Ficha' : 'Fichas de formación'}
          subtitle={
            creando
              ? 'Registra una ficha y asigna su centro e instructor a cargo.'
              : 'Consulta todas las fichas de la plataforma y administra su información.'
          }
          icon={creando ? <Plus /> : <Books />}
          breadcrumb={
            creando
              ? [
                  { label: 'Dashboard', to: '/admin/dashboard', icon: <ChartBar size={14} /> },
                  { label: 'Fichas', icon: <Books size={14} />, onClick: () => setCreando(false) },
                  { label: 'Nueva ficha' },
                ]
              : [
                  { label: 'Dashboard', to: '/admin/dashboard' },
                  { label: 'Fichas' },
                ]
          }
          onBack={creando ? () => setCreando(false) : undefined}
          actions={
            !creando ? (
              <Button type="button" onClick={abrirCreacion}>
                <Plus size={14} /> Crear Ficha
              </Button>
            ) : undefined
          }
        />

        {creando ? (
          <DataPanel title="Datos de la ficha" icon={<Books />}>
            <form className={c.form} onSubmit={onSubmit} noValidate>
              <div className={c.grid2}>
                <FormField label="Red de conocimiento" required error={errores.red}>
                  <Select name="red" value={form.red} onChange={alCambiarRed}>
                    <option value="">Selecciona una red…</option>
                    {listaRedes.map((r) => (
                      <option key={r.id} value={String(r.id)}>
                        {r.nombre}
                      </option>
                    ))}
                  </Select>
                </FormField>

                <FormField label="Programa de formación" required error={errores.programa}>
                  <Select name="programa" value={form.programa} onChange={onChange} disabled={!form.red}>
                    <option value="">{form.red ? 'Selecciona un programa…' : 'Elige primero la red…'}</option>
                    {programasDeRed.map((p) => (
                      <option key={p.id} value={String(p.id)}>
                        {p.nombre}
                      </option>
                    ))}
                  </Select>
                </FormField>
              </div>

              <div className={c.grid2}>
                <FormField label="Centro de formación" required error={errores.centroId}>
                  <Select name="centroId" value={form.centroId} onChange={onChange}>
                    <option value="">Selecciona un centro…</option>
                    {listaCentros.map((ct) => (
                      <option key={ct.id} value={String(ct.id)}>
                        {ct.name}{ct.city ? ` · ${ct.city}` : ''}
                      </option>
                    ))}
                  </Select>
                </FormField>

                <FormField label="Instructor a cargo" required error={errores.instructorId}>
                  <Select name="instructorId" value={form.instructorId} onChange={onChange}>
                    <option value="">Selecciona un instructor…</option>
                    {instructoresActivos.map((i) => (
                      <option key={i.id} value={String(i.id)}>
                        {nombreCompleto(i.generalUser)}
                      </option>
                    ))}
                  </Select>
                </FormField>
              </div>

              <FormField label="Nombre de la ficha" required error={errores.nombre}>
                <Input
                  name="nombre"
                  value={form.nombre}
                  onChange={onChange}
                  placeholder="Ej. Análisis y Desarrollo 2718"
                  maxLength={MAX_NOMBRE}
                />
              </FormField>

              <FormField label="Número de ficha" required error={errores.numero} help="Solo dígitos, sin espacios. Ej. 3142101">
                <Input
                  name="numero"
                  inputMode="numeric"
                  value={form.numero}
                  onChange={onChange}
                  placeholder="Ej. 3142101"
                  maxLength={MAX_NUMERO_FICHA}
                />
              </FormField>

              <FormField
                label="Código de la ficha"
                help="El sistema genera un código único automáticamente."
              >
                <div className={c.codigoRow}>
                  <code className={c.codigo}>{codigo}</code>
                  <Button type="button" variant="ghost" onClick={regenerarCodigo}>
                    <ArrowClockwise size={14} /> Regenerar
                  </Button>
                </div>
              </FormField>

              <Actions form>
                <Button type="submit" disabled={guardando}>
                  <CheckCircle size={14} /> {guardando ? 'Creando…' : 'Crear ficha'}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setCreando(false)}>
                  Cancelar
                </Button>
              </Actions>
            </form>
          </DataPanel>
        ) : (
          <ApiState cargando={cargando} error={error} onReintentar={recargar}>
            {creadaMsg && (
              <Alert>
                <CheckCircle size={14} /> Ficha creada correctamente.
              </Alert>
            )}

            {accionMsg && (
              <Alert variant="danger"><Warning size={14} /> {accionMsg}</Alert>
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
                  placeholder="Nombre, código, número, programa o instructor…"
                />
              </label>
              <label className={s.field}>
                <span className={s.label}>Centro</span>
                <Select
                  value={filtroCentro}
                  onChange={(e) => {
                    setFiltroCentro(e.target.value)
                    setPagina(1)
                  }}
                >
                  <option value="todos">Todos</option>
                  {listaCentros.map((ct) => (
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
                  <option value="inactivo">Inactivo</option>
                  <option value="finalizado">Finalizado</option>
                  <option value="archivado">Archivado</option>
                </Select>
              </label>
              <label className={s.field}>
                <span className={s.label}>Instructor</span>
                <Select
                  value={filtroInstructor}
                  onChange={(e) => {
                    setFiltroInstructor(e.target.value)
                    setPagina(1)
                  }}
                >
                  <option value="todos">Todos</option>
                  {listaInstructores.map((i) => (
                    <option key={i.id} value={String(i.id)}>
                      {nombreCompleto(i.generalUser)}
                    </option>
                  ))}
                </Select>
              </label>
              <p className={s.info}>
                {filtradas.length} ficha{filtradas.length !== 1 ? 's' : ''}
              </p>
            </FilterBar>

            {paginadas.length === 0 ? (
              <EmptyState
                icon={<Books />}
                title="No hay fichas"
                message={
                  listaFichas.length === 0
                    ? 'Aún no se han creado fichas de formación. Crea la primera.'
                    : 'Ninguna ficha coincide con los filtros aplicados.'
                }
                actionLabel={listaFichas.length === 0 ? 'Crear primera ficha' : 'Limpiar filtros'}
                onAction={listaFichas.length === 0 ? abrirCreacion : limpiarFiltros}
              />
            ) : (
              <>
                <DataTable
                  ariaLabel="Fichas de formación"
                  columns={[
                    {
                      key: 'codigo',
                      header: 'Código',
                      render: (f) => <code className={s.codigo}>{f.codigo}</code>,
                    },
                    {
                      key: 'ficha',
                      header: 'Ficha',
                      render: (f) => (
                        <>
                          <span className={s.title}>{f.nombre}</span>
                          <br />
                          <span className={s.subText}>N° {f.numero} · {f.program?.nombre || 'Sin programa'}</span>
                        </>
                      ),
                    },
                    {
                      key: 'centro',
                      header: 'Centro',
                      render: (f) => {
                        const centro = f.trainingCenter || centrosPorId.get(Number(f.training_center_id))
                        return centro?.name || <span className={s.muted}>—</span>
                      },
                    },
                    {
                      key: 'instructor',
                      header: 'Instructor',
                      render: (f) => nombreCompleto(f.instructor?.generalUser) || <span className={s.muted}>Sin asignar</span>,
                    },
                    {
                      key: 'aprendices',
                      header: 'Aprendices',
                      render: (f) => <span className={s.count}>{(f.apprentices || []).length}</span>,
                    },
                    {
                      key: 'propuestas',
                      header: 'Propuestas',
                      render: (f) => <span className={s.count}>{propuestasPorFicha.get(Number(f.id)) || 0}</span>,
                    },
                    {
                      key: 'estado',
                      header: 'Estado',
                      render: (f) => (
                        <Badge variant={ESTADO_VARIANT[f.estado] || 'neutral'}>
                          {ESTADO_LABEL[f.estado] || f.estado}
                        </Badge>
                      ),
                    },
                    { key: 'created_at', header: 'Creada', render: (f) => fechaDesdeApi(f.created_at) },
                    {
                      key: 'acciones',
                      header: 'Acciones',
                      align: 'end',
                      render: (f) => {
                        const conDatos = (f.apprentices || []).length > 0 || (propuestasPorFicha.get(Number(f.id)) || 0) > 0
                        return (
                          <div className={s.actions}>
                            <Button
                              as="link"
                              to={`/admin/detalle-ficha/${f.id}`}
                              viewTransition
                              size="sm"
                              variant="secondary"
                            >
                              <Eye size={14} /> Ver
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="danger"
                              disabled={conDatos}
                              title={conDatos ? 'No se puede eliminar: tiene aprendices o propuestas asociadas' : undefined}
                              onClick={() => setAEliminar(f)}
                            >
                              <Trash size={14} /> Eliminar
                            </Button>
                          </div>
                        )
                      },
                    },
                  ]}
                  rows={paginadas}
                  keyOf={(f) => f.id}
                />

                <Pagination
                  totalItems={filtradas.length}
                  itemsPerPage={ITEMS_POR_PAGINA}
                  paginaActual={pagina}
                  setPaginaActual={setPagina}
                  itemName="fichas"
                  filteredCount={filtradas.length}
                />
              </>
            )}
          </ApiState>
        )}
      </div>

      <ConfirmModal
        open={!!aEliminar}
        titulo="Eliminar ficha"
        mensaje={
          aEliminar
                ? `¿Seguro que deseas eliminar la ficha "${aEliminar.nombre}" (${aEliminar.codigo})? Solo se permite si no tiene aprendices ni propuestas. Esta acción no se puede deshacer.`
            : ''
        }
        textoConfirmar="Sí, eliminar"
        textoCancelar="Cancelar"
        onConfirmar={confirmarEliminar}
        onCancelar={() => setAEliminar(null)}
      />
    </DashboardLayout>
  )
}
