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
import ApiState from '../../../components/ApiState/ApiState'
import { useAuth } from '../../../contexts/AuthContext'
import { useApi } from '../../../lib/useApi'
import { usuarios, proyectos, similitudes, reportes, notificaciones, motor } from '../../../lib/recursos'
import { fechaDesdeApi } from '../../../utils/helpers'
import s from './DashboardAdmin.module.css'
import { RECIENTES } from '../../../constants/pagination'

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

  // Fuente única: la API. Se piden todos los recursos del tablero en paralelo.
  const { data, cargando, error, recargar } = useApi(
    async () => {
      const [listaUsuarios, listaProyectos, listaSimilitudes, listaReportes, listaNotificaciones, configMotor] =
        await Promise.all([
          usuarios.listar(),
          proyectos.listar(),
          similitudes.listar(),
          reportes.listar(),
          notificaciones.listar(),
          motor.obtener(),
        ])
      return { listaUsuarios, listaProyectos, listaSimilitudes, listaReportes, listaNotificaciones, configMotor }
    },
    [user?.id],
    { inicial: null }
  )

  const dato = data || {}
  const usuariosLista = dato.listaUsuarios || []
  const proyectosLista = dato.listaProyectos || []
  const similitudesLista = dato.listaSimilitudes || []
  const reportesLista = dato.listaReportes || []
  const motorConfig = dato.configMotor || { umbral: 0.2, meses: 12 }

  // Alertas del admin autenticado (la API devuelve todas; se filtra por usuario).
  const alertas = (dato.listaNotificaciones || [])
    .filter((n) => Number(n.id_usuario) === Number(user?.id))
    .sort((a, b) => Number(b.id) - Number(a.id))
    .slice(0, RECIENTES)

  const datos = {
    totalUsuarios: usuariosLista.length,
    suspendidos: usuariosLista.filter((u) => u.estado === false).length,
    totalProyectos: proyectosLista.length,
    pendientes: proyectosLista.filter((p) => p.estado === 'pendiente').length,
    totalSimilitudes: similitudesLista.length,
    totalReportes: reportesLista.length,
    reportesAbiertos: reportesLista.filter((r) => r.estado === 'pendiente' || r.estado === 'en_revision').length,
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

        <ApiState cargando={cargando} error={error} onReintentar={recargar}>
          <ConsoleCard
            title="Salud del motor"
            subtitle={`Umbral ${Math.round(motorConfig.umbral * 100)}% · corpus de ${motorConfig.meses} meses`}
            glow
            actions={
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
            <div className={s.accionesPanel}>
              <DataPanel title="Acciones rápidas" icon={<Sparkle size={18} />}>
                <QuickActions items={quick} />
              </DataPanel>
            </div>
            <DataPanel title="Alertas recientes" icon={<Bell size={18} />} action={<Link to="/admin/notificaciones" viewTransition className={s.panelLink}>Ver todas</Link>}>
              {alertas.length === 0 ? (
                <EmptyState title="Sin alertas" message="No tienes notificaciones recientes." />
              ) : (
                <ul className={s.lista}>
                  {alertas.map((n) => (
                    <li key={n.id}>
                      <Link to="/admin/notificaciones" viewTransition className={s.fila}>
                        <span className={s.filaMain}>
                          <span className={s.filaTitulo}>{n.titulo}</span>
                          <span className={s.filaMeta}>{TIPO_NOTIF[n.tipo] || 'Notificación'} · {fechaDesdeApi(n.fecha)}</span>
                        </span>
                        {!n.leida && <Badge variant="primary">Nueva</Badge>}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </DataPanel>
          </div>
        </ApiState>
      </div>
    </DashboardLayout>
  )
}
