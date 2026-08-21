import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import AlertasBase from '../../../components/AlertasBase/AlertasBase'

export default function AlertasInstructor() {
  return (
    <DashboardLayout role="instructor" titulo="Alertas">
      <AlertasBase
        role="instructor"
        titulo="Alertas"
        subtitle="Notificaciones sobre revisión de proyectos, similitudes detectadas y actividad del sistema."
        detallePath="/instructor"
        emptyActionLabel="Ir a revision de propuestas"
        emptyActionTo="/instructor/revision-propuestas"
      />
    </DashboardLayout>
  )
}
