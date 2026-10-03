import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import Alert from '../../../components/Alert/Alert'
import Button from '../../../components/Button/Button'
import s from './AnalizandoProyecto.module.css'
import { Brain, CheckCircle, Circle, CircleDashed, Lightbulb, WarningCircle } from 'phosphor-react'
import { similitudes as similitudesApi } from '../../../lib/recursos'

const PASOS = [
  'Obteniendo el contenido de la propuesta...',
  'Comparando con proyectos de la base de datos...',
  'Calculando porcentajes de similitud...',
  'Generando recomendaciones...',
]

// Progreso por fase real del ciclo de la petición (no un porcentaje inventado).
const PROGRESO_FASE = [15, 50, 85, 100]

const TIPS = [
  'Los proyectos con descripciones detalladas obtienen análisis más precisos.',
  'Cita siempre las fuentes que usaste en tu documentación.',
  'Puedes ver el detalle de cada similitud desde tu proyecto.',
  'Un porcentaje bajo no garantiza originalidad: revisa las coincidencias.',
  'Actualiza tus palabras clave para mejorar las comparaciones futuras.',
]

export default function AnalizandoProyecto() {
  const location = useLocation()
  const navigate = useNavigate()
  const projectId = location.state?.projectId
  const equipoFallidos = location.state?.equipoFallidos || []

  // Fase real: 0 enviado · 1 comparando (request en vuelo) · 2 generando
  // (respuesta recibida) · 3 listo (navegación al resultado).
  const [fase, setFase] = useState(0)
  const [tipIndex, setTipIndex] = useState(0)
  const [estado, setEstado] = useState('analizando') // 'analizando' | 'error'
  const [error, setError] = useState('')
  const [intento, setIntento] = useState(0)
  const navigateRef = useRef(false)

  // Tips rotando mientras se analiza.
  useEffect(() => {
    const tipsTimer = setInterval(() => {
      setTipIndex((i) => (i + 1) % TIPS.length)
    }, 1800)
    return () => clearInterval(tipsTimer)
  }, [])

  // Análisis real: el motor se ejecuta en el servidor y la fase sigue su ciclo.
  useEffect(() => {
    if (!projectId) {
      navigate('/aprendiz/propuestas', { replace: true })
      return
    }
    let vivo = true
    navigateRef.current = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reinicio de fases al (re)intentar
    setFase(0)
    setEstado('analizando')

    // Da un instante visible a la fase inicial antes de marcar "comparando".
    const aComparar = setTimeout(() => { if (vivo) setFase(1) }, 350)

    similitudesApi.detectar(projectId)
      .then(() => {
        if (!vivo) return
        setFase(2)
      })
      .catch((err) => {
        if (!vivo) return
        setEstado('error')
        setError(err?.data?.message || 'No se pudo completar el análisis. Intenta de nuevo.')
      })

    return () => {
      vivo = false
      clearTimeout(aComparar)
    }
  }, [projectId, intento, navigate])

  // Con la respuesta lista, se cierra la última fase y se navega al resultado.
  useEffect(() => {
    if (fase < 2 || navigateRef.current) return
    const aListo = setTimeout(() => setFase(3), 450)
    return () => clearTimeout(aListo)
  }, [fase])

  useEffect(() => {
    if (fase < 3 || navigateRef.current) return
    navigateRef.current = true
    const salida = setTimeout(
      () => navigate(`/aprendiz/resultado-analisis?projectId=${projectId}`, { replace: true }),
      400
    )
    return () => clearTimeout(salida)
  }, [fase, projectId, navigate])

  const progreso = PROGRESO_FASE[fase] ?? 15
  const pasoActual = fase

  if (estado === 'error') {
    return (
      <DashboardLayout role="aprendiz" titulo="Analizando Proyecto">
        <div className={s.wrapper}>
          <section className={s.card} aria-live="polite">
            <span className={s.errorIcon} aria-hidden="true"><WarningCircle size={40} /></span>
            <h1 className={s.title}>No se pudo analizar la propuesta</h1>
            <p className={s.subtitle}>{error}</p>
            <div className={s.acciones}>
              <Button
                type="button"
                onClick={() => {
                  navigateRef.current = false
                  setFase(0)
                  setEstado('analizando')
                  setError('')
                  setIntento((n) => n + 1)
                }}
              >
                Reintentar análisis
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/aprendiz/propuestas', { replace: true })}>
                Volver a mis propuestas
              </Button>
            </div>
          </section>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="aprendiz" titulo="Analizando Proyecto">
      <div className={s.wrapper}>
        <section className={s.card}>
          <div className={s.ringWrap}>
            <svg className={s.ring} viewBox="0 0 120 120" aria-hidden="true">
              <circle className={s.ringBg} cx="60" cy="60" r="52" />
              <circle
                className={s.ringFg}
                cx="60"
                cy="60"
                r="52"
                strokeDasharray={2 * Math.PI * 52}
                strokeDashoffset={2 * Math.PI * 52 * (1 - progreso / 100)}
              />
            </svg>
            <span className={s.pct}>{progreso}%</span>
            <span className={`${s.brain} ${fase < 3 ? s.pulse : ''}`} aria-hidden="true"><Brain size={22} /></span>
          </div>

          <h1 className={s.title}>Analizando propuesta...</h1>
          {/* Se anuncia solo el hito (fase), no un porcentaje animado. */}
          <p className="sr-only" aria-live="polite">{PASOS[pasoActual]}</p>
          <p className={s.subtitle}>
            ProyecTwin está comparando tu propuesta con la base de datos académica. Este proceso toma solo unos
            segundos.
          </p>

          {equipoFallidos.length > 0 && (
            <Alert variant="warning">
              La propuesta se creó, pero no se pudieron vincular {equipoFallidos.length} integrante(s) del equipo.
              Puedes agregarlos luego desde el detalle de la propuesta.
            </Alert>
          )}

          <ol className={s.steps}>
            {PASOS.map((paso, i) => (
              <li
                key={paso}
                className={`${s.step} ${i < pasoActual ? s.done : ''} ${i === pasoActual ? s.current : ''}`}
              >
                <span className={s.stepIcon} aria-hidden="true">
                  {i < pasoActual ? <CheckCircle size={16} /> : i === pasoActual ? <CircleDashed size={16} /> : <Circle size={16} />}
                </span>
                {paso}
              </li>
            ))}
          </ol>

          <aside className={s.tipBox} key={tipIndex}><Lightbulb size={22} /><strong>Tip:</strong> {TIPS[tipIndex]}
          </aside>
        </section>
      </div>
    </DashboardLayout>
  )
}
