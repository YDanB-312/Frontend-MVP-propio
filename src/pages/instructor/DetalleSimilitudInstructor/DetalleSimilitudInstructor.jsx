import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { ArrowCounterClockwise, CheckCircle, Eye, Scales } from 'phosphor-react'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import DetalleSimilitudBase from '../../../components/DetalleSimilitudBase/DetalleSimilitudBase'
import DataPanel from '../../../components/DataPanel/DataPanel'
import { findSimilarityById, updateSimilarityEstado } from '../../../data/mockData'
import s from './DetalleSimilitudInstructor.module.css'

export default function DetalleSimilitudInstructor() {
  const { id } = useParams()
  const [, setTick] = useState(0)
  const refrescar = () => setTick((t) => t + 1)

  const similitud = findSimilarityById(id)

  if (!similitud) {
    return (
      <DashboardLayout role="instructor" titulo="Detalle de Similitud">
        <DetalleSimilitudBase similitud={null} role="instructor" />
      </DashboardLayout>
    )
  }

  const cambiarEstado = (estado) => {
    updateSimilarityEstado(similitud.id, estado)
    refrescar()
  }

  const acciones = (
    <DataPanel title="Acciones de revisión" icon={<Scales />}>
      <p className={s.hint}>
        Marca el análisis como revisado cuando lo hayas evaluado, o como resuelto si ya se tomó una
        decisión sobre ambos proyectos.
      </p>
      <div className={s.actions}>
        <button
          type="button"
          className={`${s.btn} ${s.info}`}
          onClick={() => cambiarEstado('revisada')}
          disabled={similitud.estado !== 'pendiente'}
        >
          <Eye size={14} /> Marcar como revisada
        </button>
        <button
          type="button"
          className={`${s.btn} ${s.success}`}
          onClick={() => cambiarEstado('resuelta')}
          disabled={similitud.estado === 'resuelta'}
        >
          <CheckCircle size={14} /> Marcar como resuelta
        </button>
        <button
          type="button"
          className={`${s.btn} ${s.warning}`}
          onClick={() => cambiarEstado('pendiente')}
          disabled={similitud.estado === 'pendiente'}
        >
          <ArrowCounterClockwise size={14} /> Volver a pendiente
        </button>
      </div>
    </DataPanel>
  )

  return (
    <DashboardLayout role="instructor" titulo="Detalle de Similitud">
      <DetalleSimilitudBase similitud={similitud} role="instructor" actions={acciones} />
    </DashboardLayout>
  )
}
