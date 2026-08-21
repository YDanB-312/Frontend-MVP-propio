import s from './FormField.module.css'

export default function FormField({ label, error, help, required, children, className = '' }) {
  return (
    <div className={`${s.field} ${error ? s.hasError : ''} ${className}`}>
      {label && (
        <label className={s.label}>
          {label}
          {required && <span className={s.required} aria-hidden="true"> *</span>}
        </label>
      )}
      <div className={s.control}>{children}</div>
      {error ? (
        <p className={s.error} role="alert">⚠ {error}</p>
      ) : help ? (
        <p className={s.help}>{help}</p>
      ) : null}
    </div>
  )
}
