// Cliente HTTP para Laravel + Sanctum (npm, JS).
// Con VITE_API_URL usa API real con Bearer token; sin él, el frontend cae a mock.

const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

function getToken() {
  try { return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') } catch { return null }
}

export function setAuthToken(token, remember = true) {
  try {
    const store = remember ? localStorage : sessionStorage
    if (token) store.setItem('auth_token', token)
    else { localStorage.removeItem('auth_token'); sessionStorage.removeItem('auth_token') }
  } catch {
    /* almacenamiento no disponible */
  }
}

export async function apiFetch(path, { method = 'GET', body, headers = {}, auth = true } = {}) {
  if (!BASE) throw new Error('VITE_API_URL no configurado')
  const url = `${BASE}${path.startsWith('/') ? '' : '/'}${path}`
  const token = auth ? getToken() : null
  if (auth && token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let data
  try { data = text ? JSON.parse(text) : null } catch { data = text }
  if (!res.ok) {
    const err = new Error(data?.message || `HTTP ${res.status}`)
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

// Login helper con Sanctum (guarda token)
export async function apiLogin(correo, password, remember = true) {
  const data = await apiFetch('/auth/login', { method: 'POST', body: { correo, password }, auth: false })
  if (data.token) setAuthToken(data.token, remember)
  return data
}

export function apiLogout() {
  return apiFetch('/auth/logout', { method: 'POST' }).finally(() => setAuthToken(null))
}

// Helper para mapear errores 422 de Laravel a formato de FormField
export function toFieldErrors(payload) {
  if (!payload?.errors) return {}
  const out = {}
  for (const [k, v] of Object.entries(payload.errors)) out[k] = Array.isArray(v) ? v[0] : v
  return out
}
