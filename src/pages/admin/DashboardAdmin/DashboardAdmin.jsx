import { Link } from 'react-router-dom'
import { UsersThree, FolderOpen, MagnifyingGlass, Bug, Bell, Sparkle, SlidersHorizontal, GearSix, Gauge, Database } from 'phosphor-react'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import StatChip from '../../../components/StatChip/StatChip'
import ConsoleCard from '../../../components/ConsoleCard/ConsoleCard'
import SectionHeader from '../../../components/SectionHeader/SectionHeader'
import DataPanel from '../../../components/DataPanel/DataPanel'
import QuickActions from '../../../components/QuickActions/QuickActions'
import Badge from '../../../components/Badge/Badge'
import Button from '../../../components/Button/Button'
import EmptyState from '../../../components/EmptyState/EmptyState'
import { useAuth } from '../../../contexts/AuthContext'
import { getAllUsers, getAllProjects, getSimilitudesValidas, getAllBugReports, getNotificationsByUser, getPendingProjects, getConfigMotor, displayNames } from '../../../data/mockData'
import s from './DashboardAdmin.module.css'
import { RECIENTES } from '../../../constants/pagination'

export default function DashboardAdmin() {
  const { user } = useAuth()
  const usuarios = getAllUsers()
  const proyectos = getAllProjects()
  const similitudes = getSimilitudesValidas()
  const reportes = getAllBugReports()
  const motor = getConfigMotor()
  const datos = {
    totalUsuarios: usuarios.length,
    aprendices: usuarios.filter(u => u.role === 'aprendiz').length,
    instructores: usuarios.filter(u => u.role === 'instructor').length,
    suspendidos: usuarios.filter(u => u.estado === 'suspendido').length,
    totalProyectos: proyectos.length,
    pendientes: getPendingProjects().length,
    totalSimilitudes: similitudes.length,
    totalReportes: reportes.length,
    reportesAbiertos: reportes.filter(r => r.estado === 'pendiente' || r.estado === 'en_revision').length,
    alertas: user ? getNotificationsByUser(Number(user.id)).slice(0, RECIENTES) : [],
  }
  const saludo = user?.nombre?.split(' ')[0] || 'Admin'

  const quick = [{
    to: '/admin/config-similitud',
    icon: <SlidersHorizontal size={24} weight="regular" />,
    titulo: 'Motor de similitud',
    descripcion: 'Ajusta el umbral y recalibra la base',
  },
  {
    to: '/admin/configuracion',
    icon: <GearSix size={24} weight="regular" />,
    titulo: 'Configuración',
    descripcion: 'Redes, centros y motor en un solo lugar',
  }]

  if (datos.reportesAbiertos > 0) {
    quick.unshift({
      to: '/admin/reportes-fallas',
      icon: <Bug size={24} weight="regular" />,
      titulo: 'Atender reportes',
      descripcion: `${datos.reportesAbiertos} abiertos`,
    })
  }

  const colas = [
    { to: '/admin/proyectos', icon: <FolderOpen size={18} />, nombre: 'Propuestas pendientes', valor: datos.pendientes, total: datos.totalProyectos },
    { to: '/admin/reportes-fallas', icon: <Bug size={18} />, nombre: 'Reportes abiertos', valor: datos.reportesAbiertos, total: datos.totalReportes },
    { to: '/admin/usuarios', icon: <UsersThree size={18} />, nombre: 'Cuentas suspendidas', valor: datos.suspendidos, total: datos.totalUsuarios },
  ]

  return (
    <DashboardLayout role="admin" titulo="Dashboard">
      <div className={s.page}>
        <header className={s.hero}>
          <p className={`mono ${s.kicker}`}>STATUS · ADMIN</p>
          <h1 className={s.title}>¡Hola, {saludo}!</h1>
          <p className={s.texto}>Monitorea usuarios, propuestas, similitudes detectadas y reportes de fallas de toda la plataforma ProyecTwin.</p>
        </header>

        <ConsoleCard
          title="Salud del motor"
          subtitle={`Umbral ${Math.round(motor.umbral * 100)}% · corpus de ${motor.meses} meses`}
          glow
          actions={
            <Button as="link" to="/admin/config-similitud" viewTransition size="sm" variant="secondary">
              <SlidersHorizontal size={14} /> Ajustar motor
            </Button>
          }
        >
          <div className={s.motorChips}>
            <StatChip icon={<Gauge size={14} />} label="Umbral" value={`${Math.round(motor.umbral * 100)}%`} />
            <StatChip icon={<Database size={14} />} label="Corpus" value={`${motor.meses}M`} />
            <StatChip icon={<MagnifyingGlass size={14} />} label="Pares" value={datos.totalSimilitudes} />
            <StatChip icon={<UsersThree size={14} />} label="Usuarios" value={datos.totalUsuarios} />
          </div>
        </ConsoleCard>

        <section aria-label="Colas por atender">
          <SectionHeader title="Colas por atender" hint="lo que espera acción" />
          <div className={s.colas}>
            {colas.map((c) => (
              <Link key={c.to} to={c.to} viewTransition className={s.cola}>
                <span className={s.colaIcon} aria-hidden="true">{c.icon}</span>
                <span className={s.colaMain}>
                  <span className={`mono ${s.colaValor}`}>{c.valor}<span className={s.colaTotal}>/{c.total}</span></span>
                  <span className={s.colaNombre}>{c.nombre}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <div className={s.grid}>
          <DataPanel title="Acciones rápidas" icon={<Sparkle size={18} />}>
            <QuickActions items={quick} />
          </DataPanel>
          <DataPanel title="Alertas recientes" icon={<Bell size={18} />} action={<Link to="/admin/notificaciones" viewTransition className={s.panelLink}>Ver todas</Link>}>
            {datos.alertas.length === 0 ? (
              <EmptyState title="Sin alertas" message="No tienes notificaciones recientes." />
            ) : (
              <ul className={s.lista}>
                {datos.alertas.map(n => (
                  <li key={n.id}>
                    <Link to="/admin/notificaciones" viewTransition className={s.fila}>
                      <span className={s.filaMain}>
                        <span className={s.filaTitulo}>{n.mensaje}</span>
                        <span className={s.filaMeta}>{displayNames.notificationType[n.tipo] || 'Notificación'} · {n.createdAt}</span>
                      </span>
                      {!n.leido && <Badge variant="primary">Nueva</Badge>}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </DataPanel>
        </div>

      </div>
    </DashboardLayout>
  )
}
