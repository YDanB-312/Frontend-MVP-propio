import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PageHeader from
'../../../components/PageHeader/PageHeader'
import DataPanel from '../../../components/DataPanel/DataPanel'
import FormField from '../../../components/FormField/FormField'
import Actions from '../../../components/Actions/Actions'
import Button from '../../../components/Button/Button'
import { Input, Textarea } from '../../../components/Input/Input'
import EmptyState from '../../../components/EmptyState/EmptyState'
import ApiState from '../../../components/ApiState/ApiState'
import ObservacionHilo from
'../../../components/ObservacionHilo/ObservacionHilo'
import GradeBadge from '../../../components/GradeBadge/GradeBadge'
import { useAuth } from '../../../contexts/AuthContext'
import { useApi } from '../../../lib/useApi'
import { proyectos, similitudes as similitudesApi, observaciones as observacionesApi } from '../../../lib/recursos'
import { agruparObservaciones, fechaDesdeApi } from '../../../utils/helpers'
import s from '../../../components/DetalleProyectoBase/DetalleProyectoBase.module.css'
import n from '../../../components/FormularioBase/FormularioBase.module.css'
import InformacionProyecto from '../../../components/DetalleProyectoBase/InformacionProyecto'
import { ChatCircle, CheckCircle, FileText, FolderOpen, MagnifyingGlass, PencilSimple, Plus, Warning, X } from 'phosphor-react'

const ROL_LABEL = { aprendiz: 'Aprendiz', instructor: 'Instructor', admin: 'Admin' }

function nombreUsuario(u) {
  if (!u) return 'Usuario'
  return [u.nombre, u.apellido].filter(Boolean).join(' ').trim() || u.correo || 'Usuario'
}

// Una propuesta es del aprendiz si la creó o si figura en su equipo.
function esMia(proyecto, userId) {
  if (!proyecto) return false
  if (Number(proyecto.id_creador) === Number(userId)) return true
  return (proyecto.apprentices || []).some(
    (a) => Number(a.generalUser?.id) === Number(userId) || Number(a.id_usuario) === Number(userId)
  )
}

