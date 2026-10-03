// Capa de acceso a la API.
//
// Cada recurso expone funciones que devuelven directamente los datos del
// servidor (columnas del backend). No hay mocks ni transformaciones ocultas:
// las páginas piden lo que necesitan y resuelven las relaciones por `included`.
import { apiFetch, qs } from "./api";

const lista = (data) => (Array.isArray(data) ? data : (data?.data ?? []));

// ---------------------------------------------------------------- Usuarios
export const usuarios = {
  listar: (filtros = {}) =>
    apiFetch(`/general-users${qs(filtros)}`).then(lista),
  // Paginación en el servidor: devuelve { filas, total, ultimaPagina }.
  pagina: (filtros = {}) =>
    apiFetch(`/general-users${qs(filtros)}`).then((data) => ({
      filas: data?.data ?? [],
      total: data?.total ?? 0,
      ultimaPagina: data?.last_page ?? 1,
    })),
  obtener: (id, included = "apprentice,instructor,admin") =>
    apiFetch(`/general-users/${id}${qs({ included })}`),
  // Perfil público (vistas entre usuarios: compañero/instructor): solo datos básicos.
  perfil: (id) => apiFetch(`/general-users/${id}/perfil`),
  crear: (body) => apiFetch("/general-users", { method: "POST", body }),
  actualizar: (id, body) =>
    apiFetch(`/general-users/${id}`, { method: "PUT", body }),
  // Cambio del propio correo: el backend exige la contraseña actual.
  cambiarCorreo: (correo, passwordActual) =>
    apiFetch("/auth/email", {
      method: "PUT",
      body: { correo, password_actual: passwordActual },
    }),
  eliminar: (id) => apiFetch(`/general-users/${id}`, { method: "DELETE" }),
};

// ---------------------------------------------------------------- Padrón
// Identidades institucionales (solo admin): alta, retiro y códigos de
// activación de las cuentas registradas que aún no están activas.
export const padron = {
  listar: (filtros = {}) => apiFetch(`/padron${qs(filtros)}`).then(lista),
  crear: (body) => apiFetch("/padron", { method: "POST", body }),
  eliminar: (id) => apiFetch(`/padron/${id}`, { method: "DELETE" }),
  codigos: () => apiFetch("/padron/codigos").then(lista),
  regenerarCodigo: (idUsuario) =>
    apiFetch(`/padron/${idUsuario}/codigo`, { method: "POST", body: {} }),
};

// ---------------------------------------------------------------- Catálogos
export const redes = {
  listar: () => apiFetch("/knowledge-networks").then(lista),
  crear: (body) => apiFetch("/knowledge-networks", { method: "POST", body }),
  actualizar: (id, body) =>
    apiFetch(`/knowledge-networks/${id}`, { method: "PUT", body }),
  // Guardado por lote: nombre + programas (crear/renombrar/eliminar) en una
  // sola transacción del servidor.
  sincronizar: (id, body) =>
    apiFetch(`/knowledge-networks/${id}/programas`, { method: "PUT", body }),
  eliminar: (id) => apiFetch(`/knowledge-networks/${id}`, { method: "DELETE" }),
};

export const programas = {
  listar: (included = "knowledgeNetwork") =>
    apiFetch(`/training-programs${qs({ included })}`).then(lista),
  crear: (body) => apiFetch("/training-programs", { method: "POST", body }),
  actualizar: (id, body) =>
    apiFetch(`/training-programs/${id}`, { method: "PUT", body }),
  eliminar: (id) => apiFetch(`/training-programs/${id}`, { method: "DELETE" }),
};

// ---------------------------------------------------------------- Perfiles
export const instructores = {
  listar: (included = "generalUser") =>
    apiFetch(`/instructors${qs({ included })}`).then(lista),
};

export const aprendices = {
  listar: (included = "generalUser,classGroup") =>
    apiFetch(`/apprentices${qs({ included })}`).then(lista),
  actualizar: (id, body) =>
    apiFetch(`/apprentices/${id}`, { method: "PUT", body }),
};

// ---------------------------------------------------------------- Fichas
export const fichas = {
  listar: (included = "program,instructor.generalUser", filtros = {}) =>
    apiFetch(`/class-groups${qs({ included, ...filtros })}`).then(lista),
  obtener: (
    id,
    included = "program,instructor.generalUser,apprentices.generalUser",
  ) => apiFetch(`/class-groups/${id}${qs({ included })}`),
  crear: (body) => apiFetch("/class-groups", { method: "POST", body }),
  actualizar: (id, body) =>
    apiFetch(`/class-groups/${id}`, { method: "PUT", body }),
  eliminar: (id) => apiFetch(`/class-groups/${id}`, { method: "DELETE" }),
};

