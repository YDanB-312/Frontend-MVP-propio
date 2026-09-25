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

const TIPS = [
  'Los proyectos con descripciones detalladas obtienen análisis más precisos.',
  'Cita siempre las fuentes que usaste en tu documentación.',
  'Puedes ver el detalle de cada similitud desde tu proyecto.',
  'Un porcentaje bajo no garantiza originalidad: revisa las coincidencias.',
  'Actualiza tus palabras clave para mejorar las comparaciones futuras.',
]

const DURACION_PASO_MS = 90
const INCREMENTO = 2
const TOPE_ANIMACION = 90

export default function AnalizandoProyecto() {
  const location = useLocation()
  const navigate = useNavigate()
  const projectId = location.state?.projectId
  const equipoFallidos = location.state?.equipoFallidos || []

  const [progreso, setProgreso] = useState(0)
  const [tipIndex, setTipIndex] = useState(0)
  const [estado, setEstado] = useState('analizando') // 'analizando' | 'error'
  const [error, setError] = useState('')
  const [listo, setListo] = useState(false)
  const [intento, setIntento] = useState(0)
  const navigateRef = useRef(false)

  // Animación: avanza hasta el tope y espera al análisis real (no finge el 100%).
  useEffect(() => {
    const progresoTimer = setInterval(() => {
      setProgreso((p) => (p < TOPE_ANIMACION ? Math.min(TOPE_ANIMACION, p + INCREMENTO) : p))
    }, DURACION_PASO_MS)
    const tipsTimer = setInterval(() => {
      setTipIndex((i) => (i + 1) % TIPS.length)
    }, 1800)
    return () => {
      clearInterval(progresoTimer)
      clearInterval(tipsTimer)
    }
  }, [])

  // Análisis real: el motor se ejecuta en el servidor y se espera su resultado.
  useEffect(() => {
    if (!projectId) {
      navigate('/aprendiz/propuestas', { replace: true })
      return
    }
    let vivo = true
    similitudesApi.detectar(projectId)
      .then(() => { if (vivo) setListo(true) })
      .catch((err) => {
        if (!vivo) return
        setEstado('error')
        setError(err?.data?.message || 'No se pudo completar el análisis. Intenta de nuevo.')
      })
    return () => { vivo = false }
  }, [projectId, intento, navigate])

  useEffect(() => {
    if (!listo || navigateRef.current) return
    navigateRef.current = true
    setProgreso(100)
    const salida = setTimeout(
      () => navigate(`/aprendiz/resultado-analisis?projectId=${projectId}`, { replace: true }),
      500
    )
    return () => clearTimeout(salida)
  }, [listo, projectId, navigate])

  const pasoActual = Math.min(PASOS.length - 1, Math.floor(progreso / (100 / PASOS.length)))

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
                  setProgreso(0)
                  setListo(false)
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
        <section className={s.card} aria-live="polite">
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
            <span className={`${s.brain} ${progreso < 100 ? s.pulse : ''}`} aria-hidden="true"><Brain size={22} /></span>
          </div>

          <h1 className={s.title}>Analizando propuesta...</h1>
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
