import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, CaretRight, Clock, FolderOpen, MagnifyingGlass, PlusCircle, Tray } from 'phosphor-react'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import { useAuth } from '../../../contexts/AuthContext'
import MetricCard from '../../../components/MetricCard/MetricCard'
import DataPanel from '../../../components/DataPanel/DataPanel'
import QuickActions from '../../../components/QuickActions/QuickActions'
import { Sparkle } from 'phosphor-react'
import Badge from '../../../components/Badge/Badge'
import EmptyState from '../../../components/EmptyState/EmptyState'
import {
  getProjectsByStudent, getAllSimilarities, getSimilitudesValidas, getUnreadCount, displayNames,
} from '../../../data/mockData'
import { parseFecha } from '../../../utils/helpers'
import s from './DashboardAprendiz.module.css'

const ESTADO_VARIANT = {
  aprobado: 'success', completado: 'success', pendiente: 'warning', requiere_ajustes: 'warning',
  en_revision: 'info', en_progreso: 'primary', rechazado: 'danger', cancelado: 'danger', borrador: 'neutral',
}

function similitudInfo(similitudes, projectId) {
  const propias = similitudes.filter(s => s.projectId1 === projectId || s.projectId2 === projectId)
  if (propias.length === 0) return null
  return {
    pct: Math.max(...propias.map(s => Math.round(s.similitud * 100))),
    count: propias.length,
  }
}

export default function DashboardAprendiz() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const misProyectos = useMemo(() => getProjectsByStudent(user.id), [user.id])
  const similitudes = useMemo(() => getSimilitudesValidas(), [])
  const sinLeer = getUnreadCount(user.id)
  const similitudesPropias = similitudes.filter(sim =>
    misProyectos.some(p => p.id === sim.projectId1 || p.id === sim.projectId2)
  ).length
  const recientes = [...misProyectos].slice(0, 5)
  const hoy = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const acciones = []

  acciones.push({
    to: '/aprendiz/propuestas?crear=1',
    icon: <PlusCircle size={24} weight="regular" />,
    titulo: 'Nueva Propuesta',
    descripcion: 'Crea tu propuesta y analízala al instante',
  })

  const ultimaSim = [...similitudes]
    .filter((s) => misProyectos.some((p) => p.id === s.projectId1 || p.id === s.projectId2))
    .sort((a, b) => parseFecha(b.createdAt) - parseFecha(a.createdAt))[0]

  if (ultimaSim) {
    const pidPropio = misProyectos.some((p) => p.id === ultimaSim.projectId1)
      ? ultimaSim.projectId1
      : ultimaSim.projectId2
    acciones.push({
      to: `/aprendiz/resultado-analisis?projectId=${pidPropio}`,
      icon: <MagnifyingGlass size={24} weight="regular" />,
      titulo: 'Último análisis',
      descripcion: `${Math.round(ultimaSim.similitud * 100)}% · ${ultimaSim.createdAt}`,
    })
  }

  return (
    <DashboardLayout role="aprendiz" titulo="Dashboard">
      <div className={s.wrapper}>
        <section className={s.welcome}>
          <div>
            <h2 className={s.welcomeTitle}>¡Hola, {user.nombre.split(' ')[0]}!</h2>
            <p className={s.welcomeDate}>{hoy}</p>
          </div>
          <p className={s.welcomeText}>Este es tu espacio para gestionar tus propuestas y mantener la originalidad de tu trabajo.</p>
        </section>

        <section className={s.stats} aria-label="Resumen de actividad">
          <MetricCard icon={<FolderOpen size={22} />} label="Propuestas registradas" value={misProyectos.length} variant="primary" />
          <Link to="/aprendiz/similitudes" className={s.statLink}><MetricCard icon={<MagnifyingGlass size={22} />} label="Similitudes detectadas" value={similitudesPropias} variant="warning" /></Link>
          <MetricCard icon={<Bell size={22} />} label="Alertas sin leer" value={sinLeer} variant="info" />
        </section>

        <DataPanel title="Acciones rápidas" icon={<Sparkle size={18} />}>
          <QuickActions items={acciones} />
        </DataPanel>

        <DataPanel title="Propuestas recientes" icon={<Clock size={18} />} action={<Link to="/aprendiz/propuestas" className={s.panelLink}>Ver todas</Link>}>
          {recientes.length === 0 ? (
            <EmptyState icon={<Tray />} title="Aún no tienes propuestas" message="Registra tu primera propuesta para comenzar a analizarla." actionLabel="Crear propuesta" onAction={() => navigate('/aprendiz/propuestas?crear=1')} />
          ) : (
            <ul className={s.projectList}>
              {recientes.map(p => {
                const info = similitudInfo(similitudes, p.id)
                return (
                  <li key={p.id}>
                    <Link to={`/aprendiz/detalle-proyecto/${p.id}`} className={s.projectRow}>
                      <div className={s.projectInfo}>
                        <span className={s.projectTitle}>{p.title}</span>
                        <span className={s.projectMeta}>{p.createdAt} · {displayNames.projectStatus[p.estado] || p.estado}</span>
                      </div>
                      <div className={s.projectSide}>
                        {info && (
                          <Badge variant={info.pct >= 70 ? 'danger' : info.pct >= 40 ? 'warning' : 'success'}>
                            {info.pct}% · {info.count} coincidencia{info.count !== 1 ? 's' : ''}
                          </Badge>
                        )}
                        <Badge variant={ESTADO_VARIANT[p.estado] || 'neutral'}>{displayNames.projectStatus[p.estado] || p.estado}</Badge>
                        <CaretRight size={16} className={s.chevron} />
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </DataPanel>
      </div>
    </DashboardLayout>
  )
}
