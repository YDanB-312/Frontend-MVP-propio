import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import PageFallback from '../PageFallback/PageFallback'

// Autoriza rutas privadas. La sesión vive en una cookie httpOnly, así que hay
// que esperar a que AuthContext resuelva /auth/me antes de decidir.
export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, isAuthenticated, cargando } = useAuth()
  const { pathname } = useLocation()

  // Mientras se resuelve la sesión se muestra el esqueleto, no una pantalla en blanco.
  if (cargando) return <PageFallback />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(user.rol)) return <Navigate to="/login" replace />

  // Clave temporal pendiente: solo se permite la pantalla de cambio.
  if (user.debeCambiarPassword && pathname !== '/cambiar-contrasena') {
    return <Navigate to="/cambiar-contrasena" replace />
  }

  return children
}
