import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute'
import SafeRoute from './components/SafeRoute/SafeRoute'

// Public
const Home = lazy(() => import('./pages/public/Home'))
const Login = lazy(() => import('./pages/public/Login'))
const Register = lazy(() => import('./pages/public/Register'))
const RecuperarContrasena = lazy(() => import('./pages/public/RecuperarContrasena'))
const RestablecerContrasena = lazy(() => import('./pages/public/RestablecerContrasena'))
const Confirmacion = lazy(() => import('./pages/public/Confirmacion'))
const PaginaNoEncontrada = lazy(() => import('./pages/public/PaginaNoEncontrada'))

// Aprendiz
const DashboardAprendiz = lazy(() => import('./pages/aprendiz/DashboardAprendiz'))
const MisProyectos = lazy(() => import('./pages/aprendiz/MisProyectos'))
const NuevoProyecto = lazy(() => import('./pages/aprendiz/NuevoProyecto'))
const AlertasAprendiz = lazy(() => import('./pages/aprendiz/AlertasAprendiz'))
const MiPerfil = lazy(() => import('./pages/aprendiz/MiPerfil'))
const DetalleProyecto = lazy(() => import('./pages/aprendiz/DetalleProyecto'))
const DetalleSimilitud = lazy(() => import('./pages/aprendiz/DetalleSimilitud'))
const ReportarFallaAprendiz = lazy(() => import('./pages/aprendiz/ReportarFallaAprendiz'))
const UnirseFicha = lazy(() => import('./pages/aprendiz/UnirseFicha'))
const DetalleFicha = lazy(() => import('./pages/aprendiz/DetalleFicha'))
const DetalleCompanero = lazy(() => import('./pages/aprendiz/DetalleCompanero'))
const DetalleInstructorAprendiz = lazy(() => import('./pages/aprendiz/DetalleInstructor'))
const AnalizandoProyecto = lazy(() => import('./pages/aprendiz/AnalizandoProyecto'))
const ResultadoAnalisis = lazy(() => import('./pages/aprendiz/ResultadoAnalisis'))

// Instructor
const DashboardInstructor = lazy(() => import('./pages/instructor/DashboardInstructor'))
const RevisionPropuestas = lazy(() => import('./pages/instructor/RevisionPropuestas'))
const AlertasInstructor = lazy(() => import('./pages/instructor/AlertasInstructor'))
const PerfilInstructor = lazy(() => import('./pages/instructor/PerfilInstructor'))
const DetalleProyectoInstructor = lazy(() => import('./pages/instructor/DetalleProyectoInstructor'))
const DetalleSimilitudInstructor = lazy(() => import('./pages/instructor/DetalleSimilitudInstructor'))
const SimilitudesInstructor = lazy(() => import('./pages/instructor/SimilitudesInstructor'))
const ReportarFallaInstructor = lazy(() => import('./pages/instructor/ReportarFallaInstructor'))
const GestionarFichas = lazy(() => import('./pages/instructor/GestionarFichas'))
const CrearFicha = lazy(() => import('./pages/instructor/CrearFicha'))
const DetalleFichaInstructor = lazy(() => import('./pages/instructor/DetalleFichaInstructor'))
const DirectorioFichaInstructor = lazy(() => import('./pages/instructor/DirectorioFichaInstructor'))

// Admin
const DashboardAdmin = lazy(() => import('./pages/admin/DashboardAdmin'))
const GestionUsuarios = lazy(() => import('./pages/admin/GestionUsuarios'))
const NuevoUsuario = lazy(() => import('./pages/admin/NuevoUsuario'))
const ProyectosAdmin = lazy(() => import('./pages/admin/ProyectosAdmin'))
const DetalleProyectoAdmin = lazy(() => import('./pages/admin/DetalleProyectoAdmin'))
const SimilitudesAdmin = lazy(() => import('./pages/admin/SimilitudesAdmin'))
const DetalleSimilitudAdmin = lazy(() => import('./pages/admin/DetalleSimilitudAdmin'))
const DetalleUsuario = lazy(() => import('./pages/admin/DetalleUsuario'))
const ReportesFallas = lazy(() => import('./pages/admin/ReportesFallas'))
const DetalleReporte = lazy(() => import('./pages/admin/DetalleReporte'))
const NotificacionesAdmin = lazy(() => import('./pages/admin/NotificacionesAdmin'))
const PerfilAdmin = lazy(() => import('./pages/admin/PerfilAdmin'))

