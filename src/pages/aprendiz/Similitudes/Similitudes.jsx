import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CaretRight, CaretDown, MagnifyingGlass } from 'phosphor-react'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PageHeader from '../../../components/PageHeader/PageHeader'
import EmptyState from '../../../components/EmptyState/EmptyState'
import ApiState from '../../../components/ApiState/ApiState'
import SectionHeader from '../../../components/SectionHeader/SectionHeader'
import FilterBar from '../../../components/FilterBar/FilterBar'
import GradeBadge from '../../../components/GradeBadge/GradeBadge'
import { Input } from '../../../components/Input/Input'
import { useAuth } from '../../../contexts/AuthContext'
import { useApi } from '../../../lib/useApi'
import { proyectos, similitudes as similitudesApi } from '../../../lib/recursos'
import { norm } from '../../../utils/helpers'
import s from './Similitudes.module.css'

const INCLUDE_PROYECTOS = 'creator,instructor.generalUser,classGroup.program,apprentices.generalUser'

// Una propuesta es del aprendiz si la creó o si figura en su equipo.
function esMia(proyecto, userId) {
  if (!proyecto) return false
  if (Number(proyecto.id_creador) === Number(userId)) return true
  return (proyecto.apprentices || []).some(
    (a) => Number(a.generalUser?.id) === Number(userId) || Number(a.id_usuario) === Number(userId)
  )
}

