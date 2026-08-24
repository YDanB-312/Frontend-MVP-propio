import { Link, useParams } from 'react-router-dom'
import DashboardLayout from '../../../layouts/DashboardLayout/DashboardLayout'
import PageHeader from '../../../components/PageHeader/PageHeader'
import Badge from '../../../components/Badge/Badge'
import Avatar from '../../../components/Avatar/Avatar'
import EmptyState from '../../../components/EmptyState/EmptyState'
import { findFichaById, getEstudiantesDeFicha } from '../../../data/mockData'
import s from './DetalleFicha.module.css'
import { GraduationCap, MagnifyingGlass, Users } from 'phosphor-react'

export default function DetalleFicha() {
  const { id } = useParams()
  const ficha = findFichaById(id)
  const estudiantes = ficha ? getEstudiantesDeFicha(ficha.id) : []

  if (!ficha) {
    return (
      <DashboardLayout role="aprendiz" titulo="Detalle de Ficha">
        <div className={s.wrapper}>
          <EmptyState
            icon={<MagnifyingGlass />}
            title="Ficha no encontrada"
            message="La ficha que buscas no existe o fue eliminada."
          />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="aprendiz" titulo="Detalle de Ficha">
      <div className={s.wrapper}>
        <PageHeader
          title={ficha.nombre}
          subtitle={`Código ${ficha.codigo} · ${ficha.programa}`}
          icon={<GraduationCap />}
          breadcrumb={[
            { label: 'Dashboard', to: '/aprendiz/dashboard' },
            { label: 'Mi Ficha' },
          ]}
        />

        <section className={s.infoCard}>
          <header className={s.infoHeader}>
            <span className={s.infoIcon} aria-hidden="true"><GraduationCap size={22} /></span>
            <div>
              <h2 className={s.infoTitle}>{ficha.nombre}</h2>
              <span className={`${s.infoCodigo} ${s.mono}`}>{ficha.codigo}</span>
            </div>
            <Badge variant={ficha.estado === 'activo' ? 'success' : 'danger'}>
              {ficha.estado === 'activo' ? 'Activa' : 'Inactiva'}
            </Badge>
          </header>

          <dl className={s.infoGrid}>
            <div className={s.infoItem}>
              <dt>Programa</dt>
              <dd>{ficha.programa}</dd>
            </div>
            <div className={s.infoItem}>
              <dt>Instructor</dt>
              <dd>
                {ficha.instructorId ? (
                  <Link to={`/aprendiz/perfil-instructor?id=${ficha.instructorId}`} className={s.link}>
                    {ficha.instructorName}
                  </Link>
                ) : (
                  ficha.instructorName
                )}
              </dd>
            </div>
            <div className={s.infoItem}>
              <dt>Aprendices</dt>
              <dd>{estudiantes.length || ficha.aprendices}</dd>
            </div>
            <div className={s.infoItem}>
              <dt>Proyectos</dt>
              <dd>{ficha.proyectos}</dd>
            </div>
            <div className={s.infoItem}>
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
            <h3 className={s.sectionTitle}>Integrantes de la ficha ({estudiantes.length})</h3>
            <ul className={s.studentsGrid}>
              {estudiantes.map((est) => (
                <li key={est.id}>
                  <Link to={`/aprendiz/perfil-companero/${est.id}`} className={s.studentCard}>
                    <Avatar name={est.name} src={est.fotoPerfil} size="md" />
                    <span className={s.studentInfo}>
                      <span className={s.studentName}>{est.name}</span>
                      <span className={s.studentEmail}>{est.email}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
