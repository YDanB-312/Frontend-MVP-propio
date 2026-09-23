import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { haySesion } from '../../lib/api'

// Autoriza rutas privadas: exige usuario en sesión Y token válido presente.
// (Un `auth_user` huérfano, sin token, no debe dar acceso.)
export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, isAuthenticated } = useAuth()
  if (!isAuthenticated || !haySesion()) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(user.rol)) return <Navigate to="/login" replace />
  return children
}
