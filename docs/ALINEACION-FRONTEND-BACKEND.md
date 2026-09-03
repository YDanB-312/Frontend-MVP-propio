# Auditoría de Alineación Frontend ↔ Backend — ProyecTwin MVP

**Fecha:** 2026-08-28
**Estado:** Auditoría documental (sin cambios de código)
**Alcance:** Verificar el grado de alineación entre el frontend React (datos 100% mock) y la API Laravel (`/api/v1`).

---

## 1. Resumen ejecutivo

El frontend **no consume** la API backend: toda su capa de datos vive en
`src/data/mockData.js` (una "base de datos en memoria + localStorage"), con
funciones síncronas de tipo `getAllX / createX / updateX / deleteX`.
El backend expone un **CRUD REST genérico** para 13 recursos bajo `/api/v1`.

No existe alineación operativa hoy (cero `fetch`/`axios` en el frontend).
La auditoría identifica **4 desajustes estructurales críticos**, **divergencias
de nomenclatura**, **enums que no coinciden** y **una escala de similitud
distinta** que bloquearían una integración directa.

**Veredicto:** el frontend y el backend están **desalineados** en un grado que
impide una integración "plug & play". Para alinearlos habría que: (a) mapear
campos, (b) resolver modelos divergentes (integrantes, hilos, motor de
similitud) y (c) armonizar enums y escala de porcentaje. La autenticación
queda **fuera de alcance** (descartada por ahora, ver §4.1).

---

## 2. Panorama de endpoints (backend)

**Base URL efectiva:** `/api/v1`

**Middleware del grupo `api`:** solo `ThrottleRequests` (60 req/min) y
`SubstituteBindings`. **No hay `auth:sanctum` / `auth:api`** → todas las rutas
son **públicas**. `routes/api.php` (con la ruta huérfana `/api/user`) **no se
carga**; el `RouteServiceProvider` solo carga `api-v1.php` y `web.php`.

| # | Recurso | Verbo/Ruta (todos bajo `/api/v1`) | Notas |
|---|---|---|---|
| 1 | GeneralUser | `GET/POST general-users` + `GET/PUT/DELETE general-users/{id}` | *usuario base* |
| 2 | TrainingProgram | `GET/POST training-programs` + `/{id}` | programa formación |
| 3 | Instructor | `GET/POST instructors` + `/{id}` | perfil instructor |
| 4 | ClassGroup | `GET/POST class-groups` + `/{id}` | ficha/grupo |
| 5 | Apprentice | `GET/POST apprentices` + `/{id}` | perfil aprendiz |
| 6 | Admin | `GET/POST admins` + `/{id}` | perfil admin |
| 7 | Project | `GET/POST projects` + `/{id}` | entidad central |
| 8 | Similarity | `GET/POST similarities` + `/{id}` | similitud de propuestas |
| 9 | Assessment | `GET/POST assessments` + `/{id}` | revisión del instructor |
| 10 | Notification | `GET/POST notifications` + `/{id}` | notificación |
| 11 | BugReport | `GET/POST bug-reports` + `/{id}` | reporte de falla |
| 12 | ApprenticeProject | `GET/POST apprentice-projects` + `/{id}` | pivote proyecto↔aprendiz |
| 13 | Comment | `GET/POST comments` + `/{id}` | comentario |

**Características del CRUD (común a todo):**
- `index()` → `Model::included()->get()`: **devuelve todo, SIN paginación**.
- `store()` → valida, `create`, devuelve el modelo (HTTP **200**, no 201).
- `show($id)` → `findOrFail` (404 si no existe).
- `update(Model)` → valida, `update`, devuelve el modelo.
- `destroy(Model)` → `delete`, **devuelve el modelo borrado** (no 204).
- **Eager loading** controlado por query `?included=rel1,rel2` (whitelist por
  modelo, p. ej. `projects?included=creator,classGroup,apprentices,comments`).
- Respuestas: JSON plano del modelo en **snake_case español**, con casts JSON
  para `objetivos`, `entregables`, `detalles` y timestamps `created_at/updated_at`.

