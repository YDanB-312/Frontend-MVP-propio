import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardText, PlusCircle, BookOpen, MagnifyingGlass, Bell, CaretRight } from 'phosphor-react'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import StatChip from '../../../components/StatChip/StatChip'
import SectionHeader from '../../../components/SectionHeader/SectionHeader'
import GradeBadge from '../../../components/GradeBadge/GradeBadge'
import Badge from '../../../components/Badge/Badge'
import Button from '../../../components/Button/Button'
import EmptyState from '../../../components/EmptyState/EmptyState'
import ApiState from '../../../components/ApiState/ApiState'
import { useAuth } from '../../../contexts/AuthContext'
import { useApi } from '../../../lib/useApi'
import { proyectos, similitudes as similitudesApi, notificaciones, fichas, instructores } from '../../../lib/recursos'
import { PROJECT_ESTADO_VARIANT } from '../../../constants/badgeVariants'
import { fechaDesdeApi } from '../../../utils/helpers'
import s from './DashboardInstructor.module.css'
import { RECIENTES } from '../../../constants/pagination'

// Relaciones que la lista de propuestas debe traer para mostrar creador y ficha.
const INCLUDE_PROYECTOS = 'creator,instructor.generalUser,classGroup.program,classGroup.trainingCenter,apprentices.generalUser'

const ESTADO_LABEL = { pendiente: 'Pendiente', aprobado: 'Aprobado', rechazado: 'Rechazado' }

// Concatena nombre + apellido de un general_user.
function nombreCompleto(usuario) {
  return [usuario?.nombre, usuario?.apellido].filter(Boolean).join(' ').trim()
}

// Máximo porcentaje y conteo de coincidencias de una propuesta.
function infoSimilitud(lista, projectId) {
  const pares = (lista || []).filter(
    (x) => Number(x.id_proyecto_1) === Number(projectId) || Number(x.id_proyecto_2) === Number(projectId)
  )
  if (pares.length === 0) return null
  return {
    pct: Math.max(...pares.map((x) => Math.round(Number(x.porcentaje) || 0))),
    count: pares.length,
  }
}

