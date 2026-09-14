import { X } from 'phosphor-react'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import s from './Lightbox.module.css'

export default function Lightbox({ src, alt = '', caption, onClose }) {
  const ref = useFocusTrap({ active: true, onEscape: onClose })

  return (
    <div ref={ref} className={s.lightbox} role="dialog" aria-modal="true" aria-label={alt || 'Vista de imagen'} onClick={onClose}>
      <button
        type="button"
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
