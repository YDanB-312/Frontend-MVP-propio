import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
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
import ObservacionHilo from '../../../components/ObservacionHilo/ObservacionHilo'
import ConfirmModal from '../../../components/ConfirmModal/ConfirmModal'
import { instructorVeProyecto } from '../../../data/mockData'
import { useAuth } from '../../../contexts/AuthContext'
import {
  findProjectById,
  findUserById,
  getSimilaritiesByProject,
  getObservaciones,
  addObservacion,
  updateProjectEstado,
  createNotification,
  displayNames,
} from '../../../data/mockData'
import { agruparObservaciones } from '../../../utils/helpers'
import s from './DetalleProyectoInstructor.module.css'
import { ArrowCounterClockwise, ChartBar, ChatCircle, CheckCircle, ClipboardText, FileText, FolderOpen, GraduationCap, ListChecks, MagnifyingGlass, X, LockKey, Plus, Target, XCircle } from 'phosphor-react'

const ESTADO_VARIANT = {
  pendiente: 'warning',
  en_revision: 'info',
  aprobado: 'success',
  rechazado: 'danger',
  requiere_ajustes: 'warning',
}

const SIM_VARIANT = { pendiente: 'warning', revisada: 'info', resuelta: 'success' }

const ACCIONES = {
  aprobado: {
    titulo: 'Aprobar propuesta',
    verbo: 'aprobar',
    texto: 'Sí, aprobar',
    clase: s.success,
    icono: null,
  },
  rechazado: {
    titulo: 'Rechazar propuesta',
    verbo: 'rechazar',
    texto: 'Sí, rechazar',
    clase: s.danger,
    icono: null,
  },
  requiere_ajustes: {
    titulo: 'Solicitar cambios',
    verbo: 'solicitar cambios a',
    texto: 'Sí, solicitar',
    clase: s.warning,
    icono: null,
  },
}

