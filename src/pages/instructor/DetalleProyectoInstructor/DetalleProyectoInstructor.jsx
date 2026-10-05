import { useMemo, useState } from 'react'
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
import Alert from '../../../components/Alert/Alert'
import ApiState from '../../../components/ApiState/ApiState'
import ObservacionHilo from '../../../components/ObservacionHilo/ObservacionHilo'
import ConfirmModal from '../../../components/ConfirmModal/ConfirmModal'
import GradeBadge from '../../../components/GradeBadge/GradeBadge'
import HistorialProyecto from '../../../components/HistorialProyecto/HistorialProyecto'
import SimilitudesHistoricas from '../../../components/SimilitudesHistoricas/SimilitudesHistoricas'
import { useAuth } from '../../../contexts/AuthContext'
import { useApi } from '../../../lib/useApi'
import {
  proyectos,
  similitudes as similitudesApi,
  observaciones as observacionesApi,
  fichas,
  instructores,
} from '../../../lib/recursos'
import { agruparObservaciones, fechaDesdeApi, nombreCompleto } from '../../../utils/helpers'
import s from '../../../components/DetalleProyectoBase/DetalleProyectoBase.module.css'
import InformacionProyecto from '../../../components/DetalleProyectoBase/InformacionProyecto'
import { ChatCircle, CheckCircle, FileText, FolderOpen, GraduationCap, MagnifyingGlass, X, LockKey, Plus, XCircle } from 'phosphor-react'
import { ROL_LABEL } from '../../../constants/badgeVariants'