---

## 3. Matriz de entidades: frontend (mock) ↔ backend (tabla)

### 3.1 Usuario / rol

| Concepto | Frontend `mockData` | Backend `general_users` | ¿Alineado? |
|---|---|---|---|
| Identidad | `{ id, name, email, role, estado, fichaId?, programa?, fotoPerfil? }` | `{ id, nombre, apellido, correo, password, foto_url, rol, estado, ... }` | **No** |
| Nombre | `name` (una sola cadena, "María González") | `nombre` + `apellido` (2 campos) | **No** |
| Email | `email` | `correo` | **No** |
| Rol | `role` = `aprendiz\|instructor\|admin` | `rol` = enum `aprendiz\|instructor\|admin` | **Sí** (valor) |
| Activo | `estado` (1/0) | `estado` (boolean default 1) | **Sí** (valor) |
| Sesión | `{ id, correo, nombre, rol }` (español) | N/A (sin auth) | — |
| Perfil por rol | denormalizado (`fichaId`, `programa` en el user) | tablas 1:1 `apprentices`/`instructors`/`admins` | **No** (modelo) |
| Foto | `fotoPerfil` (DataURL base64) | `foto_url` (string ruta) | **Parcial** (formato) |
| Password | `state.passwords` (mapa aparte) | `password` (texto plano, oculto en API) | **No** |

### 3.2 Ficha / grupo (`class_groups`)

| Concepto | Frontend mock | Backend | ¿Alineado? |
|---|---|---|---|
| Campo | `{ id, codigo, numero, nombre, programa, idPrograma, aprendices, proyectos, estado, instructorName, instructorId, createdAt, estudiantes[] }` | `{ id, codigo, numero, nombre, estado, id_programa, id_instructor }` | **Parcial** |
| Prog / Instructor | `programa` (nombre) + `instructorName` + `instructorId` | FK `id_programa` + `id_instructor` | mapeable |
| Aprendices | `estudiantes[]` = `{id, name}` + contador `aprendices` | relación `hasMany(Apprentice)` | **No** (denorm. vs rel.) |
| Estado | enum `activo|inactivo|finalizado` | enum `activo|inactivo` | **No** (`finalizado`) |
| `idPrograma` | solo en seed; `createFicha()` **no lo setea** | `id_programa` required en validación | **No** (bug mock) |
| Codigo join | `joinFicha(codigo)` (función dedicada) | sin endpoint dedicado | **No** (falta lógica) |

### 3.3 Proyecto (`projects`) — entidad central

| Concepto | Frontend mock | Backend | ¿Alineado? |
|---|---|---|---|
| Campo | `{ id, title, description, estado, studentId, studentName, instructorId, instructorName, fichaId, createdAt, keywords, objectives, deliverables, technologies, areaAplicacion, projectType, observaciones, integrantes[] }` | `{ id, titulo, resumen, tipo_proyecto, palabras_clave, area_aplicacion, tecnologias, objetivos(json), entregables(json), url_logo, estado, observaciones, id_creador, id_instructor_asignado, id_class_group }` | **No** |
| Título | `title` | `titulo` | **No** |
| Resumen | `description` | `resumen` | **No** |
| Creador | `studentId` + `studentName` (denorm) | FK `id_creador` (+ rel `creator`) | **No** (modelo) |
| Palabras clave | `keywords` | `palabras_clave` (text) | **No** |
| Area | `areaAplicacion` | `area_aplicacion` | **No** |
| Objetivos | `objectives` + `objetivoGeneral` + `objetivosEspecificos` (solo ids 1,4) | `objetivos` (json) | **No** |
| Entregables | `deliverables` | `entregables` (json) | **No** |
| Estado | enum 9 valores | enum 6 valores | **No** (ver §5) |
| **Integrantes** | `integrantes[]` (array de nombres) | tabla pivote `apprentice_projects` (N:M) | **No** (modelo distinto) |

