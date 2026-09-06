import { Link } from 'react-router-dom'
import { ClipboardText, PlusCircle, BookOpen, MagnifyingGlass, Bell, Sparkle, Clock, CaretRight } from 'phosphor-react'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import Dashboard from '../../../components/Dashboard/Dashboard'
import MetricCard from '../../../components/MetricCard/MetricCard'
import DataPanel from '../../../components/DataPanel/DataPanel'
import QuickActions from '../../../components/QuickActions/QuickActions'
import Badge from '../../../components/Badge/Badge'
import EmptyState from '../../../components/EmptyState/EmptyState'
import { useAuth } from '../../../contexts/AuthContext'
import { getAllProjects, getAllFichas, getPendingProjects, getUnreadCount, getSimilitudesValidas, instructorVeProyecto, displayNames } from '../../../data/mockData'
import s from '../../../components/Dashboard/Dashboard.module.css'

const ESTADO_VARIANT = { pendiente: 'warning', aprobado: 'success', rechazado: 'danger' }

export default function DashboardInstructor() {
  const { user } = useAuth()
  const uid = Number(user?.id)
  // Mismo criterio que Revisión: proyecto propio O de ficha propia
  const misProyectos = user ? getAllProjects().filter(p => instructorVeProyecto(p, uid)) : []
  const pendientes = misProyectos.filter(p => p.estado === 'pendiente')
  const misFichas = user ? getAllFichas().filter(f => f.instructorId === uid) : []
  const idsPropios = new Set(misProyectos.map(p => p.id))
  const similitudesPropias = getSimilitudesValidas().filter(x => idsPropios.has(x.projectId1) || idsPropios.has(x.projectId2))
  const recientes = user ? getPendingProjects().filter(p => instructorVeProyecto(p, uid)).slice(0, 5) : []
  const saludo = user?.nombre?.split(' ')[0] || 'Instructor'

  const quick = []

  if (pendientes.length > 0) {
    quick.push({
      to: '/instructor/revision-propuestas',
      icon: <ClipboardText size={24} weight="regular" />,
      titulo: 'Revisar propuestas',
      descripcion: `${pendientes.length} esperando tu revisión`,
    })
  }

  quick.push({
    to: '/instructor/fichas?crear=1',
    icon: <PlusCircle size={24} weight="regular" />,
    titulo: 'Crear ficha',
    descripcion: 'Nueva ficha con código para tus aprendices',
  })

  return (
    <DashboardLayout role="instructor" titulo="Dashboard">
      <Dashboard
        kicker="Panel de instructor"
        titulo={<>¡Hola, {saludo}!</>}
        texto="Bienvenido de nuevo a ProyecTwin. Aquí encontrarás un resumen de tus fichas, propuestas por revisar y la actividad reciente de las propuestas de tus aprendices."
        stats={
          <>
            <Link to="/instructor/revision-propuestas" className={s.statLink}><MetricCard icon={<ClipboardText size={22} />} label="Revisiones pendientes" value={pendientes.length} variant="warning" /></Link>
            <Link to="/instructor/fichas" className={s.statLink}><MetricCard icon={<BookOpen size={22} />} label="Fichas a cargo" value={misFichas.length} variant="info" /></Link>
            <Link to="/instructor/similitudes" className={s.statLink}><MetricCard icon={<MagnifyingGlass size={22} />} label="Similitudes detectadas" value={similitudesPropias.length} variant="success" /></Link>
            <Link to="/instructor/alertas" className={s.statLink}><MetricCard icon={<Bell size={22} />} label="Alertas sin leer" value={user ? getUnreadCount(uid) : 0} variant="danger" /></Link>
          </>
        }
        acciones={
          <DataPanel title="Acciones rápidas" icon={<Sparkle size={18} />}>
            <QuickActions items={quick} />
          </DataPanel>
        }
        actividad={
          <DataPanel title="Propuestas pendientes recientes" icon={<Clock size={18} />} action={<Link to="/instructor/revision-propuestas" className={s.panelLink}>Ver todas</Link>}>
            {recientes.length === 0 ? (
              <EmptyState title="No hay propuestas pendientes" message="Cuando tus aprendices envíen nuevas propuestas aparecerán aquí para su revisión." />
            ) : (
              <ul className={s.lista}>
                {recientes.map(p => (
                  <li key={p.id}>
                    <Link to={`/instructor/detalle-proyecto/${p.id}`} className={s.fila}>
                      <div className={s.filaMain}>
                        <span className={s.filaTitulo}>{p.title}</span>
                        <span className={s.filaMeta}>{p.studentName} · {p.createdAt}</span>
                      </div>
                      <Badge variant={ESTADO_VARIANT[p.estado] || 'neutral'}>{displayNames.projectStatus[p.estado] || p.estado}</Badge>
                      <CaretRight size={16} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </DataPanel>
        }
      />
    </DashboardLayout>
  )
}
