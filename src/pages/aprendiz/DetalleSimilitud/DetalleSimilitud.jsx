import { useNavigate, useParams } from 'react-router-dom'
import { ChatCircle, MagnifyingGlass } from 'phosphor-react'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import DetalleSimilitudBase from '../../../components/DetalleSimilitudBase/DetalleSimilitudBase'
import DataPanel from '../../../components/DataPanel/DataPanel'
import EmptyState from '../../../components/EmptyState/EmptyState'
import ApiState from '../../../components/ApiState/ApiState'
import { useAuth } from '../../../contexts/AuthContext'
import { useApi } from '../../../lib/useApi'
import { proyectos, similitudes as similitudesApi, observaciones as observacionesApi } from '../../../lib/recursos'
import { formatearFecha } from '../../../utils/helpers'
import s from '../../../components/DetalleSimilitudBase/DetalleSimilitudBase.module.css'

const INCLUDE_PROYECTOS = 'creator,instructor.generalUser,classGroup.program,classGroup.trainingCenter,apprentices.generalUser'

function nombreUsuario(u) {
  if (!u) return 'Usuario'
  return [u.nombre, u.apellido].filter(Boolean).join(' ').trim() || u.correo || 'Usuario'
}

export default function DetalleSimilitud() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  // Similitud y proyectos del par: fuente única la API.
  const { data: similitud, cargando, error, recargar } = useApi(
    () => similitudesApi.obtener(id),
    [id],
    { inicial: null }
  )
  const { data: todosProyectos } = useApi(
    () => proyectos.listar({ included: INCLUDE_PROYECTOS }),
    [],
    { inicial: [] }
  )

  // Solo las observaciones de MI propuesta del par — nunca las de la ajena.
  const esMia = (p) => !!p && (
    Number(p.id_creador) === Number(user.id) ||
    (p.apprentices || []).some(
      (a) => Number(a.generalUser?.id) === Number(user.id) || Number(a.id_usuario) === Number(user.id)
    )
  )

  let miPid = null
  if (similitud && user) {
    const p1 = todosProyectos.find((p) => Number(p.id) === Number(similitud.id_proyecto_1))
    const p2 = todosProyectos.find((p) => Number(p.id) === Number(similitud.id_proyecto_2))
    if (esMia(p1)) miPid = p1.id
    else if (esMia(p2)) miPid = p2.id
  }

  const { data: comentariosApi } = useApi(
    () => (miPid ? observacionesApi.listar('user', { id_proyecto: miPid }) : Promise.resolve([])),
    [miPid],
    { inicial: [] }
  )

  const observaciones = (comentariosApi || []).map((c) => ({
    id: c.id,
    autor: nombreUsuario(c.user),
    fecha: formatearFecha(c.created_at),
    texto: c.texto,
  }))

  if (cargando) {
    return (
      <DashboardLayout role="aprendiz" titulo="Detalle de Similitud">
        <div className={s.wrapper}><ApiState cargando /></div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout role="aprendiz" titulo="Detalle de Similitud">
        <div className={s.wrapper}><ApiState error={error} onReintentar={recargar} /></div>
      </DashboardLayout>
    )
  }

  if (similitud && user && miPid == null) {
    return (
      <DashboardLayout role="aprendiz" titulo="Detalle de Similitud">
        <div className={s.wrapper}>
          <EmptyState
            icon={<MagnifyingGlass />}
            title="Similitud no autorizada"
            message="Esta similitud no pertenece a ninguna de tus propuestas."
            actionLabel="Volver a similitudes"
            onAction={() => navigate('/aprendiz/similitudes')}
          />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="aprendiz" titulo="Detalle de Similitud">
      <DetalleSimilitudBase
        similitud={similitud}
        role="aprendiz"
        backTo="/aprendiz/propuestas"
        backLabel="Volver a mis propuestas"
      >
        <DataPanel title={`Observaciones de tu propuesta (${observaciones.length})`} icon={<ChatCircle />}>
          {observaciones.length === 0 ? (
            <p className={s.muted}>Aún no hay observaciones en tu propuesta para este análisis.</p>
          ) : (
            <ul className={s.obsList}>
              {observaciones.map((o) => (
                <li key={o.id} className={s.obsItem}>
                  <header className={s.obsHeader}>
                    <span className={s.obsAutor}>{o.autor}</span>
                    <span className={s.obsFecha}>{o.fecha}</span>
                  </header>
                  <p className={s.obsTexto}>{o.texto}</p>
                </li>
              ))}
            </ul>
          )}
        </DataPanel>
      </DetalleSimilitudBase>
    </DashboardLayout>
  )
}
