import s from './DashboardHero.module.css'

export default function DashboardHero({ kicker, title, text, date, chips, actions, children }) {
  return (
    <header className={s.hero}>
      {kicker ? <p className={`mono ${s.kicker}`}>{kicker}</p> : null}
      <div className={s.line}>
        <h1 className={s.title}>{title}</h1>
        {date ? <span className={s.date}>{date}</span> : null}
      </div>
      {text ? <p className={s.text}>{text}</p> : null}
      {chips ? <div className={s.chips}>{chips}</div> : null}
      {actions ? <div className={s.actions}>{actions}</div> : null}
      {children}
    </header>
  )
}
