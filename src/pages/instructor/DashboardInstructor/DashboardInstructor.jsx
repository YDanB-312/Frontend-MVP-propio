import { Link } from 'react-router-dom'
import { ClipboardText, PlusCircle, BookOpen, MagnifyingGlass, Bell, CaretRight } from 'phosphor-react'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import StatChip from '../../../components/StatChip/StatChip'
import SectionHeader from '../../../components/SectionHeader/SectionHeader'
import GradeBadge from '../../../components/GradeBadge/GradeBadge'
import Badge from '../../../components/Badge/Badge'
import Button from '../../../components/Button/Button'
import EmptyState from '../../../components/EmptyState/EmptyState'
import { useAuth } from '../../../contexts/AuthContext'
import { getAllProjects, getAllFichas, getPendingProjects, getUnreadCount, getSimilitudesValidas, instructorVeProyecto, displayNames } from '../../../data/mockData'
import { PROJECT_ESTADO_VARIANT } from '../../../constants/badgeVariants'
import { getSimilitudMax as similitudMax } from '../../../utils/similitudInfo'
import s from './DashboardInstructor.module.css'
import { RECIENTES } from '../../../constants/pagination'

export default function DashboardInstructor() {
  const { user } = useAuth()
  const uid = Number(user?.id)
  // Mismo criterio que Revisión: proyecto propio O de ficha propia
  const misProyectos = user ? getAllProjects().filter(p => instructorVeProyecto(p, uid)) : []
  const pendientes = misProyectos.filter(p => p.estado === 'pendiente')
  const misFichas = user ? getAllFichas().filter(f => f.instructorId === uid) : []
  const idsPropios = new Set(misProyectos.map(p => p.id))
  const similitudes = getSimilitudesValidas()
  const similitudesPropias = similitudes.filter(x => idsPropios.has(x.projectId1) || idsPropios.has(x.projectId2))
  const recientes = user ? getPendingProjects().filter(p => instructorVeProyecto(p, uid)).slice(0, RECIENTES) : []
  const saludo = user?.nombre?.split(' ')[0] || 'Instructor'

  return (
    <DashboardLayout role="instructor" titulo="Dashboard">
      <div className={s.page}>
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
              <StatChip icon={<MagnifyingGlass size={14} />} label="Similitudes" value={similitudesPropias.length} />
            </Link>
            <Link to="/instructor/alertas" viewTransition className={s.chipLink}>
              <StatChip icon={<Bell size={14} />} label="Alertas" value={user ? getUnreadCount(uid) : 0} />
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
                const pct = similitudMax(similitudes, p.id)
                return (
                  <li key={p.id} className="fx-rise" style={{ '--fx-i': i }}>
                    <Link to={`/instructor/detalle-proyecto/${p.id}`} viewTransition className={s.caso}>
                      <span className={`mono ${s.orden}`}>{String(i + 1).padStart(2, '0')}</span>
                      <span className={s.casoMain}>
                        <span className={s.casoTitulo}>{p.title}</span>
                        <span className={s.casoMeta}>{p.studentName} · {p.createdAt}</span>
                      </span>
                      <span className={s.casoLado}>
                        {pct != null ? <GradeBadge score={pct} size="sm" /> : null}
                        <Badge variant={PROJECT_ESTADO_VARIANT[p.estado] || 'neutral'}>{displayNames.projectStatus[p.estado] || p.estado}</Badge>
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
                const deFicha = misProyectos.filter((p) => p.fichaId === f.id)
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
      </div>
    </DashboardLayout>
  )
}
