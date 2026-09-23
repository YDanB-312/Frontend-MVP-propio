import { useState } from 'react'
import { FolderOpen, Eye } from 'phosphor-react'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PageHeader from '../../../components/PageHeader/PageHeader'
import FilterBar from '../../../components/FilterBar/FilterBar'
import StatusMark from '../../../components/StatusMark/StatusMark'
import { PROPUESTA_STATUS } from '../../../constants/estadoStatus'
import Button from '../../../components/Button/Button'
import { Input, Select } from '../../../components/Input/Input'
import Pagination from '../../../components/Pagination/Pagination'
import EmptyState from '../../../components/EmptyState/EmptyState'
import DataTable from '../../../components/DataTable/DataTable'
import GradeBadge from '../../../components/GradeBadge/GradeBadge'
import ApiState from '../../../components/ApiState/ApiState'
import { norm, fechaDesdeApi } from '../../../utils/helpers'
import { useApi } from '../../../lib/useApi'
import { proyectos, similitudes, programas, fichas } from '../../../lib/recursos'
import s from '../../../components/ListaBase/ListaBase.module.css'
import { PAGINA_TABLA } from '../../../constants/pagination'

const ITEMS_POR_PAGINA = PAGINA_TABLA

const ESTADO_LABEL = { pendiente: 'Pendiente', aprobado: 'Aprobado', rechazado: 'Rechazado' }

// Concatena nombre + apellido de un general_user.
function nombreCompleto(usuario) {
  return [usuario?.nombre, usuario?.apellido].filter(Boolean).join(' ').trim()
}

