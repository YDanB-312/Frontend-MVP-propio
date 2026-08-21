import s from './Skeleton.module.css'

export function SkeletonLine({ width = '100%', height = 12, className = '' }) {
  return <div className={`${s.line} ${className}`} style={{ width, height }} aria-hidden="true" />
}

export function SkeletonCircle({ size = 36, className = '' }) {
  return <div className={`${s.circle} ${className}`} style={{ width: size, height: size }} aria-hidden="true" />
}

export function SkeletonCard({ lines = 3, className = '' }) {
  return (
    <div className={`${s.card} ${className}`} aria-hidden="true">
      <SkeletonLine width="40%" height={16} />
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine key={i} width={i === lines - 1 ? '60%' : '100%'} />
      ))}
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 4, className = '' }) {
  return (
    <div className={`${s.table} ${className}`} aria-hidden="true">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className={s.row}>
          <SkeletonCircle size={28} />
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonLine key={c} width={`${100 / (cols + 1)}%`} height={10} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function SkeletonStats({ count = 4, className = '' }) {
  return (
    <div className={`${s.stats} ${className}`} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={s.stat}>
          <SkeletonCircle size={32} />
          <SkeletonLine width="70%" height={18} />
          <SkeletonLine width="45%" height={10} />
        </div>
      ))}
    </div>
  )
}
