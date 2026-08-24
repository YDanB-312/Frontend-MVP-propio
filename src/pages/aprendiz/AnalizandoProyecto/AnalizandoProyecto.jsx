import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import s from './AnalizandoProyecto.module.css'
import { Brain, CheckCircle, Circle, CircleDashed, Lightbulb } from 'phosphor-react'

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

export default function AnalizandoProyecto() {
  const location = useLocation()
  const navigate = useNavigate()
  const projectId = location.state?.projectId

  const [progreso, setProgreso] = useState(0)
  const [tipIndex, setTipIndex] = useState(0)
  const navigateRef = useRef(false)

  useEffect(() => {
    const progresoTimer = setInterval(() => {
      setProgreso((p) => Math.min(100, p + INCREMENTO))
    }, DURACION_PASO_MS)

    const tipsTimer = setInterval(() => {
      setTipIndex((i) => (i + 1) % TIPS.length)
    }, 1800)

    return () => {
      clearInterval(progresoTimer)
      clearInterval(tipsTimer)
    }
  }, [])

  useEffect(() => {
    if (progreso >= 100 && !navigateRef.current) {
      navigateRef.current = true
      const destino = projectId
        ? `/aprendiz/resultado-analisis?projectId=${projectId}`
        : '/aprendiz/propuestas'
      const salida = setTimeout(() => navigate(destino, { replace: true }), 600)
      return () => clearTimeout(salida)
    }
  }, [progreso, projectId, navigate])

  const pasoActual = Math.min(PASOS.length - 1, Math.floor(progreso / (100 / PASOS.length)))

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
