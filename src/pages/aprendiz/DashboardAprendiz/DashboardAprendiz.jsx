import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, CaretRight, Clock, FolderOpen, MagnifyingGlass, PlusCircle, Tray } from 'phosphor-react'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import Dashboard from '../../../components/Dashboard/Dashboard'
import MetricCard from '../../../components/MetricCard/MetricCard'
import DataPanel from '../../../components/DataPanel/DataPanel'
import QuickActions from '../../../components/QuickActions/QuickActions'
import { Sparkle } from 'phosphor-react'
import Badge from '../../../components/Badge/Badge'
import EmptyState from '../../../components/EmptyState/EmptyState'
import {
  getProjectsByStudent, getSimilitudesValidas, getUnreadCount, displayNames,
} from '../../../data/mockData'
import { PROJECT_ESTADO_VARIANT } from '../../../constants/badgeVariants'
import { useAuth } from '../../../contexts/AuthContext'
import { getSimilitudInfo as similitudInfo } from '../../../utils/similitudInfo'
import s from '../../../components/Dashboard/Dashboard.module.css'
import { RECIENTES } from '../../../constants/pagination'

export default function DashboardAprendiz() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const misProyectos = useMemo(() => getProjectsByStudent(user.id), [user.id])
  const similitudes = useMemo(() => getSimilitudesValidas(), [])
  const sinLeer = getUnreadCount(user.id)
  const similitudesPropias = similitudes.filter(sim =>
    misProyectos.some(p => p.id === sim.projectId1 || p.id === sim.projectId2)
  ).length
  const recientes = [...misProyectos].slice(0, RECIENTES)
  const saludo = user.nombre.split(' ')[0]

  const acciones = [{
    to: '/aprendiz/propuestas?crear=1',
    icon: <PlusCircle size={24} weight="regular" />,
    titulo: 'Nueva Propuesta',
    descripcion: 'Crea tu propuesta y analízala al instante',
  }]

  return (
    <DashboardLayout role="aprendiz" titulo="Dashboard">
      <Dashboard
        kicker="Panel de aprendiz"
        titulo={<>¡Hola, {saludo}!</>}
        texto="Este es tu espacio para gestionar tus propuestas y mantener la originalidad de tu trabajo."
        stats={
          <>
            <Link to="/aprendiz/propuestas" className={s.statLink}><MetricCard icon={<FolderOpen size={22} />} label="Propuestas registradas" value={misProyectos.length} variant="primary" /></Link>
            <Link to="/aprendiz/similitudes" className={s.statLink}><MetricCard icon={<MagnifyingGlass size={22} />} label="Similitudes detectadas" value={similitudesPropias} variant="warning" /></Link>
            <Link to="/aprendiz/alertas" className={s.statLink}><MetricCard icon={<Bell size={22} />} label="Alertas sin leer" value={sinLeer} variant="info" /></Link>
          </>
        }
        acciones={
          <DataPanel title="Acciones rápidas" icon={<Sparkle size={18} />}>
            <QuickActions items={acciones} />
          </DataPanel>
        }
        actividad={
          <DataPanel title="Propuestas recientes" icon={<Clock size={18} />} action={<Link to="/aprendiz/propuestas" className={s.panelLink}>Ver todas</Link>}>
            {recientes.length === 0 ? (
              <EmptyState icon={<Tray />} title="Aún no tienes propuestas" message="Registra tu primera propuesta para comenzar a analizarla." actionLabel="Crear propuesta" onAction={() => navigate('/aprendiz/propuestas?crear=1')} />
            ) : (
              <ul className={s.lista}>
                {recientes.map(p => {
                  const info = similitudInfo(similitudes, p.id)
                  return (
                    <li key={p.id}>
                      <Link to={`/aprendiz/detalle-proyecto/${p.id}`} className={s.fila}>
                        <div className={s.filaMain}>
                          <span className={s.filaTitulo}>{p.title}</span>
                          <span className={s.filaMeta}>{p.createdAt} · {displayNames.projectStatus[p.estado] || p.estado}</span>
                        </div>
                        <div className={s.filaLado}>
                          {info && (
                            <Badge variant={info.pct >= 70 ? 'danger' : info.pct >= 40 ? 'warning' : 'success'}>
                              {info.pct}% · {info.count} coincidencia{info.count !== 1 ? 's' : ''}
                            </Badge>
                          )}
                          <Badge variant={PROJECT_ESTADO_VARIANT[p.estado] || 'neutral'}>{displayNames.projectStatus[p.estado] || p.estado}</Badge>
                          <CaretRight size={16} />
                        </div>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </DataPanel>
        }
      />
    </DashboardLayout>
  )
}
