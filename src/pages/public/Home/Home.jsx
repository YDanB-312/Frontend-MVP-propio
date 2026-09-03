import { Brain, FolderOpen, ChartBar, CheckCircle } from 'phosphor-react'
import LandingLayout from '../../../layouts/LandingLayout/LandingLayout'
import Button from '../../../components/Button/Button'
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

export default function Home() {
  return (
    <LandingLayout>
      <main className={s.wrapper}>
        <section className={s.hero}>
          <div className={s.heroInner}>
            <span className={s.heroBadge}>Plataforma académica · SENA</span>
            <h1 className={s.title}>
              Proyec<span className={s.titleAccent}>Twin</span>
            </h1>
            <p className={s.subtitle}>
              Sistema inteligente de detección de plagio para proyectos de formación. Compara, analiza y protege la
              originalidad del trabajo de los aprendices en toda la institución.
            </p>
            <div className={s.ctaRow}>
              <Button as="link" to="/login" variant="secondary">
                Iniciar Sesión
              </Button>
              <Button as="link" to="/register">
                Crear Cuenta
              </Button>
            </div>
            <ul className={s.heroPoints}>
              <li><CheckCircle size={16} weight="fill" /> Detección automática de similitud</li>
              <li><CheckCircle size={16} weight="fill" /> Propuestas organizadas por ficha</li>
              <li><CheckCircle size={16} weight="fill" /> Reportes claros para instructores</li>
            </ul>
          </div>
          <div className={`${s.blob} ${s.blobOne}`} aria-hidden="true" />
          <div className={`${s.blob} ${s.blobTwo}`} aria-hidden="true" />
        </section>

        <section className={s.section} aria-labelledby="features-title">
          <div className={s.sectionInner}>
            <span className={s.sectionTag}>Características</span>
            <h2 id="features-title" className={s.sectionTitle}>
              Todo lo que necesitas para cuidar la originalidad
            </h2>
            <p className={s.sectionSubtitle}>
              Herramientas pensadas para aprendices, instructores y administradores del SENA.
            </p>
            <div className={s.grid}>
              {FEATURES.map((f) => (
                <article key={f.title} className={s.card}>
                  <span className={s.cardIcon} aria-hidden="true">
                    {f.icon}
                  </span>
                  <h3 className={s.cardTitle}>{f.title}</h3>
                  <p className={s.cardText}>{f.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={`${s.section} ${s.sectionAlt}`} aria-labelledby="como-title">
          <div className={s.sectionInner}>
            <span className={s.sectionTag}>Cómo funciona</span>
            <h2 id="como-title" className={s.sectionTitle}>
              Tres pasos para empezar
            </h2>
            <ol className={s.steps}>
              {PASOS.map((p) => (
                <li key={p.numero} className={s.step}>
                  <span className={s.stepNumber}>{p.numero}</span>
                  <h3 className={s.stepTitle}>{p.title}</h3>
                  <p className={s.stepText}>{p.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className={s.ctaSection} aria-labelledby="cta-title">
          <div className={s.ctaInner}>
            <h2 id="cta-title" className={s.ctaTitle}>
              ¿Listo para proteger la originalidad?
            </h2>
            <Button as="link" to="/register">
              Crear Cuenta
            </Button>
          </div>
        </section>
      </main>
    </LandingLayout>
  )
}
