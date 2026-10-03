import { Link } from 'react-router-dom'
import { UsersThree, FolderOpen, MagnifyingGlass, Bug, Bell, Sparkle, SlidersHorizontal, Gauge, Database } from 'phosphor-react'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import DashboardHero from '../../../components/DashboardHero/DashboardHero'
import DashboardGrid from '../../../components/DashboardGrid/DashboardGrid'
import StatChip from '../../../components/StatChip/StatChip'
import DataPanel from '../../../components/DataPanel/DataPanel'
import SectionHeader from '../../../components/SectionHeader/SectionHeader'
import QueueTile, { QueueGrid } from '../../../components/QueueTile/QueueTile'
import ActivityList from '../../../components/ActivityList/ActivityList'
import QuickActions from '../../../components/QuickActions/QuickActions'
import Badge from '../../../components/Badge/Badge'
import Button from '../../../components/Button/Button'
import EmptyState from '../../../components/EmptyState/EmptyState'
import ApiState from '../../../components/ApiState/ApiState'
import { useAuth } from '../../../contexts/AuthContext'
import { useApi } from '../../../lib/useApi'
import { notificaciones, stats } from '../../../lib/recursos'
import { fechaDesdeApi } from '../../../utils/helpers'
import { RECIENTES } from '../../../constants/pagination'
import s from './DashboardAdmin.module.css'

// Etiquetas legibles del tipo de notificación (columnas reales de la API).
const TIPO_NOTIF = {
  similitud: 'Similitud',
  observacion: 'Observación',
  revision: 'Revisión',
  mensaje: 'Mensaje',
  sistema: 'Sistema',
}

export default function DashboardAdmin() {
  const { user } = useAuth()

  // Fuente única: la API. Los números vienen agregados del servidor (stats) y
  // solo las alertas se traen como lista.
  const { data, cargando, error, recargar } = useApi(
    async () => {
      const [resumen, listaNotificaciones] = await Promise.all([
        stats.resumen(),
        notificaciones.listar(),
      ])
      return { resumen, listaNotificaciones }
    },
    [user?.id],
    { inicial: null }
  )

  const resumen = data?.resumen || null
  const motorConfig = resumen?.motor || { umbral: 0.3, meses: 12 }

  // Alertas del admin autenticado (la API devuelve todas; se filtra por usuario).
  const alertas = (data?.listaNotificaciones || [])
    .filter((n) => Number(n.id_usuario) === Number(user?.id))
    .sort((a, b) => Number(b.id) - Number(a.id))
    .slice(0, RECIENTES)

  const datos = {
    totalUsuarios: resumen?.usuarios?.total ?? 0,
    suspendidos: resumen?.usuarios?.suspendidos ?? 0,
    totalProyectos: resumen?.proyectos?.total ?? 0,
    pendientes: resumen?.proyectos?.pendiente ?? 0,
    totalSimilitudes: resumen?.similitudes ?? 0,
    totalReportes: resumen?.reportes?.total ?? 0,
    reportesAbiertos: resumen?.reportes?.abiertos ?? 0,
  }
  const saludo = user?.nombre?.split(' ')[0] || 'Admin'

  const quick = [{
    to: '/admin/config-similitud',
    icon: <SlidersHorizontal size={24} weight="regular" />,
    titulo: 'Motor de similitud',
    descripcion: 'Ajusta el umbral y recalibra la base',
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

  const itemsAlertas = alertas.map((n) => ({
    key: n.id,
    to: '/admin/notificaciones',
    title: n.titulo,
    meta: `${TIPO_NOTIF[n.tipo] || 'Notificación'} · ${fechaDesdeApi(n.fecha)}`,
    side: !n.leida ? <Badge variant="primary">Nueva</Badge> : null,
  }))

  return (
    <DashboardLayout role="admin" titulo="Dashboard">
      <div className={s.page}>
        <DashboardHero
          kicker="STATUS · ADMIN"
          title={<>¡Hola, {saludo}!</>}
          text="Monitorea usuarios, propuestas, similitudes detectadas y reportes de fallas de toda la plataforma ProyecTwin."
        />

        <ApiState cargando={cargando} error={error} onReintentar={recargar}>
          <DataPanel
            title="Salud del motor"
            subtitle={`Umbral ${Math.round(motorConfig.umbral * 100)}% · corpus de ${motorConfig.meses} meses`}
            glow
            action={
              <Button as="link" to="/admin/config-similitud" viewTransition size="sm" variant="secondary">
                <SlidersHorizontal size={14} /> Ajustar motor
              </Button>
            }
          >
            <div className={s.motorChips}>
              <StatChip icon={<Gauge size={14} />} label="Umbral" value={`${Math.round(motorConfig.umbral * 100)}%`} />
              <StatChip icon={<Database size={14} />} label="Corpus" value={`${motorConfig.meses}M`} />
              <StatChip icon={<MagnifyingGlass size={14} />} label="Pares" value={datos.totalSimilitudes} />
              <StatChip icon={<UsersThree size={14} />} label="Usuarios" value={datos.totalUsuarios} />
            </div>
          </DataPanel>

          <section aria-label="Colas por atender">
            <SectionHeader title="Colas por atender" hint="lo que espera acción" />
            <QueueGrid>
              {colas.map((c) => (
                <QueueTile key={c.to} to={c.to} icon={c.icon} value={c.valor} total={c.total} title={c.nombre} />
              ))}
            </QueueGrid>
          </section>

          <DashboardGrid
            left={
              <div className={s.accionesPanel}>
                <DataPanel title="Acciones rápidas" icon={<Sparkle size={18} />}>
                  <QuickActions items={quick} />
                </DataPanel>
              </div>
            }
            right={
              <DataPanel
                title="Alertas recientes"
                icon={<Bell size={18} />}
                action={<Link to="/admin/notificaciones" viewTransition className={s.panelLink}>Ver todas</Link>}
              >
                <ActivityList
                  items={itemsAlertas}
                  empty={<EmptyState title="Sin alertas" message="No tienes notificaciones recientes." />}
                />
              </DataPanel>
            }
          />
        </ApiState>
      </div>
    </DashboardLayout>
  )
}
