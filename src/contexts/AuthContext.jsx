import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { RUTA_POR_ROL } from '../constants/routes'
import {
  apiFetch, apiLogin, apiLogout, apiMe, apiChangePassword,
  toFieldErrors, EVENTO_SESION_EXPIRADA,
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
    // Clave temporal del admin: obliga a cambiarla antes de usar la app.
    debeCambiarPassword: !!u.debe_cambiar_password,
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
      return { exito: true, ruta: RUTA_POR_ROL[sesion.rol] || '/', debeCambiarPassword: sesion.debeCambiarPassword }
    } catch (err) {
      const mensaje = err?.data?.message
        || (err?.status === 0 ? 'No se pudo conectar con el servidor.' : 'Credenciales incorrectas. Verifica tus datos.')
      return {
        exito: false,
        mensaje,
        pendienteActivacion: !!err?.data?.pendiente_activacion,
        correo: err?.data?.correo || null,
      }
    }
  }, [])

  // ---------------------------------------------------------------- Registro
  // El rol y la ficha los define el padrón; aquí solo se envían documento,
  // correo y clave. Devuelve el código de activación cuando el backend lo expone.
  const register = useCallback(async ({ tipo_documento, numero_documento, correo, password }) => {
    try {
      const res = await apiFetch('/general-users', {
        method: 'POST',
        auth: false,
        body: {
          tipo_documento,
          numero_documento: String(numero_documento).trim(),
          correo: correo.trim().toLowerCase(),
          password,
          password_confirmation: password,
        },
      })
      return {
        exito: true,
        correo: res?.correo || correo.trim().toLowerCase(),
        codigo: res?.codigo || null,
      }
    } catch (err) {
      return {
        exito: false,
        mensaje: err?.data?.message || 'No se pudo crear la cuenta.',
        errores: toFieldErrors(err?.data),
      }
    }
  }, [])

  // ---------------------------------------------------------------- Activación
  const activarCuenta = useCallback(async (correo, codigo) => {
    try {
      await apiFetch('/auth/activar', {
        method: 'POST',
        auth: false,
        body: { correo: correo.trim().toLowerCase(), codigo: String(codigo).trim() },
      })
      return { exito: true }
    } catch (err) {
      return { exito: false, mensaje: err?.data?.message || 'No se pudo activar la cuenta.' }
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

  // Tras cambiar la clave temporal, la sesión deja de estar pendiente.
  const marcarPasswordCambiada = useCallback(() => {
    setUser((actual) => (actual ? { ...actual, debeCambiarPassword: false } : actual))
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
    <AuthContext.Provider value={{ user, cargando, login, register, activarCuenta, cambiarMiContrasena, marcarPasswordCambiada, sincronizarSesion, logout, isAuthenticated: !!user }}>
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
