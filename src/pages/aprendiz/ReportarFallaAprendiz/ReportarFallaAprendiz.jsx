import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import ReportarFallaBase from '../../../components/ReportarFallaBase/ReportarFallaBase'
import { useAuth } from '../../../contexts/AuthContext'
import { createBugReport } from '../../../data/mockData'

export default function ReportarFallaAprendiz() {
  const { user } = useAuth()

  const handleSubmit = (form) => {
    createBugReport({
      titulo: form.titulo,
      descripcion: `[Prioridad: ${form.prioridad}] ${form.descripcion}`,
      tipo: form.tipo,
      reporterId: user.id,
      reporterName: user.nombre,
    })
  }

  return (
    <DashboardLayout role="aprendiz" titulo="Reportar Falla">
      <ReportarFallaBase role="aprendiz" onSubmit={handleSubmit} />
    </DashboardLayout>
  )
}
