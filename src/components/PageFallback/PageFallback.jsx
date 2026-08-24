import { useLocation } from 'react-router-dom'
import { SkeletonStats, SkeletonTable, SkeletonCard, SkeletonLine, SkeletonCircle } from '../Skeleton/Skeleton'
import s from './PageFallback.module.css'

function derivarRol(pathname) {
  if (pathname.startsWith('/instructor')) return 'instructor'
  if (pathname.startsWith('/admin')) return 'admin'
  if (pathname.startsWith('/aprendiz')) return 'aprendiz'
  return null
}

export default function PageFallback() {
  const { pathname } = useLocation()
  const rol = derivarRol(pathname)

  if (!rol) {
    return (
      <div className={s.center}>
        <div className={s.spinner} aria-hidden="true" />
      </div>
    )
  }

  const esTabla = /usuarios|fichas|similitudes|revision|reportes|proyectos/.test(pathname)

  return (
    <div className={s.shell} aria-hidden="true">
      <div className={s.govbar} />
      <div className={s.headerBar}>
        <SkeletonCircle size={30} />
        <SkeletonLine width={120} height={14} />
      </div>
      <div className={s.sidebar}>
        <SkeletonLine width="70%" height={12} />
        <SkeletonLine width="60%" height={12} />
        <SkeletonLine width="65%" height={12} />
        <SkeletonLine width="55%" height={12} />
        <SkeletonLine width="62%" height={12} />
      </div>
      <div className={s.content}>
        <div className={s.heroBlock}>
          <SkeletonLine width="45%" height={22} />
          <SkeletonLine width="65%" height={12} />
        </div>
        <SkeletonStats count={4} />
        {esTabla ? <SkeletonTable rows={6} cols={5} /> : <SkeletonCard lines={4} />}
        <SkeletonLine width="35%" height={16} />
        <SkeletonTable rows={3} cols={3} />
      </div>
    </div>
  )
}
