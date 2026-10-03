import { Link } from 'react-router-dom'
import { CONTACTO } from '../../constants/contacto'
import { Phone, Envelope, Copyright } from 'phosphor-react'
import s from './Footer.module.css'

const FOOTER_BY_ROLE = {
  aprendiz: {
    links: [
      { label: 'Dashboard', to: '/aprendiz/dashboard' },
      { label: 'Propuestas', to: '/aprendiz/propuestas' },
      { label: 'Similitudes', to: '/aprendiz/similitudes' },
      { label: 'Ficha', to: '/aprendiz/ficha' },
      { label: 'Alertas', to: '/aprendiz/alertas' },
      { label: 'Mi Perfil', to: '/aprendiz/perfil' },
      { label: 'Reportar Falla', to: '/aprendiz/reportar-falla' },
    ],
  },
  instructor: {
    links: [
      { label: 'Dashboard', to: '/instructor/dashboard' },
      { label: 'Revisión Propuestas', to: '/instructor/revision-propuestas' },
      { label: 'Similitudes', to: '/instructor/similitudes' },
      { label: 'Fichas', to: '/instructor/fichas' },
      { label: 'Alertas', to: '/instructor/alertas' },
      { label: 'Mi Perfil', to: '/instructor/perfil' },
      { label: 'Reportar Falla', to: '/instructor/reportar-falla' },
    ],
  },
  admin: {
    links: [
      { label: 'Dashboard', to: '/admin/dashboard' },
      { label: 'Usuarios', to: '/admin/usuarios' },
      { label: 'Propuestas', to: '/admin/proyectos' },
      { label: 'Similitudes', to: '/admin/similitudes' },
      { label: 'Fichas', to: '/admin/fichas' },
      { label: 'Redes y programas', to: '/admin/redes-conocimiento' },
      { label: 'Motor de similitud', to: '/admin/config-similitud' },
      { label: 'Mi Perfil', to: '/admin/perfil' },
    ],
  },
}

export default function Footer({ role }) {
  const footerLinks = FOOTER_BY_ROLE[role]?.links

  return (
    <footer className={s.footer}>
      <div className={s.container}>
        <div className={s.left}>
          <p className={s.copy}>
            <Copyright size={13} weight="regular" />
            {CONTACTO.copyright}. Todos los derechos reservados.
          </p>
        </div>

        {footerLinks && (
          <nav className={s.links} aria-label="Navegación secundaria">
            {footerLinks.map(l => (
              <Link key={l.to} to={l.to} viewTransition className={s.link}>{l.label}</Link>
            ))}
          </nav>
        )}

        <div className={s.contact}>
          <a href={`tel:${CONTACTO.telefono.replace(/\s/g, '')}`}>
            <Phone size={12} weight="regular" />
            {CONTACTO.telefono}
          </a>
          <span className={s.sep} aria-hidden="true">|</span>
          <a href={`mailto:${CONTACTO.email}`}>
            <Envelope size={12} weight="regular" />
            {CONTACTO.email}
          </a>
        </div>
      </div>
    </footer>
  )
}
