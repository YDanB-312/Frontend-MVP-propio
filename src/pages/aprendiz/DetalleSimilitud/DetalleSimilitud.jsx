import { useParams } from 'react-router-dom'
import { ChatCircle } from 'phosphor-react'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import DetalleSimilitudBase from '../../../components/DetalleSimilitudBase/DetalleSimilitudBase'
import DataPanel from '../../../components/DataPanel/DataPanel'
import { useAuth } from '../../../contexts/AuthContext'
import { findSimilarityById, findProjectById, getObservaciones } from '../../../data/mockData'
import s from './DetalleSimilitud.module.css'

export default function DetalleSimilitud() {
  const { id } = useParams()
  const { user } = useAuth()
  const similitud = findSimilarityById(id)

  // Solo las observaciones de MI propuesta del par — nunca las de la ajena
  let miPid = null
  if (similitud && user) {
    const p1 = findProjectById(similitud.projectId1)
    const p2 = findProjectById(similitud.projectId2)
    const esMia = (p) => p && (Number(p.studentId) === Number(user.id) || (p.integrantes || []).includes(user.nombre))
    if (esMia(p1)) miPid = p1.id
    else if (esMia(p2)) miPid = p2.id
  }
  const observaciones = miPid ? getObservaciones(miPid) : []

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
