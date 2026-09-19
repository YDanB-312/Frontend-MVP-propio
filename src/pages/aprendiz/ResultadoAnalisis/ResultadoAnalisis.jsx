import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CalendarBlank, CaretRight, CheckCircle, MagnifyingGlass, PushPin, User } from 'phosphor-react'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import Actions from '../../../components/Actions/Actions'
import Button from '../../../components/Button/Button'
import EmptyState from '../../../components/EmptyState/EmptyState'
import ApiState from '../../../components/ApiState/ApiState'
import SectionHeader from '../../../components/SectionHeader/SectionHeader'
import ConsoleCard from '../../../components/ConsoleCard/ConsoleCard'
import ScoreDial from '../../../components/ScoreDial/ScoreDial'
import GradeBadge from '../../../components/GradeBadge/GradeBadge'
import { useAuth } from '../../../contexts/AuthContext'
import { useApi } from '../../../lib/useApi'
import { proyectos, similitudes as similitudesApi } from '../../../lib/recursos'
import { formatearFecha } from '../../../utils/helpers'
import s from './ResultadoAnalisis.module.css'

const INCLUDE_PROYECTOS = 'creator,instructor.generalUser,classGroup.program,classGroup.trainingCenter,apprentices.generalUser'

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

export default function ResultadoAnalisis() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [animado, setAnimado] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setAnimado(true), 100)
    return () => clearTimeout(t)
  }, [])

  // Propuestas y similitudes: fuente única la API.
  const { data: proyectosApi, cargando: cargandoProy, error: errorProy, recargar: recargarProy } = useApi(
    () => proyectos.listar({ included: INCLUDE_PROYECTOS }),
    [],
    { inicial: [] }
  )
  const { data: similitudesApiData, cargando: cargandoSim, error: errorSim, recargar: recargarSim } = useApi(
    () => similitudesApi.listar(),
    [],
    { inicial: [] }
  )

  const cargando = cargandoProy || cargandoSim
  const error = errorProy || errorSim
  const recargar = () => { recargarProy(); recargarSim() }

  const paramProyecto = searchParams.get('projectId')
  const paramSimilitud = searchParams.get('similitudId')
  const projectId = paramProyecto ? Number(paramProyecto) : null
  const similitudId = paramSimilitud ? Number(paramSimilitud) : null

  const { base, propias, seleccionada } = useMemo(() => {
    const mapa = new Map(proyectosApi.map((p) => [Number(p.id), p]))
    let propio = null

    if (projectId) {
      propio = mapa.get(projectId) || null
    } else if (similitudId) {
      const sim = similitudesApiData.find((x) => Number(x.id) === similitudId)
      if (sim) {
        const p1 = mapa.get(Number(sim.id_proyecto_1))
        const p2 = mapa.get(Number(sim.id_proyecto_2))
        propio = [p1, p2].find((p) => p && esMia(p, user.id)) || p1
      }
    }

    if (!propio) return { base: null, propias: [], seleccionada: null }

    const lista = similitudesApiData
      .filter((x) => Number(x.id_proyecto_1) === Number(propio.id) || Number(x.id_proyecto_2) === Number(propio.id))
      .sort((a, b) => Number(b.porcentaje) - Number(a.porcentaje))

    return {
      base: propio,
      propias: lista,
      seleccionada: similitudId ? lista.find((x) => Number(x.id) === similitudId) || null : null,
    }
  }, [proyectosApi, similitudesApiData, projectId, similitudId, user.id])

  if (cargando) {
    return (
      <DashboardLayout role="aprendiz" titulo="Resultado del Análisis">
        <div className={s.wrapper}><ApiState cargando /></div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout role="aprendiz" titulo="Resultado del Análisis">
        <div className={s.wrapper}><ApiState error={error} onReintentar={recargar} /></div>
      </DashboardLayout>
    )
  }

  if (!base) {
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

  if (!esMia(base, user.id)) {
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
            message={`Buenas noticias: "${base.titulo}" no presenta similitudes con ningún otro proyecto de la base de datos.`}
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
  const pctMax = Math.round(Number(maxima.porcentaje) || 0)
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
            {base.titulo} · {total} coincidencia{total !== 1 ? 's' : ''} detectada{total !== 1 ? 's' : ''}
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
              const pct = Math.round(Number(sim.porcentaje) || 0)
              const otroId = Number(sim.id_proyecto_1) === Number(base.id) ? sim.id_proyecto_2 : sim.id_proyecto_1
              const otro = proyectosApi.find((p) => Number(p.id) === Number(otroId))
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
                      <span className={s.matchTitle}>{otro?.titulo || 'Proyecto no disponible'}</span>
                      <span className={s.matchMeta}>
                        <User size={12} /> {nombreUsuario(otro?.creator)}
                        <CalendarBlank size={12} /> {formatearFecha(sim.fecha)}
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
          <Button as="link" to={`/aprendiz/detalle-proyecto/${base.id}`} variant="secondary" viewTransition>
            Ver mi proyecto <ArrowRight size={14} />
          </Button>
        </Actions>
      </div>
    </DashboardLayout>
  )
}
