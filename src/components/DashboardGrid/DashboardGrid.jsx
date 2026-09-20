import s from './DashboardGrid.module.css'

export default function DashboardGrid({ left, right, className = '' }) {
  return (
    <div className={`${s.grid} ${className}`}>
      <section className={s.col}>{left}</section>
      <section className={s.col}>{right}</section>
    </div>
  )
}