// Acciones de revisión disponibles para el instructor.
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
  const [enviandoObs, setEnviandoObs] = useState(false)
  const [obsError, setObsError] = useState('')
  const [accionError, setAccionError] = useState('')

  // Propuesta, similitudes del par y observaciones: fuente única la API.
  const { data: proyecto, cargando, error, recargar: recargarProyecto } = useApi(
    () => proyectos.obtener(id),
    [id],
    { inicial: null }
  )
  // Similitudes de ESTA propuesta (la contraparte debe estar aprobada).
  const { data: todasSimilitudes, recargar: recargarSims } = useApi(
    () => similitudesApi.listar({ proyecto_id: id }),
    [id],
    { inicial: [] }
  )
  const { data: comentariosApi, cargando: cargandoObs, recargar: recargarObs } = useApi(
    () => observacionesApi.listar('user', { id_proyecto: id }),
    [id],
    { inicial: [] }
  )

  // Catálogos para resolver el alcance del instructor.
  const { data: instructoresApi } = useApi(() => instructores.listar(), [], { inicial: [] })
  const { data: fichasApi } = useApi(() => fichas.listar(), [], { inicial: [] })

  const miFila = useMemo(
    () => instructoresApi.find((i) => Number(i.id_usuario) === Number(user?.id)) || null,
    [instructoresApi, user?.id]
  )
  const misFichasIds = useMemo(
    () => new Set(fichasApi
      .filter((f) => Number(f.instructor?.id) === Number(miFila?.id))
      .map((f) => Number(f.id))),
    [fichasApi, miFila?.id]
  )

  // Comentarios de la API → shape que consume ObservacionHilo.
  const observaciones = useMemo(
    () => (comentariosApi || []).map((c) => ({
      id: c.id,
      respuestaA: c.respuesta_a,
      autor: `${nombreCompleto(c.user) || 'Usuario'} | ${ROL_LABEL[c.user?.rol] || 'Comentario'}`,
      texto: c.texto,
      fecha: fechaDesdeApi(c.created_at),
    })),
    [comentariosApi]
  )

  const similitudes = useMemo(
    () => (proyecto ? (todasSimilitudes || []) : []),
    [proyecto, todasSimilitudes]
  )

  if (cargando) {
    return (
      <DashboardLayout role="instructor" titulo="Detalle de Propuesta">
        <div className={s.page}><ApiState cargando /></div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout role="instructor" titulo="Detalle de Propuesta">
        <div className={s.page}><ApiState error={error} onReintentar={recargarProyecto} /></div>
      </DashboardLayout>
    )
  }

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

  // Autorización: propuestas de sus fichas o asignadas a su fila (ajenas → lectura).
  const enMiCargo =
    Number(proyecto.id_instructor_asignado) === Number(miFila?.id) ||
    misFichasIds.has(Number(proyecto.id_class_group))

  const estudiante = proyecto.creator || null
  const ficha = proyecto.classGroup || null

  const confirmarAccion = async () => {
    if (!modal) return
    const estado = modal.estado
    setAccionError('')
    try {
      // El backend registra historial/notifica; el motor ya corrió al enviar.
      await proyectos.actualizar(proyecto.id, { ...proyecto, estado })
      await Promise.all([recargarProyecto(), recargarSims()])
    } catch (err) {
      // El error se muestra al usuario; la propuesta queda como estaba.
      setAccionError(err?.data?.message || 'No se pudo actualizar el estado de la propuesta.')
    }
    setModal(null)
  }

  const agregarObservacion = async (e) => {
    e.preventDefault()
    if (enviandoObs) return
    const texto = textoObs.trim()
    if (!texto) return
    setEnviandoObs(true)
    setObsError('')
    try {
      await observacionesApi.crear({
        texto,
        id_proyecto: Number(proyecto.id),
        id_usuario: Number(user.id),
        respuesta_a: respondiendoA?.id || null,
      })
      await recargarObs()
      setTextoObs('')
      setRespondiendoA(null)
    } catch (err) {
      // Se conserva el texto para que el usuario pueda reintentar.
      setObsError(err?.data?.message || 'No se pudo publicar la observación.')
    } finally {
      setEnviandoObs(false)
    }
  }

  return (
    <DashboardLayout role="instructor" titulo="Detalle de Propuesta">
      <div className={s.page}>
        <PageHeader
          title={proyecto.titulo}
          subtitle={`Enviado el ${fechaDesdeApi(proyecto.created_at)} por ${nombreCompleto(proyecto.creator) || 'Aprendiz'}`}
          icon={<FolderOpen />}
          breadcrumb={[
            { label: 'Dashboard', to: '/instructor/dashboard' },
            { label: 'Revisión de Propuestas', to: '/instructor/revision-propuestas' },
            { label: proyecto.titulo },
          ]}
        />

        {!enMiCargo && (
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
                <Button type="button" variant="success" disabled={proyecto.estado !== 'pendiente'} onClick={() => setModal(ACCIONES.aprobado)}>
                  <CheckCircle size={14} /> Aprobar
                </Button>
                <Button type="button" variant="danger" disabled={proyecto.estado !== 'pendiente'} onClick={() => setModal(ACCIONES.rechazado)}>
                  <XCircle size={14} /> Rechazar
                </Button>
              </Actions>
            ) : undefined
          }
        >
          <InformacionProyecto proyecto={proyecto} ficha={ficha} fichaHref={ficha ? `/instructor/detalle-ficha/${ficha.id}` : null} />
        </DataPanel>

        <HistorialProyecto projectId={proyecto.id} />
        </div>

        <aside className={s.rail} aria-label="Aprendiz, similitudes y observaciones">

        <DataPanel title="Información del aprendiz" icon={<GraduationCap />}>
          {estudiante ? (
            <div className={s.personCard}>
              {estudiante.foto_url ? (
                <button type="button" className={s.avatarBtn} title="Ver foto" aria-label="Ver foto del aprendiz" onClick={() => setFotoViendo({ src: estudiante.foto_url, alt: nombreCompleto(estudiante) })}>
                  <Avatar name={nombreCompleto(estudiante)} src={estudiante.foto_url} size="md" />
                </button>
              ) : (
                <Avatar name={nombreCompleto(estudiante)} size="md" />
              )}
              <div className={s.personInfo}>
                <span className={s.personName}>{nombreCompleto(estudiante)}</span>
                <span className={s.personEmail}>{estudiante.correo}</span>
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
                const pct = Math.round(Number(sim.porcentaje) || 0)
                const otroTitulo = Number(sim.id_proyecto_1) === Number(proyecto.id)
                  ? sim.project2?.titulo
                  : sim.project1?.titulo
                return (
                  <li key={sim.id}>
                    <Link to={`/instructor/detalle-similitud/${sim.id}`} viewTransition className={s.simRow}>
                      <span className={s.simPair}>
                        vs. {otroTitulo || 'Proyecto no disponible'}
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
          <SimilitudesHistoricas proyectoId={proyecto.id} detalleBase="/instructor" />
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
          {cargandoObs ? (
            <ApiState cargando />
          ) : (
            <ObservacionHilo
              grupos={agruparObservaciones(observaciones)}
              permitirResponder
              onRespuesta={(o) => setRespondiendoA(o)}
              className={s.hilosScroll}
            />
          )}
          {obsError && <Alert variant="danger">{obsError}</Alert>}
          {accionError && <Alert variant="danger">{accionError}</Alert>}

          <form className={s.obsForm} onSubmit={agregarObservacion}>
            <Textarea
              rows={3}
              value={textoObs}
              onChange={(e) => setTextoObs(e.target.value)}
              aria-label="Escribe una observación para el aprendiz"
              placeholder={respondiendoA ? 'Continúa la conversación con tu aprendiz…' : 'Escribe una observación para el aprendiz sobre su propuesta…'}
            />
            <Button type="submit" disabled={!textoObs.trim() || enviandoObs}>
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
            ? `¿Seguro que deseas ${modal.verbo} la propuesta "${proyecto.titulo}"? El aprendiz será notificado.`
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
