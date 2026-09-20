import s from './GradualBlur.module.css'

const DIRECCION = { top: 'to top', bottom: 'to bottom', left: 'to left', right: 'to right' }
const CURVAS = {
  linear: (p) => p,
  'ease-out': (p) => 1 - Math.pow(1 - p, 2),
  bezier: (p) => p * p * (3 - 2 * p),
}

// Desenfoque progresivo en el borde de un contenedor (ReactBits GradualBlur, CSS + tokens).
export default function GradualBlur({
  position = 'bottom',
  height = '4rem',
  strength = 1.5,
  divCount = 4,
  opacity = 0.7,
  curve = 'ease-out',
  className = '',
}) {
  const direccion = DIRECCION[position] || DIRECCION.bottom
  const curva = CURVAS[curve] || CURVAS['ease-out']
  const incremento = 100 / divCount

  const capas = Array.from({ length: divCount }, (_, idx) => {
    const i = idx + 1
    const progreso = curva(i / divCount)
    const blur = 0.0625 * (progreso * divCount + 1) * strength
    const p1 = Math.round((incremento * i - incremento) * 10) / 10
    const p2 = Math.round(incremento * i * 10) / 10
    const p3 = Math.round((incremento * i + incremento) * 10) / 10
    const p4 = Math.round((incremento * i + incremento * 2) * 10) / 10
    let gradiente = `transparent ${p1}%, #000 ${p2}%`
    if (p3 <= 100) gradiente += `, #000 ${p3}%`
    if (p4 <= 100) gradiente += `, transparent ${p4}%`
    const mask = `linear-gradient(${direccion}, ${gradiente})`
    return {
      maskImage: mask,
      WebkitMaskImage: mask,
      backdropFilter: `blur(${blur.toFixed(3)}rem)`,
      WebkitBackdropFilter: `blur(${blur.toFixed(3)}rem)`,
      opacity,
    }
  })

  const vertical = position === 'top' || position === 'bottom'
  const estilo = vertical
    ? { height, width: '100%', left: 0, right: 0, [position]: 0 }
    : { width: height, height: '100%', top: 0, bottom: 0, [position]: 0 }

  return (
    <div className={`${s.wrap} ${className}`} style={estilo} aria-hidden="true">
      {capas.map((c, i) => (
        <div key={i} className={s.capa} style={c} />
      ))}
    </div>
  )
}
