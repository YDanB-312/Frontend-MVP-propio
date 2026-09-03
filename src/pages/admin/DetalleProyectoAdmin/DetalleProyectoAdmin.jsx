import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, ChartBar, ChatCircle, CheckCircle, FileText, FolderOpen, GraduationCap, MagnifyingGlass, Plus, Trash, X } from 'phosphor-react'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PageHeader from '../../../components/PageHeader/PageHeader'
import DataPanel from '../../../components/DataPanel/DataPanel'
import Button from '../../../components/Button/Button'
import Alert from '../../../components/Alert/Alert'
import { Select, Textarea } from '../../../components/Input/Input'
import Avatar from '../../../components/Avatar/Avatar'
import Lightbox from '../../../components/Lightbox/Lightbox'
import EmptyState from '../../../components/EmptyState/EmptyState'
import ConfirmModal from '../../../components/ConfirmModal/ConfirmModal'
import ObservacionHilo from '../../../components/ObservacionHilo/ObservacionHilo'
import { useAuth } from '../../../contexts/AuthContext'
import {
  findProjectById,
  findUserById,
  findFichaById,
  getSimilaritiesByProject,
  getObservaciones,
  addObservacion,
  updateProjectEstado,
  createNotification,
  deleteProject,
  displayNames,
} from '../../../data/mockData'
import { agruparObservaciones } from '../../../utils/helpers'
import s from '../../../components/DetalleProyectoBase/DetalleProyectoBase.module.css'
import InformacionProyecto from '../../../components/DetalleProyectoBase/InformacionProyecto'

const ESTADOS = ['pendiente', 'aprobado', 'rechazado']

