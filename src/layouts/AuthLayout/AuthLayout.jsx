import s from './AuthLayout.module.css'

export default function AuthLayout({ children }) {
  return (
    <div className={s.layout}>
      <div className={s.card}>
        <img
          className={s.logo}
          src="/images/Logo-ProyecTwin.png"
          alt="ProyecTwin SENA"
        />
        {children}
      </div>
    </div>
  )
}