export default function Similitudes() {
  const { user } = useAuth()

  // Filtros de la vista.
  const [busqueda, setBusqueda] = useState('')
  const [minSim, setMinSim] = useState('')

  // Propuestas y similitudes: fuente única la API.
  const { data: todosProyectos, cargando, error, recargar } = useApi(
    () => proyectos.listar({ included: INCLUDE_PROYECTOS }),
    [],
    { inicial: [] }
  )
  const { data: todasSimilitudesApi } = useApi(() => similitudesApi.listar(), [], { inicial: [] })

  const misProyectos = useMemo(
    () => todosProyectos.filter((p) => esMia(p, user.id)),
    [todosProyectos, user.id]
  )
  const idsPropios = useMemo(() => new Set(misProyectos.map((p) => Number(p.id))), [misProyectos])
  const mapaProyectos = useMemo(() => {
    const mapa = new Map(todosProyectos.map((p) => [Number(p.id), p]))
    // El otro proyecto del par puede estar fuera del alcance (otra ficha); la
    // similitud ya lo trae incluido, así que también entra al mapa.
    for (const x of todasSimilitudesApi) {
      if (x.project1) mapa.set(Number(x.project1.id), x.project1)
      if (x.project2) mapa.set(Number(x.project2.id), x.project2)
    }
    return mapa
  }, [todosProyectos, todasSimilitudesApi])

  const sims = useMemo(() => {
    const q = norm(busqueda.trim())
    return todasSimilitudesApi
      .filter((x) => idsPropios.has(Number(x.id_proyecto_1)) || idsPropios.has(Number(x.id_proyecto_2)))
      .filter((x) => {
        if (minSim && Math.round(Number(x.porcentaje) || 0) < Number(minSim)) return false
        if (!q) return true
        const propioId = idsPropios.has(Number(x.id_proyecto_1)) ? Number(x.id_proyecto_1) : Number(x.id_proyecto_2)
        const otroId = propioId === Number(x.id_proyecto_1) ? Number(x.id_proyecto_2) : Number(x.id_proyecto_1)
        return norm(mapaProyectos.get(propioId)?.titulo).includes(q)
          || norm(mapaProyectos.get(otroId)?.titulo).includes(q)
      })
      .sort((a, b) => Number(b.porcentaje) - Number(a.porcentaje))
  }, [todasSimilitudesApi, idsPropios, minSim, busqueda, mapaProyectos])

  // Agrupa por propuesta propia: una propuesta puede coincidir con muchas.
  const grupos = useMemo(() => {
    const mapa = new Map()
    for (const x of sims) {
      const propioId = idsPropios.has(Number(x.id_proyecto_1)) ? Number(x.id_proyecto_1) : Number(x.id_proyecto_2)
      if (!mapa.has(propioId)) {
        mapa.set(propioId, {
          propioId,
          titulo: mapaProyectos.get(propioId)?.titulo,
          pares: [],
        })
      }
      mapa.get(propioId).pares.push(x)
    }
    return [...mapa.values()]
      .map((g) => ({
        ...g,
        max: Math.max(...g.pares.map((x) => Math.round(Number(x.porcentaje) || 0))),
      }))
      .sort((a, b) => b.max - a.max)
  }, [sims, idsPropios, mapaProyectos])

  // Arranca todo colapsado; el usuario expande lo que quiere ver
  const [abiertos, setAbiertos] = useState(() => new Set())

  function alternarGrupo(propioId) {
    setAbiertos((prev) => {
      const next = new Set(prev)
      if (next.has(propioId)) next.delete(propioId)
      else next.add(propioId)
      return next
    })
  }

  return (
    <DashboardLayout role="aprendiz" titulo="Similitudes">
      <div>
        <PageHeader
          title="Similitudes"
          subtitle={`Coincidencias detectadas entre tus propuestas y la base de datos (${sims.length})`}
          icon={<MagnifyingGlass />}
          breadcrumb={[{ label: 'Dashboard', to: '/aprendiz/dashboard' }, { label: 'Similitudes' }]}
        />

        <ApiState cargando={cargando} error={error} onReintentar={recargar}>
          {sims.length === 0 ? (
            misProyectos.length === 0 ? (
              <EmptyState
                icon={<MagnifyingGlass />}
                title="Sin similitudes detectadas"
                message="Aún no tienes propuestas vigentes para comparar. Registra tu primera propuesta."
                actionLabel="Ir a mis propuestas"
                onAction={() => window.location.assign('/aprendiz/propuestas')}
              />
            ) : (
              <EmptyState
                icon={<MagnifyingGlass />}
                title="Sin similitudes detectadas"
                message="Buenas noticias: ninguna de tus propuestas coincide con otras por ahora."
              />
            )
          ) : (
            <>
              <FilterBar title="Filtros">
                <label className={s.field}>
                  <span className={s.label}>Buscar</span>
                  <Input
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Título de la propuesta…"
                  />
                </label>
                <label className={s.field}>
                  <span className={s.label}>% mínimo</span>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={minSim}
                    onChange={(e) => setMinSim(e.target.value)}
                    placeholder="Ej. 40"
                  />
                </label>
              </FilterBar>
              <SectionHeader title="Ranking de coincidencias" count={sims.length} hint="agrupadas por tu propuesta" />
              <div className={s.grupos}>
                {grupos.map((g) => {
                  const abierto = abiertos.has(g.propioId)
                  return (
                    <section key={g.propioId} className={s.grupo}>
                      <button
                        type="button"
                        className={s.grupoHead}
                        id={`grupo-btn-${g.propioId}`}
                        aria-expanded={abierto}
                        aria-controls={`grupo-${g.propioId}`}
                        onClick={() => alternarGrupo(g.propioId)}
                      >
                        <span className={s.grupoMain}>
                          <span className={s.grupoTitulo}>{g.titulo || 'Propuesta no disponible'}</span>
                          <span className={s.grupoMeta}>
                            {g.pares.length} coincidencia{g.pares.length !== 1 ? 's' : ''}
                          </span>
                        </span>
                        <GradeBadge score={g.max} size="sm" />
                        {abierto ? (
                          <CaretDown size={16} className={s.grupoChevron} aria-hidden="true" />
                        ) : (
                          <CaretRight size={16} className={s.grupoChevron} aria-hidden="true" />
                        )}
                      </button>
                      <div
                        id={`grupo-${g.propioId}`}
                        role="region"
                        aria-labelledby={`grupo-btn-${g.propioId}`}
                        hidden={!abierto}
                        className={s.matchList}
                      >
                          {g.pares.map((x, i) => {
                            const pct = Math.round(Number(x.porcentaje) || 0)
                            const otroPid = g.propioId === Number(x.id_proyecto_1) ? Number(x.id_proyecto_2) : Number(x.id_proyecto_1)
                            const otro = mapaProyectos.get(otroPid)
                            return (
                              <div key={x.id} className="fx-rise" style={{ '--fx-i': i }}>
                                <Link to={`/aprendiz/detalle-similitud/${x.id}`} viewTransition className={s.matchRow}>
                                  <span className={`mono ${s.matchRank}`}>#{i + 1}</span>
                                  <span className={s.matchInfo}>
                                    <span className={s.matchTitle}>{otro?.titulo || 'Proyecto no disponible'}</span>
                                    <span className={s.matchMeta}>Tu propuesta: {g.titulo || '—'}</span>
                                  </span>
                                  <GradeBadge score={pct} size="sm" />
                                  <CaretRight size={16} className={s.matchChevron} />
                                </Link>
                              </div>
                            )
                          })}
                        </div>
                    </section>
                  )
                })}
              </div>
            </>
          )}
        </ApiState>
      </div>
    </DashboardLayout>
  )
}
