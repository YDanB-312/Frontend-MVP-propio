// Cliente HTTP de ProyecTwin.
//
// Única puerta de entrada a la API Laravel. Sin mocks, sin fusión de fuentes y
// sin estado en memoria: cada llamada va al servidor con fetch().
// El token de Sanctum se guarda en localStorage (o sessionStorage si el
// usuario no marcó "recordarme") y se envía como Bearer.

const BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

const CLAVE_TOKEN = "auth_token";

// Evento que avisa a la app de que la sesión dejó de ser válida (401).
export const EVENTO_SESION_EXPIRADA = "auth:expirada";

// ---------------------------------------------------------------- Token

function getToken() {
  try {
    return (
      localStorage.getItem(CLAVE_TOKEN) || sessionStorage.getItem(CLAVE_TOKEN)
    );
  } catch {
    return null;
  }
}

export function setAuthToken(token, remember = true) {
  // Cambio de sesión (login/logout): los datos en caché pertenecen al usuario
  // anterior, así que se descartan.
  if (getToken() !== (token || null)) invalidarCache();
  const destino = remember ? localStorage : sessionStorage;
  const otro = remember ? sessionStorage : localStorage;
  try {
    if (token) destino.setItem(CLAVE_TOKEN, token);
    else {
      localStorage.removeItem(CLAVE_TOKEN);
      sessionStorage.removeItem(CLAVE_TOKEN);
    }
    otro.removeItem(CLAVE_TOKEN);
  } catch {
    /* almacenamiento no disponible */
  }
}

export function haySesion() {
  return !!getToken();
}

// ---------------------------------------------------------------- Caché de GET
//
// Dos problemas concretos de rendimiento que se resuelven aquí, sin tocar cada
// página:
//   1. Peticiones idénticas simultáneas (p. ej. React StrictMode monta los
//      efectos dos veces en desarrollo, o la campana y el perfil se piden en
//      cada página) se unifican en una sola llamada de red.
//   2. Un GET repetido dentro del TTL no vuelve al servidor.
// Cualquier escritura (POST/PUT/PATCH/DELETE) invalida la caché completa, para
// que el patrón "mutar y recargar" siga viendo datos frescos.
const TTL_GET_MS = 15000;

let generacion = 0;
const cacheGet = new Map(); // url -> { ts, data }
const enVuelo = new Map(); // url -> Promise

// Descarta lo cacheado y anula escrituras pendientes de peticiones en curso.
export function invalidarCache() {
  generacion++;
  cacheGet.clear();
  enVuelo.clear();
}

// ---------------------------------------------------------------- Fetch

// Construye un query string ignorando valores vacíos.
export function qs(params = {}) {
  const partes = Object.entries(params)
    .filter(
      ([, v]) => v !== undefined && v !== null && v !== "" && v !== "todos",
    )
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
  return partes.length ? `?${partes.join("&")}` : "";
}

// Petición base. Valida `response.ok` (fetch resuelve incluso en 4xx/5xx) y
// lanza un Error enriquecido con `status` y `data` para que la UI decida.
// `cache: false` fuerza ir a la red (p. ej. un "Recargar" explícito).
export async function apiFetch(
  path,
  { method = "GET", body, auth = true, timeout = 15000, cache = true } = {},
) {
  if (!BASE) throw new Error("VITE_API_URL no configurado");
  const url = `${BASE}${path.startsWith("/") ? "" : "/"}${path}`;

  const esGet = method === "GET";
  const usaCache = esGet && cache;
  const gen = generacion;

  if (usaCache) {
    const guardado = cacheGet.get(url);
    if (guardado && Date.now() - guardado.ts < TTL_GET_MS) return guardado.data;
    const enCurso = enVuelo.get(url);
    if (enCurso) return enCurso;
  }

  // Una escritura invalida lo cacheado antes y después: cualquier GET lanzado
  // mientras tanto traerá datos frescos.
  if (!esGet) invalidarCache();
  const genEscritura = generacion;

  const peticion = (async () => {
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    const token = auth ? getToken() : null;
    if (token) headers.Authorization = `Bearer ${token}`;

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeout);
    try {
      const res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: ctrl.signal,
      });
      const text = await res.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = text;
      }

      if (!res.ok) {
        // 401 en una llamada autenticada = token inválido o vencido. Se descarta
        // la sesión local y se avisa a la app (AuthContext redirige a /login).
        if (res.status === 401 && auth) {
          setAuthToken(null);
          try {
            window.dispatchEvent(new Event(EVENTO_SESION_EXPIRADA));
          } catch {
            /* SSR/entornos sin window */
          }
        }
        const err = new Error(data?.message || `Error ${res.status}`);
        err.status = res.status;
        err.data = data;
        throw err;
      }
      if (usaCache && gen === generacion)
        cacheGet.set(url, { ts: Date.now(), data });
      return data;
    } catch (err) {
      if (err?.name === "AbortError") {
        const e = new Error("El servidor tardó demasiado en responder.");
        e.status = 0;
        throw e;
      }
      throw err;
    } finally {
      clearTimeout(timer);
      if (enVuelo.get(url) === peticion) enVuelo.delete(url);
      if (!esGet && genEscritura === generacion) invalidarCache();
    }
  })();

  if (usaCache) enVuelo.set(url, peticion);
  return peticion;
}

// ---------------------------------------------------------------- Sesión

export async function apiLogin(correo, password, remember = true) {
  const data = await apiFetch("/auth/login", {
    method: "POST",
    body: { correo, password },
    auth: false,
  });
  if (data.token) setAuthToken(data.token, remember);
  return data; // { user, token, rol }
}

export function apiLogout() {
  // Se captura el token actual para revocarlo; al terminar solo se limpia si
  // sigue siendo el mismo (si el usuario volvió a iniciar sesión, no se borra
  // el token nuevo).
  const previo = getToken();
  return apiFetch("/auth/logout", { method: "POST" })
    .catch(() => null)
    .finally(() => {
      if (getToken() === previo) setAuthToken(null);
    });
}

export function apiMe() {
  return apiFetch("/auth/me");
}

// Cambio de la propia contraseña: el backend valida la actual y NO emite token
// nuevo (la sesión y el "Recordarme" se conservan).
export function apiChangePassword(passwordActual, password) {
  return apiFetch("/auth/password", {
    method: "PUT",
    body: {
      password_actual: passwordActual,
      password,
      password_confirmation: password,
    },
  });
}

// Recuperación de contraseña por correo (en local el enlace se escribe en el log;
// en `local` la respuesta además trae `reset_url` para poder probarlo).
export function apiForgotPassword(correo) {
  return apiFetch("/auth/forgot-password", {
    method: "POST",
    body: { correo },
    auth: false,
  });
}

export function apiResetPassword({
  correo,
  token,
  password,
  password_confirmation,
}) {
  return apiFetch("/auth/reset-password", {
    method: "POST",
    body: { correo, token, password, password_confirmation },
    auth: false,
  });
}

// ---------------------------------------------------------------- Utilidades

// Errores 422 de Laravel → { campo: mensaje } para los formularios.
export function toFieldErrors(payload) {
  if (!payload?.errors) return {};
  const out = {};
  for (const [k, v] of Object.entries(payload.errors))
    out[k] = Array.isArray(v) ? v[0] : v;
  return out;
}
