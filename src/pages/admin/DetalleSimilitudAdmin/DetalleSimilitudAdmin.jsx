import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { ArrowCounterClockwise, ChatCircle, CheckCircle, Eye, Plus, Scales } from 'phosphor-react'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import DetalleSimilitudBase from '../../../components/DetalleSimilitudBase/DetalleSimilitudBase'
import DataPanel from '../../../components/DataPanel/DataPanel'
import { useAuth } from '../../../contexts/AuthContext'
import {
  findSimilarityById,
  findProjectById,
  updateSimilarityEstado,
  getObservaciones,
  addObservacion,
} from '../../../data/mockData'
import s from './DetalleSimilitudAdmin.module.css'

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

  const cambiarEstado = (estado) => {
    updateSimilarityEstado(similitud.id, estado)
    refrescar()
  }

  const agregarObservacion = (e) => {
    e.preventDefault()
    const texto = textoObs.trim()
    if (!texto) return
    const pid = Number(proyectoObs) === 1 ? similitud.projectId1 : similitud.projectId2
    addObservacion(pid, `${user?.nombre || 'Administrador'} | Admin`, texto)
    setTextoObs('')
    refrescar()
  }

  const acciones = (
    <DataPanel title="Actualizar estado del análisis" icon={<Scales />}>
      <p className={s.hint}>
        Cambia el estado del análisis según el seguimiento dado a los proyectos involucrados.
      </p>
      <div className={s.actions}>
        <button
          type="button"
          className={`${s.btn} ${s.info}`}
          onClick={() => cambiarEstado('revisada')}
          disabled={similitud.estado === 'revisada'}
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

  const observacionesPanel = (
    <DataPanel title={`Observaciones (${observaciones.length})`} icon={<ChatCircle />}>
      <form className={s.obsForm} onSubmit={agregarObservacion}>
        <div className={s.obsControls}>
          <select
            className={s.select}
            value={proyectoObs}
            onChange={(e) => setProyectoObs(e.target.value)}
            aria-label="Proyecto para la observación"
          >
            <option value="1">Proyecto A: {(proyectoA?.title || '').slice(0, 40)}</option>
            <option value="2">Proyecto B: {(proyectoB?.title || '').slice(0, 40)}</option>
          </select>
          <textarea
            className={s.textarea}
            rows={3}
            value={textoObs}
            onChange={(e) => setTextoObs(e.target.value)}
            placeholder="Escribe una observación sobre el proyecto seleccionado…"
          />
        </div>
        <button type="submit" className={`${s.btn} ${s.primary}`} disabled={!textoObs.trim()}>
          <Plus size={14} /> Agregar observación
        </button>
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
                  <span className={`${s.obsTag} ${esA ? s.tagA : s.tagB}`}>Proyecto {esA ? 'A' : 'B'}</span>
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
        actions={acciones}
      >
        {observacionesPanel}
      </DetalleSimilitudBase>
    </DashboardLayout>
  )
}
