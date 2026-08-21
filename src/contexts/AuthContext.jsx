import { createContext, useContext, useState, useCallback } from 'react'
import { findUserByEmail, validateCredentials, createUser, updateUserPassword, emailExists } from '../data/mockData'

const AuthContext = createContext(null)

const RUTA_POR_ROL = {
  aprendiz: '/aprendiz/dashboard',
  instructor: '/instructor/dashboard',
  admin: '/admin/dashboard',
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const guardado = localStorage.getItem('auth_user') || sessionStorage.getItem('auth_user')
    if (!guardado) return null
    try {
      return JSON.parse(guardado)
    } catch {
      localStorage.removeItem('auth_user')
      sessionStorage.removeItem('auth_user')
      return null
    }
  })

  const login = useCallback((correo, password, recordarme) => {
    const email = (correo || '').trim().toLowerCase()
    const encontrado = findUserByEmail(email)
    if (!encontrado || !validateCredentials(email, password)) {
      return { exito: false, mensaje: 'Credenciales incorrectas o usuario inactivo. Verifica tus datos.' }
    }
    if (encontrado.estado !== 1) {
      return { exito: false, mensaje: 'Credenciales incorrectas o usuario inactivo. Verifica tus datos.' }
    }

    const sesion = { id: encontrado.id, correo: encontrado.email, nombre: encontrado.name, rol: encontrado.role, estado: encontrado.estado }
    const destino = recordarme ? localStorage : sessionStorage
    const otro = recordarme ? sessionStorage : localStorage
    destino.setItem('auth_user', JSON.stringify(sesion))
    otro.removeItem('auth_user')
    setUser(sesion)
    return { exito: true, ruta: RUTA_POR_ROL[encontrado.role] || '/home' }
  }, [])

  const register = useCallback(({ nombre, apellido, correo, password, rol }) => {
    const email = (correo || '').trim().toLowerCase()
    if (emailExists(email)) return { exito: false, mensaje: 'Este correo ya está registrado.' }
    createUser({
      name: `${nombre.trim()} ${apellido.trim()}`.trim(),
      email,
      role: rol,
      estado: 1,
      password,
    })
    return { exito: true, email }
  }, [])

  const cambiarContrasena = useCallback((correo, nuevaPassword) => {
    const email = (correo || '').trim().toLowerCase()
    return updateUserPassword(email, nuevaPassword)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('auth_user')
    sessionStorage.removeItem('auth_user')
    sessionStorage.removeItem('ficha_aprendiz')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, register, cambiarContrasena, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- useAuth se exporta junto al provider para mantener un único contexto
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}
