import s from './Tabs.module.css'

// Pestañas accesibles (role=tablist) para alternar secciones. En el detalle de
// proyecto solo se muestran en móvil; en escritorio se conserva el dossier.
export default function Tabs({ tabs = [], active, onChange, ariaLabel = 'Secciones', className = '' }) {
  return (
    <div className={`${s.tabs} ${className}`} role="tablist" aria-label={ariaLabel}>
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={active === t.id}
          className={`${s.tab} ${active === t.id ? s.active : ''}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
