import s from './ConsoleCard.module.css'

// Tarjeta de consola: superficie elevada con header opcional y glow puntual.
export default function ConsoleCard({ title, subtitle, actions, children, glow = false, grid = false, pad = true, className = '', ...rest }) {
  return (
    <section className={`${s.card} ${glow ? s.glow : ''} ${grid ? 'fx-grid-bg' : ''} ${pad ? '' : s.flat} ${className}`} {...rest}>
      {title || actions ? (
        <header className={s.head}>
          <div className={s.titles}>
            {title ? <h3 className={s.title}>{title}</h3> : null}
            {subtitle ? <p className={s.subtitle}>{subtitle}</p> : null}
          </div>
          {actions ? <div className={s.actions}>{actions}</div> : null}
        </header>
      ) : null}
      <div className={s.body}>{children}</div>
    </section>
  )
}
