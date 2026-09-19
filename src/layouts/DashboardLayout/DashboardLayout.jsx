import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useApi } from '../../lib/useApi'
import { notificaciones as apiNotificaciones } from '../../lib/recursos'
import {
  House, FolderOpen, Bell, Bug, UserCircle,
  ClipboardText, BookOpen, BookBookmark, UsersThree, MagnifyingGlass, GraduationCap, GearSix,
  ClockCounterClockwise
} from 'phosphor-react'
import GovernmentBar from '../../components/GovernmentBar/GovernmentBar'
import TopNav from '../../components/TopNav/TopNav'
import Sidebar from '../../components/Sidebar/Sidebar'
import Footer from '../../components/Footer/Footer'
import s from './DashboardLayout.module.css'

const LINKS = {
  aprendiz: [
    { to: '/aprendiz/dashboard', icon: <House size={20} weight="regular" />, label: 'Dashboard' },
    { to: '/aprendiz/propuestas', icon: <FolderOpen size={20} weight="regular" />, label: 'Propuestas', activeFor: ['/aprendiz/detalle-proyecto'] },
    { to: '/aprendiz/similitudes', icon: <MagnifyingGlass size={20} weight="regular" />, label: 'Similitudes', activeFor: ['/aprendiz/detalle-similitud', '/aprendiz/resultado-analisis'] },
    { to: '/aprendiz/ficha', icon: <GraduationCap size={20} weight="regular" />, label: 'Ficha', activeFor: ['/aprendiz/detalle-ficha'] },
    { to: '/aprendiz/alertas', icon: <Bell size={20} weight="regular" />, label: 'Alertas' },
    { to: '/aprendiz/perfil', icon: <UserCircle size={20} weight="regular" />, label: 'Mi Perfil' },
    { to: '/aprendiz/reportar-falla', icon: <Bug size={20} weight="regular" />, label: 'Reportar Falla' },
  ],
  instructor: [
    { to: '/instructor/dashboard', icon: <House size={20} weight="regular" />, label: 'Dashboard' },
    { to: '/instructor/revision-propuestas', icon: <ClipboardText size={20} weight="regular" />, label: 'Revisión Propuestas', activeFor: ['/instructor/detalle-proyecto'] },
    { to: '/instructor/similitudes', icon: <MagnifyingGlass size={20} weight="regular" />, label: 'Similitudes', activeFor: ['/instructor/detalle-similitud'] },
    { to: '/instructor/fichas', icon: <BookOpen size={20} weight="regular" />, label: 'Fichas', activeFor: ['/instructor/detalle-ficha', '/instructor/directorio-ficha'] },
    { to: '/instructor/alertas', icon: <Bell size={20} weight="regular" />, label: 'Alertas' },
    { to: '/instructor/perfil', icon: <UserCircle size={20} weight="regular" />, label: 'Mi Perfil' },
    { to: '/instructor/reportar-falla', icon: <Bug size={20} weight="regular" />, label: 'Reportar Falla' },
  ],
  admin: [
    { to: '/admin/dashboard', icon: <House size={20} weight="regular" />, label: 'Dashboard' },
    { to: '/admin/proyectos', icon: <FolderOpen size={20} weight="regular" />, label: 'Propuestas', activeFor: ['/admin/detalle-proyecto'] },
    { to: '/admin/similitudes', icon: <MagnifyingGlass size={20} weight="regular" />, label: 'Similitudes', activeFor: ['/admin/detalle-similitud'] },
    { to: '/admin/reportes-fallas', icon: <Bug size={20} weight="regular" />, label: 'Reportes de Fallas', activeFor: ['/admin/detalle-reporte'] },
    { to: '/admin/notificaciones', icon: <Bell size={20} weight="regular" />, label: 'Alertas' },
    { to: '/admin/usuarios', icon: <UsersThree size={20} weight="regular" />, label: 'Usuarios', activeFor: ['/admin/detalle-usuario'] },
    { to: '/admin/fichas', icon: <BookBookmark size={20} weight="regular" />, label: 'Fichas', activeFor: ['/admin/detalle-ficha'] },
  { to: '/admin/bitacora', icon: <ClockCounterClockwise size={20} weight="regular" />, label: 'Bitácora' },
    { to: '/admin/configuracion', icon: <GearSix size={20} weight="regular" />, label: 'Configuración', activeFor: ['/admin/redes-conocimiento', '/admin/training-centers', '/admin/config-similitud'] },
    { to: '/admin/perfil', icon: <UserCircle size={20} weight="regular" />, label: 'Mi Perfil' },
  ],
}

export default function DashboardLayout({ role = 'aprendiz', titulo = '', children }) {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Campana: notificaciones reales del usuario (fuente única: la API).
  const { data } = useApi(
    () => (user?.id ? apiNotificaciones.listar() : Promise.resolve([])),
    [user?.id],
    { inicial: [] }
  )
  const sinLeer = user
    ? (data || []).filter((n) => Number(n.id_usuario) === Number(user.id) && !n.leida).length
    : 0
  const links = LINKS[role] || LINKS.aprendiz

  return (
    <div className={s.layout}>
      <GovernmentBar />
      <TopNav
        titulo={titulo}
        usuario={user}
        role={role}
        notificaciones={sinLeer}
        onToggleSidebar={() => setSidebarOpen(o => !o)}
      />
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        role={role}
        links={links}
      />
      <div className={s.body}>
        <main className={s.main}>{children}</main>
        <Footer role={role} />
      </div>
    </div>
  )
}
