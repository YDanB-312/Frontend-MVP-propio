import { useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import {
  GraduationCap, Key, MagnifyingGlass, SignOut, ThumbsUp, Users, Warning,
} from 'phosphor-react'
import PageHeader from '../../../components/PageHeader/PageHeader'
import Badge from '../../../components/Badge/Badge'
import Avatar from '../../../components/Avatar/Avatar'
import ConfirmModal from '../../../components/ConfirmModal/ConfirmModal'
import EmptyState from '../../../components/EmptyState/EmptyState'
import Button from '../../../components/Button/Button'
import Actions from '../../../components/Actions/Actions'
import { useAuth } from '../../../contexts/AuthContext'
import {
  findUserById,
  findFichaById,
  findFichaByCodigo,
  getEstudiantesDeFicha,
  getProjectsByFicha,
  joinFicha,
  leaveFicha,
} from '../../../data/mockData'
import su from '../UnirseFicha/UnirseFicha.module.css'
import sd from '../../../components/DetalleFichaBase/DetalleFichaBase.module.css'

export default function MiFicha() {
  const { user } = useAuth()
  const [, setTick] = useState(0)
  const [codigo, setCodigo] = useState('')
  const [encontrada, setEncontrada] = useState(null)
  const [error, setError] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [confirmarUnion, setConfirmarUnion] = useState(false)
  const [confirmarSalir, setConfirmarSalir] = useState(false)

  const perfil = findUserById(user.id)
  const ficha = perfil?.fichaId ? findFichaById(perfil.fichaId) : null
  const estudiantes = ficha ? getEstudiantesDeFicha(ficha.id) : []

  function buscar(e) {
    e?.preventDefault()
    setError('')
    setEncontrada(null)

    if (!codigo.trim()) {
      setError('Ingresa el código de la ficha.')
      return
    }

    setBuscando(true)
    const resultado = findFichaByCodigo(codigo)
    setBuscando(false)

    if (!resultado) {
      setError(`No encontramos una ficha con el código "${codigo.trim().toLowerCase()}".`)
      return
    }
    if (resultado.estado === 'inactivo' || resultado.estado === 'finalizado') {
      setError('Esta ficha está finalizada y no acepta nuevos integrantes.')
      return
    }
    setEncontrada(resultado)
  }

  function confirmarInscripcion() {
    setConfirmarUnion(false)
    const resultado = joinFicha(codigo, { id: user.id, name: user.nombre })
    if (!resultado) {
      setError('No fue posible unirse a la ficha. Intenta de nuevo.')
      setEncontrada(null)
      return
    }
    setEncontrada(null)
    setCodigo('')
    setTick((t) => t + 1)
  }

  function salirDeLaFicha() {
    leaveFicha(user.id)
    setConfirmarSalir(false)
    setTick((t) => t + 1)
  }

  /* ---------- SIN FICHA: unirse por código ---------- */
  if (!ficha) {
    return (
      <DashboardLayout role="aprendiz" titulo="Ficha">
        <div>
        <PageHeader
          title="Unirse a una Ficha"
          subtitle="Ingresa el código que te compartió tu instructor para vincularte a tu ficha de formación"
          icon={<GraduationCap />}
        />

        <form className={su.searchForm} onSubmit={buscar}>
          <label className={su.fieldLabel} htmlFor="codigo-ficha">
            Código de la ficha
          </label>
          <div className={su.searchRow}>
            <input
              id="codigo-ficha"
              type="text"
              className={`${su.input} ${su.mono}`}
              value={codigo}
              onChange={(e) => {
                setCodigo(e.target.value.toLowerCase())
                setError('')
              }}
              placeholder="abc-defg"
              autoFocus
            />
            <Button type="submit" disabled={buscando}>
              <MagnifyingGlass size={14} /> Buscar
            </Button>
          </div>
          {error && (
            <p className={su.error} role="alert">
              <Warning size={14} /> {error}
            </p>
          )}
        </form>

        {encontrada && (
          <section className={su.fichaCard}>
            <header className={su.fichaHeader}>
              <div>
                <h2 className={su.fichaNombre}>{encontrada.nombre}</h2>
                <span className={`${su.fichaCodigo} ${su.mono}`}>{encontrada.codigo}</span>
              </div>
              <Badge variant={encontrada.estado === 'activo' ? 'success' : 'danger'}>
                {encontrada.estado === 'activo' ? 'Activa' : 'Inactiva'}
              </Badge>
            </header>
            <dl className={su.fichaInfo}>
              <div className={su.infoRow}>
                <dt>Número de ficha</dt>
                <dd>N° {encontrada.numero}</dd>
              </div>
              <div className={su.infoRow}>
                <dt>Programa</dt>
                <dd>{encontrada.programa}</dd>
              </div>
              <div className={su.infoRow}>
                <dt>Instructor</dt>
                <dd>{encontrada.instructorName}</dd>
              </div>
              <div className={su.infoRow}>
                <dt>Aprendices</dt>
                <dd>{getEstudiantesDeFicha(encontrada.id).length || encontrada.aprendices}</dd>
              </div>
              <div className={su.infoRow}>
                <dt>Creada</dt>
                <dd>{encontrada.createdAt}</dd>
              </div>
            </dl>
            {encontrada.estudiantes.some((e) => e.id === user.id) ? (
              <p className={su.notice}>Ya perteneces a esta ficha. <ThumbsUp size={16} /></p>
            ) : (
              <Actions form>
                <Button type="button" onClick={() => setConfirmarUnion(true)}>
                  Unirse a esta ficha
                </Button>
              </Actions>
            )}
          </section>
        )}

        {!encontrada && !error && (
          <EmptyState
            icon={<Key />}
            title="Busca tu ficha"
            message="El código lo genera el sistema al crear la ficha. Tu instructor puede compartirlo contigo."
          />
        )}

        <ConfirmModal
          open={confirmarUnion}
          titulo="Confirmar inscripción"
          mensaje={`¿Deseas unirte a "${encontrada?.nombre}" (${encontrada?.codigo})?`}
          textoConfirmar="Sí, unirme"
          onConfirmar={confirmarInscripcion}
          onCancelar={() => setConfirmarUnion(false)}
        />
        </div>
      </DashboardLayout>
    )
  }

  /* ---------- CON FICHA: mi ficha + salir ---------- */
  return (
    <DashboardLayout role="aprendiz" titulo="Mi Ficha">
      <div>
      <PageHeader
        title="Mi Ficha"
        subtitle={`Código ${ficha.codigo} · N° ${ficha.numero} · ${ficha.programa}`}
        icon={<GraduationCap />}
        breadcrumb={[{ label: 'Dashboard', to: '/aprendiz/dashboard' }, { label: 'Mi Ficha' }]}
        actions={
          <Button type="button" variant="dangerGhost" onClick={() => setConfirmarSalir(true)}>
            <SignOut size={14} /> Salir de la ficha
          </Button>
        }
      />

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
            <dd>{ficha.programa}</dd>
          </div>
          <div className={sd.infoItem}>
            <dt>Instructor</dt>
            <dd>
              {ficha.instructorId ? (
                <Link to={`/aprendiz/perfil-instructor?id=${ficha.instructorId}`} className={sd.link}>
                  {ficha.instructorName}
                </Link>
              ) : (
                ficha.instructorName
              )}
            </dd>
          </div>
          <div className={sd.infoItem}>
            <dt>Aprendices</dt>
            <dd>{estudiantes.length || ficha.aprendices}</dd>
          </div>
          <div className={sd.infoItem}>
            <dt>Proyectos</dt>
            <dd>{getProjectsByFicha(ficha.id).length}</dd>
          </div>
          <div className={sd.infoItem}>
            <dt>Fecha de creación</dt>
            <dd>{ficha.createdAt}</dd>
          </div>
        </dl>
      </section>

      {estudiantes.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title="Sin aprendices registrados"
          message="Aún no hay aprendices vinculados a esta ficha."
        />
      ) : (
        <>
          <h3 className={sd.sectionTitle}>Integrantes de la ficha ({estudiantes.length})</h3>
          <ul className={sd.studentsGrid}>
            {estudiantes.map((est, i) => (
              <li key={est.id} className="fx-rise" style={{ '--fx-i': i }}>
                <Link to={`/aprendiz/perfil-companero/${est.id}`} viewTransition className={sd.studentCard}>
                  <Avatar name={est.name} src={est.fotoPerfil} size="md" />
                  <span className={sd.studentInfo}>
                    <span className={sd.studentName}>{est.name}</span>
                    <span className={sd.studentEmail}>{est.email}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      <ConfirmModal
        open={confirmarSalir}
        titulo="Salir de la ficha"
        mensaje={`¿Seguro que deseas salir de "${ficha.nombre}" (${ficha.codigo})? Tus propuestas conservarán esta ficha como historial. Podrás volver a unirte con el mismo código cuando quieras.`}
        textoConfirmar="Sí, salir"
        textoCancelar="Cancelar"
        onConfirmar={salirDeLaFicha}
        onCancelar={() => setConfirmarSalir(false)}
      />
      </div>
    </DashboardLayout>
  )
}
