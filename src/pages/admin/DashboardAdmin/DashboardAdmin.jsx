import { Link } from 'react-router-dom'
import { UsersThree, FolderOpen, MagnifyingGlass, Bug, Bell, Sparkle, ChatCircle } from 'phosphor-react'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import Dashboard from '../../../components/Dashboard/Dashboard'
import MetricCard from '../../../components/MetricCard/MetricCard'
import DataPanel from '../../../components/DataPanel/DataPanel'
import QuickActions from '../../../components/QuickActions/QuickActions'
import Badge from '../../../components/Badge/Badge'
import EmptyState from '../../../components/EmptyState/EmptyState'
import { useAuth } from '../../../contexts/AuthContext'
import { getAllUsers, getAllProjects, getSimilitudesValidas, getAllBugReports, getNotificationsByUser, getPendingProjects, displayNames } from '../../../data/mockData'
import s from '../../../components/Dashboard/Dashboard.module.css'

const TIPO_ICON = { similitud: <MagnifyingGlass size={16} />, revision: null, mensaje: <Bell size={16} />, sistema: <Sparkle size={16} />, observacion: <ChatCircle size={16} /> }

export default function DashboardAdmin() {
  const { user } = useAuth()
  const usuarios = getAllUsers()
  const proyectos = getAllProjects()
  const similitudes = getSimilitudesValidas()
  const reportes = getAllBugReports()
  const datos = {
    totalUsuarios: usuarios.length,
    aprendices: usuarios.filter(u => u.role === 'aprendiz').length,
    instructores: usuarios.filter(u => u.role === 'instructor').length,
    totalProyectos: proyectos.length,
    pendientes: getPendingProjects().length,
    totalSimilitudes: similitudes.length,
    totalReportes: reportes.length,
    reportesAbiertos: reportes.filter(r => r.estado === 'pendiente' || r.estado === 'en_revision').length,
    alertas: user ? getNotificationsByUser(Number(user.id)).slice(0, 5) : [],
  }
  const saludo = user?.nombre?.split(' ')[0] || 'Admin'

  const quick = [{
    to: '/admin/reportes-fallas',
    icon: <Bug size={24} weight="regular" />,
    titulo: 'Reportar falla',
    descripcion: 'Reporta un problema con la plataforma',
  }]

  if (datos.reportesAbiertos > 0) {
    quick.unshift({
      to: '/admin/reportes-fallas',
      icon: <Bug size={24} weight="regular" />,
      titulo: 'Atender reportes',
      descripcion: `${datos.reportesAbiertos} abiertos`,
    })
  }

  return (
    <DashboardLayout role="admin" titulo="Dashboard">
      <Dashboard
        kicker="Panel de administración"
        titulo={<>¡Hola, {saludo}!</>}
        texto="Monitorea usuarios, propuestas, similitudes detectadas y reportes de fallas de toda la plataforma ProyecTwin."
        stats={
          <>
            <Link to="/admin/usuarios" className={s.statLink}><MetricCard icon={<UsersThree size={22} />} label="Usuarios" value={datos.totalUsuarios} variant="primary" trend={`${datos.aprendices} AP · ${datos.instructores} IN`} /></Link>
            <Link to="/admin/proyectos" className={s.statLink}><MetricCard icon={<FolderOpen size={22} />} label="Propuestas" value={datos.totalProyectos} variant="success" trend={`${datos.pendientes} pendientes`} /></Link>
            <Link to="/admin/similitudes" className={s.statLink}><MetricCard icon={<MagnifyingGlass size={22} />} label="Similitudes" value={datos.totalSimilitudes} variant="warning" /></Link>
            <Link to="/admin/reportes-fallas" className={s.statLink}><MetricCard icon={<Bug size={22} />} label="Reportes de fallas" value={datos.totalReportes} variant="danger" trend={`${datos.reportesAbiertos} abiertos`} /></Link>
          </>
        }
        acciones={
          <DataPanel title="Acciones rápidas" icon={<Sparkle size={18} />}>
            <QuickActions items={quick} />
          </DataPanel>
        }
        actividad={
          <DataPanel title="Alertas recientes" icon={<Bell size={18} />} action={<Link to="/admin/notificaciones" className={s.panelLink}>Ver todas</Link>}>
            {datos.alertas.length === 0 ? (
              <EmptyState title="Sin alertas" message="No tienes notificaciones recientes." />
            ) : (
              <ul className={s.lista}>
                {datos.alertas.map(n => (
                  <li key={n.id}>
                    <Link to="/admin/notificaciones" className={`${s.fila} ${!n.leido ? s.unread : ''}`}>
                      <span className={s.iconoFila} aria-hidden="true">{TIPO_ICON[n.tipo] || <Bell size={16} />}</span>
                      <div className={s.filaMain}>
                        <span className={s.filaTitulo}>{n.mensaje}</span>
                        <span className={s.filaMeta}>{displayNames.notificationType[n.tipo] || 'Notificación'} · {n.createdAt}</span>
                      </div>
                      {!n.leido && <Badge variant="primary">Nueva</Badge>}
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
