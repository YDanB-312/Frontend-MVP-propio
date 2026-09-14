import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { ChatCircle, Plus } from 'phosphor-react'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import DetalleSimilitudBase from '../../../components/DetalleSimilitudBase/DetalleSimilitudBase'
import DataPanel from '../../../components/DataPanel/DataPanel'
import Button from '../../../components/Button/Button'
import { Select, Textarea } from '../../../components/Input/Input'
import Tag from '../../../components/Tag/Tag'
import { useAuth } from '../../../contexts/AuthContext'
import {
  findSimilarityById,
  findProjectById,
  getObservaciones,
  addObservacion,
} from '../../../data/mockData'
import s from '../../../components/DetalleSimilitudBase/DetalleSimilitudBase.module.css'

export default function DetalleSimilitudAdmin() {
  const { id } = useParams()
  const { user } = useAuth()
  const [proyectoObs, setProyectoObs] = useState('1')
  const [textoObs, setTextoObs] = useState('')
  const [, setTick] = useState(0)
  const refrescar = () => setTick((t) => t + 1)

  const similitud = findSimilarityById(id)

  if (!similitud) {
    return (
      <DashboardLayout role="admin" titulo="Detalle de Similitud">
        <DetalleSimilitudBase similitud={null} role="admin" />
      </DashboardLayout>
    )
  }

  const proyectoA = findProjectById(similitud.projectId1)
  const proyectoB = findProjectById(similitud.projectId2)
  const observaciones = [...getObservaciones(similitud.projectId1), ...getObservaciones(similitud.projectId2)]

  const agregarObservacion = (e) => {
    e.preventDefault()
    const texto = textoObs.trim()
    if (!texto) return
    const pid = Number(proyectoObs) === 1 ? similitud.projectId1 : similitud.projectId2
    addObservacion(pid, `${user?.nombre || 'Administrador'} | Admin`, texto)
    setTextoObs('')
    refrescar()
  }

  const observacionesPanel = (
    <DataPanel title={`Observaciones (${observaciones.length})`} icon={<ChatCircle />}>
      <form className={s.obsForm} onSubmit={agregarObservacion}>
        <div className={s.obsControls}>
          <Select
            value={proyectoObs}
            onChange={(e) => setProyectoObs(e.target.value)}
            aria-label="Propuesta para la observación"
          >
            <option value="1">Propuesta A: {(proyectoA?.title || '').slice(0, 40)}</option>
            <option value="2">Propuesta B: {(proyectoB?.title || '').slice(0, 40)}</option>
          </Select>
          <Textarea
            rows={3}
            value={textoObs}
            onChange={(e) => setTextoObs(e.target.value)}
            aria-label="Observación sobre la propuesta seleccionada"
                  placeholder="Escribe una observación sobre la propuesta seleccionada…"
          />
        </div>
        <Button type="submit" disabled={!textoObs.trim()}>
          <Plus size={14} /> Agregar observación
        </Button>
      </form>

      {observaciones.length === 0 ? (
        <p className={s.muted}>Aún no hay observaciones en ninguno de los dos proyectos.</p>
      ) : (
        <ul className={s.obsList}>
          {observaciones.map((o) => {
            const esA = o.projectId === similitud.projectId1
            return (
              <li key={o.id} className={s.obsItem}>
                <div className={s.obsHead}>
                  <Tag variant={esA ? 'a' : 'b'} className={s.obsTag}>Propuesta {esA ? 'A' : 'B'}</Tag>
                  <span className={s.obsAutor}>{o.autor}</span>
                  <time className={s.obsFecha}>{o.fecha}</time>
                </div>
                <p className={s.obsTexto}>{o.texto}</p>
              </li>
            )
          })}
        </ul>
      )}
    </DataPanel>
  )

  return (
    <DashboardLayout role="admin" titulo="Detalle de Similitud">
      <DetalleSimilitudBase
        similitud={similitud}
        role="admin"
      >
        {observacionesPanel}
      </DetalleSimilitudBase>
    </DashboardLayout>
  )
}
