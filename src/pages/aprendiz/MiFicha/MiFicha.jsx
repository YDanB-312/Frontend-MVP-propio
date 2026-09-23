import { useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import { CheckCircle, GraduationCap, Key, SignOut, Users } from 'phosphor-react'
import PageHeader from '../../../components/PageHeader/PageHeader'
import Badge from '../../../components/Badge/Badge'
import Avatar from '../../../components/Avatar/Avatar'
import Alert from '../../../components/Alert/Alert'
import EmptyState from '../../../components/EmptyState/EmptyState'
import ApiState from '../../../components/ApiState/ApiState'
import Button from '../../../components/Button/Button'
import ConfirmModal from '../../../components/ConfirmModal/ConfirmModal'
import DataPanel from '../../../components/DataPanel/DataPanel'
import FormField from '../../../components/FormField/FormField'
import { Input } from '../../../components/Input/Input'
import Actions from '../../../components/Actions/Actions'
import { useAuth } from '../../../contexts/AuthContext'
import { useApi } from '../../../lib/useApi'
import { aprendices, fichas, proyectos } from '../../../lib/recursos'
import sd from '../../../components/DetalleFichaBase/DetalleFichaBase.module.css'

function nombreUsuario(u) {
  if (!u) return 'Usuario'
  return [u.nombre, u.apellido].filter(Boolean).join(' ').trim() || u.correo || 'Usuario'
}

export default function MiFicha() {
  const { user } = useAuth()

  // La ficha del aprendiz se deriva de su fila de aprendices (id_class_group).
  const { data: aprendicesApi, cargando: cargandoA, error: errorA, recargar: recargarA } =
    useApi(() => aprendices.listar(), [], { inicial: [] })
  const { data: fichasApi, cargando: cargandoF, error: errorF, recargar: recargarF } =
    useApi(() => fichas.listar(), [], { inicial: [] })
  const { data: todosProyectos } = useApi(() => proyectos.listar(), [], { inicial: [] })

  const [codigo, setCodigo] = useState('')
  const [previa, setPrevia] = useState(null)
  const [buscando, setBuscando] = useState(false)
  const [uniendose, setUniendose] = useState(false)
  const [codigoError, setCodigoError] = useState('')
  const [confirmarSalida, setConfirmarSalida] = useState(false)
  const [saliendo, setSaliendo] = useState(false)
  const [aviso, setAviso] = useState('')
  const [busquedaComp, setBusquedaComp] = useState('')

  const miAprendiz = aprendicesApi.find((a) => Number(a.id_usuario) === Number(user.id)) || null
  const ficha = miAprendiz
    ? fichasApi.find((f) => Number(f.id) === Number(miAprendiz.id_class_group)) || null
    : null

  const compañeros = ficha
    ? aprendicesApi.filter((a) => Number(a.id_class_group) === Number(ficha.id))
    : []
  const compañerosFiltrados = compañeros.filter((est) => {
    const q = busquedaComp.trim().toLowerCase()
    if (!q) return true
    const g = est.generalUser || {}
    return nombreUsuario(g).toLowerCase().includes(q) || (g.correo || '').toLowerCase().includes(q)
  })
  const proyectosFicha = ficha
    ? todosProyectos.filter((p) => Number(p.id_class_group) === Number(ficha.id))
    : []

  const cargando = cargandoA || cargandoF
  const error = errorA || errorF
  const recargar = () => { recargarA(); recargarF() }

  // ---------------------------------------------------------------- Acciones
  async function buscar(e) {
    e.preventDefault()
    setCodigoError('')
    setPrevia(null)
    setAviso('')
    if (!codigo.trim()) {
      setCodigoError('Ingresa el código de la ficha.')
      return
    }
    setBuscando(true)
    try {
      setPrevia(await aprendices.previsualizarCodigo(codigo))
    } catch (err) {
      setCodigoError(err?.data?.message || 'No encontramos una ficha con ese código.')
    } finally {
      setBuscando(false)
    }
  }

  async function unirme() {
    setCodigoError('')
    setUniendose(true)
    try {
      const nombreFicha = previa?.nombre || 'la ficha'
      await aprendices.unirmeAlCodigo(codigo)
      setPrevia(null)
      setCodigo('')
      setAviso(`Te uniste a ${nombreFicha}.`)
      await recargar()
    } catch (err) {
      setCodigoError(err?.data?.message || 'No fue posible unirte a la ficha.')
    } finally {
      setUniendose(false)
    }
  }

  async function salir() {
    setConfirmarSalida(false)
    setSaliendo(true)
    setAviso('')
    try {
      await aprendices.salirDeFicha()
      setAviso('Saliste de tu ficha. Puedes unirte a otra con el código que te comparta un instructor.')
      await recargar()
    } catch (err) {
      setAviso(err?.data?.message || 'No fue posible salir de la ficha.')
    } finally {
      setSaliendo(false)
    }
  }

  if (cargando) {
    return (
      <DashboardLayout role="aprendiz" titulo="Mi Ficha">
        <div><ApiState cargando /></div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout role="aprendiz" titulo="Mi Ficha">
        <div><ApiState error={error} onReintentar={recargar} /></div>
      </DashboardLayout>
    )
  }

  /* ---------- SIN FICHA: unirse con el código del instructor ---------- */
  if (!ficha) {
    return (
      <DashboardLayout role="aprendiz" titulo="Ficha">
        <div>
          <PageHeader
            title="Mi Ficha"
            subtitle="Únete a tu ficha con el código que te comparte tu instructor"
            icon={<GraduationCap />}
          />

          {aviso && <Alert variant="success">{aviso}</Alert>}

          <DataPanel title="Unirme a una ficha" icon={<Key />}>
            <form onSubmit={buscar} className={sd.joinForm}>
              <FormField
                label="Código de la ficha"
                required
                error={codigoError}
                help="Es el código que te compartió tu instructor (por ejemplo, xkp-mqwr)."
              >
                <Input
                  value={codigo}
                  onChange={(e) => { setCodigo(e.target.value); setCodigoError('') }}
                  placeholder="xkp-mqwr"
                  maxLength={40}
                  autoComplete="off"
                />
              </FormField>
              <Actions form>
                <Button type="submit" disabled={buscando}>
                  {buscando ? 'Buscando…' : 'Buscar ficha'}
                </Button>
              </Actions>
            </form>
          </DataPanel>

          {previa && (
            <section className={sd.infoCard} aria-label="Ficha encontrada">
              <header className={sd.infoHeader}>
                <span className={sd.infoIcon} aria-hidden="true"><GraduationCap size={22} /></span>
                <div>
                  <h2 className={sd.infoTitle}>{previa.nombre}</h2>
                  <span className={`${sd.infoCodigo} ${sd.mono}`}>{previa.codigo}</span>
                </div>
                <Badge variant={previa.estado === 'activo' ? 'success' : 'danger'}>
                  {previa.estado === 'activo' ? 'Activa' : 'No disponible'}
                </Badge>
              </header>

              <dl className={sd.infoGrid}>
                <div className={sd.infoItem}>
                  <dt>Número de ficha</dt>
                  <dd>N° {previa.numero || '—'}</dd>
                </div>
                <div className={sd.infoItem}>
                  <dt>Programa</dt>
                  <dd>{previa.program?.nombre || '—'}</dd>
                </div>
                <div className={sd.infoItem}>
                  <dt>Instructor</dt>
                  <dd>{nombreUsuario(previa.instructor?.generalUser)}</dd>
                </div>
                <div className={sd.infoItem}>
                  <dt>Aprendices</dt>
                  <dd>{previa.apprentices_count ?? 0}</dd>
                </div>
              </dl>

              {previa.estado === 'activo' ? (
                <Actions form>
                  <Button type="button" onClick={unirme} disabled={uniendose}>
                    <CheckCircle size={14} /> {uniendose ? 'Uniéndome…' : 'Unirme a esta ficha'}
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setPrevia(null)}>
                    Cancelar
                  </Button>
                </Actions>
              ) : (
                <Alert variant="warning">
                  Esta ficha no acepta nuevos integrantes. Pídele a tu instructor un código vigente.
                </Alert>
              )}
            </section>
          )}

          <Alert variant="info">
            ¿No tienes código? Pídeselo a tu instructor. También puedes consultar tus propuestas
            mientras tanto.
          </Alert>

          <Button as="link" to="/aprendiz/propuestas" variant="secondary">
            Ir a mis propuestas
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  /* ---------- CON FICHA: mi ficha + compañeros ---------- */
  const instructorUserId = ficha.instructor?.generalUser?.id
  const programa = ficha.program?.nombre || '—'

  return (
    <DashboardLayout role="aprendiz" titulo="Mi Ficha">
      <div>
        <PageHeader
          title="Mi Ficha"
          subtitle={`Código ${ficha.codigo} · N° ${ficha.numero} · ${programa}`}
          icon={<GraduationCap />}
          breadcrumb={[{ label: 'Dashboard', to: '/aprendiz/dashboard' }, { label: 'Mi Ficha' }]}
        />

        {aviso && <Alert variant="success">{aviso}</Alert>}

        <section className={sd.infoCard}>
          <header className={sd.infoHeader}>
            <span className={sd.infoIcon} aria-hidden="true"><GraduationCap size={22} /></span>
            <div>
              <h2 className={sd.infoTitle}>{ficha.nombre}</h2>
              <span className={`${sd.infoCodigo} ${sd.mono}`}>{ficha.codigo}</span>
            </div>
            <Badge variant={ficha.estado === 'activo' ? 'success' : 'danger'}>
              {ficha.estado === 'activo' ? 'Activa' : 'Inactiva'}
            </Badge>
          </header>

          <dl className={sd.infoGrid}>
            <div className={sd.infoItem}>
              <dt>Número de ficha</dt>
              <dd>N° {ficha.numero}</dd>
            </div>
            <div className={sd.infoItem}>
              <dt>Programa</dt>
              <dd>{programa}</dd>
            </div>
            <div className={sd.infoItem}>
              <dt>Instructor</dt>
              <dd>
                {instructorUserId ? (
                  <Link to={`/aprendiz/perfil-instructor?id=${instructorUserId}`} className={sd.link}>
                    {nombreUsuario(ficha.instructor?.generalUser) }
                  </Link>
                ) : (
                  'Sin asignar'
                )}
              </dd>
            </div>
            <div className={sd.infoItem}>
              <dt>Aprendices</dt>
              <dd>{compañeros.length}</dd>
            </div>
            <div className={sd.infoItem}>
              <dt>Propuestas</dt>
              <dd>{proyectosFicha.length}</dd>
            </div>
          </dl>
        </section>

        <Alert variant="info">
          Puedes salir de tu ficha cuando quieras y unirte a otra con el código que te dé un
          instructor. Tus propuestas se conservan en la ficha donde las registraste.
        </Alert>

        <Actions className={sd.fichaActions}>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setConfirmarSalida(true)}
            disabled={saliendo}
          >
            <SignOut size={14} /> {saliendo ? 'Saliendo…' : 'Salir de la ficha'}
          </Button>
        </Actions>

        {compañeros.length === 0 ? (
          <EmptyState
            icon={<Users />}
            title="Sin aprendices registrados"
            message="Aún no hay aprendices vinculados a esta ficha."
          />
        ) : (
          <>
            <h3 className={sd.sectionTitle}>Integrantes de la ficha ({compañeros.length})</h3>
            <FormField label="Buscar integrante">
              <Input
                value={busquedaComp}
                onChange={(e) => setBusquedaComp(e.target.value)}
                placeholder="Nombre o correo…"
              />
            </FormField>
            {compañerosFiltrados.length === 0 ? (
              <EmptyState
                icon={<Users />}
                title="Sin resultados"
                message={`Ningún integrante coincide con "${busquedaComp}".`}
              />
            ) : (
            <ul className={sd.studentsGrid}>
              {compañerosFiltrados.map((est, i) => {
                const g = est.generalUser || {}
                return (
                  <li key={est.id} className="fx-rise" style={{ '--fx-i': i }}>
                    <Link to={`/aprendiz/perfil-companero/${g.id}`} viewTransition className={sd.studentCard}>
                      <Avatar name={nombreUsuario(g)} src={g.foto_url} size="md" />
                      <span className={sd.studentInfo}>
                        <span className={sd.studentName}>{nombreUsuario(g)}</span>
                        <span className={sd.studentEmail}>{g.correo}</span>
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
            )}
          </>
        )}

        <ConfirmModal
          open={confirmarSalida}
          titulo="Salir de la ficha"
          mensaje={`¿Seguro que quieres salir de "${ficha.nombre}"? Podrás unirte a otra ficha con el código que te comparta un instructor. Tus propuestas se conservan.`}
          textoConfirmar="Sí, salir"
          onConfirmar={salir}
          onCancelar={() => setConfirmarSalida(false)}
        />
      </div>
    </DashboardLayout>
  )
}