### 3.4 Similitud (`similarities`)

| Concepto | Frontend mock | Backend | ¿Alineado? |
|---|---|---|---|
| Campo | `{ id, projectId1, projectId2, project1Title, project2Title, project1Student, project2Student, similitud, estado, createdAt }` | `{ id, id_proyecto_1, id_proyecto_2, porcentaje, estado, detalles(json), fecha, id_instructor }` | **No** |
| **Escala de valor** | `similitud` float **0–1** (seed: 0.45, 0.38, 0.52) | `porcentaje` float **0–100** (seed: 45.0, 61.0, 38.0, 52.0) | **No** (escala) |
| Títulos denorm | `project1Title`/`project2Title`/`Student` | rel `project1`/`project2` (tables join) | **No** (denorm vs rel) |
| Estado | enum `pendiente|revisada|resuelta` | enum `pendiente|revisada|resuelta` | **Sí** |
| **Motor de detección** | `detectarSimilitudes()` calcula Jaccard al aprobar (`UMBRAL_SIMILITUD=0.2`, corpus histórico aprobado del programa) | **no existe** — CRUD simple, sin algoritmo | **No** (gap funcional) |
| Fecha | `createdAt` (string dd/MM/yyyy) | `fecha` (date) | **No** (formato) |

### 3.5 Observación / comentario (`comments`)

| Concepto | Frontend mock | Backend | ¿Alineado? |
|---|---|---|---|
| Campo | `{ id, projectId, autor ("Nombre | Rol"), fecha, texto, respuestaA? }` | `{ id, texto, id_proyecto, id_usuario }` | **No** |
| **Hilos** | `respuestaA` (obs padre) → `agruparObservaciones()` | sin columna "padre/respuestaA" | **No** (gap) |
| Autor | string `"Carlos Ruiz | Instructor"` | FK `id_usuario` | **No** (modelo) |

### 3.6 Notificación (`notifications`)

| Concepto | Frontend mock | Backend | ¿Alineado? |
|---|---|---|---|
| Campo | `{ id, mensaje, tipo, userId, projectId?, reporteId?, leido, createdAt }` | `{ id, titulo, descripcion, tipo, enlace, leida, fecha, id_usuario }` | **Parcial** |
| Tipo | enum `similitud|observacion|revision|mensaje|sistema` | enum `similitud|revision|mensaje|sistema` | **No** (`observacion`) |
| Marcada leída | `markAllNotificationsAsRead(userId)` (función dedicada) | solo `PUT` por recurso (1 a 1) | **No** (falta bulk) |

### 3.7 Reporte de falla (`bug_reports`)

| Concepto | Frontend mock | Backend | ¿Alineado? |
|---|---|---|---|
| Campo | `{ id, titulo, descripcion, tipo, estado, reporterId, reporterName, createdAt, pasos? , updatedAt? }` | `{ id, titulo, descripcion, tipo, pasos, url_evidencia, estado, fecha, id_usuario, id_admin }` | **Parcial** |
| Tipo | enum `sistema|proyecto|datos|otro` | enum `sistema|proyecto|datos|otro` | **Sí** |
| Estado | enum `pendiente|en_revision|resuelto|cerrado|rechazado` | enum `pendiente|en_revision|resuelto|rechazado` | **No** (`cerrado`) |
| Reporter | `reporterId` + `reporterName` | FK `id_usuario` | mapeable |
| Lógica crear | notifica automáticamente a todos los admins activos | no existe (CRUD simple) | **No** (lógica) |

---

## 4. Desajustes críticos (bloquean integración directa)

### 4.1 Autenticación — DESCARTADA FUERA DE ALCANCE
- **Decisión del usuario (2026-08-28): el auth queda descartado por el momento.**
  No se implementará autenticación en el backend ni se conectará `AuthContext`.
  La validación de credenciales y roles seguirá siendo únicamente del lado del
  frontend (mock), y las rutas del backend permanecen públicas.
