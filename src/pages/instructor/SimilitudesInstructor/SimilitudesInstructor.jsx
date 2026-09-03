import { useState } from 'react'
import { Eye, MagnifyingGlass } from 'phosphor-react'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PageHeader from '../../../components/PageHeader/PageHeader'
import FilterBar from '../../../components/FilterBar/FilterBar'
import Badge from '../../../components/Badge/Badge'
import Button from '../../../components/Button/Button'
import { Select } from '../../../components/Input/Input'
import Pagination from '../../../components/Pagination/Pagination'
import EmptyState from '../../../components/EmptyState/EmptyState'
import { useAuth } from '../../../contexts/AuthContext'
import { findProjectById, getSimilitudesValidas, getProjectsByInstructor, displayNames } from '../../../data/mockData'
import s from '../../../components/ListaBase/ListaBase.module.css'
import local from './SimilitudesInstructor.module.css'

const ITEMS_POR_PAGINA = 8

const PROY_VARIANT = {
  pendiente: 'warning',
  aprobado: 'success',
  rechazado: 'danger',
}

export default function SimilitudesInstructor() {
  const { user } = useAuth()
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [pagina, setPagina] = useState(1)

  const idsPropios = new Set(
    user ? getProjectsByInstructor(Number(user.id)).map((p) => p.id) : []
  )
  const similitudes = getSimilitudesValidas().filter(
    (x) => idsPropios.has(x.projectId1) || idsPropios.has(x.projectId2)
  )

  const filtradas =
    filtroEstado === 'todos'
      ? similitudes
      : similitudes.filter((x) => {
          const p1 = findProjectById(x.projectId1)
          const p2 = findProjectById(x.projectId2)
          return p1?.estado === filtroEstado || p2?.estado === filtroEstado
        })

  const paginadas = filtradas.slice(
    (pagina - 1) * ITEMS_POR_PAGINA,
    pagina * ITEMS_POR_PAGINA
  )

  return (
    <DashboardLayout role="instructor" titulo="Similitudes">
      <div className={s.page}>
        <PageHeader
          title="Similitudes Detectadas"
          subtitle="Analiza los pares de proyectos con contenido similar entre tus aprendices y dales seguimiento."
          icon={<MagnifyingGlass />}
          breadcrumb={[{ label: 'Dashboard', to: '/instructor/dashboard' }, { label: 'Similitudes' }]}
        />

        <FilterBar title="Filtrar por estado de la propuesta">
          <label className={s.field}>
            <span className={s.label}>Estado de la propuesta</span>
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
            {filtradas.length} similitud{filtradas.length !== 1 ? 'es' : ''}
          </p>
        </FilterBar>

        {paginadas.length === 0 ? (
          <EmptyState
            icon={<MagnifyingGlass />}
            title="Sin similitudes"
            message={
              similitudes.length === 0
                ? 'No se han detectado similitudes entre los proyectos de tus aprendices.'
                : 'No hay similitudes con el estado de propuesta seleccionado.'
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
                    <th>Estado (A · B)</th>
                    <th>Fecha</th>
                    <th className={s.colActions}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginadas.map((sim) => {
                    const pct = Math.round((sim.similitud || 0) * 100)
                    const pA = findProjectById(sim.projectId1)
                    const pB = findProjectById(sim.projectId2)
                    const estadoA = pA?.estado || '—'
                    const estadoB = pB?.estado || '—'
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
                          <span className={local.estadoPair}>
                            <Badge variant={PROY_VARIANT[estadoA] || 'neutral'}>
                              A: {displayNames.projectStatus[estadoA] || estadoA}
                            </Badge>
                            <Badge variant={PROY_VARIANT[estadoB] || 'neutral'}>
                              B: {displayNames.projectStatus[estadoB] || estadoB}
                            </Badge>
                          </span>
                        </td>
                        <td className={s.date}>{sim.createdAt}</td>
                        <td className={s.colActions}>
                          <Button
                            as="link"
                            to={`/instructor/detalle-similitud/${sim.id}`}
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
