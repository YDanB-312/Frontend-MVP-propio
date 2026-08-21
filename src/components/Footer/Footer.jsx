import { CONTACTO } from '../../constants/contacto'
import { Phone, Envelope, Copyright } from 'phosphor-react'
import s from './Footer.module.css'

const FOOTER_BY_ROLE = {
  aprendiz: {
    links: [
      { label: 'Mis Proyectos', to: '/aprendiz/mis-proyectos' },
      { label: 'Alertas', to: '/aprendiz/alertas' },
      { label: 'Mi Perfil', to: '/aprendiz/perfil' },
    ],
  },
  instructor: {
    links: [
      { label: 'Revision Propuestas', to: '/instructor/revision-propuestas' },
      { label: 'Similitudes', to: '/instructor/similitudes' },
      { label: 'Gestionar Fichas', to: '/instructor/gestionar-fichas' },
      { label: 'Mi Perfil', to: '/instructor/perfil' },
    ],
  },
  admin: {
    links: [
      { label: 'Gestionar Usuarios', to: '/admin/gestion-usuarios' },
      { label: 'Proyectos', to: '/admin/proyectos' },
      { label: 'Reportes', to: '/admin/reportes-fallas' },
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
          <div className={s.links}>
            {footerLinks.map(l => (
              <a key={l.to} href={l.to} className={s.link}>{l.label}</a>
            ))}
          </div>
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
