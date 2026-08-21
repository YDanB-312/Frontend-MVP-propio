import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import AlertasBase from '../../../components/AlertasBase/AlertasBase'

export default function NotificacionesAdmin() {
  return (
    <DashboardLayout role="admin" titulo="Notificaciones">
      <AlertasBase
        role="admin"
        titulo="Notificaciones"
        subtitle="Novedades del sistema: reportes de fallas, similitudes y actividad de usuarios."
        detallePath="/admin"
      />
    </DashboardLayout>
  )
}
