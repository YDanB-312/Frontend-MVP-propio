import { useEffect } from 'react'
import Actions from '../Actions/Actions'
import Button from '../Button/Button'
import s from './ConfirmModal.module.css'

export default function ConfirmModal({
  open,
  titulo = '¿Estás seguro?',
  mensaje,
  onConfirmar,
  onCancelar,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onCancelar?.()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onCancelar])

  if (!open) return null

  return (
    <div className={s.overlay} onClick={onCancelar} role="presentation">
      <div
        className={s.modal}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby={mensaje ? 'confirm-modal-message' : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={s.iconWrap} aria-hidden="true">⚠</div>
        <h2 id="confirm-modal-title" className={s.title}>{titulo}</h2>
        {mensaje && <p id="confirm-modal-message" className={s.message}>{mensaje}</p>}
        <Actions>
          <Button variant="secondary" size="lg" onClick={onCancelar}>
            {textoCancelar}
          </Button>
          <Button variant="primary" size="lg" onClick={onConfirmar} autoFocus>
            {textoConfirmar}
          </Button>
        </Actions>
      </div>
    </div>
  )
}