- Estado actual (solo referencia): Sanctum instalado pero **sin**
  `personal_access_tokens`, **sin** `HasApiTokens`, sin rutas login/register/logout;
  middleware `AuthenticateApi.php` es no-op y no está registrado; `password` en
  texto plano en los controllers.
- → No es un bloqueante para esta auditoría ni para futuras fases; simplemente
  queda fuera del alcance.

### 4.2 Modelo de "integrantes" distinto
- Mock: `proyecto.integrantes[]` (array de nombres denormalizado).
- Backend: tabla pivote `apprentice_projects` (N:M) con `rol_en_proyecto`,
  `fecha_union` + 14 asignaciones sembradas.
- → Requiere migrar la lógica de "crear proyecto con integrantes" a inserciones
  en la pivote.

### 4.3 Hilos de observaciones sin soporte
- Mock: campo `respuestaA` + `agruparObservaciones()`.
- Backend: `comments` sin columna de padre → **no hay hilos**.

### 4.4 Motor de similitud ausente
- Mock: Jaccard + umbral 0.2 + corpus aprobado del programa, disparado al aprobar.
- Backend: CRUD simple de `similarities`, **sin algoritmo ni trigger**.

### 4.5 Lógica de negocio embebida en el frontend (sin endpoint)
- `updateProjectEstado('aprobado')` → dispara `detectarSimilitudes()` + notificaciones.
- `createBugReport` → notifica a todos los admins activos.
- `addObservacion` → notifica por rol del autor.
- `joinFicha(codigo)` → asigna ficha + estudiantes.
- `setUserActive`, `emailExists`, `updateUserPassword`, `markAllNotificationsAsRead`.
- → El backend solo expone CRUD; ninguna de estas operaciones compuestas tiene
  endpoint dedicado; habría que replicarlas en el cliente o añadir endpoints.

---

## 5. Divergencias de enums

| Enum | Frontend (mock) | Backend (BD/validación) | ¿Coinciden? |
|---|---|---|---|
| `userRole` | aprendiz, instructor, admin | aprendiz, instructor, admin | ✅ |
| `ProjectStatus` | borrador, pendiente, en_revision, aprobado, rechazado, requiere_ajustes, **en_progreso, completado, cancelado** | borrador, pendiente, en_revision, aprobado, rechazado, requiere_ajustes | ❌ mock añade 3 |
| `ClassGroupStatus` | activo, inactivo, **finalizado** | activo, inactivo | ❌ mock añade `finalizado` |
| `BugReportStatus` | pendiente, en_revision, resuelto, **cerrado**, rechazado | pendiente, en_revision, resuelto, rechazado | ❌ mock añade `cerrado` |
| `BugReportType` | sistema, proyecto, datos, otro | sistema, proyecto, datos, otro | ✅ |
| `SimilarityStatus` | pendiente, revisada, resuelta | pendiente, revisada, resuelta | ✅ |
| `NotificationType` | similitud, **observacion**, revision, mensaje, sistema | similitud, revision, mensaje, sistema | ❌ mock añade `observacion` |

> Nota: los valores que el mock usa y el backend **no** acepta son los que
> **romperían una validación Laravel** (`in:...`) si se intentara persistir.

---

## 6. Nomenclatura de campos (resumen del mapeo requerido)

| Frontend (mock, inglés) | Backend (Laravel, español) |
|---|---|
| `name` | `nombre` + `apellido` |
| `email` | `correo` |
| `role` | `rol` |
| `title` / `description` | `titulo` / `resumen` |
| `keywords` | `palabras_clave` |
| `objectives` | `objetivos` (json) |
| `deliverables` | `entregables` (json) |
| `technologies` | `tecnologias` |
| `areaAplicacion` | `area_aplicacion` |
| `projectType` | `tipo_proyecto` |
| `fichaId` / `instructorId` / `studentId` | `id_class_group` / `id_instructor`(asignado) / `id_creador` |
| `projectId` / `userId` / `reporterId` | `id_proyecto` / `id_usuario` / `id_usuario` |
| `similitud` (0–1) | `porcentaje` (0–100) |
| `mensaje` (notif) | `titulo` + `descripcion` |
| `leido` / `leida` | `leida` |
| `createdAt` (dd/MM/yyyy) | `created_at` / `fecha` (ISO/date) |

