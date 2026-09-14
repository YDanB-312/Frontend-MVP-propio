import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CaretRight, CaretDown, MagnifyingGlass } from 'phosphor-react'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PageHeader from '../../../components/PageHeader/PageHeader'
import EmptyState from '../../../components/EmptyState/EmptyState'
import SectionHeader from '../../../components/SectionHeader/SectionHeader'
import GradeBadge from '../../../components/GradeBadge/GradeBadge'
import { useAuth } from '../../../contexts/AuthContext'
import {
  findProjectById,
  getSimilitudesValidas,
  getProjectsByStudent,
} from '../../../data/mockData'
import s from './Similitudes.module.css'

export default function Similitudes() {
  const { user } = useAuth()

  const misProyectos = useMemo(() => getProjectsByStudent(user.id), [user.id])
  const idsPropios = useMemo(() => new Set(misProyectos.map((p) => p.id)), [misProyectos])

  const sims = useMemo(
    () =>
      getSimilitudesValidas()
        .filter((x) => idsPropios.has(x.projectId1) || idsPropios.has(x.projectId2))
        .sort((a, b) => b.similitud - a.similitud),
    [idsPropios]
  )

  // Agrupa por propuesta propia: una propuesta puede coincidir con muchas.
  const grupos = useMemo(() => {
    const mapa = new Map()
    for (const x of sims) {
      const propioId = idsPropios.has(x.projectId1) ? x.projectId1 : x.projectId2
      if (!mapa.has(propioId)) {
        mapa.set(propioId, {
          propioId,
          titulo: propioId === x.projectId1 ? x.project1Title : x.project2Title,
          pares: [],
        })
      }
      mapa.get(propioId).pares.push(x)
    }
    return [...mapa.values()]
      .map((g) => ({
        ...g,
        max: Math.max(...g.pares.map((x) => Math.round((x.similitud || 0) * 100))),
      }))
      .sort((a, b) => b.max - a.max)
  }, [sims, idsPropios])

  // Arranca todo colapsado; el usuario expande lo que quiere ver
  const [abiertos, setAbiertos] = useState(() => new Set())
  const abiertosEfectivos = abiertos

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

        {sims.length === 0 ? (
          <EmptyState
            icon={<MagnifyingGlass />}
            title="Sin similitudes detectadas"
            message="Buenas noticias: ninguna de tus propuestas coincide con la base de datos por ahora."
          />
        ) : (
          <>
            <SectionHeader title="Ranking de coincidencias" count={sims.length} hint="agrupadas por tu propuesta" />
            <div className={s.grupos}>
              {grupos.map((g) => {
                const abierto = abiertosEfectivos.has(g.propioId)
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
                          const pct = Math.round((x.similitud || 0) * 100)
                          const otroPid = g.propioId === x.projectId1 ? x.projectId2 : x.projectId1
                          const otro = findProjectById(otroPid)
                          return (
                            <div key={x.id} className="fx-rise" style={{ '--fx-i': i }}>
                              <Link to={`/aprendiz/detalle-similitud/${x.id}`} viewTransition className={s.matchRow}>
                                <span className={`mono ${s.matchRank}`}>#{i + 1}</span>
                                <span className={s.matchInfo}>
                                  <span className={s.matchTitle}>{otro?.title || 'Proyecto no disponible'}</span>
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
      </div>
    </DashboardLayout>
  )
}
