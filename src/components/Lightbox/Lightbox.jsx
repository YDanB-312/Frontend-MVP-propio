import { useEffect, useRef } from 'react'
import { X } from 'phosphor-react'
import s from './Lightbox.module.css'

export default function Lightbox({ src, alt = '', caption, onClose }) {
  const closeRef = useRef(null)
  const lastFocus = useRef(null)

  useEffect(() => {
    lastFocus.current = document.activeElement
    document.body.style.overflow = 'hidden'
    const foco = setTimeout(() => closeRef.current?.focus(), 0)
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      clearTimeout(foco)
      window.removeEventListener('keydown', onKey)
      if (lastFocus.current instanceof HTMLElement) lastFocus.current.focus()
    }
  }, [onClose])

  return (
    <div className={s.lightbox} role="dialog" aria-modal="true" aria-label={alt || 'Vista de imagen'} onClick={onClose}>
      <button
        type="button"
        ref={closeRef}
        className={s.close}
        aria-label="Cerrar visor"
        onClick={onClose}
      >
        <X size={20} />
      </button>
      <figure className={s.fig} onClick={(e) => e.stopPropagation()}>
        <img src={src} alt={alt} className={s.img} />
        {caption && <figcaption className={s.caption}>{caption}</figcaption>}
      </figure>
    </div>
  )
}
