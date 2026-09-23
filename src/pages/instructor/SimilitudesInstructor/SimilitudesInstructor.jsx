import { useMemo, useState } from 'react'
import { CaretDown, CaretRight, Eye, MagnifyingGlass } from 'phosphor-react'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PageHeader from '../../../components/PageHeader/PageHeader'
import FilterBar from '../../../components/FilterBar/FilterBar'
import StatusMark from '../../../components/StatusMark/StatusMark'
import { PROPUESTA_STATUS } from '../../../constants/estadoStatus'
import Button from '../../../components/Button/Button'
import { Input, Select } from '../../../components/Input/Input'
import Pagination from '../../../components/Pagination/Pagination'
import EmptyState from '../../../components/EmptyState/EmptyState'
import ApiState from '../../../components/ApiState/ApiState'
import DataTable from '../../../components/DataTable/DataTable'
import GradeBadge from '../../../components/GradeBadge/GradeBadge'
import { useAuth } from '../../../contexts/AuthContext'
import { useApi } from '../../../lib/useApi'
import { proyectos, similitudes as similitudesApi, fichas, instructores } from '../../../lib/recursos'
import s from '../../../components/ListaBase/ListaBase.module.css'
import local from './SimilitudesInstructor.module.css'
import { PAGINA_TABLA } from '../../../constants/pagination'
import { fechaDesdeApi, norm } from '../../../utils/helpers'

const ITEMS_POR_PAGINA = PAGINA_TABLA

// Relaciones necesarias para mostrar creador y ficha de cada propuesta del par.
const INCLUDE_PROYECTOS = 'creator,instructor.generalUser,classGroup.program,apprentices.generalUser'

const ESTADO_LABEL = { pendiente: 'Pendiente', aprobado: 'Aprobado', rechazado: 'Rechazado' }

// Concatena nombre + apellido de un general_user.
function nombreCompleto(usuario) {
  return [usuario?.nombre, usuario?.apellido].filter(Boolean).join(' ').trim()
}

