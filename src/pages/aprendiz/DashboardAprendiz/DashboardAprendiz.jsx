import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, CaretRight, Clock, FolderOpen, GraduationCap, MagnifyingGlass, PlusCircle, Tray } from 'phosphor-react'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import { useAuth } from '../../../contexts/AuthContext'
import MetricCard from '../../../components/MetricCard/MetricCard'
import DataPanel from '../../../components/DataPanel/DataPanel'
import Badge from '../../../components/Badge/Badge'
import EmptyState from '../../../components/EmptyState/EmptyState'
import {
  getProjectsByStudent, getAllSimilarities, findUserById, findFichaById, getUnreadCount, displayNames,
} from '../../../data/mockData'
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
  const perfil = findUserById(user.id)
  const ficha = findFichaById(perfil?.fichaId)
  const misProyectos = useMemo(() => getProjectsByStudent(user.id), [user.id])
  const similitudes = useMemo(() => getAllSimilarities(), [])
  const sinLeer = getUnreadCount(user.id)
  const similitudesPropias = similitudes.filter(sim =>
    misProyectos.some(p => p.id === sim.projectId1 || p.id === sim.projectId2)
  ).length
  const recientes = [...misProyectos].slice(0, 5)
  const hoy = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const acciones = [
    { to: '/aprendiz/mis-proyectos', icon: <FolderOpen size={24} weight="regular" />, titulo: 'Mis Proyectos', descripcion: 'Consulta y revisa tus proyectos registrados' },
    { to: '/aprendiz/nuevo-proyecto', icon: <PlusCircle size={24} weight="regular" />, titulo: 'Nueva Propuesta', descripcion: 'Registra una nueva propuesta académica' },
    ficha
      ? { to: `/aprendiz/detalle-ficha/${ficha.id}`, icon: <GraduationCap size={24} weight="regular" />, titulo: 'Mi Ficha', descripcion: `${ficha.nombre} · ${ficha.codigo}` }
      : { to: '/aprendiz/unirse-ficha', icon: <GraduationCap size={24} weight="regular" />, titulo: 'Unirme a una Ficha', descripcion: 'Usa el código de tu ficha de formación' },
    { to: '/aprendiz/alertas', icon: <Bell size={24} weight="regular" />, titulo: 'Alertas', descripcion: sinLeer > 0 ? `Tienes ${sinLeer} alerta${sinLeer > 1 ? 's' : ''} sin leer` : 'Todo leído al día' },
  ]

  return (
    <DashboardLayout role="aprendiz" titulo="Dashboard">
      <div className={s.wrapper}>
        <section className={s.welcome}>
          <div>
            <h2 className={s.welcomeTitle}>¡Hola, {user.nombre.split(' ')[0]}!</h2>
            <p className={s.welcomeDate}>{hoy}</p>
          </div>
          <p className={s.welcomeText}>Este es tu espacio para gestionar proyectos y mantener la originalidad de tu trabajo.</p>
        </section>

        <section className={s.stats} aria-label="Resumen de actividad">
          <MetricCard icon={<FolderOpen size={22} />} label="Proyectos totales" value={misProyectos.length} variant="primary" />
          <MetricCard icon={<MagnifyingGlass size={22} />} label="Similitudes detectadas" value={similitudesPropias} variant="warning" />
          <MetricCard icon={<Bell size={22} />} label="Alertas sin leer" value={sinLeer} variant="info" />
        </section>

        <section aria-labelledby="acciones-title">
          <h2 id="acciones-title" className={s.sectionTitle}>Acciones rápidas</h2>
          <div className={s.quickGrid}>
            {acciones.map(a => (
              <Link key={a.titulo} to={a.to} className={s.quickCard}>
                <span className={s.quickIcon} aria-hidden="true">{a.icon}</span>
                <span className={s.quickTitle}>{a.titulo}</span>
                <span className={s.quickDesc}>{a.descripcion}</span>
              </Link>
            ))}
          </div>
        </section>

        <DataPanel title="Proyectos recientes" icon={<Clock size={18} />} action={<Link to="/aprendiz/mis-proyectos" className={s.panelLink}>Ver todos</Link>}>
          {recientes.length === 0 ? (
            <EmptyState icon={<Tray />} title="Aún no tienes proyectos" message="Registra tu primera propuesta para comenzar a analizarla." actionLabel="Crear propuesta" onAction={() => navigate('/aprendiz/nuevo-proyecto')} />
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
