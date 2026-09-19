import { useState } from 'react'
import { Eye, EyeSlash } from 'phosphor-react'
import s from './Input.module.css'

export function Input({ className = '', error, ...props }) {
  return <input className={`${s.input} ${error ? s.inputError : ''} ${className}`} {...props} />
}

// Campo de contraseña con botón para mostrarla u ocultarla. Cada campo maneja su
// propio estado (no se revelan todos a la vez). El `id` que inyecta FormField
// debe llegar al <input> real para que el <label> siga asociado.
export function PasswordInput({ className = '', error, ...props }) {
  const [visible, setVisible] = useState(false)
  const etiqueta = visible ? 'Ocultar contraseña' : 'Mostrar contraseña'

  return (
    <span className={s.passwordWrap}>
      <input
        className={`${s.input} ${s.withToggle} ${error ? s.inputError : ''} ${className}`}
        type={visible ? 'text' : 'password'}
        {...props}
      />
      <button
        type="button"
        className={s.toggle}
        onClick={() => setVisible((v) => !v)}
        aria-label={etiqueta}
        aria-pressed={visible}
        title={etiqueta}
      >
        {visible ? <EyeSlash size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
      </button>
    </span>
  )
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
