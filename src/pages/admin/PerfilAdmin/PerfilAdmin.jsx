import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PerfilBase from '../../../components/PerfilBase/PerfilBase'
import { useAuth } from '../../../contexts/AuthContext'

export default function PerfilAdmin() {
  const { user } = useAuth()

  return (
    <DashboardLayout role="admin" titulo="Mi Perfil">
      <PerfilBase
        user={user}
        role="admin"
        detalles={[{ label: 'Rol', value: 'Administrador SENA' }]}
      />
    </DashboardLayout>
  )
}
