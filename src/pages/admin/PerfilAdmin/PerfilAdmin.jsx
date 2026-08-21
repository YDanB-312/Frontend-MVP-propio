import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PerfilBase from '../../../components/PerfilBase/PerfilBase'
import { useAuth } from '../../../contexts/AuthContext'
import { findUserById } from '../../../data/mockData'

export default function PerfilAdmin() {
  const { user } = useAuth()
  const perfil = findUserById(user.id)

  return (
    <DashboardLayout role="admin" titulo="Mi Perfil">
      <PerfilBase
        user={user}
        role="admin"
        detalles={[
          { label: 'Documento', value: perfil?.documentoIdentidad || 'No registrado' },
          { label: 'Permisos', value: 'Control total de la plataforma' },
        ]}
      />
    </DashboardLayout>
  )
}
