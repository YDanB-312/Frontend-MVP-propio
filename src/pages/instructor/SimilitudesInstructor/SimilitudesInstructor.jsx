import { useMemo, useState } from 'react'
import { CaretDown, CaretRight, Eye, MagnifyingGlass } from 'phosphor-react'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PageHeader from '../../../components/PageHeader/PageHeader'
import FilterBar from '../../../components/FilterBar/FilterBar'
import Badge from '../../../components/Badge/Badge'
import Button from '../../../components/Button/Button'
import { Select } from '../../../components/Input/Input'
import Pagination from '../../../components/Pagination/Pagination'
import EmptyState from '../../../components/EmptyState/EmptyState'
import DataTable from '../../../components/DataTable/DataTable'
import GradeBadge from '../../../components/GradeBadge/GradeBadge'
import { useAuth } from '../../../contexts/AuthContext'
import { findProjectById, findFichaById, getFichasDelInstructor, getSimilitudesValidas, getAllProjects, instructorVeProyecto, displayNames } from '../../../data/mockData'
import s from '../../../components/ListaBase/ListaBase.module.css'
import local from './SimilitudesInstructor.module.css'
import { PAGINA_TABLA } from '../../../constants/pagination'

const ITEMS_POR_PAGINA = PAGINA_TABLA

const PROY_VARIANT = {
  pendiente: 'warning',
  aprobado: 'success',
  rechazado: 'danger',
}

export default function SimilitudesInstructor() {
  const { user } = useAuth()
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [pagina, setPagina] = useState(1)

  // Mismo criterio que Revisión y Dashboard: proyecto propio O de ficha propia
  const idsPropios = new Set(
    user ? getAllProjects().filter((p) => instructorVeProyecto(p, Number(user.id))).map((p) => p.id) : []
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

  // Agrupa la página por ficha a cargo; el resto va a "Otras fichas".
  const misFichasIds = useMemo(
    () => new Set(getFichasDelInstructor(Number(user?.id)).map((f) => f.id)),
    [user?.id]
  )
  const grupos = useMemo(() => {
    const mapa = new Map()
    for (const x of paginadas) {
      const f1 = findProjectById(x.projectId1)?.fichaId
      const f2 = findProjectById(x.projectId2)?.fichaId
      const fid = misFichasIds.has(f1) ? f1 : misFichasIds.has(f2) ? f2 : 0
      if (!mapa.has(fid)) mapa.set(fid, { fid, pares: [] })
      mapa.get(fid).pares.push(x)
    }
    return [...mapa.values()]
      .map((g) => ({
        ...g,
        ficha: g.fid ? findFichaById(g.fid) : null,
        max: Math.max(...g.pares.map((y) => Math.round((y.similitud || 0) * 100))),
      }))
      .sort((a, b) => (a.fid === 0) - (b.fid === 0) || b.max - a.max)
  }, [paginadas, misFichasIds])

  const [abiertos, setAbiertos] = useState(null)
  const abiertosEfectivos = abiertos ?? (grupos.length > 0 ? new Set([grupos[0].fid]) : new Set())

  function alternarGrupo(fid) {
    setAbiertos((prev) => {
      const base = prev ?? (grupos.length > 0 ? new Set([grupos[0].fid]) : new Set())
      const next = new Set(base)
      if (next.has(fid)) next.delete(fid)
      else next.add(fid)
      return next
    })
  }

  const columnas = [
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
          to={`/instructor/detalle-similitud/${sim.id}`}
          viewTransition
          size="sm"
          variant="secondary"
        >
          <Eye size={14} /> Ver
        </Button>
      ),
    },
  ]

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
                setAbiertos(null)
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
          similitudes.length === 0 ? (
            getSimilitudesValidas().length === 0 ? (
              <EmptyState
                icon={<MagnifyingGlass />}
                title="Sin coincidencias en el sistema"
                message="Ninguna propuesta del sistema alcanza el umbral vigente. El motor está listo para cuando lleguen más propuestas."
              />
            ) : (
              <EmptyState
                icon={<MagnifyingGlass />}
                title="Sin similitudes"
                message={`Hay ${getSimilitudesValidas().length} coincidencia(s) válidas en el sistema, pero ninguna toca a tus aprendices o tu programa.`}
              />
            )
          ) : (
            <EmptyState
              icon={<MagnifyingGlass />}
              title="Sin similitudes"
              message="No hay similitudes con el estado de propuesta seleccionado."
            />
          )
        ) : (
          <>
            <div className={local.grupos}>
              {grupos.map((g) => {
                const abierto = abiertosEfectivos.has(g.fid)
                const titulo = g.ficha ? `${g.ficha.codigo} · ${g.ficha.nombre}` : 'Otras fichas del programa'
                return (
                  <section key={g.fid} className={local.grupo}>
                    <button
                      type="button"
                      className={local.grupoHead}
                      id={`grupo-ficha-btn-${g.fid}`}
                      aria-expanded={abierto}
                      aria-controls={`grupo-ficha-${g.fid}`}
                      onClick={() => alternarGrupo(g.fid)}
                    >
                      <span className={local.grupoMain}>
                        <span className={local.grupoTitulo}>{titulo}</span>
                        <span className={local.grupoMeta}>
                          {g.pares.length} coincidencia{g.pares.length !== 1 ? 's' : ''}
                        </span>
                      </span>
                      <GradeBadge score={g.max} size="sm" />
                      {abierto ? (
                        <CaretDown size={16} className={local.grupoChevron} aria-hidden="true" />
                      ) : (
                        <CaretRight size={16} className={local.grupoChevron} aria-hidden="true" />
                      )}
                    </button>
                    <div
                      id={`grupo-ficha-${g.fid}`}
                      role="region"
                      aria-labelledby={`grupo-ficha-btn-${g.fid}`}
                      hidden={!abierto}
                    >
                      <DataTable
                        ariaLabel={`Similitudes de ${titulo}`}
                        columns={columnas}
                        rows={g.pares}
                        keyOf={(sim) => sim.id}
                      />
                    </div>
                  </section>
                )
              })}
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
