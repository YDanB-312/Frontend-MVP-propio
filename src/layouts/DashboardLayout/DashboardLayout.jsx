import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import {
  House, FolderOpen, PlusCircle, Link, Bell, Bug, UserCircle,
  ClipboardText, BookOpen, UsersThree, MagnifyingGlass
} from 'phosphor-react'
import GovernmentBar from '../../components/GovernmentBar/GovernmentBar'
import Header from '../../components/Header/Header'
import Sidebar from '../../components/Sidebar/Sidebar'
import Footer from '../../components/Footer/Footer'
import s from './DashboardLayout.module.css'

const LINKS = {
  aprendiz: [
    { to: '/aprendiz/dashboard', icon: <House size={20} weight="regular" />, label: 'Dashboard' },
    { to: '/aprendiz/mis-proyectos', icon: <FolderOpen size={20} weight="regular" />, label: 'Mis Proyectos' },
    { to: '/aprendiz/nuevo-proyecto', icon: <PlusCircle size={20} weight="regular" />, label: 'Nueva Propuesta' },
    { to: '/aprendiz/unirse-ficha', icon: <Link size={20} weight="regular" />, label: 'Unirse a Ficha' },
    { to: '/aprendiz/alertas', icon: <Bell size={20} weight="regular" />, label: 'Alertas' },
    { to: '/aprendiz/reportar-falla', icon: <Bug size={20} weight="regular" />, label: 'Reportar Falla' },
    { to: '/aprendiz/perfil', icon: <UserCircle size={20} weight="regular" />, label: 'Mi Perfil' },
  ],
  instructor: [
    { to: '/instructor/dashboard', icon: <House size={20} weight="regular" />, label: 'Dashboard' },
    { to: '/instructor/revision-propuestas', icon: <ClipboardText size={20} weight="regular" />, label: 'Revision Propuestas' },
    { to: '/instructor/similitudes', icon: <MagnifyingGlass size={20} weight="regular" />, label: 'Similitudes' },
    { to: '/instructor/gestionar-fichas', icon: <BookOpen size={20} weight="regular" />, label: 'Gestionar Fichas' },
    { to: '/instructor/alertas', icon: <Bell size={20} weight="regular" />, label: 'Alertas' },
    { to: '/instructor/reportar-falla', icon: <Bug size={20} weight="regular" />, label: 'Reportar Falla' },
    { to: '/instructor/perfil', icon: <UserCircle size={20} weight="regular" />, label: 'Mi Perfil' },
  ],
  admin: [
    { to: '/admin/dashboard', icon: <House size={20} weight="regular" />, label: 'Dashboard' },
    { to: '/admin/gestion-usuarios', icon: <UsersThree size={20} weight="regular" />, label: 'Gestionar Usuarios' },
    { to: '/admin/proyectos', icon: <FolderOpen size={20} weight="regular" />, label: 'Proyectos' },
    { to: '/admin/similitudes', icon: <MagnifyingGlass size={20} weight="regular" />, label: 'Similitudes' },
    { to: '/admin/reportes-fallas', icon: <Bug size={20} weight="regular" />, label: 'Reportes de Fallas' },
    { to: '/admin/notificaciones', icon: <Bell size={20} weight="regular" />, label: 'Notificaciones' },
    { to: '/admin/perfil', icon: <UserCircle size={20} weight="regular" />, label: 'Mi Perfil' },
  ],
}

export default function DashboardLayout({ role = 'aprendiz', titulo = '', children }) {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const links = LINKS[role] || LINKS.aprendiz

  return (
    <div className={s.layout}>
      <GovernmentBar />
      <Header
        titulo={titulo}
        usuario={user}
        role={role}
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