export default function DetalleProyecto() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  // Propuesta con sus relaciones, similitudes del par y comentarios del hilo.
  const { data: project, cargando, error, recargar } = useApi(
    () => proyectos.obtener(id),
    [id],
    { inicial: null }
  )
  const { data: todasSimilitudes, recargar: recargarSims } = useApi(() => similitudesApi.listar(), [], { inicial: [] })
  const { data: comentariosApi, cargando: cargandoObs, recargar: recargarObs } = useApi(
    () => observacionesApi.listar('user', { id_proyecto: id }),
    [id],
    { inicial: [] }
  )

  const [texto, setTexto] = useState('')
  const [respondiendoA, setRespondiendoA] = useState(null)
  const [enviando, setEnviando] = useState(false)

  /* ---------- Edición de la propuesta (mientras no esté aprobada) ---------- */
  const [editando, setEditando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [errores, setErrores] = useState({})
  const [aviso, setAviso] = useState('')
  const [form, setForm] = useState({ titulo: '', resumen: '', palabras_clave: '', objetivo_general: '', objetivos_especificos: '', area_aplicacion: '' })

  // Comentarios de la API → shape que consume ObservacionHilo.
  const observaciones = useMemo(
    () => (comentariosApi || []).map((c) => ({
      id: c.id,
      respuestaA: c.respuesta_a,
      autor: `${nombreUsuario(c.user)} | ${ROL_LABEL[c.user?.rol] || 'Comentario'}`,
      texto: c.texto,
      fecha: fechaDesdeApi(c.created_at),
    })),
    [comentariosApi]
  )

  const similitudes = useMemo(
    () => (project
      ? (todasSimilitudes || []).filter(
          (x) => Number(x.id_proyecto_1) === Number(project.id) || Number(x.id_proyecto_2) === Number(project.id)
        )
      : []),
    [project, todasSimilitudes]
  )

  if (cargando) {
    return (
      <DashboardLayout role="aprendiz" titulo="Detalle del Proyecto">
        <div className={s.page}><ApiState cargando /></div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout role="aprendiz" titulo="Detalle del Proyecto">
        <div className={s.page}><ApiState error={error} onReintentar={recargar} /></div>
      </DashboardLayout>
    )
  }

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
  const esPropio = esMia(project, user.id)
  const ficha = project.classGroup || null
  // Se puede editar mientras la propuesta no haya sido aprobada por el instructor.
  const puedeEditar = esPropio && project.estado !== 'aprobado'

  function iniciarEdicion() {
    setForm({
      titulo: project.titulo || '',
      resumen: project.resumen || '',
      palabras_clave: project.palabras_clave || '',
      objetivo_general: project.objetivo_general || '',
      objetivos_especificos: (Array.isArray(project.objetivos_especificos) ? project.objetivos_especificos : []).join('\n'),
      area_aplicacion: project.area_aplicacion || '',
    })
    setErrores({})
    setAviso('')
    setEditando(true)
  }

  function validar() {
    const errs = {}
    if (form.titulo.trim().length < 5) errs.titulo = 'El título debe tener al menos 5 caracteres.'
    if (form.resumen.trim().length < 20) errs.resumen = 'La descripción debe tener al menos 20 caracteres.'
    if (form.objetivo_general.trim().length < 15) errs.objetivo_general = 'El objetivo general debe tener al menos 15 caracteres.'
    const objetivos = form.objetivos_especificos.split('\n').map((l) => l.trim()).filter(Boolean)
    if (objetivos.length < 2) errs.objetivos_especificos = 'Escribe al menos 2 objetivos específicos (uno por línea).'
    if (!form.area_aplicacion.trim()) errs.area_aplicacion = 'Indica el área de aplicación.'
    return errs
  }

  async function guardarEdicion(e) {
    e.preventDefault()
    const errs = validar()
    setErrores(errs)
    if (Object.keys(errs).length > 0) return

    setGuardando(true)
    try {
      const objetivosValidos = form.objetivos_especificos.split('\n').map((l) => l.trim()).filter(Boolean)
      await proyectos.actualizar(project.id, {
        titulo: form.titulo.trim(),
        resumen: form.resumen.trim(),
        palabras_clave: form.palabras_clave.trim() || null,
        area_aplicacion: form.area_aplicacion.trim(),
        objetivo_general: form.objetivo_general.trim() || null,
        objetivos_especificos: objetivosValidos,
        estado: project.estado === 'rechazado' ? 'pendiente' : project.estado,
        id_creador: project.id_creador,
        id_instructor_asignado: project.id_instructor_asignado,
        id_class_group: project.id_class_group,
      })
      // El contenido cambió: el backend vuelve a puntuar sus coincidencias.
      try { await similitudesApi.detectar(project.id) } catch { /* no bloquea el guardado */ }
      await Promise.all([recargar(), recargarSims()])
      setEditando(false)
      setAviso(project.estado === 'rechazado'
        ? 'Propuesta reenviada: vuelve a quedar pendiente de revisión.'
        : 'Propuesta actualizada correctamente.')
    } catch (err) {
      setErrores({ titulo: err?.data?.message || 'No se pudo actualizar la propuesta.' })
    } finally {
      setGuardando(false)
    }
  }

  async function agregarObservacion(e) {
    e.preventDefault()
    const t = texto.trim()
    if (!t) return
    setEnviando(true)
    try {
      await observacionesApi.crear({
        texto: t,
        id_proyecto: Number(project.id),
        id_usuario: Number(user.id),
        respuesta_a: respondiendoA?.id || null,
      })
      await recargarObs()
      setTexto('')
      setRespondiendoA(null)
    } catch {
      // Se conserva el texto para que el usuario pueda reintentar.
    } finally {
      setEnviando(false)
    }
  }

  return (
    <DashboardLayout role="aprendiz" titulo="Detalle del Proyecto">
      <div className={s.page}>
        <PageHeader
          title={project.titulo}
          subtitle={`Enviado el ${fechaDesdeApi(project.created_at)} por ${nombreUsuario(project.creator)}`}
          icon={<FolderOpen />}
          breadcrumb={[
            { label: 'Dashboard', to: '/aprendiz/dashboard' },
            { label: 'Mis Propuestas', to: '/aprendiz/propuestas' },
            { label: project.titulo },
          ]}
          actions={
            puedeEditar && !editando ? (
              <Button type="button" variant="secondary" onClick={iniciarEdicion}>
                <PencilSimple size={14} /> Editar
              </Button>
            ) : undefined
          }
        />

        {aviso && (
          <p className={s.muted} role="status"><CheckCircle size={14} /> {aviso}</p>
        )}

        <div className={esPropio ? s.dossier : s.dossierSolo}>
          <div className={s.colPrincipal}>
            <DataPanel title="Información del proyecto" icon={<FileText />}>
              {editando ? (
                <form className={n.form} onSubmit={guardarEdicion} noValidate>
                  <FormField label="Título" required error={errores.titulo}>
                    <Input
                      value={form.titulo}
                      onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                      maxLength={120}
                    />
                  </FormField>
                  <FormField label="Descripción" required error={errores.resumen}>
                    <Textarea
                      rows={4}
                      value={form.resumen}
                      onChange={(e) => setForm((f) => ({ ...f, resumen: e.target.value }))}
                    />
                  </FormField>
                  <FormField label="Objetivo general" required error={errores.objetivo_general}>
                    <Textarea
                      rows={3}
                      value={form.objetivo_general}
                      onChange={(e) => setForm((f) => ({ ...f, objetivo_general: e.target.value }))}
                    />
                  </FormField>
                  <FormField label="Objetivos específicos" required error={errores.objetivos_especificos} help="Uno por línea.">
                    <Textarea
                      rows={4}
                      value={form.objetivos_especificos}
                      onChange={(e) => setForm((f) => ({ ...f, objetivos_especificos: e.target.value }))}
                    />
                  </FormField>
                  <div className={n.grid2}>
                    <FormField label="Palabras clave" help="Opcional, separadas por comas.">
                      <Input
                        value={form.palabras_clave}
                        onChange={(e) => setForm((f) => ({ ...f, palabras_clave: e.target.value }))}
                        maxLength={200}
                      />
                    </FormField>
                    <FormField label="Área de aplicación" required error={errores.area_aplicacion}>
                      <Input
                        value={form.area_aplicacion}
                        onChange={(e) => setForm((f) => ({ ...f, area_aplicacion: e.target.value }))}
                        maxLength={120}
                      />
                    </FormField>
                  </div>
                  {project.estado === 'rechazado' && (
                    <p className={s.muted}><Warning size={14} /> Al guardar, la propuesta vuelve a quedar pendiente de revisión.</p>
                  )}
                  <Actions form>
                    <Button type="submit" disabled={guardando}>
                      <CheckCircle size={14} /> {guardando ? 'Guardando…' : 'Guardar cambios'}
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => setEditando(false)}>
                      Cancelar
                    </Button>
                  </Actions>
                </form>
              ) : (
                <InformacionProyecto proyecto={project} ficha={ficha} fichaHref={`/aprendiz/detalle-ficha/${project.id_class_group}`} />
              )}
            </DataPanel>
          </div>

          {esPropio && (
            <aside className={s.rail} aria-label="Similitudes y observaciones">
              <DataPanel title="Similitudes detectadas" icon={<MagnifyingGlass />}>
                {similitudes.length === 0 ? (
                  <p className={s.muted}>No se han detectado similitudes para esta propuesta.</p>
                ) : (
                  <ul className={s.simList}>
                    {similitudes.map((sim) => {
                      const pct = Math.round(Number(sim.porcentaje) || 0)
                      const otroTitulo = Number(sim.id_proyecto_1) === Number(project.id)
                        ? sim.project2?.titulo
                        : sim.project1?.titulo
                      return (
                        <li key={sim.id}>
                          <Link to={`/aprendiz/detalle-similitud/${sim.id}`} viewTransition className={s.simRow}>
                            <span className={s.simPair}>vs. {otroTitulo || 'Proyecto no disponible'}</span>
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

                <form className={s.obsForm} onSubmit={agregarObservacion}>
                  <Textarea
                    rows={3}
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    aria-label="Escribe un comentario sobre la propuesta"
                    placeholder={respondiendoA ? 'Escribe tu respuesta al instructor…' : 'Escribe tu comentario sobre la propuesta...'}
                  />
                  <Button type="submit" disabled={!texto.trim() || enviando}>
                    <Plus size={14} /> Agregar observación
                  </Button>
                </form>
              </DataPanel>
            </aside>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
