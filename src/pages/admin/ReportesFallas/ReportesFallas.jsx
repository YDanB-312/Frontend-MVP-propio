import { useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PageHeader from '../../../components/PageHeader/PageHeader'
import FilterBar from '../../../components/FilterBar/FilterBar'
import Badge from '../../../components/Badge/Badge'
import Pagination from '../../../components/Pagination/Pagination'
import EmptyState from '../../../components/EmptyState/EmptyState'
import { getAllBugReports, displayNames } from '../../../data/mockData'
import s from './ReportesFallas.module.css'
import { Bug, Eye } from 'phosphor-react'

const ITEMS_POR_PAGINA = 8

const ESTADO_VARIANT = {
  pendiente: 'warning',
  en_revision: 'info',
  resuelto: 'success',
  cerrado: 'neutral',
  rechazado: 'danger',
}

const PRIORIDAD_POR_TIPO = {
  sistema: { label: 'Alta', variant: 'danger' },
  proyecto: { label: 'Media', variant: 'warning' },
  datos: { label: 'Media', variant: 'warning' },
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
            <select
              className={s.select}
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
            </select>
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
                    const prioridad = PRIORIDAD_POR_TIPO[r.tipo] || PRIORIDAD_POR_TIPO.otro
                    return (
                      <tr key={r.id}>
                        <td>
                          <Link to={`/admin/detalle-reporte/${r.id}`} className={s.titleLink}>
                            {r.titulo}
                          </Link>
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
                          <Link
                            to={`/admin/detalle-reporte/${r.id}`}
                            className={`${s.btn} ${s.secondary}`}
                          >
                            <Eye size={14} /> Ver
                          </Link>
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
