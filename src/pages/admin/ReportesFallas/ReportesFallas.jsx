import { useState } from 'react'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PageHeader from '../../../components/PageHeader/PageHeader'
import FilterBar from '../../../components/FilterBar/FilterBar'
import Badge from '../../../components/Badge/Badge'
import Button from '../../../components/Button/Button'
import { Input, Select } from '../../../components/Input/Input'
import Pagination from '../../../components/Pagination/Pagination'
import EmptyState from '../../../components/EmptyState/EmptyState'
import DataTable from '../../../components/DataTable/DataTable'
import { norm } from '../../../utils/helpers'
import { getAllBugReports, displayNames } from '../../../data/mockData'
import s from '../../../components/ListaBase/ListaBase.module.css'
import { Bug, Eye } from 'phosphor-react'
import { PAGINA_TABLA } from '../../../constants/pagination'

const ITEMS_POR_PAGINA = PAGINA_TABLA

const ESTADO_VARIANT = {
  pendiente: 'warning',
  en_revision: 'info',
  resuelto: 'success',
  cerrado: 'neutral',
  rechazado: 'danger',
}

const PRIORIDAD_META = {
  baja: { label: 'Baja', variant: 'neutral' },
  media: { label: 'Media', variant: 'warning' },
  alta: { label: 'Alta', variant: 'danger' },
  critica: { label: 'Crítica', variant: 'danger' },
}

const PRIORIDAD_POR_TIPO = {
  sistema: { label: 'Alta', variant: 'danger' },
  proyecto: { label: 'Media', variant: 'warning' },
  datos: { label: 'Media', variant: 'warning' },
  bug_ui: { label: 'Media', variant: 'warning' },
  error_datos: { label: 'Alta', variant: 'danger' },
  rendimiento: { label: 'Alta', variant: 'danger' },
  seguridad: { label: 'Crítica', variant: 'danger' },
  otro: { label: 'Baja', variant: 'neutral' },
}

