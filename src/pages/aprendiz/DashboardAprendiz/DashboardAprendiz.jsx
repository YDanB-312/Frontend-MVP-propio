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
import ApiState from '../../../components/ApiState/ApiState'
import { useApi } from '../../../lib/useApi'
import { proyectos, similitudes as similitudesApi, notificaciones } from '../../../lib/recursos'
import { PROJECT_ESTADO_VARIANT } from '../../../constants/badgeVariants'
import { useAuth } from '../../../contexts/AuthContext'
import { formatearFecha } from '../../../utils/helpers'
import s from '../../../components/Dashboard/Dashboard.module.css'
import { RECIENTES } from '../../../constants/pagination'

// Relaciones que la lista debe incluir para poder detectar al equipo (pivote).
const INCLUDE_PROYECTOS = 'creator,instructor.generalUser,classGroup.program,classGroup.trainingCenter,apprentices.generalUser'

// Etiquetas de estado de propuesta (el backend solo devuelve el código).
const ESTADO_LABEL = { pendiente: 'Pendiente', aprobado: 'Aprobado', rechazado: 'Rechazado' }

// Una propuesta es del aprendiz si la creó o si figura en su equipo.
function esMio(proyecto, userId) {
  if (!proyecto) return false
  if (Number(proyecto.id_creador) === Number(userId)) return true
  return (proyecto.apprentices || []).some(
    (a) => Number(a.generalUser?.id) === Number(userId) || Number(a.id_usuario) === Number(userId)
  )
}

// Máximo porcentaje y número de coincidencias de una propuesta.
function infoSimilitud(lista, projectId) {
  const pares = (lista || []).filter(
    (x) => Number(x.id_proyecto_1) === Number(projectId) || Number(x.id_proyecto_2) === Number(projectId)
  )
  if (pares.length === 0) return null
  return {
    pct: Math.max(...pares.map((x) => Math.round(Number(x.porcentaje) || 0))),
    count: pares.length,
  }
}

export default function DashboardAprendiz() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Propuestas, similitudes y notificaciones: fuente única la API.
  const { data: todosProyectos, cargando, error, recargar } = useApi(
    () => proyectos.listar({ included: INCLUDE_PROYECTOS }),
    [],
    { inicial: [] }
  )
  const { data: todasSimilitudes } = useApi(() => similitudesApi.listar(), [], { inicial: [] })
  const { data: misNotificaciones } = useApi(
    // El backend ya acota las notificaciones al usuario autenticado: misma URL
    // que usa el layout, así se comparte una sola petición.
    () => notificaciones.listar(),
    [user.id],
    { inicial: [] }
  )

  const misProyectos = useMemo(
    () => todosProyectos.filter((p) => esMio(p, user.id)),
    [todosProyectos, user.id]
  )
  const idsPropios = useMemo(() => new Set(misProyectos.map((p) => Number(p.id))), [misProyectos])

  const similitudesPropias = useMemo(
    () => todasSimilitudes.filter(
      (x) => idsPropios.has(Number(x.id_proyecto_1)) || idsPropios.has(Number(x.id_proyecto_2))
    ).length,
    [todasSimilitudes, idsPropios]
  )

  const sinLeer = useMemo(
    () => misNotificaciones.filter((n) => Number(n.id_usuario) === Number(user.id) && !n.leida).length,
    [misNotificaciones, user.id]
  )

  const recientes = useMemo(() => [...misProyectos].slice(0, RECIENTES), [misProyectos])
  const saludo = (user.nombre || '').split(' ')[0]

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
            <ApiState cargando={cargando} error={error} onReintentar={recargar}>
              {recientes.length === 0 ? (
                <EmptyState icon={<Tray />} title="Aún no tienes propuestas" message="Registra tu primera propuesta para comenzar a analizarla." actionLabel="Crear propuesta" onAction={() => navigate('/aprendiz/propuestas?crear=1')} />
              ) : (
                <ul className={s.lista}>
                  {recientes.map((p) => {
                    const info = infoSimilitud(todasSimilitudes, p.id)
                    return (
                      <li key={p.id}>
                        <Link to={`/aprendiz/detalle-proyecto/${p.id}`} className={s.fila}>
                          <div className={s.filaMain}>
                            <span className={s.filaTitulo}>{p.titulo}</span>
                            <span className={s.filaMeta}>{formatearFecha(p.created_at)} · {ESTADO_LABEL[p.estado] || p.estado}</span>
                          </div>
                          <div className={s.filaLado}>
                            {info && (
                              <Badge variant={info.pct >= 70 ? 'danger' : info.pct >= 40 ? 'warning' : 'success'}>
                                {info.pct}% · {info.count} coincidencia{info.count !== 1 ? 's' : ''}
                              </Badge>
                            )}
                            <Badge variant={PROJECT_ESTADO_VARIANT[p.estado] || 'neutral'}>{ESTADO_LABEL[p.estado] || p.estado}</Badge>
                            <CaretRight size={16} />
                          </div>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </ApiState>
          </DataPanel>
        }
      />
    </DashboardLayout>
  )
}
