import { useId } from 'react'
import { cloneElement, isValidElement } from 'react'
import s from './FormField.module.css'

export default function FormField({ label, error, help, required, children, className = '' }) {
  const id = useId()

  const control = isValidElement(children)
    ? cloneElement(children, { id })
    : children

  return (
    <div className={`${s.field} ${error ? s.hasError : ''} ${className}`}>
      {label && (
        <label htmlFor={id} className={s.label}>
          {label}
          {required && <span className={s.required} aria-hidden="true"> *</span>}
        </label>
      )}
      <div className={s.control}>{control}</div>
      {error ? (
        <p className={s.error} role="alert">⚠ {error}</p>
      ) : help ? (
        <p className={s.help}>{help}</p>
      ) : null}
    </div>
  )
}
