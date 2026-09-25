import { useEffect, useState } from 'react'
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
  // Verificación reforzada (para acciones destructivas del admin):
  responsabilidad = false,
  textoResponsabilidad = 'Entiendo que esta acción es irreversible y es mi responsabilidad.',
  verificacion, // si viene, hay que escribir exactamente este texto para habilitar
  children,
}) {
  const [cargando, setCargando] = useState(false)
  const [acepta, setAcepta] = useState(false)
  const [texto, setTexto] = useState('')

  // Al reabrir, se limpia la verificación (deferido para no mutar en el cuerpo
  // del efecto, misma pauta que useApi).
  useEffect(() => {
    if (!open) return
    Promise.resolve().then(() => { setAcepta(false); setTexto('') })
  }, [open])

  const ref = useFocusTrap({ active: open && !cargando, onEscape: () => cancelar() })

  function cancelar() {
    if (cargando) return
    onCancelar?.()
  }

  const verificado = (!responsabilidad || acepta) && (!verificacion || texto.trim() === verificacion)

  async function confirmar() {
    if (cargando || !verificado) return
    setCargando(true)
    try {
      await onConfirmar?.()
    } finally {
      setCargando(false)
    }
  }

  if (!open) return null

  return (
    <div className={s.overlay} onClick={cancelar} role="presentation">
      <div
        ref={ref}
        className={s.modal}
        role="alertdialog"
        aria-modal="true"
        aria-busy={cargando}
        aria-labelledby="confirm-modal-title"
        aria-describedby={mensaje ? 'confirm-modal-message' : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={s.iconWrap} aria-hidden="true">⚠</div>
        <h2 id="confirm-modal-title" className={s.title}>{titulo}</h2>
        {mensaje && <p id="confirm-modal-message" className={s.message}>{mensaje}</p>}

        {(responsabilidad || verificacion) && (
          <div className={s.verify}>
            {responsabilidad && (
              <label className={s.checkRow}>
                <input
                  type="checkbox"
                  className={s.checkInput}
                  checked={acepta}
                  onChange={(e) => setAcepta(e.target.checked)}
                />
                <span>{textoResponsabilidad}</span>
              </label>
            )}
            {verificacion && (
              <label className={s.verifyField}>
                <span className={s.verifyLabel}>
                  Escribe <strong>{verificacion}</strong> para confirmar
                </span>
                <input
                  type="text"
                  className={s.verifyInput}
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  autoComplete="off"
                  spellCheck="false"
                />
              </label>
            )}
          </div>
        )}

        {children && <div className={s.content}>{children}</div>}

        <Actions>
          <Button variant="secondary" size="lg" disabled={cargando} onClick={cancelar}>
            {textoCancelar}
          </Button>
          <Button variant="primary" size="lg" disabled={cargando || !verificado} onClick={confirmar}>
            {cargando ? 'Procesando…' : textoConfirmar}
          </Button>
        </Actions>
      </div>
    </div>
  )
}