export default function ProyectosAdmin() {
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroFicha, setFiltroFicha] = useState('todos')
  const [filtroPrograma, setFiltroPrograma] = useState('todos')
  const [filtroInstructor, setFiltroInstructor] = useState('todos')
  const [filtroArea, setFiltroArea] = useState('todos')
  const [minSim, setMinSim] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [pagina, setPagina] = useState(1)

  // Fuente única: la API. Propuestas + similitudes + catálogos de filtro.
  const { data, cargando, error, recargar } = useApi(
    async () => {
      const [listaProyectos, listaSimilitudes, listaProgramas, listaFichas] = await Promise.all([
        proyectos.listar(),
        similitudes.listar(),
        programas.listar(),
        fichas.listar('program'),
      ])
      return { listaProyectos, listaSimilitudes, listaProgramas, listaFichas }
    },
    [],
    { inicial: null }
  )

  const listaProyectos = data?.listaProyectos || []
  const listaSimilitudes = data?.listaSimilitudes || []
  const listaProgramas = data?.listaProgramas || []
  const listaFichas = data?.listaFichas || []

  const fichasFiltro = listaFichas
  const programasFiltro = [...new Set(listaProgramas.map((p) => p.nombre))].sort()
  const instructoresFiltro = [...new Map(
    listaProyectos
      .filter((p) => p.id_instructor_asignado && p.instructor?.generalUser)
      .map((p) => [Number(p.id_instructor_asignado), nombreCompleto(p.instructor.generalUser)])
  ).entries()]
  const areasFiltro = [...new Set(listaProyectos.map((p) => p.area_aplicacion).filter(Boolean))].sort()

  // Máximo porcentaje y conteo de coincidencias por propuesta.
  const simInfo = {}
  for (const sim of listaSimilitudes) {
    const pct = Math.round(Number(sim.porcentaje) || 0)
    for (const pid of [sim.id_proyecto_1, sim.id_proyecto_2]) {
      if (!simInfo[pid]) simInfo[pid] = { pct, count: 0 }
      if (pct > simInfo[pid].pct) simInfo[pid].pct = pct
      simInfo[pid].count += 1
    }
  }

  const filtrados = listaProyectos.filter((p) => {
    const q = norm(busqueda.trim())
    const coincideQ = !q || norm(p.titulo).includes(q) || norm(nombreCompleto(p.creator)).includes(q)
    const coincideEstado = filtroEstado === 'todos' || p.estado === filtroEstado
    const fichaP = p.classGroup || null
    const coincideFicha =
      filtroFicha === 'todos' ||
      (filtroFicha === 'sin'
        ? !p.id_class_group
        : String(p.id_class_group || '') === String(filtroFicha))
    const coincidePrograma = filtroPrograma === 'todos' || (fichaP && fichaP.program?.nombre === filtroPrograma)
    const coincideInstructor = filtroInstructor === 'todos' || String(p.id_instructor_asignado || '') === String(filtroInstructor)
    const coincideArea = filtroArea === 'todos' || p.area_aplicacion === filtroArea
    const coincideSim = !minSim || (simInfo[p.id]?.pct || 0) >= Number(minSim)
    const fecha = String(p.created_at || '').slice(0, 10)
    const coincideFecha = (!desde || fecha >= desde) && (!hasta || fecha <= hasta)
    return coincideQ && coincideEstado && coincideFicha && coincidePrograma
      && coincideInstructor && coincideArea && coincideSim && coincideFecha
  })

  const paginados = filtrados.slice(
    (pagina - 1) * ITEMS_POR_PAGINA,
    pagina * ITEMS_POR_PAGINA
  )

  const limpiarFiltros = () => {
    setBusqueda('')
    setFiltroEstado('todos')
    setFiltroFicha('todos')
    setFiltroPrograma('todos')
    setFiltroInstructor('todos')
    setFiltroArea('todos')
    setMinSim('')
    setDesde('')
    setHasta('')
    setPagina(1)
  }

  return (
    <DashboardLayout role="admin" titulo="Propuestas">
      <div className={s.page}>
        <PageHeader
          title="Propuestas"
          subtitle="Consulta y supervisa todas las propuestas registradas en la plataforma."
          icon={<FolderOpen />}
          breadcrumb={[
            { label: 'Dashboard', to: '/admin/dashboard' },
            { label: 'Propuestas' },
          ]}
        />

        <ApiState cargando={cargando} error={error} onReintentar={recargar}>
          <FilterBar title="Buscar y filtrar">
            <label className={s.field}>
              <span className={s.label}>Buscar</span>
              <Input
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value)
                  setPagina(1)
                }}
                placeholder="Título o aprendiz…"
              />
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
                <option value="pendiente">{ESTADO_LABEL.pendiente}</option>
                <option value="aprobado">{ESTADO_LABEL.aprobado}</option>
                <option value="rechazado">{ESTADO_LABEL.rechazado}</option>
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
                {programasFiltro.map((prog) => (
                  <option key={prog} value={prog}>
                    {prog}
                  </option>
                ))}
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
                <option value="sin">Sin ficha</option>
                {fichasFiltro.map((f) => (
                  <option key={f.id} value={String(f.id)}>
                    {f.codigo} · {f.nombre}
                  </option>
                ))}
              </Select>
            </label>
            <label className={s.field}>
              <span className={s.label}>Instructor</span>
              <Select
                value={filtroInstructor}
                onChange={(e) => { setFiltroInstructor(e.target.value); setPagina(1) }}
              >
                <option value="todos">Todos</option>
                {instructoresFiltro.map(([id, nombre]) => (
                  <option key={id} value={String(id)}>{nombre}</option>
                ))}
              </Select>
            </label>
            <label className={s.field}>
              <span className={s.label}>Área</span>
              <Select
                value={filtroArea}
                onChange={(e) => { setFiltroArea(e.target.value); setPagina(1) }}
              >
                <option value="todos">Todas</option>
                {areasFiltro.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </Select>
            </label>
            <label className={s.field}>
              <span className={s.label}>% mínimo</span>
              <Input
                type="number"
                min={0}
                max={100}
                value={minSim}
                onChange={(e) => { setMinSim(e.target.value); setPagina(1) }}
                placeholder="Ej. 40"
              />
            </label>
            <label className={s.field}>
              <span className={s.label}>Desde</span>
              <Input type="date" value={desde} onChange={(e) => { setDesde(e.target.value); setPagina(1) }} />
            </label>
            <label className={s.field}>
              <span className={s.label}>Hasta</span>
              <Input type="date" value={hasta} onChange={(e) => { setHasta(e.target.value); setPagina(1) }} />
            </label>
            <p className={s.info}>
              {filtrados.length} proyecto{filtrados.length !== 1 ? 's' : ''}
            </p>
          </FilterBar>

          {paginados.length === 0 ? (
            <EmptyState
              icon={<FolderOpen />}
              title="Sin propuestas"
              message={
                listaProyectos.length === 0
                  ? 'Todavía no hay propuestas registradas.'
                  : 'Ninguna propuesta coincide con los filtros aplicados.'
              }
              actionLabel={listaProyectos.length === 0 ? undefined : 'Limpiar filtros'}
              onAction={listaProyectos.length === 0 ? undefined : limpiarFiltros}
            />
          ) : (
            <>
              <DataTable
                ariaLabel="Propuestas registradas"
                columns={[
                  {
                    key: 'propuesta',
                    header: 'Propuesta',
                    render: (p) => (
                      <>
                        <span className={s.title}>{p.titulo}</span>
                        <br />
                        <span className={s.subText}>{p.area_aplicacion}</span>
                      </>
                    ),
                  },
                  { key: 'aprendiz', header: 'Aprendiz', render: (p) => nombreCompleto(p.creator) || '—' },
                  { key: 'created_at', header: 'Fecha', render: (p) => fechaDesdeApi(p.created_at) },
                  {
                    key: 'similitud',
                    header: 'Similitud',
                    render: (p) => {
                      const info = simInfo[p.id]
                      if (!info) return <span className={s.muted}>—</span>
                      return (
                        <span title={`${info.pct}% · ${info.count}`}>
                          <GradeBadge score={info.pct} size="sm" />
                        </span>
                      )
                    },
                  },
                  {
                    key: 'programa',
                    header: 'Programa',
                    render: (p) => p.classGroup?.program?.nombre || <span className={s.muted}>—</span>,
                  },
                  {
                    key: 'estado',
                    header: 'Estado',
                    render: (p) => (
                      <StatusMark status={PROPUESTA_STATUS[p.estado] || 'pending'} label={ESTADO_LABEL[p.estado] || p.estado} />
                    ),
                  },
                  {
                    key: 'acciones',
                    header: 'Acciones',
                    align: 'end',
                    render: (p) => (
                      <Button
                        as="link"
                        to={`/admin/detalle-proyecto/${p.id}`}
                        viewTransition
                        size="sm"
                        variant="secondary"
                      >
                        <Eye size={14} /> Ver
                      </Button>
                    ),
                  },
                ]}
                rows={paginados}
                keyOf={(p) => p.id}
              />

              <Pagination
                totalItems={filtrados.length}
                itemsPerPage={ITEMS_POR_PAGINA}
                paginaActual={pagina}
                setPaginaActual={setPagina}
                itemName="propuestas"
                filteredCount={filtrados.length}
              />
            </>
          )}
        </ApiState>
      </div>
    </DashboardLayout>
  )
}
