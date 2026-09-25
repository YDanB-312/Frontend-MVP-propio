import { useState } from 'react'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PageHeader from '../../../components/PageHeader/PageHeader'
import FilterBar from '../../../components/FilterBar/FilterBar'
import Badge from '../../../components/Badge/Badge'
import StatusMark from '../../../components/StatusMark/StatusMark'
import { REPORTE_STATUS } from '../../../constants/estadoStatus'
import Button from '../../../components/Button/Button'
import { Input, Select } from '../../../components/Input/Input'
import Pagination from '../../../components/Pagination/Pagination'
import EmptyState from '../../../components/EmptyState/EmptyState'
import DataTable from '../../../components/DataTable/DataTable'
import ApiState from '../../../components/ApiState/ApiState'
import ConfirmModal from '../../../components/ConfirmModal/ConfirmModal'
import { norm, fechaDesdeApi } from '../../../utils/helpers'
import { useApi } from '../../../lib/useApi'
import { reportes } from '../../../lib/recursos'
import s from '../../../components/ListaBase/ListaBase.module.css'
import { Bug, Eye, Trash } from 'phosphor-react'
import { PAGINA_TABLA } from '../../../constants/pagination'

const ITEMS_POR_PAGINA = PAGINA_TABLA

const ESTADO_LABEL = {
  pendiente: 'Pendiente',
  en_revision: 'En Revisión',
  resuelto: 'Resuelto',
  cerrado: 'Cerrado',
  rechazado: 'Rechazado',
}

const TIPO_LABEL = {
  sistema: 'Sistema',
  proyecto: 'Proyecto',
  datos: 'Datos',
  bug_ui: 'Interfaz',
  error_datos: 'Error de datos',
  rendimiento: 'Rendimiento',
  seguridad: 'Seguridad',
  otro: 'Otro',
}

const PRIORIDAD_META = {
  baja: { label: 'Baja', variant: 'neutral' },
  media: { label: 'Media', variant: 'warning' },
  alta: { label: 'Alta', variant: 'danger' },
  critica: { label: 'Crítica', variant: 'danger' },
}

// La API no guarda prioridad: se deriva del tipo de reporte.
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

// Concatena nombre + apellido de un general_user.
function nombreCompleto(usuario) {
  return [usuario?.nombre, usuario?.apellido].filter(Boolean).join(' ').trim()
}

export default function ReportesFallas() {
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [filtroPrioridad, setFiltroPrioridad] = useState('todos')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [pagina, setPagina] = useState(1)
  const [aEliminar, setAEliminar] = useState(null)

  // Fuente única: la API. Reportes con su usuario incluido.
  const { data, cargando, error, recargar } = useApi(
    () => reportes.listar('generalUser'),
    [],
    { inicial: [] }
  )

  const listaReportes = data || []

  async function confirmarEliminar() {
    if (!aEliminar) return
    try {
      await reportes.eliminar(aEliminar.id)
      setAEliminar(null)
      await recargar()
    } catch {
      setAEliminar(null)
    }
  }

  const reporterDe = (r) => nombreCompleto(r.generalUser) || `Usuario #${r.id_usuario}`

  const clavePrioridad = (r) => {
    const porTipo = PRIORIDAD_POR_TIPO[r.tipo]?.label || 'Media'
    return Object.entries(PRIORIDAD_META).find(([, m]) => m.label === porTipo)?.[0] || 'media'
  }

  const tiposFiltro = [...new Set(listaReportes.map((r) => r.tipo))].sort()

  const filtrados = listaReportes.filter((r) => {
    const q = norm(busqueda.trim())
    const coincideQ =
      !q ||
      norm(r.titulo).includes(q) ||
      norm(`#${r.id}`).includes(q) ||
      norm(r.descripcion).includes(q) ||
      norm(reporterDe(r)).includes(q)
    const coincideEstado = filtroEstado === 'todos' || r.estado === filtroEstado
    const coincideTipo = filtroTipo === 'todos' || r.tipo === filtroTipo
    const coincidePrioridad = filtroPrioridad === 'todos' || clavePrioridad(r) === filtroPrioridad
    // Rango de fechas (fecha date-only en formato YYYY-MM-DD: comparable como texto).
    const fecha = String(r.fecha || '').slice(0, 10)
    const coincideDesde = !fechaDesde || (fecha && fecha >= fechaDesde)
    const coincideHasta = !fechaHasta || (fecha && fecha <= fechaHasta)
    return coincideQ && coincideEstado && coincideTipo && coincidePrioridad && coincideDesde && coincideHasta
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
    setFechaDesde('')
    setFechaHasta('')
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
                    {TIPO_LABEL[t] || t}
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
            <label className={s.field}>
              <span className={s.label}>Desde</span>
              <Input
                type="date"
                value={fechaDesde}
                onChange={(e) => {
                  setFechaDesde(e.target.value)
                  setPagina(1)
                }}
              />
            </label>
            <label className={s.field}>
              <span className={s.label}>Hasta</span>
              <Input
                type="date"
                value={fechaHasta}
                onChange={(e) => {
                  setFechaHasta(e.target.value)
                  setPagina(1)
                }}
              />
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
                listaReportes.length === 0
                  ? 'No hay reportes de fallas registrados. ¡Buen momento para celebrar!'
                  : 'Ningún reporte coincide con los filtros aplicados.'
              }
              actionLabel={listaReportes.length === 0 ? undefined : 'Limpiar filtros'}
              onAction={listaReportes.length === 0 ? undefined : limpiarFiltros}
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
                  { key: 'reportante', header: 'Reportante', render: (r) => reporterDe(r) },
                  {
                    key: 'tipo',
                    header: 'Tipo',
                    render: (r) => (
                      <Badge variant="info">{TIPO_LABEL[r.tipo] || r.tipo}</Badge>
                    ),
                  },
                  {
                    key: 'prioridad',
                    header: 'Prioridad',
                    render: (r) => {
                      const prioridad = PRIORIDAD_POR_TIPO[r.tipo] || PRIORIDAD_META.media
                      return <Badge variant={prioridad.variant}>{prioridad.label}</Badge>
                    },
                  },
                  {
                    key: 'estado',
                    header: 'Estado',
                    render: (r) => (
                      <StatusMark status={REPORTE_STATUS[r.estado] || 'pending'} label={ESTADO_LABEL[r.estado] || r.estado} />
                    ),
                  },
                  { key: 'fecha', header: 'Fecha', render: (r) => fechaDesdeApi(r.fecha) },
                  {
                    key: 'acciones',
                    header: 'Acciones',
                    align: 'end',
                    render: (r) => (
                      <span className={s.actions}>
                        <Button
                          as="link"
                          to={`/admin/detalle-reporte/${r.id}`}
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
                          onClick={() => setAEliminar(r)}
                        >
                          <Trash size={14} /> Eliminar
                        </Button>
                      </span>
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
        </ApiState>
      </div>

      <ConfirmModal
        open={!!aEliminar}
        titulo="Eliminar reporte"
        mensaje="¿Seguro que deseas eliminar este reporte de falla? Esta acción no se puede deshacer."
        textoConfirmar="Sí, eliminar"
        responsabilidad
        onConfirmar={confirmarEliminar}
        onCancelar={() => setAEliminar(null)}
      />
    </DashboardLayout>
  )
}
