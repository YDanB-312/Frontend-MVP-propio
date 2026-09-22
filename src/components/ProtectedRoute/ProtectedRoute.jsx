import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { haySesion } from '../../lib/api'

// Autoriza rutas privadas: exige usuario en sesión Y token válido presente.
// (Un `auth_user` huérfano, sin token, no debe dar acceso.)
export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, isAuthenticated } = useAuth()
  if (!isAuthenticated || !haySesion()) return <Navigate to="/login" replace />
  if (allowedRoles) {
    // El superadmin es superset del admin: entra a cualquier ruta de admin.
    const permitido = allowedRoles.includes(user.rol)
      || (user.rol === 'superadmin' && allowedRoles.includes('admin'))
    if (!permitido) return <Navigate to="/login" replace />
  }
  return children
}
