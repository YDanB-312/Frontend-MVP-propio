import { useEffect, useState } from 'react'
import { reduceMovimiento } from '../../utils/viewTransition'
import s from './CountUp.module.css'

// Separa el valor en prefijo/sufijo no numérico y su parte numérica ("35%" → 35 + "%").
function parsear(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? { num: value, prefix: '', suffix: '' } : null
  }
  if (typeof value !== 'string') return null
  const m = value.match(/^([^\d-]*)(-?\d+(?:[.,]\d+)?)([^\d]*)$/)
  if (!m) return null
  const num = Number(m[2].replace(',', '.'))
  if (!Number.isFinite(num)) return null
  return { num, prefix: m[1], suffix: m[3] }
}

// Offset de "camino más corto" del rodillo (mismo criterio que ReactBits Counter).
function offsetDe(digito, placeValue) {
  let offset = (10 + digito - (placeValue % 10)) % 10
  if (offset > 5) offset -= 10
  return offset
}

// Cada posición del número con su peso (10, 1, 0.1…); puntos y signos son estáticos.
function placesDe(texto) {
  const punto = texto.indexOf('.')
  const largoEntero = punto === -1 ? texto.length : punto
  const places = []
  for (let i = 0; i < texto.length; i++) {
    const ch = texto[i]
    if (ch === '.') {
      places.push({ key: i, tipo: 'punto' })
    } else if (/\d/.test(ch)) {
      const weight = i < largoEntero ? 10 ** (largoEntero - 1 - i) : 10 ** -(i - largoEntero)
      places.push({ key: i, tipo: 'digito', weight })
    } else {
      places.push({ key: i, tipo: 'signo', texto: ch })
    }
  }
  return places
}

// Contador con rodillo de dígitos (sin dependencias).
// Accesibilidad: el valor real vive en un sr-only; el rodillo es aria-hidden.
export default function CountUp({ value, duration, decimals = 0, className = '' }) {
  const parsed = parsear(value)
  const esNumero = parsed !== null
  const objetivo = esNumero ? parsed.num : 0
  const prefix = esNumero ? parsed.prefix : ''
  const suffix = esNumero ? parsed.suffix : ''
  const reducir = reduceMovimiento()
  const [listo, setListo] = useState(() => esNumero && reducir)

  useEffect(() => {
    if (!esNumero || reducir) return undefined
    const id = requestAnimationFrame(() => setListo(true))
    return () => cancelAnimationFrame(id)
  }, [esNumero, reducir])

  if (!esNumero) {
    return <span className={className}>{value}</span>
  }

  const final = `${prefix}${objetivo.toFixed(decimals)}${suffix}`

  if (reducir) {
    return <span className={className}>{final}</span>
  }

  const valor = listo ? objetivo : 0
  const places = placesDe(objetivo.toFixed(decimals))

  return (
    <span className={className} style={duration ? { '--countup-dur': `${duration}ms` } : undefined}>
      <span className="sr-only">{final}</span>
      <span className={s.counter} aria-hidden="true">
        {prefix ? <span className={s.afijo}>{prefix}</span> : null}
        {places.map((p) => {
          if (p.tipo === 'punto') return <span key={p.key} className={s.punto}>.</span>
          if (p.tipo === 'signo') return <span key={p.key} className={s.afijo}>{p.texto}</span>
          const placeValue = Math.round(valor / p.weight)
          return (
            <span key={p.key} className={s.col}>
              {Array.from({ length: 10 }, (_, d) => (
                <span key={d} className={s.numero} style={{ transform: `translateY(${offsetDe(d, placeValue)}em)` }}>
                  {d}
                </span>
              ))}
            </span>
          )
        })}
        {suffix ? <span className={s.afijo}>{suffix}</span> : null}
      </span>
    </span>
  )
}
