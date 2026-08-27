import s from './Dashboard.module.css'

const fechaHoy = new Intl.DateTimeFormat('es-CO', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
}).format(new Date())

export default function Dashboard({ kicker, titulo, texto, stats, acciones, actividad }) {
  return (
    <div className={s.page}>
      <header className={s.hero}>
        {kicker && <p className={s.kicker}>{kicker}</p>}
        <div className={s.heroLine}>
          <h1 className={s.titulo}>{titulo}</h1>
          <span className={s.fecha}>{fechaHoy}</span>
        </div>
        {texto && <p className={s.texto}>{texto}</p>}
      </header>

      <section className={s.stats} aria-label="Resumen de actividad">
        {stats}
      </section>

      <div className={s.cols}>
        <section className={s.col}>
          {acciones}
        </section>
        <section className={s.col}>
          {actividad}
        </section>
      </div>
    </div>
  )
}
