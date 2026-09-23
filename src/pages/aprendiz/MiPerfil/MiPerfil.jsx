import { useMemo } from 'react'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PerfilBase from '../../../components/PerfilBase/PerfilBase'
import ApiState from '../../../components/ApiState/ApiState'
import { useAuth } from '../../../contexts/AuthContext'
import { useApi } from '../../../lib/useApi'
import { usuarios, aprendices, fichas, proyectos, notificaciones } from '../../../lib/recursos'

const INCLUDE_PROYECTOS = 'creator,instructor.generalUser,classGroup.program,apprentices.generalUser'

// Una propuesta es del aprendiz si la creó o si figura en su equipo.
function esMia(proyecto, userId) {
  if (!proyecto) return false
  if (Number(proyecto.id_creador) === Number(userId)) return true
  return (proyecto.apprentices || []).some(
    (a) => Number(a.generalUser?.id) === Number(userId) || Number(a.id_usuario) === Number(userId)
  )
}

export default function MiPerfil() {
  const { user } = useAuth()

  // Cuenta, ficha, propuestas y alertas: fuente única la API.
  const { data: cuenta, cargando, error, recargar } = useApi(
    () => usuarios.obtener(user.id),
    [user.id],
    { inicial: null }
  )
  const { data: aprendicesApi } = useApi(() => aprendices.listar(), [], { inicial: [] })
  const { data: fichasApi } = useApi(() => fichas.listar(), [], { inicial: [] })
  const { data: todosProyectos } = useApi(
    () => proyectos.listar({ included: INCLUDE_PROYECTOS }),
    [],
    { inicial: [] }
  )
  const { data: misNotificaciones } = useApi(
    // El backend ya acota las notificaciones al usuario autenticado: misma URL
    // que usa el layout, así se comparte una sola petición.
    () => notificaciones.listar(),
    [user.id],
    { inicial: [] }
  )

  const miAprendiz = aprendicesApi.find((a) => Number(a.id_usuario) === Number(user.id)) || null
  const ficha = miAprendiz
    ? fichasApi.find((f) => Number(f.id) === Number(miAprendiz.id_class_group)) || null
    : null

  const totalProyectos = useMemo(
    () => todosProyectos.filter((p) => esMia(p, user.id)).length,
    [todosProyectos, user.id]
  )
  const sinLeer = useMemo(
    () => misNotificaciones.filter((n) => Number(n.id_usuario) === Number(user.id) && !n.leida).length,
    [misNotificaciones, user.id]
  )

  if (cargando) {
    return (
      <DashboardLayout role="aprendiz" titulo="Mi Perfil">
        <ApiState cargando />
      </DashboardLayout>
    )
  }

  if (error || !cuenta) {
    return (
      <DashboardLayout role="aprendiz" titulo="Mi Perfil">
        <ApiState error={error || new Error('No se pudo cargar tu perfil.')} onReintentar={recargar} />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="aprendiz" titulo="Mi Perfil">
      <PerfilBase
        user={cuenta}
        role="aprendiz"
        stats={[
          { value: totalProyectos, label: 'Proyectos' },
          { value: sinLeer, label: 'Alertas sin leer' },
          { value: ficha?.program?.nombre || '—', label: 'Programa' },
        ]}
        detalles={[
          { label: 'Rol', value: 'Aprendiz SENA' },
          { label: 'Ficha', value: ficha ? `${ficha.nombre} (${ficha.codigo})` : 'Sin ficha asignada' },
        ]}
      />
    </DashboardLayout>
  )
}
