import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import ReportarFallaBase from '../../../components/ReportarFallaBase/ReportarFallaBase'
import { useAuth } from '../../../contexts/AuthContext'
import { reportes } from '../../../lib/recursos'

// Fecha local (no UTC): evita que un reporte de la noche quede con el día siguiente.
const hoyISO = () => {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

export default function ReportarFallaAprendiz() {
  const { user } = useAuth()

  // El reporte se envía directamente a la API (lo lee el panel de admin).
  const handleSubmit = async (form) => {
    await reportes.crear({
      titulo: form.titulo.trim(),
      descripcion: form.descripcion.trim(),
      tipo: form.tipo,
      estado: 'pendiente',
      fecha: hoyISO(),
      id_usuario: Number(user.id),
    })
  }

  return (
    <DashboardLayout role="aprendiz" titulo="Reportar Falla">
      <ReportarFallaBase role="aprendiz" onSubmit={handleSubmit} />
    </DashboardLayout>
  )
}
