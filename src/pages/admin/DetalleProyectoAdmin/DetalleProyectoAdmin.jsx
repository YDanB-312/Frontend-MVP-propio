import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, ChartBar, ChatCircle, CheckCircle, FileText, FolderOpen, GraduationCap, ListChecks, MagnifyingGlass, Plus, Target, Trash, XCircle } from 'phosphor-react'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PageHeader from '../../../components/PageHeader/PageHeader'
import DataPanel from '../../../components/DataPanel/DataPanel'
import Badge from '../../../components/Badge/Badge'
import Actions from '../../../components/Actions/Actions'
import Button from '../../../components/Button/Button'
import { Textarea } from '../../../components/Input/Input'
import Avatar from '../../../components/Avatar/Avatar'
import Lightbox from '../../../components/Lightbox/Lightbox'
import EmptyState from '../../../components/EmptyState/EmptyState'
import ConfirmModal from '../../../components/ConfirmModal/ConfirmModal'
import ObservacionHilo from '../../../components/ObservacionHilo/ObservacionHilo'
import { useAuth } from '../../../contexts/AuthContext'
import {
  findProjectById,
  findUserById,
  getSimilaritiesByProject,
  getObservaciones,
  addObservacion,
  updateProjectEstado,
  createNotification,
  deleteProject,
  displayNames,
} from '../../../data/mockData'
import { agruparObservaciones } from '../../../utils/helpers'
import s from './DetalleProyectoAdmin.module.css'

const ESTADO_VARIANT = {
  pendiente: 'warning',
  en_revision: 'info',
  aprobado: 'success',
  rechazado: 'danger',
  requiere_ajustes: 'warning',
}

const SIM_VARIANT = { pendiente: 'warning', revisada: 'info', resuelta: 'success' }

export default function DetalleProyectoAdmin() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [textoObs, setTextoObs] = useState('')
  const [respondiendoA, setRespondiendoA] = useState(null)
  const [modalAccion, setModalAccion] = useState(null)
  const [modalEliminar, setModalEliminar] = useState(false)
  const [fotoViendo, setFotoViendo] = useState(null)

  const proyecto = findProjectById(id)
  const estudiante = proyecto ? findUserById(proyecto.studentId) : null
  const similitudes = proyecto ? getSimilaritiesByProject(proyecto.id) : []
  const observaciones = proyecto ? getObservaciones(proyecto.id) : []

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

  const confirmarAccion = () => {
    if (!modalAccion) return
    updateProjectEstado(proyecto.id, modalAccion.estado)
    createNotification({
      mensaje: `Tu proyecto '${proyecto.title}' ha pasado a ${
        displayNames.projectStatus[modalAccion.estado]
      }`,
      tipo: 'revision',
      userId: proyecto.studentId,
      projectId: proyecto.id,
    })
    setModalAccion(null)
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

  const keywords = (proyecto.keywords || '').split(',').map((k) => k.trim()).filter(Boolean)
  const objetivosEsp = (proyecto.objetivosEspecificos || '').split('\n').map((l) => l.trim()).filter(Boolean)
  const tieneObjetivosNuevos = proyecto.objetivoGeneral || objetivosEsp.length > 0

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

        <div className={s.actionsBar}>
          <Badge variant={ESTADO_VARIANT[proyecto.estado] || 'neutral'} className={s.bigBadge}>
            {displayNames.projectStatus[proyecto.estado] || proyecto.estado}
          </Badge>
          <Actions form>
            <Button
              type="button"
              variant="success"
              onClick={() => setModalAccion({ estado: 'aprobado', verbo: 'aprobar' })}
              disabled={proyecto.estado === 'aprobado'}
            >
              <CheckCircle size={14} /> Aprobar
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={() => setModalAccion({ estado: 'rechazado', verbo: 'rechazar' })}
              disabled={proyecto.estado === 'rechazado'}
            >
              <XCircle size={14} /> Rechazar
            </Button>
            <Button
              type="button"
              variant="dangerGhost"
              onClick={() => setModalEliminar(true)}
            >
              <Trash size={14} /> Eliminar
            </Button>
          </Actions>
        </div>

        <DataPanel title="Información de la propuesta" icon={<FileText />}>
          <p className={s.description}>{proyecto.description}</p>

          <dl className={s.grid}>
            <div className={s.cell}>
              <dt>Aprendiz</dt>
              <dd>{proyecto.studentName}</dd>
            </div>
            <div className={s.cell}>
              <dt>Instructor</dt>
              <dd>{proyecto.instructorName || '—'}</dd>
            </div>
            <div className={s.cell}>
              <dt>Área de aplicación</dt>
              <dd>{proyecto.areaAplicacion || '—'}</dd>
            </div>
            <div className={s.cell}>
              <dt>Integrantes</dt>
              <dd>{(proyecto.integrantes || []).join(', ') || '—'}</dd>
            </div>
            <div className={s.cell}>
              <dt>Última actualización</dt>
              <dd>{proyecto.updatedAt || proyecto.createdAt}</dd>
            </div>
          </dl>

          {keywords.length > 0 && (
            <div className={s.keywords}>
              {keywords.map((k) => (
                <span key={k} className={s.keyword}>
                  {k}
                </span>
              ))}
            </div>
          )}

          <div className={s.blocks}>
            {tieneObjetivosNuevos ? (
              <>
                <div className={s.block}>
                  <h3 className={s.blockTitle}><Target size={14} /> Objetivo general</h3>
                  <pre className={s.pre}>{proyecto.objetivoGeneral || 'Sin definir.'}</pre>
                </div>
                {objetivosEsp.length > 0 && (
                  <div className={s.block}>
                    <h3 className={s.blockTitle}><ListChecks size={14} /> Objetivos específicos</h3>
                    <ol className={s.objList}>
                      {objetivosEsp.map((o) => (
                        <li key={o}>{o}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </>
            ) : (
              <div className={s.block}>
                <h3 className={s.blockTitle}><Target size={14} /> Objetivos</h3>
                <pre className={s.pre}>{proyecto.objectives || 'Sin objetivos definidos.'}</pre>
              </div>
            )}
          </div>
        </DataPanel>

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
                        <Badge variant={SIM_VARIANT[sim.estado] || 'neutral'}>
                          {displayNames.similarityStatus[sim.estado] || sim.estado}
                        </Badge>
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

      <ConfirmModal
        open={!!modalAccion}
        titulo={modalAccion?.estado === 'aprobado' ? 'Aprobar propuesta' : 'Rechazar propuesta'}
        mensaje={
          modalAccion
            ? `¿Seguro que deseas ${modalAccion.verbo} la propuesta "${proyecto.title}"? El aprendiz será notificado.`
            : ''
        }
        textoConfirmar={modalAccion?.estado === 'aprobado' ? 'Sí, aprobar' : 'Sí, rechazar'}
        onConfirmar={confirmarAccion}
        onCancelar={() => setModalAccion(null)}
      />

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
