import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PageHeader from '../../../components/PageHeader/PageHeader'
import DataPanel from '../../../components/DataPanel/DataPanel'
import Actions from '../../../components/Actions/Actions'
import Button from '../../../components/Button/Button'
import { Textarea } from '../../../components/Input/Input'
import Avatar from '../../../components/Avatar/Avatar'
import Lightbox from '../../../components/Lightbox/Lightbox'
import EmptyState from '../../../components/EmptyState/EmptyState'
import ObservacionHilo from '../../../components/ObservacionHilo/ObservacionHilo'
import ConfirmModal from '../../../components/ConfirmModal/ConfirmModal'
import GradeBadge from '../../../components/GradeBadge/GradeBadge'
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
import InformacionProyecto from '../../../components/DetalleProyectoBase/InformacionProyecto'
import { ChatCircle, CheckCircle, FileText, FolderOpen, GraduationCap, MagnifyingGlass, X, LockKey, Plus, XCircle } from 'phosphor-react'

const ACCIONES = {
  aprobado: {
    estado: 'aprobado',
    titulo: 'Aprobar propuesta',
    verbo: 'aprobar',
    texto: 'Sí, aprobar',
  },
  rechazado: {
    estado: 'rechazado',
    titulo: 'Rechazar propuesta',
    verbo: 'rechazar',
    texto: 'Sí, rechazar',
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
    addObservacion(proyecto.id, `${user?.nombre || 'Instructor'} | Instructor`, texto, respondiendoA?.id || null)
    setTextoObs('')
    setRespondiendoA(null)
  }



  return (
    <DashboardLayout role="instructor" titulo="Detalle de Propuesta">
      <div className={s.page}>
        <PageHeader
          title={proyecto.title}
          subtitle={`Enviado el ${proyecto.createdAt} por ${proyecto.studentName}`}
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

        <div className={s.dossier}>
        <div className={s.colPrincipal}>
        <DataPanel
          title="Información del proyecto"
          icon={<FileText />}
          action={
            enMiCargo ? (
              <Actions>
                <Button type="button" variant="success" disabled={proyecto.estado === 'aprobado'} onClick={() => setModal(ACCIONES.aprobado)}>
                  <CheckCircle size={14} /> Aprobar
                </Button>
                <Button type="button" variant="danger" disabled={proyecto.estado === 'rechazado'} onClick={() => setModal(ACCIONES.rechazado)}>
                  <XCircle size={14} /> Rechazar
                </Button>
              </Actions>
            ) : undefined
          }
        >
          <InformacionProyecto proyecto={proyecto} ficha={ficha} fichaHref={ficha ? `/instructor/detalle-ficha/${ficha.id}` : null} />
        </DataPanel>
        </div>

        <aside className={s.rail} aria-label="Aprendiz, similitudes y observaciones">

        <DataPanel title="Información del aprendiz" icon={<GraduationCap />}>
          {estudiante ? (
            <div className={s.personCard}>
              {estudiante.fotoPerfil ? (
                <button type="button" className={s.avatarBtn} title="Ver foto" aria-label="Ver foto del aprendiz" onClick={() => setFotoViendo({ src: estudiante.fotoPerfil, alt: estudiante.name })}>
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
                    <Link to={`/instructor/detalle-similitud/${sim.id}`} viewTransition className={s.simRow}>
                      <span className={s.simPair}>
                        vs.{' '}
                        {sim.projectId1 === proyecto.id ? sim.project2Title : sim.project1Title}
                      </span>
                      <span className={s.simRight}>
                        <GradeBadge score={pct} size="sm" />
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
            className={s.hilosScroll}
          />
          <form className={s.obsForm} onSubmit={agregarObservacion}>
            <Textarea
              rows={3}
              value={textoObs}
              onChange={(e) => setTextoObs(e.target.value)}
              aria-label="Escribe una observación para el aprendiz"
              placeholder={respondiendoA ? 'Continúa la conversación con tu aprendiz…' : 'Escribe una observación para el aprendiz sobre su propuesta…'}
            />
            <Button type="submit" disabled={!textoObs.trim()}>
              <Plus size={14} /> Agregar observación
            </Button>
          </form>
        </DataPanel>
        )}
        </aside>
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
