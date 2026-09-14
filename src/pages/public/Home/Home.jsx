import { useEffect, useMemo, useState } from 'react'
import { Brain, FolderOpen, ChartBar, CheckCircle, MagnifyingGlass, Database, Gauge } from 'phosphor-react'
import LandingLayout from '../../../layouts/LandingLayout/LandingLayout'
import Button from '../../../components/Button/Button'
import SectionHeader from '../../../components/SectionHeader/SectionHeader'
import ConsoleCard from '../../../components/ConsoleCard/ConsoleCard'
import StatChip from '../../../components/StatChip/StatChip'
import GradeBadge from '../../../components/GradeBadge/GradeBadge'
import { getAllProjects, getConfigMotor } from '../../../data/mockData'
import { vectorDeProyecto, construirIdf, similitudEntre } from '../../../data/similitud'
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
  const motor = getConfigMotor()
  const proyectos = useMemo(() => getAllProjects(), [])
  const totalProyectos = proyectos.length
  const umbralPct = Math.round(motor.umbral * 100)

  const [ideaViva, setIdeaViva] = useState('')
  const [ideaEstable, setIdeaEstable] = useState('')

  // El lector anuncia solo cuando la idea se estabiliza (sin spam por tecla)
  useEffect(() => {
    const t = setTimeout(() => setIdeaEstable(ideaViva), 350)
    return () => clearTimeout(t)
  }, [ideaViva])

  const vectoresCorpus = useMemo(() => proyectos.map(vectorDeProyecto), [proyectos])
  const idfCorpus = useMemo(() => construirIdf(vectoresCorpus), [vectoresCorpus])

  const demo = useMemo(() => {
    const q = ideaEstable.trim()
    if (q.length < UMBRAL_DEMO) return null
    const vecSonda = vectorDeProyecto({ title: q })
    const ranked = proyectos
      .map((p, i) => ({ proyecto: p, pct: Math.round(similitudEntre(vecSonda, vectoresCorpus[i], idfCorpus) * 100) }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 3)
    return {
      top: ranked,
      sobre: ranked.filter((r) => r.pct >= umbralPct).length,
    }
  }, [ideaEstable, proyectos, vectoresCorpus, idfCorpus, umbralPct])

  return (
    <LandingLayout>
      <div className={s.wrapper}>
        <section className={`fx-grid-bg ${s.hero}`}>
          <div className={s.heroInner}>
            <span className={`mono ${s.heroBadge} fx-rise`} style={{ '--fx-i': 0 }}>
              <span className={s.liveDot} aria-hidden="true" />
              MOTOR v2 · TF-IDF + COSENO
            </span>
            <h1 className={`${s.title} fx-rise`} style={{ '--fx-i': 1 }}>
              ¿Tu propuesta <span className={s.titleAccent}>es original?</span>
            </h1>
            <p className={`${s.subtitle} fx-rise`} style={{ '--fx-i': 2 }}>
              Sistema inteligente de detección de plagio para proyectos de formación. Compara, analiza y protege la
              originalidad del trabajo de los aprendices en toda la institución.
            </p>
            <div className={`${s.stats} fx-rise`} style={{ '--fx-i': 3 }}>
              <StatChip icon={<Database size={14} />} label="Propuestas" value={totalProyectos} />
              <StatChip icon={<Gauge size={14} />} label="Umbral" value={`${Math.round(motor.umbral * 100)}%`} />
              <StatChip icon={<MagnifyingGlass size={14} />} label="Corpus" value={`${motor.meses}M`} />
            </div>
            <div className={`${s.ctaRow} fx-rise`} style={{ '--fx-i': 4 }}>
              <Button as="link" to="/login" variant="secondary" viewTransition>
                Iniciar Sesión
              </Button>
              <Button as="link" to="/register" viewTransition>
                Crear Cuenta
              </Button>
            </div>
            <ul className={`${s.heroPoints} fx-rise`} style={{ '--fx-i': 5 }}>
              <li><CheckCircle size={16} weight="fill" /> Detección automática de similitud</li>
              <li><CheckCircle size={16} weight="fill" /> Propuestas organizadas por ficha</li>
              <li><CheckCircle size={16} weight="fill" /> Reportes claros para instructores</li>
            </ul>
          </div>
          <div className={s.terminal}>
            <div className={s.termBar}>
              <span className={s.termDot} />
              <span className={s.termDot} />
              <span className={s.termDot} />
              <span className={`mono ${s.termTitle}`}>proyectwin · demo en vivo</span>
            </div>
            <div className={s.termBody}>
              <p className={`mono ${s.termLine}`}>
                <span aria-hidden="true">$&nbsp;</span>
                <span className={s.termType}>comparar --corpus {motor.meses}m --umbral {umbralPct}%</span>
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
                  {demo
                    ? `${demo.top.length} coincidencias, ${demo.sobre} sobre el umbral de ${umbralPct}%`
                    : 'Esperando una idea de al menos 3 letras'}
                </span>
                {!demo ? (
                  <p className={`mono ${s.termHint}`} aria-hidden="true">
                    <span className={s.caret} aria-hidden="true">▊</span> esperando idea (mín. {UMBRAL_DEMO} letras)…
                  </p>
                ) : (
                  <div aria-hidden="true">
                    {demo.top.map((r, i) => (
                      <div key={r.proyecto.id} className={`${s.termMatch} fx-rise`} style={{ '--fx-i': i }}>
                        <span className={`mono ${s.termPair}`}>{r.proyecto.title}</span>
                        <GradeBadge score={r.pct} size="sm" />
                      </div>
                    ))}
                    <p className={`mono ${s.termLine}`}>
                      <span className={s.caret} aria-hidden="true">▊</span> {demo.sobre} sobre el umbral de {umbralPct}%
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className={s.scanbeam} aria-hidden="true" />
          </div>
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

        <section className={s.ctaSection} aria-labelledby="cta-title">
          <ConsoleCard glow className={s.ctaCard}>
            <h2 id="cta-title" className={s.ctaTitle}>
              ¿Listo para proteger la originalidad?
            </h2>
            <Button as="link" to="/register" viewTransition>
              Crear Cuenta
            </Button>
          </ConsoleCard>
        </section>
      </div>
    </LandingLayout>
  )
}
