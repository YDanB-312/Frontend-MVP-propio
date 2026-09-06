import { useState } from 'react'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PageHeader from '../../../components/PageHeader/PageHeader'
import FilterBar from '../../../components/FilterBar/FilterBar'
import Badge from '../../../components/Badge/Badge'
import Button from '../../../components/Button/Button'
import { Select } from '../../../components/Input/Input'
import Pagination from '../../../components/Pagination/Pagination'
import EmptyState from '../../../components/EmptyState/EmptyState'
import { getAllBugReports, displayNames } from '../../../data/mockData'
import s from '../../../components/ListaBase/ListaBase.module.css'
import { Bug, Eye } from 'phosphor-react'

const ITEMS_POR_PAGINA = 8

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
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [pagina, setPagina] = useState(1)

  const reportes = getAllBugReports()

  const filtrados =
    filtroEstado === 'todos' ? reportes : reportes.filter((r) => r.estado === filtroEstado)

  const paginados = filtrados.slice(
    (pagina - 1) * ITEMS_POR_PAGINA,
    pagina * ITEMS_POR_PAGINA
  )

  return (
    <DashboardLayout role="admin" titulo="Reportes de Fallas">
      <div className={s.page}>
        <PageHeader
          title="Reportes de Fallas"
          subtitle="Da seguimiento a los problemas reportados por los usuarios de la plataforma."
          icon={<Bug />}
        />

        <FilterBar title="Filtrar por estado">
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
                : 'No hay reportes con el estado seleccionado.'
            }
          />
        ) : (
          <>
            <div className={s.tableWrap}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>Reporte</th>
                    <th>Reportante</th>
                    <th>Tipo</th>
                    <th>Prioridad</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                    <th className={s.colActions}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginados.map((r) => {
                    const prioridad = (r.prioridad && PRIORIDAD_META[r.prioridad]) || PRIORIDAD_POR_TIPO[r.tipo] || PRIORIDAD_META.media
                    return (
                      <tr key={r.id}>
                        <td>
                          <span className={s.title}>{r.titulo}</span>
                          <span className={s.subText}>#{r.id}</span>
                        </td>
                        <td className={s.text}>{r.reporterName}</td>
                        <td>
                          <Badge variant="info">{displayNames.bugReportType[r.tipo] || r.tipo}</Badge>
                        </td>
                        <td>
                          <Badge variant={prioridad.variant}>{prioridad.label}</Badge>
                        </td>
                        <td>
                          <Badge variant={ESTADO_VARIANT[r.estado] || 'neutral'}>
                            {displayNames.bugReportStatus[r.estado] || r.estado}
                          </Badge>
                        </td>
                        <td className={s.date}>{r.createdAt}</td>
                        <td className={s.colActions}>
                          <Button
                            as="link"
                            to={`/admin/detalle-reporte/${r.id}`}
                            size="sm"
                            variant="secondary"
                          >
                            <Eye size={14} /> Ver
                          </Button>
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
              itemName="reportes"
              filteredCount={filtrados.length}
            />
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
