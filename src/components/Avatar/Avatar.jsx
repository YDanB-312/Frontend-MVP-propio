import s from './Avatar.module.css'

const SIZES = { sm: s.sm, md: s.md, lg: s.lg, xl: s.xl }

const PALETTE = [
  '#2a7c00', '#0b5d75', '#b45309', '#b91c1c', '#6d28d9',
  '#0e7490', '#be185d', '#3f7d0d', '#c2410c', '#4338ca',
]

function hashName(name) {
  let hash = 0
  const str = String(name || '')
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function getInitials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function Avatar({ name = '', src, size = 'md', className = '', title }) {
  const color = PALETTE[hashName(name) % PALETTE.length]
  return (
    <span
      className={`${s.avatar} ${SIZES[size] || s.md} ${className}`}
      style={{ backgroundColor: color }}
      title={title ?? name}
      aria-hidden={title ? undefined : true}
    >
      {src ? <img src={src} alt="" className={s.img} draggable="false" /> : getInitials(name)}
    </span>
  )
}
