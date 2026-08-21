import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import ReportarFallaBase from '../../../components/ReportarFallaBase/ReportarFallaBase'
import { useAuth } from '../../../contexts/AuthContext'
import { createBugReport } from '../../../data/mockData'

export default function ReportarFallaInstructor() {
  const { user } = useAuth()

  const handleSubmit = (form) => {
    createBugReport({
      titulo: form.titulo,
      descripcion: form.descripcion,
      tipo: form.tipo,
      prioridad: form.prioridad,
      reporterId: Number(user?.id),
      reporterName: user?.nombre || 'Instructor',
    })
  }

  return (
    <DashboardLayout role="instructor" titulo="Reportar Falla">
      <ReportarFallaBase role="instructor" onSubmit={handleSubmit} />
    </DashboardLayout>
  )
}
