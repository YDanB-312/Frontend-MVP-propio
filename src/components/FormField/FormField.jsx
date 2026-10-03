import { useId } from 'react'
import { cloneElement, isValidElement } from 'react'
import s from './FormField.module.css'

export default function FormField({ label, error, help, required, children, className = '' }) {
  const id = useId()
  const errorId = `${id}-error`
  const helpId = `${id}-help`

  // El control recibe id, required y los enlaces ARIA al error/ayuda: sin esto
  // el mensaje no se anuncia junto al campo (WCAG 3.3.1 y 4.1.3).
  const control = isValidElement(children)
    ? cloneElement(children, {
        id,
        required,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': error ? errorId : help ? helpId : undefined,
      })
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
        <p id={errorId} className={s.error} role="alert">⚠ {error}</p>
      ) : help ? (
        <p id={helpId} className={s.help}>{help}</p>
      ) : null}
    </div>
  )
}