export default function ReportesFallas() {
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [filtroPrioridad, setFiltroPrioridad] = useState('todos')
  const [pagina, setPagina] = useState(1)

  const reportes = getAllBugReports()

  const clavePrioridad = (r) => {
    if (r.prioridad && PRIORIDAD_META[r.prioridad]) return r.prioridad
    const porTipo = PRIORIDAD_POR_TIPO[r.tipo]?.label || 'Media'
    return Object.entries(PRIORIDAD_META).find(([, m]) => m.label === porTipo)?.[0] || 'media'
  }

  const tiposFiltro = [...new Set(reportes.map((r) => r.tipo))].sort()

  const filtrados = reportes.filter((r) => {
    const q = norm(busqueda.trim())
    const coincideQ =
      !q ||
      norm(r.titulo).includes(q) ||
      norm(`#${r.id}`).includes(q) ||
      norm(r.reporterName).includes(q)
    const coincideEstado = filtroEstado === 'todos' || r.estado === filtroEstado
    const coincideTipo = filtroTipo === 'todos' || r.tipo === filtroTipo
    const coincidePrioridad = filtroPrioridad === 'todos' || clavePrioridad(r) === filtroPrioridad
    return coincideQ && coincideEstado && coincideTipo && coincidePrioridad
  })

  const paginados = filtrados.slice(
    (pagina - 1) * ITEMS_POR_PAGINA,
    pagina * ITEMS_POR_PAGINA
  )

  const limpiarFiltros = () => {
    setBusqueda('')
    setFiltroEstado('todos')
    setFiltroTipo('todos')
    setFiltroPrioridad('todos')
    setPagina(1)
  }

  return (
    <DashboardLayout role="admin" titulo="Reportes de Fallas">
      <div className={s.page}>
        <PageHeader
          title="Reportes de Fallas"
          subtitle="Da seguimiento a los problemas reportados por los usuarios de la plataforma."
          icon={<Bug />}
          breadcrumb={[
            { label: 'Dashboard', to: '/admin/dashboard' },
            { label: 'Reportes de Fallas' },
          ]}
        />

        <FilterBar title="Buscar y filtrar">
          <label className={s.field}>
            <span className={s.label}>Buscar</span>
            <Input
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value)
                setPagina(1)
              }}
              placeholder="Título, #id o reportante…"
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
              <option value="pendiente">Pendiente</option>
              <option value="en_revision">En Revisión</option>
              <option value="resuelto">Resuelto</option>
              <option value="cerrado">Cerrado</option>
              <option value="rechazado">Rechazado</option>
            </Select>
          </label>
          <label className={s.field}>
            <span className={s.label}>Tipo</span>
            <Select
              value={filtroTipo}
              onChange={(e) => {
                setFiltroTipo(e.target.value)
                setPagina(1)
              }}
            >
              <option value="todos">Todos</option>
              {tiposFiltro.map((t) => (
                <option key={t} value={t}>
                  {displayNames.bugReportType[t] || t}
                </option>
              ))}
            </Select>
          </label>
          <label className={s.field}>
            <span className={s.label}>Prioridad</span>
            <Select
              value={filtroPrioridad}
              onChange={(e) => {
                setFiltroPrioridad(e.target.value)
                setPagina(1)
              }}
            >
              <option value="todos">Todas</option>
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
              <option value="critica">Crítica</option>
            </Select>
          </label>
          <p className={s.info}>
            {filtrados.length} reporte{filtrados.length !== 1 ? 's' : ''}
          </p>
        </FilterBar>

        {paginados.length === 0 ? (
          <EmptyState
          icon={<Bug />}
            title="Sin reportes"
            message={
              reportes.length === 0
                ? 'No hay reportes de fallas registrados. ¡Buen momento para celebrar!'
                : 'Ningún reporte coincide con los filtros aplicados.'
            }
            actionLabel={reportes.length === 0 ? undefined : 'Limpiar filtros'}
            onAction={reportes.length === 0 ? undefined : limpiarFiltros}
          />
        ) : (
          <>
            <DataTable
              ariaLabel="Reportes de fallas"
              columns={[
                {
                  key: 'reporte',
                  header: 'Reporte',
                  render: (r) => (
                    <>
                      <span className={s.title}>{r.titulo}</span>
                      <br />
                      <span className={s.subText}>#{r.id}</span>
                    </>
                  ),
                },
                { key: 'reporterName', header: 'Reportante' },
                {
                  key: 'tipo',
                  header: 'Tipo',
                  render: (r) => (
                    <Badge variant="info">{displayNames.bugReportType[r.tipo] || r.tipo}</Badge>
                  ),
                },
                {
                  key: 'prioridad',
                  header: 'Prioridad',
                  render: (r) => {
                    const prioridad = (r.prioridad && PRIORIDAD_META[r.prioridad]) || PRIORIDAD_POR_TIPO[r.tipo] || PRIORIDAD_META.media
                    return <Badge variant={prioridad.variant}>{prioridad.label}</Badge>
                  },
                },
                {
                  key: 'estado',
                  header: 'Estado',
                  render: (r) => (
                    <Badge variant={ESTADO_VARIANT[r.estado] || 'neutral'}>
                      {displayNames.bugReportStatus[r.estado] || r.estado}
                    </Badge>
                  ),
                },
                { key: 'createdAt', header: 'Fecha' },
                {
                  key: 'acciones',
                  header: 'Acciones',
                  align: 'end',
                  render: (r) => (
                    <Button
                      as="link"
                      to={`/admin/detalle-reporte/${r.id}`}
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
              keyOf={(r) => r.id}
            />

            <Pagination
              totalItems={filtrados.length}
              itemsPerPage={ITEMS_POR_PAGINA}
              paginaActual={pagina}
              setPaginaActual={setPagina}
              itemName="reportes"
              filteredCount={filtrados.length}
            />
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
