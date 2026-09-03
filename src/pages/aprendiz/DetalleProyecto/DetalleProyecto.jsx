import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PageHeader from '../../../components/PageHeader/PageHeader'
import DataPanel from '../../../components/DataPanel/DataPanel'
import Button from '../../../components/Button/Button'
import { Textarea } from '../../../components/Input/Input'
import EmptyState from '../../../components/EmptyState/EmptyState'
import ObservacionHilo from '../../../components/ObservacionHilo/ObservacionHilo'
import { useAuth } from '../../../contexts/AuthContext'
import {
  findProjectById,
  findFichaById,
  getSimilitudesValidas,
  getObservaciones,
  addObservacion,
} from '../../../data/mockData'
import { agruparObservaciones } from '../../../utils/helpers'
import s from '../../../components/DetalleProyectoBase/DetalleProyectoBase.module.css'
import InformacionProyecto from '../../../components/DetalleProyectoBase/InformacionProyecto'
import { ChatCircle, FileText, FolderOpen, MagnifyingGlass, Plus, X } from 'phosphor-react'



export default function DetalleProyecto() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const project = findProjectById(id)

  const [texto, setTexto] = useState('')
  const [observaciones, setObservaciones] = useState(() => (project ? getObservaciones(project.id) : []))
  const [respondiendoA, setRespondiendoA] = useState(null)

  const similitudes = useMemo(
    () => (project ? getSimilitudesValidas().filter((s) => s.projectId1 === project.id || s.projectId2 === project.id) : []),
    [project]
  )

  if (!project) {
    return (
      <DashboardLayout role="aprendiz" titulo="Detalle del Proyecto">
        <div className={s.page}>
          <EmptyState
            icon={<MagnifyingGlass />}
            title="Proyecto no encontrado"
            message="El proyecto que buscas no existe o fue eliminado."
            actionLabel="Volver a mis propuestas"
            onAction={() => navigate('/aprendiz/propuestas')}
          />
        </div>
      </DashboardLayout>
    )
  }

  // Creador o integrante del equipo → derechos plenos sobre la propuesta
  const esPropio =
    Number(project.studentId) === Number(user.id) ||
    (project.integrantes || []).includes(user.nombre)

  const ficha = project ? findFichaById(project.fichaId) : null



  function agregarObservacion(e) {
    e.preventDefault()
    const t = texto.trim()
    if (!t) return
    addObservacion(project.id, `${user.nombre} | Aprendiz`, t, respondiendoA?.id || null)
    setObservaciones(getObservaciones(project.id))
    setTexto('')
    setRespondiendoA(null)
  }

  return (
    <DashboardLayout role="aprendiz" titulo="Detalle del Proyecto">
      <div className={s.page}>
        <PageHeader
          title={project.title}
          subtitle={`Enviado el ${project.createdAt} por ${project.studentName}`}
          icon={<FolderOpen />}
          breadcrumb={[
            { label: 'Dashboard', to: '/aprendiz/dashboard' },
            { label: 'Mis Proyectos', to: '/aprendiz/propuestas' },
            { label: project.title },
          ]}
        />

        <div className={s.grid}>
          <div className={s.col}>
            <DataPanel title="Información del proyecto" icon={<FileText />}>
              <InformacionProyecto proyecto={project} ficha={ficha} fichaHref={`/aprendiz/detalle-ficha/${project.fichaId}`} />
            </DataPanel>
          </div>

          <div className={s.col}>
            {esPropio && (
            <DataPanel title="Similitudes detectadas" icon={<MagnifyingGlass />}>
              {similitudes.length === 0 ? (
                <p className={s.muted}>No se han detectado similitudes para esta propuesta.</p>
              ) : (
                <ul className={s.simList}>
                  {similitudes.map((sim) => {
                    const pct = Math.round(sim.similitud * 100)
                    const otroTitulo = sim.projectId1 === project.id ? sim.project2Title : sim.project1Title
                    return (
                      <li key={sim.id}>
                        <Link to={`/aprendiz/detalle-similitud/${sim.id}`} className={s.simRow}>
                          <span className={s.simPair}>vs. {otroTitulo}</span>
                          <span className={s.simRight}>
                            <span className={`${s.pct} ${pct >= 60 ? s.pctHigh : pct >= 40 ? s.pctMid : s.pctLow}`}>{pct}%</span>
                          </span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </DataPanel>
            )}

            {esPropio && (
            <DataPanel title={`Observaciones (${observaciones.length})`} icon={<ChatCircle />}>
              {respondiendoA && (
                <div className={s.respondiendoChip}>
                  Respondiendo a {String(respondiendoA.autor).split(' | ')[0]}
                  <button type="button" onClick={() => setRespondiendoA(null)} aria-label="Cancelar respuesta"><X size={12} /></button>
                </div>
              )}
              <ObservacionHilo
                grupos={agruparObservaciones(observaciones)}
                permitirResponder
                onRespuesta={(o) => setRespondiendoA(o)}
              />

              <form className={s.obsForm} onSubmit={agregarObservacion}>
                <Textarea
                  rows={3}
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  placeholder={respondiendoA ? 'Escribe tu respuesta al instructor…' : 'Escribe tu comentario sobre la propuesta...'}
                />
                <Button type="submit" disabled={!texto.trim()}>
                  <Plus size={14} /> Agregar observación
                </Button>
              </form>
            </DataPanel>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
