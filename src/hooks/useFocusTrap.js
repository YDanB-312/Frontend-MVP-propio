import { useEffect, useRef } from 'react'

const SELECTORES_FOCO =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Atrapa el Tab dentro del contenedor mientras está activo: foco inicial al
// primer elemento (o al contenedor), ciclo Tab/Shift+Tab, Escape delegable,
// bloqueo de scroll del fondo y retorno del foco al salir.
export function useFocusTrap({ active, onEscape, focoInicial = 'primero' }) {
  const ref = useRef(null)
  const anterior = useRef(null)
  const escapeRef = useRef(onEscape)

  useEffect(() => {
    escapeRef.current = onEscape
  })

  useEffect(() => {
    if (!active) return
    const nodo = ref.current
    if (!nodo) return
    anterior.current = document.activeElement
    const previoOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Sin filtro de visibilidad por layout (offsetParent no existe en todos
    // los entornos): el selector ya excluye deshabilitados y tabindex -1.
    const focoables = () => [...nodo.querySelectorAll(SELECTORES_FOCO)]

    const timer = setTimeout(() => {
      if (focoInicial === 'contenedor') {
        if (!nodo.hasAttribute('tabindex')) nodo.setAttribute('tabindex', '-1')
        nodo.focus({ preventScroll: true })
      } else {
        focoables()[0]?.focus({ preventScroll: true })
      }
    }, 0)

    const onKey = (e) => {
      if (e.key === 'Escape') {
        escapeRef.current?.()
        return
      }
      if (e.key !== 'Tab') return
      const items = focoables()
      if (items.length === 0) {
        e.preventDefault()
        return
      }
      const primero = items[0]
      const ultimo = items[items.length - 1]
      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault()
        ultimo.focus()
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault()
        primero.focus()
      }
    }
    document.addEventListener('keydown', onKey, true)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('keydown', onKey, true)
      document.body.style.overflow = previoOverflow
      if (anterior.current instanceof HTMLElement) anterior.current.focus({ preventScroll: true })
    }
  }, [active, focoInicial])

  return ref
}
