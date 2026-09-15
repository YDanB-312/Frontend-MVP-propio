// Diccionario JS del contrato (fuente única para no romper E2E).
// Cada entrada mapea mockData.js ↔ Laravel Resource + validation rules.

/**
 * @typedef {'aprendiz'|'instructor'|'admin'} Rol
 * @typedef {'activo'|'suspendido'} EstadoUser
 * @typedef {'activo'|'inactivo'|'finalizado'} EstadoFicha
 * @typedef {'pendiente'|'aprobado'|'rechazado'} EstadoProyecto
 */

// Ejemplo: ProjectDTO expone `programa` denormalizado para que
// `?programa=ADSO` siga funcionando aunque backend normalice por FK.

/** @type {Record<string,string>} Reglas espejo de backend */
export const VALIDATION_HINTS = Object.freeze({
  // Laravel: 'nombre:required|max:255' ↔ React: nombre>=2
  // Mantener sincronizado con GeneralUserController, ClassGroupController, ProjectController
  user_nombre_min: 2,
  ficha_numero_re: /^\d{4,8}$/,
})
