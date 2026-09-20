import { useEffect, useState } from 'react'
import { reduceMovimiento } from '../../utils/viewTransition'
import s from './TextType.module.css'

// Efecto máquina de escribir (ReactBits TextType, sin dependencias).
// El texto real vive en un sr-only; la capa que se escribe es aria-hidden.
export default function TextType({
  text = '',
  speed = 45,
  startDelay = 150,
  cursor = false,
  respectReducedMotion = true,
  className = '',
  as: Tag = 'span',
}) {
  const reducir = respectReducedMotion && reduceMovimiento()
  const [mostrados, setMostrados] = useState(0)

  useEffect(() => {
    if (reducir || !text) return undefined
    let i = 0
    let intervalo = null
    const tic = () => {
      i += 1
      setMostrados(i)
      if (i >= text.length) clearInterval(intervalo)
    }
    const inicio = setTimeout(() => {
      intervalo = setInterval(tic, speed)
    }, startDelay)
    return () => {
      clearTimeout(inicio)
      if (intervalo) clearInterval(intervalo)
    }
  }, [text, speed, startDelay, reducir])

  if (reducir) {
    return <Tag className={className}>{text}</Tag>
  }

  return (
    <Tag className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {text.slice(0, mostrados)}
        {cursor ? <span className={s.cursor} /> : null}
      </span>
    </Tag>
  )
}
