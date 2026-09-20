import { Link } from 'react-router-dom'
import CountUp from '../CountUp/CountUp'
import s from './QueueTile.module.css'

export function QueueGrid({ children, className = '' }) {
  return <div className={`${s.grid} ${className}`}>{children}</div>
}

export default function QueueTile({ to, icon, eyebrow, value, total, title, meta, accent = 'primary', className = '' }) {
  const Comp = to ? Link : 'div'
  return (
    <Comp {...(to ? { to } : {})} className={`${s.tile} ${s[accent] || s.primary} ${className}`}>
      {icon ? <span className={s.icon} aria-hidden="true">{icon}</span> : null}
      <span className={s.main}>
        {eyebrow ? <span className={`mono ${s.eyebrow}`}>{eyebrow}</span> : null}
        {value != null ? (
          <span className={`mono ${s.value}`}>
            <CountUp value={value} />
            {total != null ? <span className={s.total}>/{total}</span> : null}
          </span>
        ) : null}
        <span className={s.title}>{title}</span>
        {meta ? <span className={s.meta}>{meta}</span> : null}
      </span>
    </Comp>
  )
}
