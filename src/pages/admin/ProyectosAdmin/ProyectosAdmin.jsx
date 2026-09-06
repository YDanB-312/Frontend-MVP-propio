import { useState } from 'react'
import { FolderOpen, Eye, MagnifyingGlass } from 'phosphor-react'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PageHeader from '../../../components/PageHeader/PageHeader'
import FilterBar from '../../../components/FilterBar/FilterBar'
import Badge from '../../../components/Badge/Badge'
import Button from '../../../components/Button/Button'
import { Input, Select } from '../../../components/Input/Input'
import Pagination from '../../../components/Pagination/Pagination'
import EmptyState from '../../../components/EmptyState/EmptyState'
import {
  getAllProjects,
  getSimilitudesValidas,
  displayNames,
} from '../../../data/mockData'
import s from '../../../components/ListaBase/ListaBase.module.css'

const ITEMS_POR_PAGINA = 8

const ESTADO_VARIANT = {
  pendiente: 'warning',
  aprobado: 'success',
  rechazado: 'danger',
}

export default function ProyectosAdmin() {
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [pagina, setPagina] = useState(1)

  const proyectos = getAllProjects()

  // Solo similitudes válidas (intra-programa + al menos un aprobado), como el resto del admin
  const simInfo = {}
  for (const sim of getSimilitudesValidas()) {
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
    <DashboardLayout role="admin" titulo="Propuestas">
      <div className={s.page}>
        <PageHeader
          title="Propuestas"
          subtitle="Consulta y supervisa todas las propuestas registradas en la plataforma."
          icon={<FolderOpen />}
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
              <option value="pendiente">{displayNames.projectStatus.pendiente}</option>
              <option value="aprobado">{displayNames.projectStatus.aprobado}</option>
              <option value="rechazado">{displayNames.projectStatus.rechazado}</option>
            </Select>
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
              proyectos.length === 0
                ? 'Todavía no hay propuestas registradas.'
                : 'Ninguna propuesta coincide con los filtros aplicados.'
            }
          />
        ) : (
          <>
            <div className={s.tableWrap}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>Propuesta</th>
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
                          <span className={s.title}>{p.title}</span>
                          <span className={s.subText}>{p.areaAplicacion}</span>
                        </td>
                        <td className={s.text}>{p.studentName}</td>
                        <td className={s.date}>{p.createdAt}</td>
                        <td>
                          {info ? (
                            <Badge variant={info.pct >= 60 ? 'danger' : info.pct >= 40 ? 'warning' : 'success'}>
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
                          <Button
                            as="link"
                            to={`/admin/detalle-proyecto/${p.id}`}
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
              itemName="propuestas"
              filteredCount={filtrados.length}
            />
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
