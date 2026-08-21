# Changelog — ProyecTwin MVP (Frontend)

## Fase 1 — Sidebar Toggle (DashboardLayout)
- DashboardLayout.jsx: `useState` for `sidebarOpen`, passed `onToggleSidebar` to Header, `isOpen`/`onClose` to Sidebars.
- Header.jsx: hamburger `<a>` → `<button onClick={onToggleSidebar}>`.
- SidebarAprendiz/Instructor/Admin.jsx: receive `isOpen`/`onClose` props; `<NavLink onClick={onClose}>` to auto-close on navigation.
- SidebarAprendiz.css: `:target` → `.abierto` class-based toggle.

## Fase 2 — GovernmentBar (Alto Contraste)
- GovernmentBar.jsx: `useState` for `altoContraste`, `useEffect` to toggle `.alto-contraste` on `document.body`.

## Fase 3 — Invitado Forms (Register, Recuperar, Restablecer)
- Register.jsx: 5 `useState` (nombre, apellido, correo, password, rol) + `useNavigate`.
- RecuperarContrasena.jsx: 1 `useState` (correo) + `useNavigate`.
- RestablecerContrasena.jsx: 2 `useState` (password, confirmar) + `useNavigate` + password-match guard.

## Fase 4 — Aprendiz Modules
- MisProyectos.jsx: 5 `useState` (filtroEstado, filtroFecha, filtroInstructor, busqueda, paginaActual).
- AlertasAprendiz.jsx: 5 `useState` (filtroTipo, filtroEstado, filtroProyecto, filtroFecha, leidas[]) + `marcarLeida(i)` / `marcarTodasLeidas()`.
- MiPerfil.jsx: 10 `useState` (nombre, apellido, correo, programa, centro, 3 passwords, 2 checkboxes).

## Fase 5 — Instructor Modules
- RevisionPropuestas.jsx: 4 `useState` (filtroEstado, filtroFecha, filtroPrograma, paginaActual).
- AlertasInstructor.jsx: 5 `useState` + leidas (same pattern as AlertasAprendiz).
- PerfilInstructor.jsx: 15 `useState` (nombre, apellido, correo, especialidad, centro, biografia, 3 passwords, limite, tiempoRevision, 4 checkboxes, plantilla).
- GestionarFichas.jsx: 3 `useState` (filtroPrograma, filtroEstado, busqueda) + `limpiarFiltros()`.
- CrearFicha.jsx: 2 `useState` (codigo, programa) + `useNavigate`.
- DetalleFichaInstructor.jsx: `useState` for `copiado` + `useEffect` with 2s timeout + `navigator.clipboard.writeText()`.

## Fase 6 — Admin Modules
- GestionUsuarios.jsx: 4 `useState` (filtroRol, filtroEstado, busqueda, paginaActual).
- ProyectosAdmin.jsx: 4 `useState` (filtroPrograma, filtroEstado, busqueda, paginaActual).
- ReportesFallas.jsx: 4 `useState` (filtroEstado, filtroFecha, filtroUsuario, paginaActual).
- NotificacionesAdmin.jsx: 5 `useState` + leidas (same pattern).
- PerfilAdmin.jsx: 10 `useState` (nombre, apellido, correo, rol, centro, 3 passwords, 3 checkboxes).

## Previous Structural Fixes (all files)
- Breadcrumb `<a>` → `<Link>` (PageHeader).
- `action="#"` → `onSubmit={(e) => e.preventDefault()}` on 14 forms.
- `<option selected>` → `defaultValue`.
- `onClick` placeholders `onClick={() => {}}` on 86 buttons.
- Dates 2023 → 2026.
- Hardcoded counts → `{array.length}`.
- ~350 tilde corrections across 38 files.

## Build
- `npm run build` passes with zero errors.
