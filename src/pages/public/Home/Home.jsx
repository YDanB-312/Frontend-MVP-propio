import { useEffect, useState } from 'react'
import { Brain, FolderOpen, ChartBar, CheckCircle, MagnifyingGlass, Database, Gauge } from 'phosphor-react'
import LandingLayout from '../../../layouts/LandingLayout/LandingLayout'
import SectionHeader from '../../../components/SectionHeader/SectionHeader'
import ConsoleCard from '../../../components/ConsoleCard/ConsoleCard'
import StatChip from '../../../components/StatChip/StatChip'
import GradeBadge from '../../../components/GradeBadge/GradeBadge'
import GradualBlur from '../../../components/GradualBlur/GradualBlur'
import TextType from '../../../components/TextType/TextType'
import { useApi } from '../../../lib/useApi'
import { demo } from '../../../lib/recursos'
import s from './Home.module.css'

const FEATURES = [
  {
    icon: <Brain size={28} weight="light" />,
    title: 'Detección IA',
    description:
      'Algoritmos de inteligencia artificial comparan los proyectos entre sí y calculan su porcentaje de similitud de forma automática.',
  },
  {
    icon: <FolderOpen size={28} weight="light" />,
    title: 'Análisis de Fichas',
    description:
      'Organiza los proyectos por ficha de formación, consulta los integrantes y sigue el avance de cada propuesta académica.',
  },
  {
    icon: <ChartBar size={28} weight="light" />,
    title: 'Reportes',
    description:
      'Informes claros y detallados para instructores y administradores, con observaciones, estados y niveles de similitud.',
  },
]

const PASOS = [
  {
    numero: '01',
    title: 'Crea tu cuenta',
    description: 'Regístrate como aprendiz o instructor con tu correo electrónico en menos de un minuto.',
  },
  {
    numero: '02',
    title: 'Registra tu proyecto',
    description: 'Describe tu propuesta, agrega palabras clave y únete a tu ficha de formación con su código único.',
  },
  {
    numero: '03',
    title: 'Recibe el análisis',
    description: 'ProyecTwin compara tu propuesta con la base de datos y te muestra el nivel de similitud con recomendaciones.',
  },
]

const UMBRAL_DEMO = 3