export default function DetalleProyectoAdmin() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [textoObs, setTextoObs] = useState('')
  const [respondiendoA, setRespondiendoA] = useState(null)
  const [modalEliminar, setModalEliminar] = useState(false)
  const [fotoViendo, setFotoViendo] = useState(null)

  const proyecto = findProjectById(id)
  const estudiante = proyecto ? findUserById(proyecto.studentId) : null
  const similitudes = proyecto ? getSimilaritiesByProject(proyecto.id) : []
  const observaciones = proyecto ? getObservaciones(proyecto.id) : []

  const [nuevoEstado, setNuevoEstado] = useState(() => (proyecto ? proyecto.estado : 'pendiente'))
  const [guardado, setGuardado] = useState(false)

  // Sincroniza el selector al navegar entre proyectos sin remontar
  useEffect(() => {
    if (proyecto) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNuevoEstado(proyecto.estado)
      setGuardado(false)
    }
  }, [proyecto?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!proyecto) {
    return (
      <DashboardLayout role="admin" titulo="Detalle de Propuesta">
        <div className={s.page}>
          <EmptyState
            icon={<MagnifyingGlass />}
            title="Propuesta no encontrada"
            message="La propuesta que buscas no existe o fue eliminada."
            actionLabel="Volver a propuestas"
            onAction={() => navigate('/admin/proyectos')}
          />
        </div>
      </DashboardLayout>
    )
  }

  const guardarEstado = (e) => {
    e.preventDefault()
    if (nuevoEstado === proyecto.estado) return
    updateProjectEstado(proyecto.id, nuevoEstado)
    createNotification({
      mensaje: `Tu proyecto '${proyecto.title}' ha pasado a ${
        displayNames.projectStatus[nuevoEstado] || nuevoEstado
      }`,
      tipo: 'revision',
      userId: proyecto.studentId,
      projectId: proyecto.id,
    })
    setGuardado(true)
    setTimeout(() => setGuardado(false), 3000)
  }

  const confirmarEliminar = () => {
    deleteProject(proyecto.id)
    navigate('/admin/proyectos')
  }

  const agregarObservacion = (e) => {
    e.preventDefault()
    const texto = textoObs.trim()
    if (!texto) return
    addObservacion(proyecto.id, `${user?.nombre || 'Administrador'} | Admin`, texto, respondiendoA?.id || null)
    setTextoObs('')
    setRespondiendoA(null)
  }

  const ficha = findFichaById(proyecto.fichaId)

  return (
    <DashboardLayout role="admin" titulo="Detalle de Propuesta">
      <div className={s.page}>
        <PageHeader
          title={proyecto.title}
          subtitle={`Enviado el ${proyecto.createdAt} por ${proyecto.studentName}`}
          icon={<FolderOpen />}
          breadcrumb={[
            { label: 'Dashboard', to: '/admin/dashboard', icon: <ChartBar size={14} /> },
            { label: 'Proyectos', to: '/admin/proyectos', icon: <FolderOpen size={14} /> },
            { label: proyecto.title },
          ]}
        />

        {guardado && (
          <Alert><CheckCircle size={14} /> Estado actualizado correctamente.</Alert>
        )}

        <div className={s.grid}>
          <div className={s.col}>
            <DataPanel
              title="Información del proyecto"
              icon={<FileText />}
              action={
                <form onSubmit={guardarEstado} className={s.stateForm}>
                  <Select
                    value={nuevoEstado}
                    onChange={(e) => { setNuevoEstado(e.target.value); setGuardado(false) }}
                    aria-label="Cambiar estado"
                  >
                    {ESTADOS.map((est) => (
                      <option key={est} value={est}>
                        {displayNames.projectStatus[est] || est}
                      </option>
                    ))}
                  </Select>
                  <Button type="submit" disabled={nuevoEstado === proyecto.estado}>
                    <CheckCircle size={14} /> Guardar
                  </Button>
                  <Button
                    type="button"
                    variant="dangerGhost"
                    onClick={() => setModalEliminar(true)}
                  >
                    <Trash size={14} /> Eliminar
                  </Button>
                </form>
              }
            >
              <InformacionProyecto proyecto={proyecto} ficha={ficha} fichaHref={ficha ? `/admin/detalle-ficha/${ficha.id}` : null} />
            </DataPanel>
          </div>

          <div className={s.col}>
            <DataPanel title="Información del aprendiz" icon={<GraduationCap />}>
              {estudiante ? (
                <div className={s.personCard}>
                  {estudiante.fotoPerfil ? (
                    <button type="button" className={s.avatarBtn} title="Ver foto" onClick={() => setFotoViendo({ src: estudiante.fotoPerfil, alt: estudiante.name })}>
                      <Avatar name={estudiante.name} src={estudiante.fotoPerfil} size="md" />
                    </button>
                  ) : (
                    <Avatar name={estudiante.name} size="md" />
                  )}
                  <div className={s.personInfo}>
                    <span className={s.personName}>{estudiante.name}</span>
                    <span className={s.personEmail}>{estudiante.email}</span>
                  </div>
                  <Button as="link" to={`/admin/detalle-usuario/${estudiante.id}`} variant="secondary">
                    Ver usuario <ArrowRight size={14} />
                  </Button>
                </div>
              ) : (
                <p className={s.muted}>No se encontró la información del aprendiz.</p>
              )}
            </DataPanel>

            <DataPanel title="Similitudes detectadas" icon={<MagnifyingGlass />}>
              {similitudes.length === 0 ? (
                <p className={s.muted}>No se han detectado similitudes para esta propuesta.</p>
              ) : (
                <ul className={s.simList}>
                  {similitudes.map((sim) => {
                    const pct = Math.round((sim.similitud || 0) * 100)
                    return (
                      <li key={sim.id}>
                        <Link to={`/admin/detalle-similitud/${sim.id}`} className={s.simRow}>
                          <span className={s.simPair}>
                            vs.{' '}
                            {sim.projectId1 === proyecto.id ? sim.project2Title : sim.project1Title}
                          </span>
                          <span className={s.simRight}>
                            <span
                              className={`${s.pct} ${
                                pct >= 60 ? s.pctHigh : pct >= 40 ? s.pctMid : s.pctLow
                              }`}
                            >
                              {pct}%
                            </span>
                          </span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </DataPanel>

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
                  value={textoObs}
                  onChange={(e) => setTextoObs(e.target.value)}
                  placeholder="Escribe una observación sobre esta propuesta…"
                />
                <Button type="submit" disabled={!textoObs.trim()}>
                  <Plus size={14} /> Agregar observación
                </Button>
              </form>
            </DataPanel>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={modalEliminar}
        titulo="Eliminar propuesta"
        mensaje={`¿Seguro que deseas eliminar "${proyecto.title}"? Se eliminarán también sus similitudes y observaciones. Esta acción no se puede deshacer.`}
        textoConfirmar="Sí, eliminar"
        onConfirmar={confirmarEliminar}
        onCancelar={() => setModalEliminar(false)}
      />
      {fotoViendo && <Lightbox src={fotoViendo.src} alt={fotoViendo.alt} caption={fotoViendo.alt} onClose={() => setFotoViendo(null)} />}
    </DashboardLayout>
  )
}
