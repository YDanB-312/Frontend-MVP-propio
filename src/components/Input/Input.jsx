import s from './Input.module.css'

export function Input({ className = '', error, ...props }) {
  return <input className={`${s.input} ${error ? s.inputError : ''} ${className}`} {...props} />
}

export function Textarea({ className = '', error, ...props }) {
  return <textarea className={`${s.input} ${s.textarea} ${error ? s.inputError : ''} ${className}`} {...props} />
}

export function Select({ className = '', error, children, ...props }) {
  return (
    <select className={`${s.input} ${s.select} ${error ? s.inputError : ''} ${className}`} {...props}>
      {children}
    </select>
  )
}