export default function DetalleProyectoInstructor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [textoObs, setTextoObs] = useState('')
  const [respondiendoA, setRespondiendoA] = useState(null)
  const [modal, setModal] = useState(null)
  const [fotoViendo, setFotoViendo] = useState(null)

  const proyecto = findProjectById(id)
  const estudiante = proyecto ? findUserById(proyecto.studentId) : null
  const similitudes = proyecto ? getSimilaritiesByProject(proyecto.id) : []
  const observaciones = proyecto ? getObservaciones(proyecto.id) : []

  // Autorización: propuestas de fichas a su cargo (ajenas → modo lectura)
  const enMiCargo =
    proyecto &&
    instructorVeProyecto(proyecto, Number(user?.id))

  if (!proyecto) {
    return (
      <DashboardLayout role="instructor" titulo="Detalle de Propuesta">
        <div className={s.page}>
          <EmptyState
            icon={<MagnifyingGlass />}
            title="Propuesta no encontrada"
            message="La propuesta que buscas no existe o fue eliminada."
            actionLabel="Volver a revisión de propuestas"
            onAction={() => navigate('/instructor/revision-propuestas')}
          />
        </div>
      </DashboardLayout>
    )
  }

  const confirmarAccion = () => {
    if (!modal) return
    updateProjectEstado(proyecto.id, modal.estado)
    createNotification({
      mensaje: `Tu proyecto '${proyecto.title}' ha pasado a ${
        displayNames.projectStatus[modal.estado]
      }`,
      tipo: 'revision',
      userId: proyecto.studentId,
      projectId: proyecto.id,
    })
    setModal(null)
  }

  const agregarObservacion = (e) => {
    e.preventDefault()
    const texto = textoObs.trim()
    if (!texto) return
    addObservacion(proyecto.id, `${user?.nombre || 'Instructor'} | Instructor`, texto)
    setTextoObs('')
  }

  const keywords = (proyecto.keywords || '').split(',').map((k) => k.trim()).filter(Boolean)
  const objetivosEsp = (proyecto.objetivosEspecificos || '').split('\n').map((l) => l.trim()).filter(Boolean)
  const tieneObjetivosNuevos = proyecto.objetivoGeneral || objetivosEsp.length > 0

  return (
    <DashboardLayout role="instructor" titulo="Detalle de Propuesta">
      <div className={s.page}>
        <PageHeader
          title={proyecto.title}
          subtitle={`Propuesta enviada el ${proyecto.createdAt} por ${proyecto.studentName}`}
          icon={<FolderOpen />}
          breadcrumb={[
            { label: 'Dashboard', to: '/instructor/dashboard', icon: <ChartBar size={14} /> },
            { label: 'Revisión de Propuestas', to: '/instructor/revision-propuestas', icon: <ClipboardText size={14} /> },
            { label: proyecto.title },
          ]}
        />

        {proyecto && !enMiCargo && (
          <div className={s.bannerLectura}>
            <LockKey size={14} /> Propuesta de otra ficha · modo lectura
          </div>
        )}

        <div className={s.actionsBar}>
          <Badge variant={ESTADO_VARIANT[proyecto.estado] || 'neutral'} className={s.bigBadge}>
            {displayNames.projectStatus[proyecto.estado] || proyecto.estado}
          </Badge>
          {enMiCargo && (
          <Actions form>
            <Button
              type="button"
              variant="success"
              onClick={() => setModal(ACCIONES.aprobado)}
            >
              <CheckCircle size={14} /> Aprobar
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={() => setModal(ACCIONES.rechazado)}
            >
              <XCircle size={14} /> Rechazar
            </Button>
            <Button
              type="button"
              variant="warning"
              onClick={() => setModal(ACCIONES.requiere_ajustes)}
            >
              <ArrowCounterClockwise size={14} /> Solicitar Cambios
            </Button>
          </Actions>
          )}
        </div>

        <DataPanel title="Información de la propuesta" icon={<FileText />}>
          <p className={s.description}>{proyecto.description}</p>

          <dl className={s.grid}>
            <div className={s.cell}>
              <dt>Área de aplicación</dt>
              <dd>{proyecto.areaAplicacion || '—'}</dd>
            </div>
            <div className={s.cell}>
              <dt>Tipo de proyecto</dt>
              <dd>{proyecto.projectType === 'pagina_web' ? 'Página Web' : 'Aplicación'}</dd>
            </div>
            <div className={s.cell}>
              <dt>Integrantes</dt>
              <dd>{(proyecto.integrantes || []).join(', ') || '—'}</dd>
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
            <div className={s.studentCard}>
              {estudiante.fotoPerfil ? (
                <button type="button" className={s.avatarBtn} title="Ver foto" onClick={() => setFotoViendo({ src: estudiante.fotoPerfil, alt: estudiante.name })}>
                  <Avatar name={estudiante.name} src={estudiante.fotoPerfil} size="md" />
                </button>
              ) : (
                <Avatar name={estudiante.name} size="md" />
              )}
              <div className={s.studentInfo}>
                <span className={s.studentName}>{estudiante.name}</span>
                <span className={s.studentEmail}>{estudiante.email}</span>
              </div>
              <Button
                as="link"
                to={`/instructor/perfil-companero/${estudiante.id}`}
                variant="secondary"
              >
                Ver perfil
              </Button>
            </div>
          ) : (
            <p className={s.muted}>No se encontró la información del aprendiz.</p>
          )}
        </DataPanel>

        {enMiCargo && (
        <DataPanel title="Similitudes detectadas" icon={<MagnifyingGlass />}>
          {similitudes.length === 0 ? (
            <p className={s.muted}>No se han detectado similitudes para esta propuesta.</p>
          ) : (
            <ul className={s.simList}>
              {similitudes.map((sim) => {
                const pct = Math.round((sim.similitud || 0) * 100)
                return (
                  <li key={sim.id}>
                    <Link to={`/instructor/detalle-similitud/${sim.id}`} className={s.simRow}>
                      <span className={s.simPair}>
                        vs.{' '}
                        {sim.projectId1 === proyecto.id ? sim.project2Title : sim.project1Title}
                      </span>
                      <span className={s.simRight}>
                        <span className={`${s.pct} ${pct >= 60 ? s.pctHigh : pct >= 40 ? s.pctMid : s.pctLow}`}>
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
        )}

        {enMiCargo && (
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
              placeholder={respondiendoA ? 'Continúa la conversación con tu aprendiz…' : 'Escribe una observación para el aprendiz sobre su propuesta…'}
            />
            <Button type="submit" disabled={!textoObs.trim()}>
              <Plus size={14} /> Agregar observación
            </Button>
          </form>
        </DataPanel>
        )}
      </div>

      <ConfirmModal
        open={!!modal}
        titulo={modal?.titulo}
        mensaje={
          modal
            ? `¿Seguro que deseas ${modal.verbo} la propuesta "${proyecto.title}"? El aprendiz será notificado.`
            : ''
        }
        textoConfirmar={modal?.texto}
        onConfirmar={confirmarAccion}
        onCancelar={() => setModal(null)}
      />
          {fotoViendo && <Lightbox src={fotoViendo.src} alt={fotoViendo.alt} caption={fotoViendo.alt} onClose={() => setFotoViendo(null)} />}
</DashboardLayout>
  )
}