export default function Home() {
  // Resumen público (config del motor + conteos agregados) para los chips.
  const { data: resumen } = useApi(() => demo.resumen(), [])
  const umbralPct = resumen ? Math.round(Number(resumen.umbral) * 100) : null
  const meses = resumen?.meses ?? null

  /* ---------- Demo en vivo: escribe una idea y el motor la compara ---------- */
  const [ideaViva, setIdeaViva] = useState('')
  const [ideaEstable, setIdeaEstable] = useState('')
  const [resultado, setResultado] = useState(null)
  const [comparando, setComparando] = useState(false)
  const [errorDemo, setErrorDemo] = useState(false)

  // Debounce: la idea se estabiliza a los 350 ms (evita consultar por tecla).
  useEffect(() => {
    const t = setTimeout(() => setIdeaEstable(ideaViva), 350)
    return () => clearTimeout(t)
  }, [ideaViva])

  // Consulta al motor del backend cuando la idea tiene largo suficiente.
  // Si es más corta, el render muestra "esperando" y no se toca el estado.
  useEffect(() => {
    const q = ideaEstable.trim()
    if (q.length < UMBRAL_DEMO) return () => {}
    let vivo = true
    // Los cambios de estado se difieren a microtarea para no mutar en el
    // cuerpo del efecto (misma pauta que useApi).
    Promise.resolve()
      .then(() => { if (vivo) { setComparando(true); setErrorDemo(false) } })
      .then(() => demo.comparar(q))
      .then((r) => { if (vivo) setResultado(r) })
      .catch(() => { if (vivo) { setResultado(null); setErrorDemo(true) } })
      .finally(() => { if (vivo) setComparando(false) })
    return () => { vivo = false }
  }, [ideaEstable])

  const listo = ideaEstable.trim().length >= UMBRAL_DEMO

  return (
    <LandingLayout>
      <div className={s.wrapper}>
        <section className={`fx-grid-bg ${s.hero}`}>
          <div className={s.heroInner}>
            <span className={`mono ${s.heroBadge} fx-rise`} style={{ '--fx-i': 0 }}>
              <span className={s.liveDot} aria-hidden="true" />
              MOTOR · TF-IDF + N-GRAMAS
            </span>
            <h1 className={`${s.title} fx-rise`} style={{ '--fx-i': 1 }}>
              ¿Tu propuesta <span className={s.titleAccent}>es original?</span>
            </h1>
            <p className={`${s.subtitle} fx-rise`} style={{ '--fx-i': 2 }}>
              Sistema inteligente de detección de plagio para proyectos de formación. Compara, analiza y protege la
              originalidad del trabajo de los aprendices en toda la institución.
            </p>
            <div className={`${s.stats} fx-rise`} style={{ '--fx-i': 3 }}>
              <StatChip icon={<Database size={14} />} label="Propuestas" value={resumen ? resumen.total_propuestas : '—'} />
              <StatChip icon={<Gauge size={14} />} label="Programas" value={resumen ? resumen.total_programas : '—'} />
              <StatChip icon={<MagnifyingGlass size={14} />} label="Umbral" value={umbralPct != null ? `${umbralPct}%` : '—'} />
            </div>
            <ul className={`${s.heroPoints} fx-rise`} style={{ '--fx-i': 4 }}>
              <li><CheckCircle size={16} weight="fill" /> Detección automática de similitud</li>
              <li><CheckCircle size={16} weight="fill" /> Propuestas organizadas por ficha</li>
              <li><CheckCircle size={16} weight="fill" /> Reportes claros para instructores</li>
            </ul>
          </div>

          <div className={s.terminal}>
            <div className={s.termBar}>
              <span className={`${s.termDot} ${s.termDot1}`} aria-hidden="true" />
              <span className={`${s.termDot} ${s.termDot2}`} aria-hidden="true" />
              <span className={`${s.termDot} ${s.termDot3}`} aria-hidden="true" />
              <span className={`mono ${s.termTitle}`}>proyectwin · demo en vivo</span>
            </div>
            <div className={s.termBody}>
              <p className={`mono ${s.termLine}`}>
                <span aria-hidden="true">$&nbsp;</span>
                <TextType
                  key={`${meses}-${umbralPct}`}
                  className={`mono ${s.termType}`}
                  text={`comparar --corpus ${meses ?? '—'}m --umbral ${umbralPct ?? '—'}%`}
                  speed={45}
                  startDelay={200}
                  cursor
                  respectReducedMotion={false}
                />
              </p>

              <label className={`mono ${s.termLabel}`} htmlFor="demo-idea">
                Escribe tu idea y mira al motor trabajar:
              </label>
              <input
                id="demo-idea"
                className={`mono ${s.termInput}`}
                value={ideaViva}
                onChange={(e) => setIdeaViva(e.target.value)}
                placeholder="Ej: tienda virtual de artesanías…"
                maxLength={120}
                autoComplete="off"
                spellCheck="false"
              />

              <div aria-live="polite" aria-atomic="true">
                <span className="sr-only">
                  {!listo
                    ? `Esperando una idea de al menos ${UMBRAL_DEMO} letras`
                    : comparando
                      ? 'Analizando la idea con el motor'
                      : errorDemo
                        ? 'No se pudo consultar el motor'
                        : resultado
                          ? `${resultado.coincidencias.length} coincidencias, ${resultado.sobre} sobre el umbral de ${umbralPct}%`
                          : 'Sin resultados'}
                </span>

                {!listo ? (
                  <p className={`mono ${s.termHint}`} aria-hidden="true">
                    <span className={s.caret} aria-hidden="true">▊</span> esperando idea (mín. {UMBRAL_DEMO} letras)…
                  </p>
                ) : errorDemo ? (
                  <p className={`mono ${s.termHint}`} aria-hidden="true">
                    <span className={s.caret} aria-hidden="true">▊</span> no se pudo consultar el motor. Intenta de nuevo.
                  </p>
                ) : comparando || !resultado ? (
                  <p className={`mono ${s.termHint}`} aria-hidden="true">
                    <span className={s.caret} aria-hidden="true">▊</span> analizando…
                  </p>
                ) : (
                  <div className={s.termResults} aria-hidden="true">
                    {resultado.coincidencias.map((r, i) => (
                      <div key={r.id} className={`${s.termMatch} fx-rise`} style={{ '--fx-i': i }}>
                        <span className={`mono ${s.termPair}`}>{r.titulo}</span>
                        <GradeBadge score={r.porcentaje} size="sm" />
                      </div>
                    ))}
                    <p className={`mono ${s.termLine}`}>
                      <span className={s.caret} aria-hidden="true">▊</span> {resultado.sobre} sobre el umbral de {umbralPct}%
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className={s.scanbeam} aria-hidden="true" />
          </div>
          <GradualBlur position="bottom" height="4rem" strength={1.4} divCount={4} opacity={0.7} />
        </section>

        <section className={s.section} aria-labelledby="features-title">
          <div className={s.sectionInner}>
            <SectionHeader
              title={<span id="features-title">Todo lo que necesitas para cuidar la originalidad</span>}
              hint="Características"
            />
            <p className={s.sectionSubtitle}>
              Herramientas pensadas para aprendices, instructores y administradores del SENA.
            </p>
            <div className={s.grid}>
              {FEATURES.map((f, i) => (
                <div key={f.title} className="fx-rise" style={{ '--fx-i': i }}>
                  <ConsoleCard title={f.title} className={s.featureCard}>
                    <span className={s.cardIcon} aria-hidden="true">
                      {f.icon}
                    </span>
                    <p className={s.cardText}>{f.description}</p>
                  </ConsoleCard>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={`${s.section} ${s.sectionAlt}`} aria-labelledby="como-title">
          <div className={s.sectionInner}>
            <SectionHeader
              title={<span id="como-title">Tres pasos para empezar</span>}
              hint="Cómo funciona"
            />
            <ol className={s.steps}>
              {PASOS.map((p) => (
                <li key={p.numero} className={s.step}>
                  <span className={`mono ${s.stepNumber}`}>{p.numero}</span>
                  <h3 className={s.stepTitle}>{p.title}</h3>
                  <p className={s.stepText}>{p.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

      </div>
    </LandingLayout>
  )
}