---

## 7. Otros desajustes de comportamiento

| Aspecto | Frontend | Backend | Impacto |
|---|---|---|---|
| **Paginación** | componente `Pagination` (itemsPerPage) | `index()` devuelve todo (`->get()`, sin paginate) | hay que paginar en cliente o añadir `paginate()` |
| **Formato de fechas** | strings `dd/MM/yyyy` / `d MMM yyyy`, helpers `formatearFecha/parseFecha` | `date` / ISO `created_at` | requiere parseo/formateo |
| **Asincronía** | capa de datos **100% síncrona** (sin Promises) | HTTP asíncrono | hay que introducir loading/estados async |
| **Persistencia** | `localStorage` (`proyectwin_mock_v2`) | BD MySQL (`proyectwin_mvp`) | reemplazo de fuente de verdad |
| **Auth/roles** | `ProtectedRoute` + `RUTA_POR_ROL` (solo frontend) | sin protección | fuera de alcance (sin conectar) |

---

## 8. Coincidencias / puntos alineados ✅

- Roles (`aprendiz|instructor|admin`) y su semántica por ruta de dashboard.
- Enum `userRole`, `SimilarityStatus`, `BugReportType` coinciden byte a byte.
- Estados base de proyecto (`borrador|pendiente|en_revision|aprobado|rechazado|requiere_ajustes`) coinciden; el mock solo añade extra que el backend no usa.
- `estado` activo/inactivo del usuario (bool) coincide.
- Volumen de datos de ejemplo en seed y en mock es similar (13 usuarios, 4 fichas, 8 proyectos, 3–4 similitudes, 6 bug reports, ~10 notificaciones, 3 comentarios), lo que facilita mapear seeds→mock.

---

## 9. Trabajo estimado para una futura integración (referencia)

> No se ejecuta en esta auditoría; se documenta como hoja de ruta.

1. **Capa de datos HTTP**: crear módulo `src/services/api.js` con fetch/axios;
   reescribir `mockData.js` como cliente asíncrono (loading states, errores).
2. **Mapeo de campos** (tabla §6) vía transformadores request/response.
3. **Auth**: **descartada fuera de alcance** por decisión del usuario. El
   `AuthContext` sigue validando contra mock y las rutas backend permanecen
   públicas; no se implementará Sanctum por ahora.
4. **Modelos divergentes**: integrantes → pivote `apprentice_projects`;
   hilos de observaciones → añadir `respuesta_a` a `comments`; unificar escala
   `similitud`/`porcentaje` (0–100) y formatos de fecha.
5. **Enums**: armonizar `ProjectStatus`, `ClassGroupStatus`, `BugReportStatus`,
   `NotificationType` (retirar valores que el backend no acepta o añadirlos en BD).
6. **Lógica de negocio**: portar motor de similitud, notificaciones automáticas y
   operaciones compuestas (join, marcar todas leídas, activar/desactivar) como
   endpoints o eventos backend.
7. **Paginación**: decidir cliente vs `paginate()`; probar `?included=` para detalle.

---

## 10. Archivos de referencia

- Frontend (datos): `MVP/frontend/src/data/mockData.js`
- Frontend (auth): `MVP/frontend/src/contexts/AuthContext.jsx`
- Frontend (helpers): `MVP/frontend/src/utils/helpers.js`, `notificaciones.js`, `foto.js`
- Backend (rutas): `MVP/backend/routes/api-v1.php`
- Backend (controladores): `MVP/backend/app/Http/Controllers/Api/*`
- Backend (modelos): `MVP/backend/app/Models/*`
- Backend (esquema): `MVP/backend/database/migrations/*`
- Backend (seed): `MVP/backend/database/seeders/DatabaseSeeder.php`
