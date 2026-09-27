import { useEffect, useState } from 'react'
import { reduceMovimiento } from '../../utils/viewTransition'
import s from './TextType.module.css'

// Efecto máquina de escribir (ReactBits TextType, sin dependencias).
// - Con `text`: escribe una sola frase.
// - Con `texts`: bucle que escribe, espera, borra y pasa a la siguiente.
// El texto real vive en un sr-only; la capa que se escribe es aria-hidden.
export default function TextType({
  text = '',
  texts = null,
  speed = 45,
  deleteSpeed = 22,
  hold = 1600,
  startDelay = 150,
  cursor = false,
  respectReducedMotion = true,
  className = '',
  as: Tag = 'span',
}) {
  const lista = Array.isArray(texts) && texts.length ? texts : null
  const reducir = respectReducedMotion && reduceMovimiento()

  const [idx, setIdx] = useState(0)
  const [mostrados, setMostrados] = useState(0)
  const [borrando, setBorrando] = useState(false)
  const [activo, setActivo] = useState(startDelay <= 0)

  const actual = lista ? lista[idx % lista.length] : text

  // Espera inicial (una sola vez) antes de arrancar el bucle.
  useEffect(() => {
    if (reducir || activo) return undefined
    const t = setTimeout(() => setActivo(true), startDelay)
    return () => clearTimeout(t)
  }, [reducir, activo, startDelay])

  // Modo simple: escribe una sola frase de izquierda a derecha.
  useEffect(() => {
    if (reducir || lista || !text) return undefined
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
  }, [reducir, lista, text, speed, startDelay])

  // Modo bucle: escribe → espera → borra → siguiente frase.
  useEffect(() => {
    if (reducir || !lista || !actual) return undefined
    if (!activo) return undefined

    let t
    if (!borrando && mostrados < actual.length) {
      t = setTimeout(() => setMostrados(mostrados + 1), speed)
    } else if (!borrando) {
      t = setTimeout(() => setBorrando(true), hold)
    } else if (mostrados > 0) {
      t = setTimeout(() => setMostrados(mostrados - 1), deleteSpeed)
    } else {
      t = setTimeout(() => {
        setBorrando(false)
        setIdx((i) => (i + 1) % lista.length)
      }, speed)
    }
    return () => clearTimeout(t)
  }, [reducir, lista, actual, activo, borrando, mostrados, speed, deleteSpeed, hold])

  if (reducir) {
    return <Tag className={className}>{actual}</Tag>
  }

  return (
    <Tag className={className}>
      <span className="sr-only">{actual}</span>
      <span aria-hidden="true">
        {actual.slice(0, mostrados)}
        {cursor ? <span className={s.cursor} /> : null}
      </span>
    </Tag>
  )
}