export default function DashboardInstructor() {
  const { user } = useAuth()

  // Fuente única: la API. Catálogos e instructor propio para resolver el alcance.
  const { data: instructoresApi } = useApi(() => instructores.listar(), [], { inicial: [] })
  const { data: fichasApi } = useApi(() => fichas.listar(), [], { inicial: [] })
  const { data: todosProyectos, cargando, error, recargar } = useApi(
    () => proyectos.listar({ included: INCLUDE_PROYECTOS }),
    [],
    { inicial: [] }
  )
  const { data: todasSimilitudes } = useApi(() => similitudesApi.listar(), [], { inicial: [] })
  const { data: misNotificaciones } = useApi(
    // El backend ya acota las notificaciones al usuario autenticado: misma URL
    // que usa el layout, así se comparte una sola petición.
    () => (user?.id ? notificaciones.listar() : Promise.resolve([])),
    [user?.id],
    { inicial: [] }
  )

  // Fila de perfil del instructor (instructors) del usuario autenticado.
  const miFila = useMemo(
    () => instructoresApi.find((i) => Number(i.id_usuario) === Number(user?.id)) || null,
    [instructoresApi, user?.id]
  )

  // Fichas a su cargo: la relación viene en ficha.instructor.id (fila instructors).
  const misFichas = useMemo(
    () => fichasApi.filter((f) => Number(f.instructor?.id) === Number(miFila?.id)),
    [fichasApi, miFila?.id]
  )
  const misFichasIds = useMemo(() => new Set(misFichas.map((f) => Number(f.id))), [misFichas])

  // Regla de negocio: el instructor ve el proyecto si es su asignado o si la
  // propuesta pertenece a una de sus fichas.
  const verProyecto = useMemo(
    () => (p) =>
      Number(p.id_instructor_asignado) === Number(miFila?.id) ||
      misFichasIds.has(Number(p.id_class_group)),
    [miFila?.id, misFichasIds]
  )

  const misProyectos = useMemo(
    () => todosProyectos.filter(verProyecto),
    [todosProyectos, verProyecto]
  )
  const pendientes = useMemo(
    () => misProyectos.filter((p) => p.estado === 'pendiente'),
    [misProyectos]
  )

  const idsPropios = useMemo(() => new Set(misProyectos.map((p) => Number(p.id))), [misProyectos])
  const similitudesPropias = useMemo(
    () => todasSimilitudes.filter(
      (x) => idsPropios.has(Number(x.id_proyecto_1)) || idsPropios.has(Number(x.id_proyecto_2))
    ).length,
    [todasSimilitudes, idsPropios]
  )

  const sinLeer = useMemo(
    () => misNotificaciones.filter((n) => Number(n.id_usuario) === Number(user?.id) && !n.leida).length,
    [misNotificaciones, user?.id]
  )

  const recientes = useMemo(() => pendientes.slice(0, RECIENTES), [pendientes])
  const saludo = (user?.nombre || '').split(' ')[0] || 'Instructor'

  return (
    <DashboardLayout role="instructor" titulo="Dashboard">
      <div className={s.page}>
        <ApiState cargando={cargando} error={error} onReintentar={recargar}>
          <header className={s.hero}>
            <p className={`mono ${s.kicker}`}>TURNO · INSTRUCTOR</p>
            <h1 className={s.title}>¡Hola, {saludo}!</h1>
            <p className={s.texto}>
              {pendientes.length === 0
                ? 'Sin pendientes en tu turno. Bienvenido de nuevo a ProyecTwin.'
                : `Tienes ${pendientes.length} propuesta${pendientes.length !== 1 ? 's' : ''} esperando tu revisión.`}
            </p>
            <div className={s.chips}>
              <Link to="/instructor/revision-propuestas" viewTransition className={s.chipLink}>
                <StatChip icon={<ClipboardText size={14} />} label="Por revisar" value={pendientes.length} />
              </Link>
              <Link to="/instructor/fichas" viewTransition className={s.chipLink}>
                <StatChip icon={<BookOpen size={14} />} label="Fichas" value={misFichas.length} />
              </Link>
              <Link to="/instructor/similitudes" viewTransition className={s.chipLink}>
                <StatChip icon={<MagnifyingGlass size={14} />} label="Similitudes" value={similitudesPropias} />
              </Link>
              <Link to="/instructor/alertas" viewTransition className={s.chipLink}>
                <StatChip icon={<Bell size={14} />} label="Alertas" value={sinLeer} />
              </Link>
            </div>
            <div className={s.ctaRow}>
              {pendientes.length > 0 && (
                <Button as="link" to="/instructor/revision-propuestas" viewTransition>
                  <ClipboardText size={14} /> Revisar propuestas
                </Button>
              )}
              <Button as="link" to="/instructor/fichas?crear=1" viewTransition variant="secondary">
                <PlusCircle size={14} /> Crear ficha
              </Button>
            </div>
          </header>

          <section aria-label="Pendientes del turno">
            <SectionHeader title="Hoy en tu turno" count={recientes.length} hint="pendientes recientes" />
            {recientes.length === 0 ? (
              <EmptyState title="No hay propuestas pendientes" message="Cuando tus aprendices envíen nuevas propuestas aparecerán aquí para su revisión." />
            ) : (
              <ol className={s.turno}>
                {recientes.map((p, i) => {
                  const info = infoSimilitud(todasSimilitudes, p.id)
                  return (
                    <li key={p.id} className="fx-rise" style={{ '--fx-i': i }}>
                      <Link to={`/instructor/detalle-proyecto/${p.id}`} viewTransition className={s.caso}>
                        <span className={`mono ${s.orden}`}>{String(i + 1).padStart(2, '0')}</span>
                        <span className={s.casoMain}>
                          <span className={s.casoTitulo}>{p.titulo}</span>
                          <span className={s.casoMeta}>{nombreCompleto(p.creator)} · {fechaDesdeApi(p.created_at)}</span>
                        </span>
                        <span className={s.casoLado}>
                          {info ? <GradeBadge score={info.pct} size="sm" /> : null}
                          <Badge variant={PROJECT_ESTADO_VARIANT[p.estado] || 'neutral'}>{ESTADO_LABEL[p.estado] || p.estado}</Badge>
                          <CaretRight size={16} className={s.chevron} />
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ol>
            )}
          </section>

          <section aria-label="Tus cohortes">
            <SectionHeader title="Tus cohortes" count={misFichas.length} />
            {misFichas.length === 0 ? null : (
              <div className={s.cohortes}>
                {misFichas.map((f) => {
                  const deFicha = misProyectos.filter((p) => Number(p.id_class_group) === Number(f.id))
                  const pend = deFicha.filter((p) => p.estado === 'pendiente').length
                  return (
                    <Link key={f.id} to={`/instructor/detalle-ficha/${f.id}`} viewTransition className={s.cohorte}>
                      <span className={`mono ${s.cohorteCodigo}`}>{f.codigo}</span>
                      <span className={s.cohorteNombre}>{f.nombre}</span>
                      <span className={s.cohorteMeta}>
                        {deFicha.length} propuesta{deFicha.length !== 1 ? 's' : ''} · {pend} por revisar
                      </span>
                    </Link>
                  )
                })}
              </div>
            )}
          </section>
        </ApiState>
      </div>
    </DashboardLayout>
  )
}
