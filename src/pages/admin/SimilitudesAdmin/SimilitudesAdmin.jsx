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
import GradeBadge from '../../../components/GradeBadge/GradeBadge'
import StatChip from '../../../components/StatChip/StatChip'
import { findProjectById, getSimilitudesValidas, getConfigMotor, getProgramaDeProyecto, REDES, displayNames } from '../../../data/mockData'
import { norm } from '../../../utils/helpers'
import s from '../../../components/ListaBase/ListaBase.module.css'
import local from './SimilitudesAdmin.module.css'
import { Eye, MagnifyingGlass } from 'phosphor-react'
import { PAGINA_TABLA } from '../../../constants/pagination'

const ITEMS_POR_PAGINA = PAGINA_TABLA

const PROY_VARIANT = {
  pendiente: 'warning',
  aprobado: 'success',
  rechazado: 'danger',
}

export default function SimilitudesAdmin() {
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroPrograma, setFiltroPrograma] = useState('todos')
  const [pagina, setPagina] = useState(1)

  const similitudes = getSimilitudesValidas()
  const programasFiltro = [...new Set(REDES.flatMap((r) => r.programas))].sort()

  const filtradas = similitudes.filter((x) => {
    const p1 = findProjectById(x.projectId1)
    const p2 = findProjectById(x.projectId2)
    const q = norm(busqueda.trim())
    const coincideQ =
      !q ||
      norm(x.project1Title).includes(q) ||
      norm(x.project2Title).includes(q) ||
      norm(x.project1Student).includes(q) ||
      norm(x.project2Student).includes(q)
    const coincideEstado =
      filtroEstado === 'todos' || p1?.estado === filtroEstado || p2?.estado === filtroEstado
    const coincidePrograma =
      filtroPrograma === 'todos' ||
      getProgramaDeProyecto(p1) === filtroPrograma ||
      getProgramaDeProyecto(p2) === filtroPrograma
    return coincideQ && coincideEstado && coincidePrograma
  })

  const paginadas = filtradas.slice(
    (pagina - 1) * ITEMS_POR_PAGINA,
    pagina * ITEMS_POR_PAGINA
  )

  const limpiarFiltros = () => {
    setBusqueda('')
    setFiltroEstado('todos')
    setFiltroPrograma('todos')
    setPagina(1)
  }

  const cfg = getConfigMotor()
  const umbralPct = Math.round(cfg.umbral * 100)
  const altas = similitudes.filter((x) => Math.round((x.similitud || 0) * 100) >= 70).length
  const programasAfectados = new Set(
    similitudes.flatMap((x) => [
      getProgramaDeProyecto(findProjectById(x.projectId1)),
      getProgramaDeProyecto(findProjectById(x.projectId2)),
    ]).filter(Boolean)
  ).size

  return (
    <DashboardLayout role="admin" titulo="Similitudes">
      <div className={s.page}>
        <PageHeader
          title="Similitudes Detectadas"
          subtitle={`Umbral ${Math.round(getConfigMotor().umbral * 100)}% · corpus de ${getConfigMotor().meses} meses. Analiza los pares y dales seguimiento.`}
          icon={<MagnifyingGlass />}
          breadcrumb={[
            { label: 'Dashboard', to: '/admin/dashboard' },
            { label: 'Similitudes' },
          ]}
          actions={
            <Button as="link" to="/admin/config-similitud" size="sm" variant="secondary">
              Ajustar motor
            </Button>
          }
        />

        <div className={local.tira} role="status" aria-label="Resumen de coincidencias">
          <StatChip label="Pares" value={similitudes.length} />
          <StatChip label="Sobre 70%" value={altas} />
          <StatChip label="Programas" value={programasAfectados} />
          <StatChip label="Umbral" value={`${umbralPct}%`} />
        </div>

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
                : 'Ninguna similitud coincide con los filtros aplicados.'
            }
            actionLabel={similitudes.length === 0 ? undefined : 'Limpiar filtros'}
            onAction={similitudes.length === 0 ? undefined : limpiarFiltros}
          />
        ) : (
          <>
            <DataTable
              ariaLabel="Similitudes detectadas"
              columns={[
                {
                  key: 'a',
                  header: 'Propuesta A',
                  render: (sim) => (
                    <>
                      <span className={s.title}>{sim.project1Title}</span>
                      <br />
                      <span className={s.subText}>{sim.project1Student}</span>
                    </>
                  ),
                },
                {
                  key: 'b',
                  header: 'Propuesta B',
                  render: (sim) => (
                    <>
                      <span className={s.title}>{sim.project2Title}</span>
                      <br />
                      <span className={s.subText}>{sim.project2Student}</span>
                    </>
                  ),
                },
                {
                  key: 'similitud',
                  header: 'Similitud',
                  render: (sim) => <GradeBadge score={Math.round((sim.similitud || 0) * 100)} size="sm" />,
                },
                {
                  key: 'estados',
                  header: 'Estado',
                  render: (sim) => {
                    const estadoA = findProjectById(sim.projectId1)?.estado || '—'
                    const estadoB = findProjectById(sim.projectId2)?.estado || '—'
                    return (
                      <span className={local.estadoPair}>
                        <Badge variant={PROY_VARIANT[estadoA] || 'neutral'}>
                          A: {displayNames.projectStatus[estadoA] || estadoA}
                        </Badge>
                        <Badge variant={PROY_VARIANT[estadoB] || 'neutral'}>
                          B: {displayNames.projectStatus[estadoB] || estadoB}
                        </Badge>
                      </span>
                    )
                  },
                },
                { key: 'createdAt', header: 'Fecha' },
                {
                  key: 'acciones',
                  header: 'Acciones',
                  align: 'end',
                  render: (sim) => (
                    <Button
                      as="link"
                      to={`/admin/detalle-similitud/${sim.id}`}
                      viewTransition
                      size="sm"
                      variant="secondary"
                    >
                      <Eye size={14} /> Ver
                    </Button>
                  ),
                },
              ]}
              rows={paginadas}
              keyOf={(sim) => sim.id}
            />

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
