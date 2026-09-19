import Actions from '../Actions/Actions'
import Button from '../Button/Button'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import s from './ConfirmModal.module.css'

export default function ConfirmModal({
  open,
  titulo = '¿Estás seguro?',
  mensaje,
  onConfirmar,
  onCancelar,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  children,
}) {
  const ref = useFocusTrap({ active: open, onEscape: onCancelar })

  if (!open) return null

  return (
    <div className={s.overlay} onClick={onCancelar} role="presentation">
      <div
        ref={ref}
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
        {children && <div className={s.content}>{children}</div>}
        <Actions>
          <Button variant="secondary" size="lg" onClick={onCancelar}>
            {textoCancelar}
          </Button>
          <Button variant="primary" size="lg" onClick={onConfirmar}>
            {textoConfirmar}
          </Button>
        </Actions>
      </div>
    </div>
  )
}
