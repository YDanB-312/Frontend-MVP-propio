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
import Tag from '../../../components/Tag/Tag'
import { instructorVeProyecto } from '../../../data/mockData'
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
  displayNames,
} from '../../../data/mockData'
import { agruparObservaciones } from '../../../utils/helpers'
import s from '../../../components/DetalleProyectoBase/DetalleProyectoBase.module.css'
import local from './DetalleProyectoInstructor.module.css'
import { ArrowCounterClockwise, ChatCircle, CheckCircle, FileText, FolderOpen, GraduationCap, MagnifyingGlass, X, LockKey, Plus, XCircle } from 'phosphor-react'

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
  },
  rechazado: {
    titulo: 'Rechazar propuesta',
    verbo: 'rechazar',
    texto: 'Sí, rechazar',
  },
  requiere_ajustes: {
    titulo: 'Solicitar cambios',
    verbo: 'solicitar cambios a',
    texto: 'Sí, solicitar',
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
  const ficha = proyecto ? findFichaById(proyecto.fichaId) : null
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
            { label: 'Dashboard', to: '/instructor/dashboard' },
            { label: 'Revisión de Propuestas', to: '/instructor/revision-propuestas' },
            { label: proyecto.title },
          ]}
        />

        {proyecto && !enMiCargo && (
          <div className={s.bannerLectura}>
            <LockKey size={14} /> Propuesta de otra ficha · modo lectura
          </div>
        )}

        <div className={s.grid}>
        <div className={s.col}>
        <DataPanel
          title="Información de la propuesta"
          icon={<FileText />}
          action={
            enMiCargo ? (
              <Actions>
                <Button type="button" variant="success" onClick={() => setModal(ACCIONES.aprobado)}>
                  <CheckCircle size={14} /> Aprobar
                </Button>
                <Button type="button" variant="danger" onClick={() => setModal(ACCIONES.rechazado)}>
                  <XCircle size={14} /> Rechazar
                </Button>
                <Button type="button" variant="warning" onClick={() => setModal(ACCIONES.requiere_ajustes)}>
                  <ArrowCounterClockwise size={14} /> Solicitar Cambios
                </Button>
              </Actions>
            ) : undefined
          }
        >
          <div className={s.badgeRow}>
            <Badge variant={ESTADO_VARIANT[proyecto.estado] || 'neutral'}>
              {displayNames.projectStatus[proyecto.estado] || proyecto.estado}
            </Badge>
            {proyecto.areaAplicacion && <Badge variant="info">{proyecto.areaAplicacion}</Badge>}
          </div>

          <dl className={s.detailList}>
            <div className={s.detailRow}>
              <dt>Fecha de envío</dt>
              <dd>{proyecto.createdAt}</dd>
            </div>
            <div className={s.detailRow}>
              <dt>Ficha</dt>
              <dd>
                {ficha ? (
                  <Link to={`/instructor/detalle-ficha/${ficha.id}`} className={s.link}>
                    {ficha.codigo} · {ficha.nombre}
                  </Link>
                ) : (
                  `#${proyecto.fichaId}`
                )}
              </dd>
            </div>
            <div className={s.detailRow}>
              <dt>Tipo de proyecto</dt>
              <dd>{proyecto.projectType === 'pagina_web' ? 'Página Web' : 'Aplicación'}</dd>
            </div>
            <div className={s.detailRow}>
              <dt>Integrantes</dt>
              <dd>{(proyecto.integrantes || []).join(', ') || '—'}</dd>
            </div>
          </dl>

          <h3 className={s.subTitle}>Descripción</h3>
          <p className={s.paragraph}>{proyecto.description}</p>

          {tieneObjetivosNuevos ? (
            <>
              <h3 className={s.subTitle}>Objetivo general</h3>
              <p className={s.paragraph}>{proyecto.objetivoGeneral || 'Sin definir.'}</p>
              {objetivosEsp.length > 0 && (
                <>
                  <h3 className={s.subTitle}>Objetivos específicos</h3>
                  <ol className={s.objList}>
                    {objetivosEsp.map((o) => (
                      <li key={o}>{o}</li>
                    ))}
                  </ol>
                </>
              )}
            </>
          ) : (
            <>
              <h3 className={s.subTitle}>Objetivos</h3>
              <pre className={s.pre}>{proyecto.objectives || 'Sin objetivos definidos.'}</pre>
            </>
          )}

          {keywords.length > 0 && (
            <>
              <h3 className={s.subTitle}>Palabras clave</h3>
              <div className={s.chips}>
                {keywords.map((k) => (
                  <Tag key={k} variant="success">
                    {k}
                  </Tag>
                ))}
              </div>
            </>
          )}
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
        </div>
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
