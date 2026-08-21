import { useParams } from 'react-router-dom'
import { ChatCircle } from 'phosphor-react'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import DetalleSimilitudBase from '../../../components/DetalleSimilitudBase/DetalleSimilitudBase'
import DataPanel from '../../../components/DataPanel/DataPanel'
import { findSimilarityById, getObservaciones } from '../../../data/mockData'
import s from './DetalleSimilitud.module.css'

export default function DetalleSimilitud() {
  const { id } = useParams()
  const similitud = findSimilarityById(id)
  const observaciones = similitud ? getObservaciones(similitud.projectId1) : []

  return (
    <DashboardLayout role="aprendiz" titulo="Detalle de Similitud">
      <DetalleSimilitudBase
        similitud={similitud}
        role="aprendiz"
        backTo="/aprendiz/mis-proyectos"
        backLabel="Volver a mis proyectos"
      >
        <DataPanel title={`Observaciones (${observaciones.length})`} icon={<ChatCircle />}>
          {observaciones.length === 0 ? (
            <p className={s.muted}>Sin observaciones registradas para este análisis.</p>
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
