import { useParams } from 'react-router-dom'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import DetalleSimilitudBase from '../../../components/DetalleSimilitudBase/DetalleSimilitudBase'
import { findSimilarityById } from '../../../data/mockData'

export default function DetalleSimilitudInstructor() {
  const { id } = useParams()
  const similitud = findSimilarityById(id)

  if (!similitud) {
    return (
      <DashboardLayout role="instructor" titulo="Detalle de Similitud">
        <DetalleSimilitudBase similitud={null} role="instructor" />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="instructor" titulo="Detalle de Similitud">
      <DetalleSimilitudBase similitud={similitud} role="instructor" />
    </DashboardLayout>
  )
}
