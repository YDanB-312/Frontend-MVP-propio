import { Link } from 'react-router-dom'
import { UsersThree, FolderOpen, MagnifyingGlass, Bug, Bell, Sparkle, CheckCircle, ChatCircle } from 'phosphor-react'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import MetricCard from '../../../components/MetricCard/MetricCard'
import DataPanel from '../../../components/DataPanel/DataPanel'
import QuickActions from '../../../components/QuickActions/QuickActions'
import Badge from '../../../components/Badge/Badge'
import EmptyState from '../../../components/EmptyState/EmptyState'
import { useAuth } from '../../../contexts/AuthContext'
import { getAllUsers, getAllProjects, getAllSimilarities, getAllBugReports, getNotificationsByUser, getPendingProjects, displayNames } from '../../../data/mockData'
import s from './DashboardAdmin.module.css'

const TIPO_ICON = { similitud: <MagnifyingGlass size={16} />, revision: <CheckCircle size={16} />, mensaje: <Bell size={16} />, sistema: <Sparkle size={16} />, observacion: <ChatCircle size={16} /> }

export default function DashboardAdmin() {
  const { user } = useAuth()
  const usuarios = getAllUsers()
  const proyectos = getAllProjects()
  const similitudes = getAllSimilarities()
  const reportes = getAllBugReports()
  const datos = {
    totalUsuarios: usuarios.length,
    aprendices: usuarios.filter(u => u.role === 'aprendiz').length,
    instructores: usuarios.filter(u => u.role === 'instructor').length,
    totalProyectos: proyectos.length,
    pendientes: getPendingProjects().length,
    totalSimilitudes: similitudes.length,
    similitudesPendientes: similitudes.filter(x => x.estado === 'pendiente').length,
    totalReportes: reportes.length,
    reportesAbiertos: reportes.filter(r => r.estado === 'pendiente' || r.estado === 'en_revision').length,
    alertas: user ? getNotificationsByUser(Number(user.id)).slice(0, 5) : [],
  }

      const quick = []

  if (datos.reportesAbiertos > 0) {
    quick.push({
      to: '/admin/reportes-fallas',
      icon: <Bug size={24} weight="regular" />,
      titulo: 'Atender reportes',
      descripcion: `${datos.reportesAbiertos} abiertos`,
    })
  }

  quick.push({
    to: '/admin/usuarios?crear=1',
    icon: <UsersThree size={24} weight="regular" />,
    titulo: 'Crear usuario',
    descripcion: 'Alta de aprendices, instructores o admins',
  })

return (
    <DashboardLayout role="admin" titulo="Dashboard">
      <div className={s.page}>
        <section className={s.hero}>
          <p className={s.heroKicker}>Panel de administración</p>
          <h1 className={s.heroTitle}>Resumen general del sistema</h1>
          <p className={s.heroText}>Monitorea usuarios, propuestas, similitudes detectadas y reportes de fallas de toda la plataforma ProyecTwin.</p>
        </section>

        <section className={s.stats} aria-label="Estadísticas generales">
          <Link to="/admin/usuarios" className={s.statLink}><MetricCard icon={<UsersThree size={22} />} label="Usuarios" value={datos.totalUsuarios} variant="primary" trend={`${datos.aprendices} AP · ${datos.instructores} IN`} /></Link>
          <Link to="/admin/proyectos" className={s.statLink}><MetricCard icon={<FolderOpen size={22} />} label="Propuestas" value={datos.totalProyectos} variant="success" trend={`${datos.pendientes} pendientes`} /></Link>
          <Link to="/admin/similitudes" className={s.statLink}><MetricCard icon={<MagnifyingGlass size={22} />} label="Similitudes" value={datos.totalSimilitudes} variant="warning" trend={`${datos.similitudesPendientes} sin revisar`} /></Link>
          <Link to="/admin/reportes-fallas" className={s.statLink}><MetricCard icon={<Bug size={22} />} label="Reportes de fallas" value={datos.totalReportes} variant="danger" trend={`${datos.reportesAbiertos} abiertos`} /></Link>
        </section>

        <DataPanel title="Acciones rápidas" icon={<Sparkle size={18} />}>
          <QuickActions items={quick} />
        </DataPanel>

        <DataPanel title="Alertas recientes" icon={<Bell size={18} />} action={<Link to="/admin/notificaciones" className={s.link}>Ver todas</Link>}>
          {datos.alertas.length === 0 ? (
            <EmptyState title="Sin alertas" message="No tienes notificaciones recientes." />
          ) : (
            <ul className={s.list}>
              {datos.alertas.map(n => (
                <li key={n.id} className={`${s.row} ${!n.leido ? s.unread : ''}`}>
                  <span className={s.icon} aria-hidden="true">{TIPO_ICON[n.tipo] || <Bell size={16} />}</span>
                  <span className={s.rowBody}>
                    <span className={s.rowMsg}>{n.mensaje}</span>
                    <span className={s.rowMeta}>{displayNames.notificationType[n.tipo] || 'Notificación'} · {n.createdAt}</span>
                  </span>
                  {!n.leido && <Badge variant="primary">Nueva</Badge>}
                </li>
              ))}
            </ul>
          )}
        </DataPanel>
      </div>
    </DashboardLayout>
  )
}
