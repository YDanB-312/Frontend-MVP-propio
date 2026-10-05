import { Link } from 'react-router-dom'
import { useApi } from '../../lib/useApi'
import { similitudes } from '../../lib/recursos'
import { fechaDesdeApi } from '../../utils/helpers'
import s from '../DetalleProyectoBase/DetalleProyectoBase.module.css'
import local from './SimilitudesHistoricas.module.css'

// Evidencia de versiones anteriores: pares que dejaron de estar vigentes
// (rechazo/reenvío). Es solo lectura y se muestra debajo de las vigentes.
export default function SimilitudesHistoricas({ proyectoId, detalleBase }) {
  const { data } = useApi(
    () => similitudes.listar({ proyecto_id: proyectoId, historial: 1 }),
    [proyectoId],
    { inicial: [] }
  )
  const items = data || []
  if (items.length === 0) return null

  return (
    <div className={local.historicas}>
      <p className={local.historicasTitle}>Versiones anteriores ({items.length})</p>
      <ul className={s.simList}>
        {items.map((sim) => {
          const otro = Number(sim.id_proyecto_1) === Number(proyectoId) ? sim.project2 : sim.project1
          const pct = Math.round(Number(sim.porcentaje) || 0)
          return (
            <li key={sim.id}>
              <Link to={`${detalleBase}/detalle-similitud/${sim.id}`} viewTransition className={s.simRow}>
                <span className={s.simPair}>vs. {otro?.titulo || 'Propuesta no disponible'}</span>
                <span className={s.simRight}>
                  <span className={s.muted}>{fechaDesdeApi(sim.fecha || sim.created_at)} · {pct}%</span>
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
