import { Link } from 'react-router-dom'
import { ClipboardText, BookOpen, MagnifyingGlass, Bell, PlusCircle, Bug, UserCircle, Sparkle, Clock, CaretRight } from 'phosphor-react'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import MetricCard from '../../../components/MetricCard/MetricCard'
import DataPanel from '../../../components/DataPanel/DataPanel'
import Badge from '../../../components/Badge/Badge'
import EmptyState from '../../../components/EmptyState/EmptyState'
import { useAuth } from '../../../contexts/AuthContext'
import { getProjectsByInstructor, getAllFichas, getPendingProjects, getUnreadCount, getAllSimilarities, displayNames } from '../../../data/mockData'
import s from './DashboardInstructor.module.css'

const ESTADO_VARIANT = { pendiente: 'warning', en_revision: 'info', aprobado: 'success', rechazado: 'danger', requiere_ajustes: 'warning' }

export default function DashboardInstructor() {
  const { user } = useAuth()
  const uid = Number(user?.id)
  const misProyectos = user ? getProjectsByInstructor(uid) : []
  const pendientes = misProyectos.filter(p => p.estado === 'pendiente')
  const misFichas = user ? getAllFichas().filter(f => f.instructorId === uid) : []
  const idsPropios = new Set(misProyectos.map(p => p.id))
  const similitudesPropias = getAllSimilarities().filter(x => idsPropios.has(x.projectId1) || idsPropios.has(x.projectId2))
  const pendientesSim = similitudesPropias.filter(x => x.estado === 'pendiente').length
  const recientes = user ? getPendingProjects().filter(p => p.instructorId === uid).slice(0, 5) : []
  const saludo = user?.nombre?.split(' ')[0] || 'Instructor'

  return (
    <DashboardLayout role="instructor" titulo="Dashboard">
      <div className={s.page}>
        <section className={s.hero}>
          <p className={s.heroKicker}>Panel de instructor</p>
          <h1 className={s.heroTitle}>¡Hola, {saludo}!</h1>
          <p className={s.heroText}>Bienvenido de nuevo a ProyecTwin. Aquí encontrarás un resumen de tus fichas, propuestas por revisar y la actividad reciente de tus proyectos.</p>
        </section>

        <section className={s.stats} aria-label="Estadísticas generales">
          <Link to="/instructor/revision-propuestas" className={s.statLink}><MetricCard icon={<ClipboardText size={22} />} label="Revisiones pendientes" value={pendientes.length} variant="warning" /></Link>
          <Link to="/instructor/gestionar-fichas" className={s.statLink}><MetricCard icon={<BookOpen size={22} />} label="Fichas a cargo" value={misFichas.length} variant="info" /></Link>
          <Link to="/instructor/similitudes" className={s.statLink}><MetricCard icon={<MagnifyingGlass size={22} />} label="Similitudes detectadas" value={similitudesPropias.length} variant="success" trend={pendientesSim > 0 ? `${pendientesSim} PENDIENTE${pendientesSim !== 1 ? 'S' : ''}` : undefined} /></Link>
          <Link to="/instructor/alertas" className={s.statLink}><MetricCard icon={<Bell size={22} />} label="Alertas sin leer" value={user ? getUnreadCount(uid) : 0} variant="danger" /></Link>
        </section>

        <DataPanel title="Acciones rápidas" icon={<Sparkle size={18} />}>
          <div className={s.quick}>
            <Link to="/instructor/revision-propuestas" className={s.quickItem}><ClipboardText size={18} /> Revisar propuestas</Link>
            <Link to="/instructor/gestionar-fichas" className={s.quickItem}><BookOpen size={18} /> Gestionar fichas</Link>
            <Link to="/instructor/crear-ficha" className={s.quickItem}><PlusCircle size={18} /> Crear ficha</Link>
            <Link to="/instructor/alertas" className={s.quickItem}><Bell size={18} /> Ver alertas</Link>
            <Link to="/instructor/reportar-falla" className={s.quickItem}><Bug size={18} /> Reportar falla</Link>
            <Link to="/instructor/perfil" className={s.quickItem}><UserCircle size={18} /> Mi perfil</Link>
          </div>
        </DataPanel>

        <DataPanel title="Propuestas pendientes recientes" icon={<Clock size={18} />} action={<Link to="/instructor/revision-propuestas" className={s.link}>Ver todas</Link>}>
          {recientes.length === 0 ? (
            <EmptyState title="No hay propuestas pendientes" message="Cuando tus aprendices envíen nuevas propuestas aparecerán aquí para su revisión." />
          ) : (
            <ul className={s.list}>
              {recientes.map(p => (
                <li key={p.id}>
                  <Link to={`/instructor/detalle-proyecto/${p.id}`} className={s.row}>
                    <div className={s.rowMain}>
                      <span className={s.rowTitle}>{p.title}</span>
                      <span className={s.rowMeta}>{p.studentName} · {p.createdAt}</span>
                    </div>
                    <Badge variant={ESTADO_VARIANT[p.estado] || 'neutral'}>{displayNames.projectStatus[p.estado] || p.estado}</Badge>
                    <CaretRight size={16} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </DataPanel>
      </div>
    </DashboardLayout>
  )
}
