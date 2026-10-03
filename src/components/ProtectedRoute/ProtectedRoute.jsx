import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

// Autoriza rutas privadas. La sesión vive en una cookie httpOnly, así que hay
// que esperar a que AuthContext resuelva /auth/me antes de decidir. Con
// contraseña temporal pendiente, todo redirige al cambio obligatorio.
export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, isAuthenticated, cargando } = useAuth()
  const { pathname } = useLocation()
  if (cargando) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user.mustChangePassword && pathname !== '/cambio-obligatorio') {
    return <Navigate to="/cambio-obligatorio" replace />
  }
  if (allowedRoles && !allowedRoles.includes(user.rol)) return <Navigate to="/login" replace />
  return children
}
