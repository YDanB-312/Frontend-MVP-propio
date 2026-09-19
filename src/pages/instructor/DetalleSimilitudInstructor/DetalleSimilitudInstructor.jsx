import { useParams } from 'react-router-dom'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import DetalleSimilitudBase from '../../../components/DetalleSimilitudBase/DetalleSimilitudBase'
import ApiState from '../../../components/ApiState/ApiState'
import { useApi } from '../../../lib/useApi'
import { similitudes as similitudesApi } from '../../../lib/recursos'

export default function DetalleSimilitudInstructor() {
  const { id } = useParams()

  // Similitud con sus proyectos (project1/project2) incluidos: fuente única la API.
  const { data: similitud, cargando, error, recargar } = useApi(
    () => similitudesApi.obtener(id),
    [id],
    { inicial: null }
  )

  if (cargando) {
    return (
      <DashboardLayout role="instructor" titulo="Detalle de Similitud">
        <ApiState cargando />
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout role="instructor" titulo="Detalle de Similitud">
        <ApiState error={error} onReintentar={recargar} />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="instructor" titulo="Detalle de Similitud">
      <DetalleSimilitudBase
        similitud={similitud}
        role="instructor"
        backTo="/instructor/similitudes"
        backLabel="Volver a similitudes"
      />
    </DashboardLayout>
  )
}
