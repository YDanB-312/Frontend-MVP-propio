import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import ReportarFallaBase from '../../../components/ReportarFallaBase/ReportarFallaBase'
import { useAuth } from '../../../contexts/AuthContext'
import { createBugReport } from '../../../data/mockData'

export default function ReportarFallaAprendiz() {
  const { user } = useAuth()

  const handleSubmit = (form) => {
    createBugReport({
      titulo: form.titulo,
      descripcion: form.descripcion,
      tipo: form.tipo,
      prioridad: form.prioridad,
      reporterId: Number(user?.id),
      reporterName: user?.nombre || 'Aprendiz',
    })
  }

  return (
    <DashboardLayout role="aprendiz" titulo="Reportar Falla">
      <ReportarFallaBase role="aprendiz" onSubmit={handleSubmit} />
    </DashboardLayout>
  )
}