export default function SimilitudesInstructor() {
  const { user } = useAuth()
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroFicha, setFiltroFicha] = useState('todos')
  const [minSim, setMinSim] = useState('')
  const [pagina, setPagina] = useState(1)

  // Fuente única: la API. Propuestas, similitudes y catálogos del instructor.
  const { data: instructoresApi } = useApi(() => instructores.listar(), [], { inicial: [] })
  const { data: fichasApi } = useApi(() => fichas.listar(), [], { inicial: [] })
  const { data: todosProyectos, cargando, error, recargar } = useApi(
    () => proyectos.listar({ included: INCLUDE_PROYECTOS }),
    [],
    { inicial: [] }
  )
  const { data: todasSimilitudes } = useApi(() => similitudesApi.listar(), [], { inicial: [] })

  const miFila = useMemo(
    () => instructoresApi.find((i) => Number(i.id_usuario) === Number(user?.id)) || null,
    [instructoresApi, user?.id]
  )
  const misFichas = useMemo(
    () => fichasApi.filter((f) => Number(f.instructor?.id) === Number(miFila?.id)),
    [fichasApi, miFila?.id]
  )
  const misFichasIds = useMemo(() => new Set(misFichas.map((f) => Number(f.id))), [misFichas])

  const proyectoPorId = useMemo(
    () => new Map((todosProyectos || []).map((p) => [Number(p.id), p])),
    [todosProyectos]
  )

  // Regla de negocio: el instructor ve la similitud si toca una propuesta suya.
  const proyectoEnAlcance = useMemo(
    () => (p) =>
      !!p && (
        Number(p.id_instructor_asignado) === Number(miFila?.id) ||
        misFichasIds.has(Number(p.id_class_group))
      ),
    [miFila?.id, misFichasIds]
  )

  const similitudes = useMemo(
    () => (todasSimilitudes || []).filter(
      (x) => proyectoEnAlcance(proyectoPorId.get(Number(x.id_proyecto_1)))
        || proyectoEnAlcance(proyectoPorId.get(Number(x.id_proyecto_2)))
    ),
    [todasSimilitudes, proyectoPorId, proyectoEnAlcance]
  )

  const filtradas = useMemo(() => {
    const q = norm(busqueda.trim())
    return similitudes.filter((x) => {
      const p1 = proyectoPorId.get(Number(x.id_proyecto_1))
      const p2 = proyectoPorId.get(Number(x.id_proyecto_2))
      const coincideEstado = filtroEstado === 'todos' || p1?.estado === filtroEstado || p2?.estado === filtroEstado
      const coincideFicha =
        filtroFicha === 'todos' ||
        String(p1?.id_class_group || '') === String(filtroFicha) ||
        String(p2?.id_class_group || '') === String(filtroFicha)
      const coincideSim = !minSim || Math.round(Number(x.porcentaje) || 0) >= Number(minSim)
      const coincideQ =
        !q ||
        norm(p1?.titulo || x.project1?.titulo).includes(q) ||
        norm(p2?.titulo || x.project2?.titulo).includes(q) ||
        norm(nombreCompleto(p1?.creator)).includes(q) ||
        norm(nombreCompleto(p2?.creator)).includes(q)
      return coincideEstado && coincideFicha && coincideSim && coincideQ
    })
  }, [similitudes, filtroEstado, filtroFicha, minSim, busqueda, proyectoPorId])

  const paginadas = filtradas.slice(
    (pagina - 1) * ITEMS_POR_PAGINA,
    pagina * ITEMS_POR_PAGINA
  )

  // Agrupa la página por ficha a cargo; el resto va a "Otras fichas".
  const grupos = useMemo(() => {
    const mapa = new Map()
    for (const x of paginadas) {
      const f1 = proyectoPorId.get(Number(x.id_proyecto_1))?.id_class_group
      const f2 = proyectoPorId.get(Number(x.id_proyecto_2))?.id_class_group
      const fid = misFichasIds.has(Number(f1)) ? Number(f1) : misFichasIds.has(Number(f2)) ? Number(f2) : 0
      if (!mapa.has(fid)) mapa.set(fid, { fid, pares: [] })
      mapa.get(fid).pares.push(x)
    }
    return [...mapa.values()]
      .map((g) => ({
        ...g,
        ficha: g.fid ? fichasApi.find((f) => Number(f.id) === g.fid) || null : null,
        max: Math.max(...g.pares.map((y) => Math.round(Number(y.porcentaje) || 0))),
      }))
      .sort((a, b) => (a.fid === 0) - (b.fid === 0) || b.max - a.max)
  }, [paginadas, misFichasIds, proyectoPorId, fichasApi])

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
      render: (sim) => {
        const p = proyectoPorId.get(Number(sim.id_proyecto_1))
        return (
          <>
            <span className={s.title}>{p?.titulo || 'Proyecto no disponible'}</span>
            <br />
            <span className={s.subText}>{nombreCompleto(p?.creator) || '—'}</span>
          </>
        )
      },
    },
    {
      key: 'b',
      header: 'Propuesta B',
      render: (sim) => {
        const p = proyectoPorId.get(Number(sim.id_proyecto_2))
        return (
          <>
            <span className={s.title}>{p?.titulo || 'Proyecto no disponible'}</span>
            <br />
            <span className={s.subText}>{nombreCompleto(p?.creator) || '—'}</span>
          </>
        )
      },
    },
    {
      key: 'similitud',
      header: 'Similitud',
      render: (sim) => <GradeBadge score={Math.round(Number(sim.porcentaje) || 0)} size="sm" />,
    },
    {
      key: 'estados',
      header: 'Estado',
      render: (sim) => {
        const estadoA = proyectoPorId.get(Number(sim.id_proyecto_1))?.estado || '—'
        const estadoB = proyectoPorId.get(Number(sim.id_proyecto_2))?.estado || '—'
        return (
          <span className={local.estadoPair}>
            <StatusMark status={PROPUESTA_STATUS[estadoA] || 'pending'} label={`A: ${ESTADO_LABEL[estadoA] || estadoA}`} />
            <StatusMark status={PROPUESTA_STATUS[estadoB] || 'pending'} label={`B: ${ESTADO_LABEL[estadoB] || estadoB}`} />
          </span>
        )
      },
    },
    {
      key: 'fecha',
      header: 'Fecha',
      render: (sim) => fechaDesdeApi(sim.fecha) || '—',
    },
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
            <span className={s.label}>Buscar</span>
            <Input
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setPagina(1) }}
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
                setAbiertos(null)
              }}
            >
              <option value="todos">Todos</option>
              <option value="pendiente">{ESTADO_LABEL.pendiente}</option>
              <option value="aprobado">{ESTADO_LABEL.aprobado}</option>
              <option value="rechazado">{ESTADO_LABEL.rechazado}</option>
            </Select>
          </label>
          <label className={s.field}>
            <span className={s.label}>Ficha</span>
            <Select
              value={filtroFicha}
              onChange={(e) => { setFiltroFicha(e.target.value); setPagina(1) }}
            >
              <option value="todos">Todas</option>
              {misFichas.map((f) => (
                <option key={f.id} value={String(f.id)}>{f.codigo} · {f.nombre}</option>
              ))}
            </Select>
          </label>
          <label className={s.field}>
            <span className={s.label}>% mínimo</span>
            <Input
              type="number"
              min={0}
              max={100}
              value={minSim}
              onChange={(e) => { setMinSim(e.target.value); setPagina(1) }}
              placeholder="Ej. 40"
            />
          </label>
          <p className={s.info}>
            {filtradas.length} similitud{filtradas.length !== 1 ? 'es' : ''}
          </p>
        </FilterBar>

        <ApiState cargando={cargando} error={error} onReintentar={recargar}>
          {paginadas.length === 0 ? (
            similitudes.length === 0 ? (
              <EmptyState
                icon={<MagnifyingGlass />}
                title="Sin similitudes"
                message="Ninguna de tus propuestas alcanza el umbral vigente. El motor está listo para cuando lleguen más propuestas."
              />
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
        </ApiState>
      </div>
    </DashboardLayout>
  )
}
