import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PageHeader from '../../../components/PageHeader/PageHeader'
import DataPanel from '../../../components/DataPanel/DataPanel'
import Badge from '../../../components/Badge/Badge'
import Button from '../../../components/Button/Button'
import { Textarea } from '../../../components/Input/Input'
import EmptyState from '../../../components/EmptyState/EmptyState'
import FormField from '../../../components/FormField/FormField'
import ObservacionHilo from '../../../components/ObservacionHilo/ObservacionHilo'
import Tag from '../../../components/Tag/Tag'
import { useAuth } from '../../../contexts/AuthContext'
import {
  findProjectById,
  findFichaById,
  getAllSimilarities,
  getSimilitudesValidas,
  getObservaciones,
  addObservacion,
  displayNames,
} from '../../../data/mockData'
import { agruparObservaciones } from '../../../utils/helpers'
import s from './DetalleProyecto.module.css'
import { CaretRight, ChatCircle, ClipboardText, FileText, MagnifyingGlass, X } from 'phosphor-react'

const ESTADO_VARIANT = {
  aprobado: 'success',
  completado: 'success',
  pendiente: 'warning',
  requiere_ajustes: 'warning',
  en_revision: 'info',
  en_progreso: 'primary',
  rechazado: 'danger',
  cancelado: 'danger',
  borrador: 'neutral',
}

export default function DetalleProyecto() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const project = findProjectById(id)

  const [texto, setTexto] = useState('')
  const [error, setError] = useState('')
  const [observaciones, setObservaciones] = useState(() => (project ? getObservaciones(project.id) : []))
  const [respondiendoA, setRespondiendoA] = useState(null)

  const similitudes = useMemo(
    () => (project ? getSimilitudesValidas().filter((s) => s.projectId1 === project.id || s.projectId2 === project.id) : []),
    [project]
  )

  if (!project) {
    return (
      <DashboardLayout role="aprendiz" titulo="Detalle del Proyecto">
        <div className={s.wrapper}>
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

  const keywords = (project.keywords || '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean)

  const objetivosEsp = (project.objetivosEspecificos || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  const tieneObjetivosNuevos = project.objetivoGeneral || objetivosEsp.length > 0

  function agregarObservacion(e) {
    e.preventDefault()
    if (texto.trim().length < 5) {
      setError('Escribe una observación de al menos 5 caracteres.')
      return
    }
    addObservacion(project.id, `${user.nombre} | Aprendiz`, texto.trim(), respondiendoA?.id || null)
    setObservaciones(getObservaciones(project.id))
    setTexto('')
    setError('')
    setRespondiendoA(null)
  }

  return (
    <DashboardLayout role="aprendiz" titulo="Detalle del Proyecto">
      <div className={s.wrapper}>
        <PageHeader
          title={project.title}
          subtitle={`Registrado el ${project.createdAt}`}
          icon={<FileText />}
          breadcrumb={[
            { label: 'Dashboard', to: '/aprendiz/dashboard' },
            { label: 'Mis Proyectos', to: '/aprendiz/propuestas' },
            { label: project.title },
          ]}
        />

        <div className={s.grid}>
          <div className={s.col}>
            <DataPanel title="Información del proyecto" icon={<ClipboardText />}>
              <div className={s.badgeRow}>
                <Badge variant={ESTADO_VARIANT[project.estado] || 'neutral'}>
                  {displayNames.projectStatus[project.estado] || project.estado}
                </Badge>
                {project.areaAplicacion && <Badge variant="info">{project.areaAplicacion}</Badge>}
              </div>

              <dl className={s.detailList}>
                <div className={s.detailRow}>
                  <dt>Fecha de creación</dt>
                  <dd>{project.createdAt}</dd>
                </div>
                <div className={s.detailRow}>
                  <dt>Instructor</dt>
                  <dd>{project.instructorName}</dd>
                </div>
                <div className={s.detailRow}>
                  <dt>Ficha</dt>
                  <dd>
                    <Link to={`/aprendiz/detalle-ficha/${project.fichaId}`} className={s.link}>
                      {ficha ? `${ficha.codigo} · ${ficha.nombre}` : `#${project.fichaId}`}
                    </Link>
                  </dd>
                </div>
                <div className={s.detailRow}>
                  <dt>Integrantes</dt>
                  <dd>{(project.integrantes || []).join(', ') || project.studentName}</dd>
                </div>
              </dl>

              <h3 className={s.subTitle}>Descripción</h3>
              <p className={s.paragraph}>{project.description}</p>

              {tieneObjetivosNuevos ? (
                <>
                  <h3 className={s.subTitle}>Objetivo general</h3>
                  <p className={s.paragraph}>{project.objetivoGeneral || 'Sin definir.'}</p>
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
              ) : project.objectives ? (
                <>
                  <h3 className={s.subTitle}>Objetivos</h3>
                  <pre className={s.pre}>{project.objectives}</pre>
                </>
              ) : null}

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
            {esPropio && (
            <DataPanel title={`Similitudes detectadas (${similitudes.length})`} icon={<MagnifyingGlass />}>
              {similitudes.length === 0 ? (
                <p className={s.muted}>Aún no se han detectado similitudes para este proyecto.</p>
              ) : (
                <ul className={s.simList}>
                  {similitudes.map((sim) => {
                    const pct = Math.round(sim.similitud * 100)
                    const otroId = sim.projectId1 === project.id ? sim.projectId2 : sim.projectId1
                    const otroTitulo = sim.projectId1 === project.id ? sim.project2Title : sim.project1Title
                    return (
                      <li key={sim.id}>
                        <Link to={`/aprendiz/detalle-similitud/${sim.id}`} className={s.simRow}>
                          <span className={s.simPct}>{pct}%</span>
                          <span className={s.simInfo}>
                            <span className={s.simTitle}>{otroTitulo}</span>
                            <span className={s.simMeta}>Proyecto #{otroId} · {sim.createdAt}</span>
                          </span>
                          <span className={s.chevron} aria-hidden="true"><CaretRight size={22} /></span>
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
              <ObservacionHilo
                grupos={agruparObservaciones(observaciones)}
                permitirResponder
                onRespuesta={(o) => setRespondiendoA(o)}
              />

              <form className={s.obsForm} onSubmit={agregarObservacion} noValidate>
                <FormField
                  label={respondiendoA ? `Respondiendo a ${String(respondiendoA.autor).split(' | ')[0]}` : 'Nueva observación'}
                  error={error}
                >
                  <Textarea
                    rows={3}
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    placeholder={respondiendoA ? 'Escribe tu respuesta al instructor…' : 'Escribe tu comentario sobre la propuesta...'}
                    maxLength={500}
                  />
                </FormField>
                {respondiendoA && (
                  <button
                    type="button"
                    className={s.cancelarRespuesta}
                    onClick={() => setRespondiendoA(null)}
                  >
                    <X size={12} /> Cancelar respuesta
                  </button>
                )}
                <Button type="submit">
                  {respondiendoA ? 'Publicar respuesta' : 'Publicar observación'}
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
