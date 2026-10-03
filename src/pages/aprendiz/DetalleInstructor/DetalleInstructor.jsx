import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import DataPanel from '../../../components/DataPanel/DataPanel'
import Badge from '../../../components/Badge/Badge'
import EmptyState from '../../../components/EmptyState/EmptyState'
import ApiState from '../../../components/ApiState/ApiState'
import PerfilBase from '../../../components/PerfilBase/PerfilBase'
import { useAuth } from '../../../contexts/AuthContext'
import { useApi } from '../../../lib/useApi'
import { usuarios, aprendices, fichas } from '../../../lib/recursos'
import s from '../../../components/PersonaDetalleBase/PersonaDetalleBase.module.css'
import { CaretRight, GraduationCap, MagnifyingGlass } from 'phosphor-react'

function nombreUsuario(u) {
  if (!u) return 'Usuario'
  return [u.nombre, u.apellido].filter(Boolean).join(' ').trim() || u.correo || 'Usuario'
}

export default function DetalleInstructor() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Mi ficha (para resolver el instructor cuando no llega ?id=).
  const { data: aprendicesApi, cargando: cargandoAprendices } = useApi(() => aprendices.listar(), [], { inicial: [] })
  const { data: fichasApi, cargando: cargandoFichas, error: errorFichas, recargar: recargarFichas } =
    useApi(() => fichas.listar(), [], { inicial: [] })

  const miAprendiz = aprendicesApi.find((a) => Number(a.id_usuario) === Number(user.id)) || null
  const miFicha = miAprendiz
    ? fichasApi.find((f) => Number(f.id) === Number(miAprendiz.id_class_group)) || null
    : null

  const paramId = searchParams.get('id')
  const instructorId = paramId ? Number(paramId) : (miFicha?.instructor?.generalUser?.id ?? null)

  const { data: instructor, cargando, error, recargar } = useApi(
    () => (instructorId ? usuarios.perfil(instructorId) : Promise.resolve(null)),
    [instructorId],
    { inicial: null }
  )

  const fichasInstructor = instructorId
    ? fichasApi.filter((f) => Number(f.instructor?.generalUser?.id) === Number(instructorId))
    : []

  const cargandoTotal = cargando || cargandoFichas || cargandoAprendices

  if (cargandoTotal) {
    return (
      <DashboardLayout role="aprendiz" titulo="Mi Instructor">
        <div className={s.wrapper}><ApiState cargando /></div>
      </DashboardLayout>
    )
  }

  if (error || errorFichas) {
    return (
      <DashboardLayout role="aprendiz" titulo="Mi Instructor">
        <div className={s.wrapper}>
          <ApiState error={error || errorFichas} onReintentar={() => { recargar(); recargarFichas() }} />
        </div>
      </DashboardLayout>
    )
  }

  if (!instructor || instructor.rol !== 'instructor') {
    return (
      <DashboardLayout role="aprendiz" titulo="Mi Instructor">
        <div className={s.wrapper}>
          <EmptyState
            icon={<MagnifyingGlass />}
            title="Sin instructor asignado"
            message="Aún no tienes una ficha con instructor asignado. Cuando coordinación te asigne una ficha, verás aquí a tu instructor."
            actionLabel="Ir a Mi Ficha"
            actionIcon={<GraduationCap size={14} />}
            onAction={() => navigate('/aprendiz/ficha')}
          />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="aprendiz" titulo="Mi Instructor">
      <div className={s.wrapper}>
        <PerfilBase
          user={instructor}
          role="instructor"
          soloLectura
          titulo="Mi Instructor"
          subtitulo="Conoce a quien acompaña tu proceso de formación"
          breadcrumb={[
            { label: 'Dashboard', to: '/aprendiz/dashboard' },
            { label: 'Mi Instructor' },
          ]}
          detalles={[{ label: 'Rol', value: 'Instructor SENA' }]}
        />

        <DataPanel title={`Fichas de ${nombreUsuario(instructor).split(' ')[0]} (${fichasInstructor.length})`} icon={<GraduationCap />}>
          {fichasInstructor.length === 0 ? (
            <p className={s.muted}>Este instructor no tiene fichas asignadas actualmente.</p>
          ) : (
            <ul className={s.list}>
              {fichasInstructor.map((f, i) => (
                <li key={f.id} className="fx-rise" style={{ '--fx-i': i }}>
                  <Link to={`/aprendiz/detalle-ficha/${f.id}`} viewTransition className={s.row}>
                    <span className={s.rowInfo}>
                      <span className={s.rowTitle}>{f.nombre}</span>
                      <span className={s.rowCodigo}>{f.codigo}</span>
                    </span>
                    <span className={s.rowSide}>
                      <Badge variant="info">{f.program?.nombre || '—'}</Badge>
                      <Badge variant={f.estado === 'activo' ? 'success' : 'info'}>
                        {f.estado === 'activo' ? 'Activa' : 'Finalizada'}
                      </Badge>
                      <span className={s.chevron} aria-hidden="true"><CaretRight size={22} /></span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </DataPanel>
      </div>
    </DashboardLayout>
  )
}
