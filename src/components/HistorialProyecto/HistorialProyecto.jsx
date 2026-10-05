import { ClockCounterClockwise } from 'phosphor-react'
import DataPanel from '../DataPanel/DataPanel'
import ApiState from '../ApiState/ApiState'
import { useApi } from '../../lib/useApi'
import { proyectos } from '../../lib/recursos'
import { fechaDesdeApi } from '../../utils/helpers'
import s from './HistorialProyecto.module.css'

// Etiquetas legibles de los eventos del historial (project_histories).
const ACCION_LABEL = {
  creada: 'Propuesta creada',
  actualizada: 'Contenido actualizado',
  enviada: 'Enviada a revisión',
  rechazada: 'Rechazada por el instructor',
  reenviada: 'Reenviada a revisión',
  aprobada: 'Aprobada',
  devuelta_revision: 'Devuelta a revisión por intervención administrativa',
}

function nombreUsuario(u) {
  if (!u) return 'Sistema'
  return [u.nombre, u.apellido].filter(Boolean).join(' ').trim() || u.correo || 'Usuario'
}

// Historial de la propuesta: quién hizo qué y cuándo.
export default function HistorialProyecto({ projectId }) {
  const { data, cargando, error, recargar } = useApi(
    () => proyectos.historial(projectId),
    [projectId],
    { inicial: [] }
  )
  const items = data || []

  return (
    <DataPanel title="Historial" icon={<ClockCounterClockwise />}>
      <ApiState
        cargando={cargando}
        error={error}
        onReintentar={recargar}
        vacio={items.length === 0}
        mensajeVacio="Aún no hay eventos registrados."
      >
        <ol className={s.list}>
          {items.map((h) => (
            <li key={h.id} className={s.item}>
              <span className={s.dot} aria-hidden="true" />
              <div className={s.info}>
                <span className={s.accion}>{ACCION_LABEL[h.accion] || h.accion}</span>
                {h.detalle?.observacion && (
                  <p className={s.obs}>“{h.detalle.observacion}”</p>
                )}
              </div>
              <span className={s.meta}>
                {nombreUsuario(h.user)} · {fechaDesdeApi(h.created_at)}
              </span>
            </li>
          ))}
        </ol>
      </ApiState>
    </DataPanel>
  )
}
