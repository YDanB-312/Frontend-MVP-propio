import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { RUTA_POR_ROL } from '../constants/routes'
import {
  apiFetch, apiLogin, apiLogout, apiMe, apiChangePassword,
  EVENTO_SESION_EXPIRADA,
} from '../lib/api'

// Sesión del usuario.
//
// Fuente única: la API. La autenticación vive en una cookie httpOnly que el
// navegador envía sola; aquí solo se guarda en memoria la versión mínima de la
// cuenta ({ id, correo, nombre, rol }) que pintan las vistas. Al arrancar se
// pregunta a /auth/me para rehidratar la sesión.

const AuthContext = createContext(null)

// Normaliza la cuenta de la API al shape mínimo de sesión.
function aSesion(u) {
  return {
    id: u.id,
    correo: u.correo,
    nombre: [u.nombre, u.apellido].filter(Boolean).join(' ').trim() || u.correo,
    rol: String(u.rol || '').toLowerCase(),
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // Mientras se resuelve /auth/me no se puede decidir si hay sesión.
  const [cargando, setCargando] = useState(true)

  // ---------------------------------------------------------------- Login
  const login = useCallback(async (correo, password, recordarme) => {
    try {
      const { user: cuenta } = await apiLogin(correo.trim().toLowerCase(), password, recordarme)
      const sesion = aSesion(cuenta)
      setUser(sesion)
      return { exito: true, ruta: RUTA_POR_ROL[sesion.rol] || '/' }
    } catch (err) {
      const mensaje = err?.data?.message
        || (err?.status === 0 ? 'No se pudo conectar con el servidor.' : 'Credenciales incorrectas. Verifica tus datos.')
      return { exito: false, mensaje }
    }
  }, [])

  // ---------------------------------------------------------------- Registro
  const register = useCallback(async ({ nombre, apellido, correo, password, rol }) => {
    try {
      await apiFetch('/general-users', {
        method: 'POST',
        auth: false,
        body: { nombre: nombre.trim(), apellido: apellido.trim(), correo: correo.trim().toLowerCase(), password, rol },
      })
      return { exito: true, email: correo.trim().toLowerCase() }
    } catch (err) {
      if (err?.status === 422) return { exito: false, mensaje: 'Este correo ya está registrado.' }
      return { exito: false, mensaje: err?.data?.message || 'No se pudo crear la cuenta.' }
    }
  }, [])

  // ---------------------------------------------------------------- Contraseñas
  const cambiarMiContrasena = useCallback(async (actual, nueva) => {
    if (!user?.id) return { exito: false, mensaje: 'Sesión no válida. Inicia sesión de nuevo.' }
    try {
      await apiChangePassword(actual, nueva)
      return { exito: true }
    } catch (err) {
      return { exito: false, mensaje: err?.data?.message || 'No se pudo actualizar la contraseña.' }
    }
  }, [user])

  // ---------------------------------------------------------------- Logout
  const logout = useCallback(async () => {
    // Espera a que el backend cierre la sesión (cookie) antes de limpiar el
    // estado; si no, un refresco inmediato podría reautenticar al usuario.
    await apiLogout()
    setUser(null)
  }, [])

  // Refresca nombre/correo en memoria tras editar el perfil.
  const sincronizarSesion = useCallback((nombre, correo) => {
    setUser((actual) => {
      if (!actual) return actual
      return { ...actual, nombre: nombre || actual.nombre, correo: correo || actual.correo }
    })
  }, [])

  // Rehidratar/validar la sesión al arrancar (la cookie es httpOnly, así que la
  // única forma de saber quién es el usuario es preguntar a /auth/me).
  useEffect(() => {
    let vivo = true
    apiMe()
      .then((cuenta) => {
        if (vivo && cuenta?.id) setUser(aSesion(cuenta))
      })
      .catch(() => {
        if (vivo) setUser(null)
      })
      .finally(() => {
        if (vivo) setCargando(false)
      })
    return () => { vivo = false }
  }, [])

  // La API avisa (evento global) cuando una llamada autenticada recibe 401.
  useEffect(() => {
    const alExpirar = () => setUser(null)
    window.addEventListener(EVENTO_SESION_EXPIRADA, alExpirar)
    return () => window.removeEventListener(EVENTO_SESION_EXPIRADA, alExpirar)
  }, [])

  return (
    <AuthContext.Provider value={{ user, cargando, login, register, cambiarMiContrasena, sincronizarSesion, logout, isAuthenticated: !!user }}>
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
