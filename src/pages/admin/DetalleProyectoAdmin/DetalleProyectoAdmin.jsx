import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, ChatCircle, CheckCircle, FileText, FolderOpen, GraduationCap, MagnifyingGlass, PencilSimple, Plus, Trash, X } from 'phosphor-react'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PageHeader from '../../../components/PageHeader/PageHeader'
import DataPanel from '../../../components/DataPanel/DataPanel'
import Button from '../../../components/Button/Button'
import Alert from '../../../components/Alert/Alert'
import { Input, Select, Textarea } from '../../../components/Input/Input'
import FormField from '../../../components/FormField/FormField'
import Avatar from '../../../components/Avatar/Avatar'
import Lightbox from '../../../components/Lightbox/Lightbox'
import EmptyState from '../../../components/EmptyState/EmptyState'
import ConfirmModal from '../../../components/ConfirmModal/ConfirmModal'
import ObservacionHilo from
'../../../components/ObservacionHilo/ObservacionHilo'
import GradeBadge from '../../../components/GradeBadge/GradeBadge'
import { useAuth } from '../../../contexts/AuthContext'
import {
  findProjectById,
  findUserById,
  findFichaById,
  getSimilaritiesByProject,
  getObservaciones,
  addObservacion,
  deleteObservacion,
  updateProject,
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
  const [obsAEliminar, setObsAEliminar] = useState(null)
  const [, setTick] = useState(0)
  const refrescarObs = () => setTick((t) => t + 1)

  const proyecto = findProjectById(id)
  const estudiante = proyecto ? findUserById(proyecto.studentId) : null
  const similitudes = proyecto ? getSimilaritiesByProject(proyecto.id) : []
  const observaciones = proyecto ? getObservaciones(proyecto.id) : []

  const [nuevoEstado, setNuevoEstado] = useState(() => (proyecto ? proyecto.estado : 'pendiente'))
  const [guardado, setGuardado] = useState(false)
  const [editando, setEditando] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', keywords: '' })
  const [errores, setErrores] = useState({})
  const [editMsg, setEditMsg] = useState(false)

  // Sincroniza los selectores al navegar entre proyectos sin remontar
  useEffect(() => {
    if (proyecto) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNuevoEstado(proyecto.estado)
      setGuardado(false)
      setEditando(false)
      setEditMsg(false)
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

  const iniciarEdicion = () => {
    setForm({
      title: proyecto.title || '',
      description: proyecto.description || '',
      keywords: proyecto.keywords || '',
    })
    setErrores({})
    setEditMsg(false)
    setEditando(true)
  }

  const guardarEdicion = (e) => {
    e.preventDefault()
    const errs = {}
    if (form.title.trim().length < 5) errs.title = 'El título debe tener al menos 5 caracteres.'
    if (form.description.trim().length < 20) errs.description = 'La descripción debe tener al menos 20 caracteres.'
    setErrores(errs)
    if (Object.keys(errs).length > 0) return
    updateProject({
      id: proyecto.id,
      title: form.title.trim(),
      description: form.description.trim(),
      keywords: form.keywords.trim(),
    })
    setEditando(false)
    setEditMsg(true)
  }

  return (
    <DashboardLayout role="admin" titulo="Detalle de Propuesta">
      <div className={s.page}>
        <PageHeader
          title={proyecto.title}
          subtitle={`Enviado el ${proyecto.createdAt} por ${proyecto.studentName}`}
          icon={<FolderOpen />}
          breadcrumb={[
            { label: 'Dashboard', to: '/admin/dashboard' },
            { label: 'Proyectos', to: '/admin/proyectos' },
            { label: proyecto.title },
          ]}
        />

        {guardado && (
          <Alert><CheckCircle size={14} /> Estado actualizado correctamente.</Alert>
        )}

        <div className={s.dossier}>
          <div className={s.colPrincipal}>
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
                    variant="secondary"
                    onClick={() => (editando ? setEditando(false) : iniciarEdicion())}
                  >
                    <PencilSimple size={14} /> {editando ? 'Cancelar edición' : 'Editar'}
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
              {editMsg && (
                <Alert><CheckCircle size={14} /> Contenido actualizado correctamente.</Alert>
              )}
              {editando ? (
                <form className={s.obsForm} onSubmit={guardarEdicion} noValidate>
                  <FormField label="Título" required error={errores.title}>
                    <Input
                      value={form.title}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                      maxLength={120}
                    />
                  </FormField>
                  <FormField label="Descripción" required error={errores.description}>
                    <Textarea
                      rows={4}
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    />
                  </FormField>
                  <FormField label="Palabras clave" help="Separadas por comas.">
                    <Input
                      value={form.keywords}
                      onChange={(e) => setForm((f) => ({ ...f, keywords: e.target.value }))}
                    />
                  </FormField>
                  <Button type="submit">
                    <CheckCircle size={14} /> Guardar contenido
                  </Button>
                </form>
              ) : (
                <InformacionProyecto proyecto={proyecto} ficha={ficha} fichaHref={ficha ? `/admin/detalle-ficha/${ficha.id}` : null} />
              )}
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
                        <Link to={`/admin/detalle-similitud/${sim.id}`} viewTransition className={s.simRow}>
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
                permitirEliminar
                onEliminar={(o) => setObsAEliminar(o)}
                className={s.hilosScroll}
              />

              <form className={s.obsForm} onSubmit={agregarObservacion}>
                <Textarea
                  rows={3}
                  value={textoObs}
                  onChange={(e) => setTextoObs(e.target.value)}
                  placeholder="Escribe una observación sobre esta propuesta…"
                  aria-label="Observación sobre esta propuesta"
                />
                <Button type="submit" disabled={!textoObs.trim()}>
                  <Plus size={14} /> Agregar observación
                </Button>
              </form>
            </DataPanel>
          </aside>
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
      <ConfirmModal
        open={!!obsAEliminar}
        titulo="Eliminar observación"
        mensaje={
          obsAEliminar
            ? `¿Seguro que deseas eliminar la observación de "${String(obsAEliminar.autor).split(' | ')[0]}"? Esta acción no se puede deshacer.`
            : ''
        }
        textoConfirmar="Sí, eliminar"
        onConfirmar={() => {
          if (respondiendoA?.id === obsAEliminar?.id) setRespondiendoA(null)
          deleteObservacion(obsAEliminar.id)
          setObsAEliminar(null)
          refrescarObs()
        }}
        onCancelar={() => setObsAEliminar(null)}
      />
      {fotoViendo && <Lightbox src={fotoViendo.src} alt={fotoViendo.alt} caption={fotoViendo.alt} onClose={() => setFotoViendo(null)} />}
    </DashboardLayout>
  )
}
