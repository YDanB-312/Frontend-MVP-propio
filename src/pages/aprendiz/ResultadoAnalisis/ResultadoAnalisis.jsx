import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CalendarBlank, CaretRight, CheckCircle, MagnifyingGlass, PushPin, User } from 'phosphor-react'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import Actions from '../../../components/Actions/Actions'
import Button from '../../../components/Button/Button'
import EmptyState from '../../../components/EmptyState/EmptyState'
import SectionHeader from '../../../components/SectionHeader/SectionHeader'
import ConsoleCard from '../../../components/ConsoleCard/ConsoleCard'
import ScoreDial from '../../../components/ScoreDial/ScoreDial'
import GradeBadge from '../../../components/GradeBadge/GradeBadge'
import { toPct } from '../../../utils/similitudInfo'
import { useAuth } from '../../../contexts/AuthContext'
import { findProjectById, findSimilarityById, getSimilitudesValidas } from '../../../data/mockData'
import s from './ResultadoAnalisis.module.css'

export default function ResultadoAnalisis() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [animado, setAnimado] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setAnimado(true), 100)
    return () => clearTimeout(t)
  }, [])

  const { propio, propias, seleccionada } = useMemo(() => {
    const projectId = Number(searchParams.get('projectId'))
    const similitudId = Number(searchParams.get('similitudId'))

    let base = null
    if (projectId) {
      base = findProjectById(projectId)
    } else if (similitudId) {
      const sim = findSimilarityById(similitudId)
      if (sim) {
        const p1 = findProjectById(sim.projectId1)
        const p2 = findProjectById(sim.projectId2)
        base = [p1, p2].find((p) => p && p.studentId === user.id) || p1
      }
    }
    if (!base) return { propio: null, propias: [], seleccionada: null }

    const lista = getSimilitudesValidas()
      .filter((x) => x.projectId1 === base.id || x.projectId2 === base.id)
      .sort((a, b) => b.similitud - a.similitud)

    return {
      propio: base,
      propias: lista,
      seleccionada: similitudId ? lista.find((x) => x.id === similitudId) || null : null,
    }
  }, [searchParams, user.id])

  if (!propio) {
    return (
      <DashboardLayout role="aprendiz" titulo="Resultado del Análisis">
        <div className={s.wrapper}>
          <EmptyState
            icon={<MagnifyingGlass />}
            title="Sin resultados de análisis"
            message="No encontramos un análisis reciente para mostrar. Registra o selecciona un proyecto para analizarlo."
            actionLabel="Ir a mis proyectos"
            actionIcon={<ArrowLeft size={14} />}
            onAction={() => navigate('/aprendiz/propuestas')}
          />
        </div>
      </DashboardLayout>
    )
  }

  const esPropio = Number(propio.studentId) === Number(user.id) || (propio.integrantes || []).includes(user.nombre)
  if (!esPropio) {
    return (
      <DashboardLayout role="aprendiz" titulo="Resultado del Análisis">
        <div className={s.wrapper}>
          <EmptyState
            icon={<MagnifyingGlass />}
            title="Análisis no autorizado"
            message="Este análisis no pertenece a ninguna de tus propuestas."
            actionLabel="Ir a mis proyectos"
            actionIcon={<ArrowLeft size={14} />}
            onAction={() => navigate('/aprendiz/propuestas')}
          />
        </div>
      </DashboardLayout>
    )
  }

  if (propias.length === 0) {
    return (
      <DashboardLayout role="aprendiz" titulo="Resultado del Análisis">
        <div className={s.wrapper}>
          <EmptyState
            icon={<CheckCircle size={40} weight="light" />}
            title="Sin coincidencias detectadas"
            message={`Buenas noticias: "${propio.title}" no presenta similitudes con ningún otro proyecto de la base de datos.`}
            actionLabel="Ir a mis proyectos"
            actionIcon={<ArrowLeft size={14} />}
            onAction={() => navigate('/aprendiz/propuestas')}
          />
        </div>
      </DashboardLayout>
    )
  }

  const maxima = seleccionada || propias[0]
  const total = propias.length
  const pctMax = toPct(maxima.similitud)
  const nivel = pctMax >= 70 ? 'alta' : pctMax >= 40 ? 'media' : 'baja'

  const recomendaciones =
    nivel === 'alta'
      ? [
          'Revisa las secciones con mayor coincidencia y reescríbelas con tus propias palabras.',
          'Cita adecuadamente todas las fuentes y referencias utilizadas.',
          'Considera rediseñar el enfoque o el alcance para diferenciar tu propuesta.',
          'Conversa con tu instructor sobre los hallazgos del análisis.',
        ]
      : nivel === 'media'
        ? [
            'Compara tu documentación con los proyectos similares y refuerza tus aportes propios.',
            'Amplía la descripción de tu metodología y resultados.',
            'Verifica que las citas y referencias estén completas.',
          ]
        : [
            '¡Buen trabajo! Tu proyecto muestra un nivel bajo de coincidencia.',
            'Continúa documentando con detalle tu proceso y fuentes.',
            'Guarda este análisis como evidencia de originalidad.',
          ]

  return (
    <DashboardLayout role="aprendiz" titulo="Resultado del Análisis">
      <div className={s.wrapper}>
        <header className={s.header}>
          <p className={`mono ${s.kicker}`}>VEREDICTO DEL MOTOR · {total} coincidencia{total !== 1 ? 's' : ''}</p>
          <h1 className={s.title}>Resultado del análisis</h1>
          <p className={s.subtitle}>
            {propio.title} · {total} coincidencia{total !== 1 ? 's' : ''} detectada{total !== 1 ? 's' : ''}
          </p>
        </header>

        <ConsoleCard glow className={`${s.scoreCard} ${animado ? s.on : ''}`}>
          <div className={s.scoreTop}>
            <ScoreDial value={pctMax} size={148} label="Coincidencia máxima" />
            <div className={s.scoreInfo}>
              <p className={s.nivel}>Coincidencia {nivel} <GradeBadge score={pctMax} /></p>
              <p className={s.nivelDesc}>
                {total === 1
                  ? 'Se detectó una coincidencia para tu proyecto.'
                  : `Es la más alta entre las ${total} coincidencias detectadas. Revisa el listado completo abajo.`}{' '}
                {nivel === 'alta'
                  ? 'El sistema encontró coincidencias significativas con otros proyectos registrados.'
                  : nivel === 'media'
                    ? 'Existen coincidencias parciales que vale la pena revisar.'
                    : 'Tu proyecto es mayormente original frente a la base de datos.'}
              </p>
            </div>
          </div>
        </ConsoleCard>

        <section aria-label="Proyectos con similitud">
          <SectionHeader title={`Proyectos con similitud (${total})`} hint="ranking por puntaje" />
          <ol className={s.matchList}>
            {propias.map((sim, i) => {
              const pct = toPct(sim.similitud)
              const otroId = sim.projectId1 === propio.id ? sim.projectId2 : sim.projectId1
              const otro = findProjectById(otroId)
              const esMaxima = sim.id === maxima.id
              return (
                <li key={sim.id} className="fx-rise" style={{ '--fx-i': i }}>
                  <Link
                    to={`/aprendiz/detalle-similitud/${sim.id}`}
                    viewTransition
                    className={`${s.matchRow} ${esMaxima ? s.matchRowSelected : ''}`}
                  >
                    <span className={`mono ${s.matchRank}`}>#{i + 1}</span>
                    <span className={s.matchInfo}>
                      <span className={s.matchTitle}>{otro?.title || 'Proyecto no disponible'}</span>
                      <span className={s.matchMeta}>
                        <User size={12} /> {otro?.studentName || sim.project2Student}
                        <CalendarBlank size={12} /> {sim.createdAt}
                      </span>
                    </span>
                    <span className={s.matchRight}>
                      <GradeBadge score={pct} size="sm" />
                      <CaretRight size={16} className={s.matchChevron} />
                    </span>
                  </Link>
                </li>
              )
            })}
          </ol>
        </section>

        <ConsoleCard className={s.recoPanel}>
          <h2 id="reco-title" className={s.recoTitle}>
            <PushPin size={14} /> Recomendaciones
          </h2>
          <ul className={s.recoList}>
            {recomendaciones.map((r) => (
              <li key={r} className={s.recoItem}>
                {r}
              </li>
            ))}
          </ul>
        </ConsoleCard>

        <Actions align="center" wrap>
          <Button as="link" to="/aprendiz/propuestas" viewTransition>
            <ArrowLeft size={14} /> Volver a mis proyectos
          </Button>
          <Button as="link" to={`/aprendiz/detalle-proyecto/${propio.id}`} variant="secondary" viewTransition>
            Ver mi proyecto <ArrowRight size={14} />
          </Button>
        </Actions>
      </div>
    </DashboardLayout>
  )
}
