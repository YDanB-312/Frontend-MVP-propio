// Cliente HTTP de ProyecTwin.
//
// Única puerta de entrada a la API Laravel. Sin mocks y sin estado persistente
// en el navegador: la sesión viaja en una cookie httpOnly que el navegador
// gestiona sola (no es accesible desde JavaScript). Para métodos que escriben se
// añade el token CSRF (X-XSRF-TOKEN) que Laravel expone en la cookie XSRF-TOKEN.

const BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

// La cookie CSRF vive en la raíz del backend, no bajo el prefijo de la API:
// con BASE="/v1" debe pedirse a "/sanctum/csrf-cookie" (el proxy de Vite lo
// reenvía). Si BASE es absoluto, se conserva su origen.
const URL_CSRF = /^https?:/i.test(BASE)
  ? new URL("/sanctum/csrf-cookie", BASE).href
  : "/sanctum/csrf-cookie";

// Evento que avisa a la app de que la sesión dejó de ser válida (401).
export const EVENTO_SESION_EXPIRADA = "auth:expirada";

// ---------------------------------------------------------------- CSRF

function leerCookie(nombre) {
  try {
    const m = document.cookie.match(new RegExp("(^|; )" + nombre + "=([^;]*)"));
    return m ? decodeURIComponent(m[2]) : null;
  } catch {
    return null;
  }
}

let csrfListo = false;

// Pide la cookie CSRF una sola vez (Laravel la deja en XSRF-TOKEN).
async function asegurarCsrf() {
  if (csrfListo || leerCookie("XSRF-TOKEN")) {
    csrfListo = true;
    return;
  }
  try {
    await fetch(URL_CSRF, {
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    csrfListo = true;
  } catch {
    /* se reintentará en la próxima escritura */
  }
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
  if (!BASE && !path.startsWith("/")) throw new Error("Ruta inválida");
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

    // Las escrituras exigen el token CSRF (cookie httpOnly de sesión + header).
    if (!esGet) {
      await asegurarCsrf();
      const xsrf = leerCookie("XSRF-TOKEN");
      if (xsrf) headers["X-XSRF-TOKEN"] = xsrf;
    }

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeout);
    try {
      const res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        credentials: "include",
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
        // 401 en una llamada autenticada = sesión ausente o vencida. Se avisa a
        // la app (AuthContext limpia el usuario y la UI redirige a /login).
        if (res.status === 401 && auth) {
          try {
            window.dispatchEvent(new Event(EVENTO_SESION_EXPIRADA));
          } catch {
            /* entornos sin window */
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

// Registro público (multipart): adjunta el PDF que soporta el rol (aprendiz o
// instructor). La cuenta queda pendiente de verificación del administrador.
export async function apiRegistro(datos, archivo) {
  await asegurarCsrf();

  const headers = { Accept: "application/json" };
  const xsrf = leerCookie("XSRF-TOKEN");
  if (xsrf) headers["X-XSRF-TOKEN"] = xsrf;

  const fd = new FormData();
  Object.entries(datos).forEach(([clave, valor]) => fd.append(clave, valor));
  if (archivo) fd.append("soporte", archivo);

  const res = await fetch(`${BASE}/general-users`, {
    method: "POST",
    headers,
    body: fd,
    credentials: "include",
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const err = new Error(data?.message || `Error ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export async function apiLogin(correo, password, remember = false) {
  // La sesión queda en la cookie httpOnly que devuelve el servidor.
  return apiFetch("/auth/login", {
    method: "POST",
    body: { correo, password, recordarme: !!remember },
    auth: false,
  });
}

export function apiLogout() {
  return apiFetch("/auth/logout", { method: "POST" }).catch(() => null);
}

export function apiMe() {
  return apiFetch("/auth/me");
}

// Cambio de la propia contraseña: el backend valida la actual y NO emite token
// nuevo (la sesión se conserva).
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

// Recuperación de contraseña por correo (en `local` la respuesta trae
// `reset_url` para poder probarlo sin abrir el correo).
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
