import { Link } from 'react-router-dom'
import { Brain, FolderOpen, ChartBar } from 'phosphor-react'
import LandingLayout from '../../../layouts/LandingLayout/LandingLayout'
import { CONTACTO as Contacto } from '../../../constants/contacto'
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
    description: 'Regístrate como aprendiz o instructor con tu correo institucional del SENA en menos de un minuto.',
  },
  {
    numero: '02',
    title: 'Registra tu proyecto',
    description: 'Describe tu propuesta, agrega palabras clave y únete a tu ficha de formación con su código único.',
  },
  {
    numero: '03',
    title: 'Recibe el análisis',
    description: 'DetectaIA compara tu proyecto con la base de datos y te muestra el nivel de similitud con recomendaciones.',
  },
]

export default function Home() {
  return (
    <LandingLayout>
      <main className={s.wrapper}>
        <section className={s.hero}>
          <div className={s.heroInner}>
            <span className={s.heroBadge}>Plataforma académica · SENA</span>
            <h1 className={s.title}>DetectaIA</h1>
            <p className={s.subtitle}>
              Sistema inteligente de detección de plagio para proyectos de formación. Compara, analiza y protege la
              originalidad del trabajo de los aprendices en toda la institución.
            </p>
            <div className={s.ctaRow}>
              <Link to="/login" className={`${s.btn} ${s.btnSecondary}`}>
                Iniciar Sesion
              </Link>
              <Link to="/register" className={`${s.btn} ${s.btnPrimary}`}>
                Crear Cuenta
              </Link>
            </div>
            <dl className={s.heroStats}>
              <div className={s.heroStat}>
                <dt>Proyectos analizados</dt>
                <dd>+500</dd>
              </div>
              <div className={s.heroStat}>
                <dt>Fichas activas</dt>
                <dd>+40</dd>
              </div>
              <div className={s.heroStat}>
                <dt>Precisión de detección</dt>
                <dd>98%</dd>
              </div>
            </dl>
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

        <section className={s.section} aria-labelledby="cta-title">
          <div className={s.sectionInner}>
            <div className={s.ctaPanel}>
              <h2 id="cta-title" className={s.ctaTitle}>
                ¿Listo para proteger la originalidad de tus proyectos?
              </h2>
              <p className={s.ctaText}>
                Únete a la comunidad ProyecTwin del SENA y comienza a analizar tus propuestas hoy mismo.
              </p>
              <div className={s.ctaRow}>
                <Link to="/register" className={`${s.btn} ${s.btnLight}`}>
                  Crear Cuenta
                </Link>
                <Link to="/login" className={`${s.btn} ${s.btnOutline}`}>
                  Iniciar Sesion
                </Link>
              </div>
              <p className={s.ctaContact}>
                ¿Dudas? Escríbenos a <strong>{Contacto.email}</strong> o llama al <strong>{Contacto.telefono}</strong>
              </p>
            </div>
          </div>
        </section>
      </main>
    </LandingLayout>
  )
}
