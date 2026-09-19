import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { ChatCircle, Plus } from 'phosphor-react'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import DetalleSimilitudBase from '../../../components/DetalleSimilitudBase/DetalleSimilitudBase'
import DataPanel from '../../../components/DataPanel/DataPanel'
import ApiState from '../../../components/ApiState/ApiState'
import Button from '../../../components/Button/Button'
import { Select, Textarea } from '../../../components/Input/Input'
import Tag from '../../../components/Tag/Tag'
import { useAuth } from '../../../contexts/AuthContext'
import { useApi } from '../../../lib/useApi'
import { similitudes, observaciones } from '../../../lib/recursos'
import { fechaDesdeApi } from '../../../utils/helpers'
import s from '../../../components/DetalleSimilitudBase/DetalleSimilitudBase.module.css'

const ROL_CHIP = { aprendiz: 'Aprendiz', instructor: 'Instructor', admin: 'Admin' }

// Concatena nombre + apellido de un general_user.
function nombreCompleto(usuario) {
  return [usuario?.nombre, usuario?.apellido].filter(Boolean).join(' ').trim()
}

function mapearObservaciones(lista, projectId) {
  return (lista || []).map((o) => ({
    id: o.id,
    projectId,
    autor: `${nombreCompleto(o.user) || 'Usuario'} | ${ROL_CHIP[o.user?.rol] || 'Usuario'}`,
    fecha: fechaDesdeApi(o.created_at),
    texto: o.texto,
  }))
}

export default function DetalleSimilitudAdmin() {
  const { id } = useParams()
  const { user } = useAuth()
  const [proyectoObs, setProyectoObs] = useState('1')
  const [textoObs, setTextoObs] = useState('')

  // Fuente única: la API. Similitud + observaciones de ambas propuestas del par.
  const { data, cargando, error, recargar } = useApi(
    async () => {
      let similitud
      try {
        similitud = await similitudes.obtener(id)
      } catch {
        similitud = null
      }
      if (!similitud) return { similitud: null, obsA: [], obsB: [] }
      const [obsA, obsB] = await Promise.all([
        observaciones.listar('user', { id_proyecto: similitud.id_proyecto_1 }),
        observaciones.listar('user', { id_proyecto: similitud.id_proyecto_2 }),
      ])
      return { similitud, obsA, obsB }
    },
    [id],
    { inicial: null }
  )

  const similitud = data?.similitud || null

  if (cargando || error || !similitud) {
    return (
      <DashboardLayout role="admin" titulo="Detalle de Similitud">
        {cargando ? (
          <ApiState cargando error={null} />
        ) : error ? (
          <DataPanel title="Error" icon={<ChatCircle />}>
            <p className={s.muted}>{error.message || 'No se pudo cargar la similitud.'}</p>
            <Button type="button" variant="secondary" onClick={recargar}>Reintentar</Button>
          </DataPanel>
        ) : (
          <DetalleSimilitudBase similitud={null} role="admin" />
        )}
      </DashboardLayout>
    )
  }

  const proyectoA = similitud.project1 || null
  const proyectoB = similitud.project2 || null
  const observacionesLista = [
    ...mapearObservaciones(data.obsA, similitud.id_proyecto_1),
    ...mapearObservaciones(data.obsB, similitud.id_proyecto_2),
  ]

  const agregarObservacion = async (e) => {
    e.preventDefault()
    const texto = textoObs.trim()
    if (!texto) return
    const idProyecto = Number(proyectoObs) === 1 ? similitud.id_proyecto_1 : similitud.id_proyecto_2
    try {
      await observaciones.crear({
        texto,
        id_proyecto: idProyecto,
        id_usuario: Number(user?.id),
        respuesta_a: null,
      })
      await recargar()
      setTextoObs('')
    } catch {
      // Error silencioso: el formulario conserva el texto para reintentar.
    }
  }

  const observacionesPanel = (
    <DataPanel title={`Observaciones (${observacionesLista.length})`} icon={<ChatCircle />}>
      <form className={s.obsForm} onSubmit={agregarObservacion}>
        <div className={s.obsControls}>
          <Select
            value={proyectoObs}
            onChange={(e) => setProyectoObs(e.target.value)}
            aria-label="Propuesta para la observación"
          >
            <option value="1">Propuesta A: {(proyectoA?.titulo || '').slice(0, 40)}</option>
            <option value="2">Propuesta B: {(proyectoB?.titulo || '').slice(0, 40)}</option>
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

      {observacionesLista.length === 0 ? (
        <p className={s.muted}>Aún no hay observaciones en ninguno de los dos proyectos.</p>
      ) : (
        <ul className={s.obsList}>
          {observacionesLista.map((o) => {
            const esA = Number(o.projectId) === Number(similitud.id_proyecto_1)
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
      <DetalleSimilitudBase similitud={similitud} role="admin">
        {observacionesPanel}
      </DetalleSimilitudBase>
    </DashboardLayout>
  )
}
