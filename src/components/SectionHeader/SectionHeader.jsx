import s from './SectionHeader.module.css'

// Encabezado de sección estilo canirun: título + conteo + acciones.
export default function SectionHeader({ title, count, hint, actions, className = '' }) {
  return (
    <div className={`${s.row} ${className}`}>
      <div className={s.titles}>
        <h2 className={s.title}>{title}</h2>
        {count != null ? <span className={`mono ${s.count}`}>{count}</span> : null}
        {hint ? <span className={s.hint}>{hint}</span> : null}
      </div>
      {actions ? <div className={s.actions}>{actions}</div> : null}
    </div>
  )
}
