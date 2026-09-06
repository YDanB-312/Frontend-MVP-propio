import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CalendarBlank, CaretRight, CheckCircle, MagnifyingGlass, PushPin, User } from 'phosphor-react'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import Actions from '../../../components/Actions/Actions'
import Button from '../../../components/Button/Button'
import EmptyState from '../../../components/EmptyState/EmptyState'
import { useAuth } from '../../../contexts/AuthContext'
import { findProjectById, findSimilarityById, getSimilitudesValidas } from '../../../data/mockData'
import s from './ResultadoAnalisis.module.css'

const CIRCUNFERENCIA = 2 * Math.PI * 54

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
  const pctMax = Math.round(maxima.similitud * 100)
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
          <h1 className={s.title}>Resultado del análisis</h1>
          <p className={s.subtitle}>
            {propio.title} · {total} coincidencia{total !== 1 ? 's' : ''} detectada{total !== 1 ? 's' : ''}
          </p>
        </header>

        <section className={`${s.scoreCard} ${nivel === 'alta' ? s.danger : nivel === 'media' ? s.warning : s.success}`}>
          <div className={s.circleWrap}>
            <svg className={s.circle} viewBox="0 0 120 120" aria-hidden="true">
              <circle className={s.circleBg} cx="60" cy="60" r="54" />
              <circle
                className={s.circleFg}
                cx="60"
                cy="60"
                r="54"
                strokeDasharray={CIRCUNFERENCIA}
                strokeDashoffset={animado ? CIRCUNFERENCIA * (1 - pctMax / 100) : CIRCUNFERENCIA}
              />
            </svg>
            <div className={s.circleText}>
              <span className={s.pct}>{pctMax}%</span>
              <span className={s.pctLabel}>máxima</span>
            </div>
          </div>
          <div className={s.scoreInfo}>
            <p className={s.nivel}>Coincidencia {nivel}</p>
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
        </section>

        <section aria-label="Proyectos con similitud">
          <h2 className={s.sectionTitle}>Proyectos con similitud ({total})</h2>
          <ol className={s.matchList}>
            {propias.map((sim, i) => {
              const pct = Math.round(sim.similitud * 100)
              const otroId = sim.projectId1 === propio.id ? sim.projectId2 : sim.projectId1
              const otro = findProjectById(otroId)
              const seleccionada = sim.id === maxima.id
              return (
                <li key={sim.id}>
                  <Link
                    to={`/aprendiz/detalle-similitud/${sim.id}`}
                    className={`${s.matchRow} ${seleccionada ? s.matchRowSelected : ''}`}
                  >
                    <span className={s.matchRank}>#{i + 1}</span>
                    <span className={s.matchInfo}>
                      <span className={s.matchTitle}>{otro?.title || 'Proyecto no disponible'}</span>
                      <span className={s.matchMeta}>
                        <User size={12} /> {otro?.studentName || sim.project2Student}
                        <CalendarBlank size={12} /> {sim.createdAt}
                      </span>
                    </span>
                    <span className={s.matchRight}>
                      <span
                        className={`${s.matchPct} ${
                          pct >= 70 ? s.matchPctHigh : pct >= 40 ? s.matchPctMid : s.matchPctLow
                        }`}
                      >
                        {pct}%
                      </span>
                      <CaretRight size={16} className={s.matchChevron} />
                    </span>
                  </Link>
                </li>
              )
            })}
          </ol>
        </section>

        <section className={s.recoPanel} aria-labelledby="reco-title">
          <h2 id="reco-title" className={s.sectionTitle}>
            <PushPin size={14} /> Recomendaciones
          </h2>
          <ul className={s.recoList}>
            {recomendaciones.map((r) => (
              <li key={r} className={s.recoItem}>
                {r}
              </li>
            ))}
          </ul>
        </section>

        <Actions align="center" wrap>
          <Button as="link" to="/aprendiz/propuestas">
            <ArrowLeft size={14} /> Volver a mis proyectos
          </Button>
          <Button as="link" to={`/aprendiz/detalle-proyecto/${propio.id}`} variant="secondary">
            Ver mi proyecto <ArrowRight size={14} />
          </Button>
        </Actions>
      </div>
    </DashboardLayout>
  )
}
