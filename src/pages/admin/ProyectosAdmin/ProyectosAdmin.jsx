import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FolderOpen, Eye, MagnifyingGlass } from 'phosphor-react'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PageHeader from '../../../components/PageHeader/PageHeader'
import FilterBar from '../../../components/FilterBar/FilterBar'
import Badge from '../../../components/Badge/Badge'
import Pagination from '../../../components/Pagination/Pagination'
import EmptyState from '../../../components/EmptyState/EmptyState'
import {
  getAllProjects,
  getAllSimilarities,
  displayNames,
} from '../../../data/mockData'
import s from './ProyectosAdmin.module.css'

const ITEMS_POR_PAGINA = 8

const ESTADO_VARIANT = {
  borrador: 'neutral',
  pendiente: 'warning',
  en_revision: 'info',
  aprobado: 'success',
  rechazado: 'danger',
  requiere_ajustes: 'warning',
  en_progreso: 'info',
  completado: 'success',
  cancelado: 'danger',
}

export default function ProyectosAdmin() {
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [pagina, setPagina] = useState(1)

  const proyectos = getAllProjects()

  const simInfo = {}
  for (const sim of getAllSimilarities()) {
    const pct = Math.round((sim.similitud || 0) * 100)
    for (const pid of [sim.projectId1, sim.projectId2]) {
      if (!simInfo[pid]) simInfo[pid] = { pct, count: 0 }
      if (pct > simInfo[pid].pct) simInfo[pid].pct = pct
      simInfo[pid].count += 1
    }
  }

  const filtrados = proyectos.filter((p) => {
    const q = busqueda.trim().toLowerCase()
    const coincideQ =
      !q ||
      p.title.toLowerCase().includes(q) ||
      (p.studentName || '').toLowerCase().includes(q)
    const coincideEstado = filtroEstado === 'todos' || p.estado === filtroEstado
    return coincideQ && coincideEstado
  })

  const paginados = filtrados.slice(
    (pagina - 1) * ITEMS_POR_PAGINA,
    pagina * ITEMS_POR_PAGINA
  )

  return (
    <DashboardLayout role="admin" titulo="Proyectos">
      <div className={s.page}>
        <PageHeader
          title="Proyectos"
          subtitle="Consulta y supervisa todas las propuestas de proyecto registradas en la plataforma."
          icon={<FolderOpen />}
        />

        <FilterBar title="Buscar y filtrar">
          <label className={s.field}>
            <span className={s.label}>Buscar</span>
            <input
              className={s.input}
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
            <select
              className={s.select}
              value={filtroEstado}
              onChange={(e) => {
                setFiltroEstado(e.target.value)
                setPagina(1)
              }}
            >
              <option value="todos">Todos</option>
              {Object.entries(displayNames.projectStatus).map(([valor, etiqueta]) => (
                <option key={valor} value={valor}>
                  {etiqueta}
                </option>
              ))}
            </select>
          </label>
          <p className={s.info}>
            {filtrados.length} proyecto{filtrados.length !== 1 ? 's' : ''}
          </p>
        </FilterBar>

        {paginados.length === 0 ? (
          <EmptyState
            icon={<FolderOpen />}
            title="Sin proyectos"
            message={
              proyectos.length === 0
                ? 'Todavía no hay proyectos registrados.'
                : 'Ningún proyecto coincide con los filtros aplicados.'
            }
          />
        ) : (
          <>
            <div className={s.tableWrap}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>Proyecto</th>
                    <th>Aprendiz</th>
                    <th>Fecha</th>
                    <th>Similitud</th>
                    <th>Estado</th>
                    <th className={s.colActions}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginados.map((p) => {
                    const info = simInfo[p.id]
                    return (
                      <tr key={p.id}>
                        <td>
                          <Link to={`/admin/detalle-proyecto/${p.id}`} className={s.titleLink}>
                            {p.title}
                          </Link>
                          <span className={s.subText}>{p.areaAplicacion}</span>
                        </td>
                        <td className={s.text}>{p.studentName}</td>
                        <td className={s.date}>{p.createdAt}</td>
                        <td>
                          {info ? (
                            <Badge variant={info.pct >= 70 ? 'danger' : info.pct >= 40 ? 'warning' : 'success'}>
                              <MagnifyingGlass size={12} /> {info.pct}% · {info.count}
                            </Badge>
                          ) : (
                            <span className={s.muted}>—</span>
                          )}
                        </td>
                        <td>
                          <Badge variant={ESTADO_VARIANT[p.estado] || 'neutral'}>
                            {displayNames.projectStatus[p.estado] || p.estado}
                          </Badge>
                        </td>
                        <td className={s.colActions}>
                          <Link
                            to={`/admin/detalle-proyecto/${p.id}`}
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
              itemName="proyectos"
              filteredCount={filtrados.length}
            />
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