const PageLoader = (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
    <div style={{ width: 32, height: 32, border: '3px solid var(--c-border)', borderTopColor: 'var(--c-primary)', borderRadius: 'var(--r-full)', animation: 'spin .6s linear infinite' }} />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
)

export default function App() {
  return (
    <Suspense fallback={PageLoader}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/recuperar-contrasena" element={<RecuperarContrasena />} />
        <Route path="/restablecer-contrasena" element={<RestablecerContrasena />} />
        <Route path="/confirmacion" element={<Confirmacion />} />

        <Route path="/aprendiz/dashboard" element={<ProtectedRoute allowedRoles={['aprendiz']}><SafeRoute><DashboardAprendiz /></SafeRoute></ProtectedRoute>} />
        <Route path="/aprendiz/mis-proyectos" element={<ProtectedRoute allowedRoles={['aprendiz']}><SafeRoute><MisProyectos /></SafeRoute></ProtectedRoute>} />
        <Route path="/aprendiz/nuevo-proyecto" element={<ProtectedRoute allowedRoles={['aprendiz']}><SafeRoute><NuevoProyecto /></SafeRoute></ProtectedRoute>} />
        <Route path="/aprendiz/unirse-ficha" element={<ProtectedRoute allowedRoles={['aprendiz']}><SafeRoute><UnirseFicha /></SafeRoute></ProtectedRoute>} />
        <Route path="/aprendiz/alertas" element={<ProtectedRoute allowedRoles={['aprendiz']}><SafeRoute><AlertasAprendiz /></SafeRoute></ProtectedRoute>} />
        <Route path="/aprendiz/reportar-falla" element={<ProtectedRoute allowedRoles={['aprendiz']}><SafeRoute><ReportarFallaAprendiz /></SafeRoute></ProtectedRoute>} />
        <Route path="/aprendiz/perfil" element={<ProtectedRoute allowedRoles={['aprendiz']}><SafeRoute><MiPerfil /></SafeRoute></ProtectedRoute>} />
        <Route path="/aprendiz/detalle-proyecto/:id" element={<ProtectedRoute allowedRoles={['aprendiz']}><SafeRoute><DetalleProyecto /></SafeRoute></ProtectedRoute>} />
        <Route path="/aprendiz/detalle-similitud/:id" element={<ProtectedRoute allowedRoles={['aprendiz']}><SafeRoute><DetalleSimilitud /></SafeRoute></ProtectedRoute>} />
        <Route path="/aprendiz/detalle-ficha/:id" element={<ProtectedRoute allowedRoles={['aprendiz']}><SafeRoute><DetalleFicha /></SafeRoute></ProtectedRoute>} />
        <Route path="/aprendiz/perfil-companero/:id" element={<ProtectedRoute allowedRoles={['aprendiz', 'instructor']}><SafeRoute><DetalleCompanero /></SafeRoute></ProtectedRoute>} />
        <Route path="/instructor/perfil-companero/:id" element={<ProtectedRoute allowedRoles={['instructor']}><SafeRoute><DetalleCompanero /></SafeRoute></ProtectedRoute>} />
        <Route path="/aprendiz/perfil-instructor" element={<ProtectedRoute allowedRoles={['aprendiz']}><SafeRoute><DetalleInstructorAprendiz /></SafeRoute></ProtectedRoute>} />
        <Route path="/aprendiz/analizando-proyecto" element={<ProtectedRoute allowedRoles={['aprendiz']}><SafeRoute><AnalizandoProyecto /></SafeRoute></ProtectedRoute>} />
        <Route path="/aprendiz/resultado-analisis" element={<ProtectedRoute allowedRoles={['aprendiz']}><SafeRoute><ResultadoAnalisis /></SafeRoute></ProtectedRoute>} />

        <Route path="/instructor/dashboard" element={<ProtectedRoute allowedRoles={['instructor']}><SafeRoute><DashboardInstructor /></SafeRoute></ProtectedRoute>} />
        <Route path="/instructor/revision-propuestas" element={<ProtectedRoute allowedRoles={['instructor']}><SafeRoute><RevisionPropuestas /></SafeRoute></ProtectedRoute>} />
        <Route path="/instructor/alertas" element={<ProtectedRoute allowedRoles={['instructor']}><SafeRoute><AlertasInstructor /></SafeRoute></ProtectedRoute>} />
        <Route path="/instructor/perfil" element={<ProtectedRoute allowedRoles={['instructor']}><SafeRoute><PerfilInstructor /></SafeRoute></ProtectedRoute>} />
        <Route path="/instructor/detalle-proyecto/:id" element={<ProtectedRoute allowedRoles={['instructor']}><SafeRoute><DetalleProyectoInstructor /></SafeRoute></ProtectedRoute>} />
        <Route path="/instructor/detalle-similitud/:id" element={<ProtectedRoute allowedRoles={['instructor']}><SafeRoute><DetalleSimilitudInstructor /></SafeRoute></ProtectedRoute>} />
        <Route path="/instructor/similitudes" element={<ProtectedRoute allowedRoles={['instructor']}><SafeRoute><SimilitudesInstructor /></SafeRoute></ProtectedRoute>} />
        <Route path="/instructor/reportar-falla" element={<ProtectedRoute allowedRoles={['instructor']}><SafeRoute><ReportarFallaInstructor /></SafeRoute></ProtectedRoute>} />
        <Route path="/instructor/gestionar-fichas" element={<ProtectedRoute allowedRoles={['instructor']}><SafeRoute><GestionarFichas /></SafeRoute></ProtectedRoute>} />
        <Route path="/instructor/crear-ficha" element={<ProtectedRoute allowedRoles={['instructor']}><SafeRoute><CrearFicha /></SafeRoute></ProtectedRoute>} />
        <Route path="/instructor/detalle-ficha/:id" element={<ProtectedRoute allowedRoles={['instructor']}><SafeRoute><DetalleFichaInstructor /></SafeRoute></ProtectedRoute>} />
        <Route path="/instructor/directorio-ficha/:id" element={<ProtectedRoute allowedRoles={['instructor']}><SafeRoute><DirectorioFichaInstructor /></SafeRoute></ProtectedRoute>} />

        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><SafeRoute><DashboardAdmin /></SafeRoute></ProtectedRoute>} />
        <Route path="/admin/gestion-usuarios" element={<ProtectedRoute allowedRoles={['admin']}><SafeRoute><GestionUsuarios /></SafeRoute></ProtectedRoute>} />
        <Route path="/admin/nuevo-usuario" element={<ProtectedRoute allowedRoles={['admin']}><SafeRoute><NuevoUsuario /></SafeRoute></ProtectedRoute>} />
        <Route path="/admin/proyectos" element={<ProtectedRoute allowedRoles={['admin']}><SafeRoute><ProyectosAdmin /></SafeRoute></ProtectedRoute>} />
        <Route path="/admin/detalle-proyecto/:id" element={<ProtectedRoute allowedRoles={['admin']}><SafeRoute><DetalleProyectoAdmin /></SafeRoute></ProtectedRoute>} />
        <Route path="/admin/similitudes" element={<ProtectedRoute allowedRoles={['admin']}><SafeRoute><SimilitudesAdmin /></SafeRoute></ProtectedRoute>} />
        <Route path="/admin/detalle-similitud/:id" element={<ProtectedRoute allowedRoles={['admin']}><SafeRoute><DetalleSimilitudAdmin /></SafeRoute></ProtectedRoute>} />
        <Route path="/admin/detalle-usuario/:id" element={<ProtectedRoute allowedRoles={['admin']}><SafeRoute><DetalleUsuario /></SafeRoute></ProtectedRoute>} />
        <Route path="/admin/reportes-fallas" element={<ProtectedRoute allowedRoles={['admin']}><SafeRoute><ReportesFallas /></SafeRoute></ProtectedRoute>} />
        <Route path="/admin/detalle-reporte/:id" element={<ProtectedRoute allowedRoles={['admin']}><SafeRoute><DetalleReporte /></SafeRoute></ProtectedRoute>} />
        <Route path="/admin/notificaciones" element={<ProtectedRoute allowedRoles={['admin']}><SafeRoute><NotificacionesAdmin /></SafeRoute></ProtectedRoute>} />
        <Route path="/admin/perfil" element={<ProtectedRoute allowedRoles={['admin']}><SafeRoute><PerfilAdmin /></SafeRoute></ProtectedRoute>} />

        <Route path="*" element={<PaginaNoEncontrada />} />
      </Routes>
    </Suspense>
  )
}
