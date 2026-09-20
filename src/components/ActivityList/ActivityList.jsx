import { Link } from 'react-router-dom'
import s from './ActivityList.module.css'

export default function ActivityList({ items = [], variant = 'plain', accent = 'primary', empty = null }) {
  if (items.length === 0) return empty

  return (
    <ul className={variant === 'card' ? s.cards : s.list}>
      {items.map((item, index) => {
        const Comp = item.to ? Link : 'div'
        const rowClass = variant === 'card' ? `${s.card} ${s[accent] || s.primary}` : s.row
        return (
          <li key={item.key ?? index}>
            <Comp {...(item.to ? { to: item.to } : {})} className={rowClass}>
              {item.ordinal != null ? (
                <span className={`mono ${s.ordinal}`}>{String(item.ordinal).padStart(2, '0')}</span>
              ) : null}
              <span className={s.main}>
                <span className={s.title}>{item.title}</span>
                {item.meta ? <span className={s.meta}>{item.meta}</span> : null}
              </span>
              {item.side ? <span className={s.side}>{item.side}</span> : null}
            </Comp>
          </li>
        )
      })}
    </ul>
  )
}
