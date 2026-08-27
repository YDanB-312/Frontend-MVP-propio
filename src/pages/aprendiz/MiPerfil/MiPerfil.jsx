import { useMemo } from 'react'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PerfilBase from '../../../components/PerfilBase/PerfilBase'
import { useAuth } from '../../../contexts/AuthContext'
import {
  findUserById,
  findFichaById,
  getProjectsByStudent,
  getUnreadCount,
} from '../../../data/mockData'

export default function MiPerfil() {
  const { user } = useAuth()
  const perfil = findUserById(user.id)
  const ficha = findFichaById(perfil?.fichaId)
  const totalProyectos = useMemo(() => getProjectsByStudent(user.id).length, [user.id])
  const sinLeer = getUnreadCount(user.id)

  return (
    <DashboardLayout role="aprendiz" titulo="Mi Perfil">
      <PerfilBase
        user={user}
        role="aprendiz"
        stats={[
          { value: totalProyectos, label: 'Proyectos' },
          { value: sinLeer, label: 'Alertas sin leer' },
          { value: perfil?.programa || '—', label: 'Programa' },
        ]}
        detalles={[
          { label: 'Rol', value: 'Aprendiz SENA' },
          { label: 'Ficha', value: ficha ? `${ficha.nombre} (${ficha.codigo})` : 'Sin ficha asignada' },
        ]}
      />
    </DashboardLayout>
  )
}
