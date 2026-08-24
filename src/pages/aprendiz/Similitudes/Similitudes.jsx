import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { CaretRight, MagnifyingGlass } from 'phosphor-react'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PageHeader from '../../../components/PageHeader/PageHeader'
import Badge from '../../../components/Badge/Badge'
import EmptyState from '../../../components/EmptyState/EmptyState'
import { useAuth } from '../../../contexts/AuthContext'
import {
  findProjectById,
  getAllSimilarities,
  getProjectsByStudent,
  displayNames,
} from '../../../data/mockData'
// Estilos reutilizados de vistas existentes (filas de coincidencias + porcentajes)
import ra from '../ResultadoAnalisis/ResultadoAnalisis.module.css'

const SIM_VARIANT = { pendiente: 'warning', revisada: 'info', resuelta: 'success' }

export default function Similitudes() {
  const { user } = useAuth()

  const misProyectos = useMemo(() => getProjectsByStudent(user.id), [user.id])
  const idsPropios = useMemo(() => new Set(misProyectos.map((p) => p.id)), [misProyectos])

  const sims = useMemo(
    () =>
      getAllSimilarities()
        .filter((x) => idsPropios.has(x.projectId1) || idsPropios.has(x.projectId2))
        // Regla: solo coincidencias contra propuestas APROBADAS (en producción)
        .filter((x) => {
          const propioPid = idsPropios.has(x.projectId1) ? x.projectId1 : x.projectId2
          const otroPid = propioPid === x.projectId1 ? x.projectId2 : x.projectId1
          const otro = findProjectById(otroPid)
          return otro?.estado === 'aprobado'
        })
        .sort((a, b) => b.similitud - a.similitud),
    [idsPropios]
  )

  return (
    <DashboardLayout role="aprendiz" titulo="Similitudes">
      <div>
        <PageHeader
          title="Similitudes"
          subtitle={`Coincidencias detectadas entre tus propuestas y la base de datos (${sims.length})`}
          icon={<MagnifyingGlass />}
          breadcrumb={[{ label: 'Dashboard', to: '/aprendiz/dashboard' }, { label: 'Similitudes' }]}
        />

        <div className={ra.matchList}>
          {sims.length === 0 ? (
            <EmptyState
              icon={<MagnifyingGlass />}
              title="Sin similitudes detectadas"
              message="Buenas noticias: ninguna de tus propuestas coincide con la base de datos por ahora."
            />
          ) : (
            sims.map((x, i) => {
              const pct = Math.round((x.similitud || 0) * 100)
              const propioId = idsPropios.has(x.projectId1) ? x.projectId1 : x.projectId2
              const otroPid = propioId === x.projectId1 ? x.projectId2 : x.projectId1
              const otro = findProjectById(otroPid)
              const tituloPropio = propioId === x.projectId1 ? x.project1Title : x.project2Title
              return (
                <div key={x.id}>
                  <Link to={`/aprendiz/detalle-similitud/${x.id}`} className={ra.matchRow}>
                    <span className={ra.matchRank}>#{i + 1}</span>
                    <span className={ra.matchInfo}>
                      <span className={ra.matchTitle}>{otro?.title || 'Propuesta no disponible'}</span>
                      <span className={ra.matchMeta}>Tu propuesta: {tituloPropio || '—'}</span>
                    </span>
                    <span
                      className={`${ra.matchPct} ${
                        pct >= 70 ? ra.matchPctHigh : pct >= 40 ? ra.matchPctMid : ra.matchPctLow
                      }`}
                    >
                      {pct}%
                    </span>
                    <Badge variant={SIM_VARIANT[x.estado] || 'neutral'}>
                      {displayNames.similarityStatus[x.estado] || x.estado}
                    </Badge>
                    <CaretRight size={16} />
                  </Link>
                </div>
              )
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