// ---------------------------------------------------------------- Propuestas
export const proyectos = {
  listar: (filtros = {}) =>
    apiFetch(
      `/projects${qs({ included: "creator,instructor.generalUser,classGroup.program", ...filtros })}`,
    ).then(lista),
  obtener: (id) =>
    apiFetch(
      `/projects/${id}${qs({ included: "creator,instructor.generalUser,classGroup.program,apprentices.generalUser" })}`,
    ),
  crear: (body) => apiFetch("/projects", { method: "POST", body }),
  actualizar: (id, body) =>
    apiFetch(`/projects/${id}`, { method: "PUT", body }),
  eliminar: (id) => apiFetch(`/projects/${id}`, { method: "DELETE" }),
  // Equipo (pivote aprendiz ↔ proyecto). El servidor filtra por propuesta:
  // ya no se descarga la tabla completa para filtrar en el navegador.
  equipo: (idProyecto) =>
    apiFetch(
      `/apprentice-projects${qs({
        included: "apprentice.generalUser",
        id_proyecto: idProyecto,
      })}`,
    ).then(lista),
  agregarAlEquipo: (idAprendiz, idProyecto) =>
    apiFetch("/apprentice-projects", {
      method: "POST",
      body: { id_aprendiz: idAprendiz, id_proyecto: idProyecto },
    }),
  quitarDelEquipo: (idPivote) =>
    apiFetch(`/apprentice-projects/${idPivote}`, { method: "DELETE" }),
};

// ---------------------------------------------------------------- Similitudes
// Se incluyen los proyectos del par (con su equipo) para resolver títulos y
// autoría sin depender del listado global de propuestas.
const INCLUDE_SIMILITUD =
  "project1.classGroup.program,project2.classGroup.program,project1.creator,project2.creator,project1.apprentices.generalUser,project2.apprentices.generalUser";

export const similitudes = {
  listar: (filtros = {}) =>
    apiFetch(
      `/similarities${qs({ included: INCLUDE_SIMILITUD, ...filtros })}`,
    ).then(lista),
  obtener: (id) =>
    apiFetch(`/similarities/${id}${qs({ included: INCLUDE_SIMILITUD })}`),
  // El motor puede tardar (BM25 + LSA + pasajes): timeout amplio.
  detectar: (idProyecto) =>
    apiFetch("/similarities/detect", {
      method: "POST",
      body: { id_proyecto: idProyecto },
      timeout: 120000,
    }),
  recalcular: () =>
    apiFetch("/similarities/recalculate", {
      method: "POST",
      body: {},
      timeout: 120000,
    }),
  eliminar: (id) => apiFetch(`/similarities/${id}`, { method: "DELETE" }),
};

// ---------------------------------------------------------------- Stats
// Conteos agregados por rol: los tableros ya no descargan colecciones enteras
// solo para pintar números.
export const stats = {
  resumen: () => apiFetch("/stats/resumen"),
};

// ---------------------------------------------------------------- Motor
export const motor = {
  // Lectura pública de la configuración global (landing, barra de gobierno y admin).
  obtener: () => apiFetch("/config-similitud"),
  actualizar: (umbral, meses) =>
    apiFetch("/config-similitud", { method: "PUT", body: { umbral, meses } }),
};

// ---------------------------------------------------------------- Demo pública
// Endpoints abiertos que usa la landing: cualquier visitante puede probar el
// motor sin iniciar sesión. Devuelven solo datos agregados o títulos y %.
export const demo = {
  resumen: () => apiFetch("/public/resumen", { auth: false }),
  comparar: (texto) =>
    apiFetch("/public/demo-similitud", {
      method: "POST",
      body: { texto },
      auth: false,
    }),
};

// ---------------------------------------------------------------- Notificaciones
export const notificaciones = {
  listar: (filtros = {}) =>
    apiFetch(`/notifications${qs(filtros)}`).then(lista),
  crear: (body) => apiFetch("/notifications", { method: "POST", body }),
  // Recibe la notificación completa (el backend exige varios campos en el PUT).
  marcarLeida: (notificacion, leida = true) =>
    apiFetch(`/notifications/${notificacion.id}`, {
      method: "PUT",
      body: { ...notificacion, leida },
    }),
  eliminar: (id) => apiFetch(`/notifications/${id}`, { method: "DELETE" }),
};

// ---------------------------------------------------------------- Reportes
export const reportes = {
  listar: (included = "generalUser") =>
    apiFetch(`/bug-reports${qs({ included })}`).then(lista),
  obtener: (id) =>
    apiFetch(`/bug-reports/${id}${qs({ included: "generalUser" })}`),
  crear: (body) => apiFetch("/bug-reports", { method: "POST", body }),
  actualizar: (id, body) =>
    apiFetch(`/bug-reports/${id}`, { method: "PUT", body }),
  eliminar: (id) => apiFetch(`/bug-reports/${id}`, { method: "DELETE" }),
};

// ---------------------------------------------------------------- Observaciones
export const observaciones = {
  listar: (included = "user", filtros = {}) =>
    apiFetch(`/comments${qs({ included, ...filtros })}`).then(lista),
  crear: (body) => apiFetch("/comments", { method: "POST", body }),
  eliminar: (id) => apiFetch(`/comments/${id}`, { method: "DELETE" }),
};

// ---------------------------------------------------------------- Bitácora (solo admin, inmutable)
export const auditoria = {
  listar: (filtros = {}) => apiFetch(`/audit-logs${qs(filtros)}`).then(lista),
};
