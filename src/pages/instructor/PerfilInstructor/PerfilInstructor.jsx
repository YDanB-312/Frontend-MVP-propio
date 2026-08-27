import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PerfilBase from '../../../components/PerfilBase/PerfilBase'
import { useAuth } from '../../../contexts/AuthContext'
import { findUserById } from '../../../data/mockData'

export default function PerfilInstructor() {
  const { user } = useAuth()
  const perfil = findUserById(user.id)

  return (
    <DashboardLayout role="instructor" titulo="Mi Perfil">
      <PerfilBase
        user={user}
        role="instructor"
        detalles={[{ label: 'Rol', value: 'Instructor SENA' }]}
      />
    </DashboardLayout>
  )
}
