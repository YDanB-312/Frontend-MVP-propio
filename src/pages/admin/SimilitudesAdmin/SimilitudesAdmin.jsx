import { useState } from 'react'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PageHeader from '../../../components/PageHeader/PageHeader'
import FilterBar from '../../../components/FilterBar/FilterBar'
import Badge from '../../../components/Badge/Badge'
import Button from '../../../components/Button/Button'
import { Select } from '../../../components/Input/Input'
import Pagination from '../../../components/Pagination/Pagination'
import EmptyState from '../../../components/EmptyState/EmptyState'
import { getAllSimilarities, displayNames } from '../../../data/mockData'
import s from '../../../components/ListaBase/ListaBase.module.css'
import local from './SimilitudesAdmin.module.css'
import { Eye, MagnifyingGlass } from 'phosphor-react'

const ITEMS_POR_PAGINA = 8

const SIM_VARIANT = { pendiente: 'warning', revisada: 'info', resuelta: 'success' }

export default function SimilitudesAdmin() {
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [pagina, setPagina] = useState(1)

  const similitudes = getAllSimilarities()

  const filtradas =
    filtroEstado === 'todos'
      ? similitudes
      : similitudes.filter((x) => x.estado === filtroEstado)

  const paginadas = filtradas.slice(
    (pagina - 1) * ITEMS_POR_PAGINA,
    pagina * ITEMS_POR_PAGINA
  )

  return (
    <DashboardLayout role="admin" titulo="Similitudes">
      <div className={s.page}>
        <PageHeader
          title="Similitudes Detectadas"
          subtitle="Analiza los pares de proyectos con contenido similar y dales seguimiento."
          icon={<MagnifyingGlass />}
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
              <option value="revisada">Revisada</option>
              <option value="resuelta">Resuelta</option>
            </Select>
          </label>
          <p className={s.info}>
            {filtradas.length} similitud{filtradas.length !== 1 ? 'es' : ''}
          </p>
        </FilterBar>

        {paginadas.length === 0 ? (
          <EmptyState
          icon={<MagnifyingGlass />}
            title="Sin similitudes"
            message={
              similitudes.length === 0
                ? 'No se han detectado similitudes entre proyectos.'
                : 'No hay similitudes con el estado seleccionado.'
            }
          />
        ) : (
          <>
            <div className={s.tableWrap}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>Propuesta A</th>
                    <th>Propuesta B</th>
                    <th>Similitud</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                    <th className={s.colActions}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginadas.map((sim) => {
                    const pct = Math.round((sim.similitud || 0) * 100)
                    return (
                      <tr key={sim.id}>
                        <td>
                          <span className={s.title}>{sim.project1Title}</span>
                          <span className={s.subText}>{sim.project1Student}</span>
                        </td>
                        <td>
                          <span className={s.title}>{sim.project2Title}</span>
                          <span className={s.subText}>{sim.project2Student}</span>
                        </td>
                        <td>
                          <span
                            className={`${local.pct} ${
                              pct >= 60 ? local.pctHigh : pct >= 40 ? local.pctMid : local.pctLow
                            }`}
                          >
                            {pct}%
                          </span>
                          <span className={local.barTrack} aria-hidden="true">
                            <span
                              className={`${local.barFill} ${
                                pct >= 60 ? local.fillHigh : pct >= 40 ? local.fillMid : local.fillLow
                              }`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </span>
                        </td>
                        <td>
                          <Badge variant={SIM_VARIANT[sim.estado] || 'neutral'}>
                            {displayNames.similarityStatus[sim.estado] || sim.estado}
                          </Badge>
                        </td>
                        <td className={s.date}>{sim.createdAt}</td>
                        <td className={s.colActions}>
                          <Button
                            as="link"
                            to={`/admin/detalle-similitud/${sim.id}`}
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
              totalItems={filtradas.length}
              itemsPerPage={ITEMS_POR_PAGINA}
              paginaActual={pagina}
              setPaginaActual={setPagina}
              itemName="similitudes"
              filteredCount={filtradas.length}
            />
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
