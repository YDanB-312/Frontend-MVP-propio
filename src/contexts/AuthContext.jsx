import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { RUTA_POR_ROL } from '../constants/routes'
import {
  apiFetch, apiLogin, apiLogout, apiMe, apiChangePassword, setAuthToken, haySesion,
  EVENTO_SESION_EXPIRADA,
} from '../lib/api'

// Sesión del usuario.
//
// Fuente única: la API. `user` es una versión mínima de la cuenta
// ({ id, correo, nombre, rol }) que se guarda en localStorage/sessionStorage
// solo para pintar la interfaz sin parpadeos; el token vive aparte y se
// valida contra /auth/me al recargar.

const AuthContext = createContext(null)

const CLAVE_USUARIO = 'auth_user'

function leerUsuarioGuardado() {
  const guardado = localStorage.getItem(CLAVE_USUARIO) || sessionStorage.getItem(CLAVE_USUARIO)
  if (!guardado) return null
  try {
    return JSON.parse(guardado)
  } catch {
    localStorage.removeItem(CLAVE_USUARIO)
    sessionStorage.removeItem(CLAVE_USUARIO)
    return null
  }
}

function guardarUsuario(usuario, remember = true) {
  const destino = remember ? localStorage : sessionStorage
  const otro = remember ? sessionStorage : localStorage
  destino.setItem(CLAVE_USUARIO, JSON.stringify(usuario))
  otro.removeItem(CLAVE_USUARIO)
}

function limpiarUsuario() {
  localStorage.removeItem(CLAVE_USUARIO)
  sessionStorage.removeItem(CLAVE_USUARIO)
}

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
  const [user, setUser] = useState(leerUsuarioGuardado)

  // ---------------------------------------------------------------- Login
  const login = useCallback(async (correo, password, recordarme) => {
    try {
      const { user: cuenta } = await apiLogin(correo.trim().toLowerCase(), password, recordarme)
      const sesion = aSesion(cuenta)
      guardarUsuario(sesion, recordarme)
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
  // Cambio autenticado: verifica la actual y actualiza el propio perfil.
  const cambiarMiContrasena = useCallback(async (actual, nueva) => {
    if (!user?.id) return { exito: false, mensaje: 'Sesión no válida. Inicia sesión de nuevo.' }
    try {
      // El backend valida la actual y actualiza sin emitir token nuevo.
      await apiChangePassword(actual, nueva)
      return { exito: true }
    } catch (err) {
      return { exito: false, mensaje: err?.data?.message || 'No se pudo actualizar la contraseña.' }
    }
  }, [user])

  // ---------------------------------------------------------------- Logout
  const logout = useCallback(() => {
    // apiLogout captura el token actual para revocarlo en el servidor; acto
    // seguido se limpia el local para no dejar un token viejo que provoque un
    // 401 en la siguiente navegación.
    apiLogout()
    setAuthToken(null)
    limpiarUsuario()
    setUser(null)
  }, [])

  // Refresca nombre/correo tras editar el perfil (estado + almacenamiento), para
  // que la cabecera y los formularios no sigan mostrando los datos viejos.
  const sincronizarSesion = useCallback((nombre, correo) => {
    setUser((actual) => {
      if (!actual) return actual
      const sesion = { ...actual, nombre: nombre || actual.nombre, correo: correo || actual.correo }
      guardarUsuario(sesion, !!localStorage.getItem(CLAVE_USUARIO))
      return sesion
    })
  }, [])

  // Rehidratar/validar la cuenta al arrancar: si hay token, se pregunta a la
  // API quién es. Un token inválido (p. ej. tras resembrar la base) limpia la
  // sesión en lugar de dejar la UI "logueada" mostrando errores.
  useEffect(() => {
    if (!haySesion()) return
    let vivo = true
    apiMe()
      .then((cuenta) => {
        if (!vivo || !cuenta?.id) return
        const sesion = aSesion(cuenta)
        guardarUsuario(sesion, !!localStorage.getItem(CLAVE_USUARIO))
        setUser(sesion)
      })
      .catch(() => {
        if (!vivo) return
        setAuthToken(null)
        limpiarUsuario()
        setUser(null)
      })
    return () => { vivo = false }
  }, [])

  // La API avisa (evento global) cuando una llamada autenticada recibe 401.
  useEffect(() => {
    const alExpirar = () => {
      limpiarUsuario()
      setUser(null)
    }
    window.addEventListener(EVENTO_SESION_EXPIRADA, alExpirar)
    return () => window.removeEventListener(EVENTO_SESION_EXPIRADA, alExpirar)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, register, cambiarMiContrasena, sincronizarSesion, logout, isAuthenticated: !!user }}>
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
