import { cloneElement, isValidElement, useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import s from './Tooltip.module.css'

const GAP = 8

// Tooltip propia (inspirada en ReactBits WarmTooltip, sin dependencias).
// Funciona sobre controles deshabilitados porque los eventos viven en el wrapper.
export default function Tooltip({ content, side = 'top', delay = 350, children }) {
  const id = useId()
  const triggerRef = useRef(null)
  const timerRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  const posicionar = useCallback(() => {
    const el = triggerRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const centroX = r.left + r.width / 2
    const centroY = r.top + r.height / 2
    if (side === 'top') setPos({ top: r.top - GAP, left: centroX })
    else if (side === 'bottom') setPos({ top: r.bottom + GAP, left: centroX })
    else if (side === 'left') setPos({ top: centroY, left: r.left - GAP })
    else setPos({ top: centroY, left: r.right + GAP })
  }, [side])

  const mostrar = useCallback(() => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setOpen(true), delay)
  }, [delay])

  const ocultar = useCallback(() => {
    clearTimeout(timerRef.current)
    setOpen(false)
  }, [])

  useLayoutEffect(() => {
    if (open) posicionar()
  }, [open, posicionar])

  useEffect(() => {
    if (!open) return undefined
    const onScroll = () => posicionar()
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
    }
  }, [open, posicionar])

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const trigger = isValidElement(children)
    ? cloneElement(children, { 'aria-describedby': open ? id : children.props['aria-describedby'] })
    : children

  return (
    <>
      <span
        ref={triggerRef}
        className={s.wrap}
        onMouseEnter={mostrar}
        onMouseLeave={ocultar}
        onPointerDown={ocultar}
        onFocusCapture={mostrar}
        onBlurCapture={ocultar}
        onKeyDown={(e) => { if (e.key === 'Escape') ocultar() }}
      >
        {trigger}
      </span>
      {open && content
        ? createPortal(
            <span id={id} role="tooltip" className={s.bubble} data-side={side} style={{ top: pos.top, left: pos.left }}>
              {content}
            </span>,
            document.body
          )
        : null}
    </>
  )
}
