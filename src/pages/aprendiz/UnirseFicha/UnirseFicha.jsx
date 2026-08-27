import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PageHeader from '../../../components/PageHeader/PageHeader'
import Badge from '../../../components/Badge/Badge'
import ConfirmModal from '../../../components/ConfirmModal/ConfirmModal'
import Actions from '../../../components/Actions/Actions'
import Button from '../../../components/Button/Button'
import EmptyState from '../../../components/EmptyState/EmptyState'
import { useAuth } from '../../../contexts/AuthContext'
import { findFichaByCodigo, joinFicha } from '../../../data/mockData'
import s from './UnirseFicha.module.css'
import { CheckCircle, GraduationCap, Key, MagnifyingGlass, ThumbsUp, Warning } from 'phosphor-react'

export default function UnirseFicha() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [codigo, setCodigo] = useState('')
  const [ficha, setFicha] = useState(null)
  const [error, setError] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [confirmarOpen, setConfirmarOpen] = useState(false)
  const [unida, setUnida] = useState(null)

  function buscar(e) {
    e?.preventDefault()
    setError('')
    setFicha(null)

    if (!codigo.trim()) {
      setError('Ingresa el código de la ficha.')
      return
    }

    setBuscando(true)
    const encontrada = findFichaByCodigo(codigo)
    setBuscando(false)

    if (!encontrada) {
      setError(`No encontramos una ficha con el código "${codigo.trim().toUpperCase()}".`)
      return
    }
    if (encontrada.estado === 'inactivo') {
      setError('Esta ficha está inactiva y no acepta nuevos integrantes.')
      return
    }
    setFicha(encontrada)
  }

  const yaInscrito = ficha ? ficha.estudiantes.some((e) => e.id === user.id) : false

  function confirmarUnion() {
    setConfirmarOpen(false)
    const resultado = joinFicha(codigo, { id: user.id, name: user.nombre })
    if (!resultado) {
      setError('No fue posible unirse a la ficha. Intenta de nuevo.')
      setFicha(null)
      return
    }
    setUnida(resultado)
    setFicha(null)
    setCodigo('')
    try {
      sessionStorage.setItem(
        'ficha_aprendiz',
        JSON.stringify({ id: resultado.id, codigo: resultado.codigo })
      )
    } catch {
      return
    }
  }

  return (
    <DashboardLayout role="aprendiz" titulo="Unirse a una Ficha">
      <div className={s.wrapper}>
        <PageHeader
          title="Unirse a una Ficha"
          subtitle="Ingresa el código que te compartió tu instructor para vincularte a tu ficha de formación"
          icon={<GraduationCap />}
        />

        {unida ? (
          <section className={s.successCard}>
            <span className={s.successIcon} aria-hidden="true"><CheckCircle size={22} /></span>
            <h2 className={s.successTitle}>¡Te uniste a la ficha!</h2>
            <p className={s.successText}>
              Ahora haces parte de <strong>{unida.nombre}</strong> ({unida.codigo}).
            </p>
            <Actions form>
              <Button as="link" to={`/aprendiz/detalle-ficha/${unida.id}`}>
                Ver mi ficha
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/aprendiz/dashboard')}
              >
                Ir al dashboard
              </Button>
            </Actions>
          </section>
        ) : (
          <>
            <form className={s.searchForm} onSubmit={buscar}>
              <label className={s.fieldLabel} htmlFor="codigo-ficha">
                Código de la ficha
              </label>
              <div className={s.searchRow}>
                <input
                  id="codigo-ficha"
                  type="text"
                  className={`${s.input} ${s.mono}`}
                  value={codigo}
                  onChange={(e) => {
                    setCodigo(e.target.value.toUpperCase())
                    setError('')
                  }}
                  placeholder="FT-X7K2MN"
                  autoFocus
                />
                <Button type="submit" disabled={buscando}>
                  <MagnifyingGlass size={14} /> Buscar
                </Button>
              </div>
              {error && (
                <p className={s.error} role="alert">
                  <Warning size={14} /> {error}
                </p>
              )}
            </form>

            {ficha && (
              <section className={s.fichaCard}>
                <header className={s.fichaHeader}>
                  <div>
                    <h2 className={s.fichaNombre}>{ficha.nombre}</h2>
                    <span className={`${s.fichaCodigo} ${s.mono}`}>{ficha.codigo}</span>
                  </div>
                  <Badge variant={ficha.estado === 'activo' ? 'success' : 'danger'}>
                    {ficha.estado === 'activo' ? 'Activa' : 'Inactiva'}
                  </Badge>
                </header>
                <dl className={s.fichaInfo}>
                  <div className={s.infoRow}>
                    <dt>Número de ficha</dt>
                    <dd>N° {ficha.numero}</dd>
                  </div>
                  <div className={s.infoRow}>
                    <dt>Programa</dt>
                    <dd>{ficha.programa}</dd>
                  </div>
                  <div className={s.infoRow}>
                    <dt>Instructor</dt>
                    <dd>{ficha.instructorName}</dd>
                  </div>
                  <div className={s.infoRow}>
                    <dt>Aprendices</dt>
                    <dd>{ficha.aprendices}</dd>
                  </div>
                  <div className={s.infoRow}>
                    <dt>Creada</dt>
                    <dd>{ficha.createdAt}</dd>
                  </div>
                </dl>
                {yaInscrito ? (
                  <p className={s.notice}>Ya perteneces a esta ficha. <ThumbsUp size={16} /></p>
                ) : (
                  <Actions form>
                    <Button
                      type="button"
                      onClick={() => setConfirmarOpen(true)}
                    >
                      Unirse a esta ficha
                    </Button>
                  </Actions>
                )}
              </section>
            )}

            {!ficha && !error && (
              <EmptyState
                icon={<Key />}
                title="Busca tu ficha"
                message="El código lo genera el sistema al crear la ficha. Tu instructor puede compartirlo contigo."
              />
            )}
          </>
        )}

        <ConfirmModal
          open={confirmarOpen}
          titulo="Confirmar inscripción"
          mensaje={`¿Deseas unirte a "${ficha?.nombre}" (${ficha?.codigo})?`}
          textoConfirmar="Sí, unirme"
          onConfirmar={confirmarUnion}
          onCancelar={() => setConfirmarOpen(false)}
        />
      </div>
    </DashboardLayout>
  )
}
