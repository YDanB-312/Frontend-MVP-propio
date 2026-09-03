import { Link } from 'react-router-dom'
import Badge from '../Badge/Badge'
import Tag from '../Tag/Tag'
import s from './DetalleProyectoBase.module.css'
import { displayNames } from '../../data/mockData'

const ESTADO_VARIANT = {
  pendiente: 'warning',
  aprobado: 'success',
  rechazado: 'danger',
}

/**
 * Contenido compartido "Información del proyecto" — usado por
 * DetalleProyecto (aprendiz), DetalleProyectoInstructor y DetalleProyectoAdmin.
 * Mantiene una sola fuente de verdad visual para coherencia entre roles.
 */
export default function InformacionProyecto({ proyecto, ficha, fichaHref }) {
  const keywords = (proyecto.keywords || '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean)

  const objetivosEsp = (proyecto.objetivosEspecificos || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  const tieneObjetivosNuevos = proyecto.objetivoGeneral || objetivosEsp.length > 0
  const objetivosLegacy = (proyecto.objectives || '')
    .split('\n')
    .map((l) => l.replace(/^[\s•\-–]+/, '').trim())
    .filter(Boolean)

  return (
    <>
      <div className={s.badgeRow}>
        <Badge variant={ESTADO_VARIANT[proyecto.estado] || 'neutral'}>
          {displayNames.projectStatus[proyecto.estado] || proyecto.estado}
        </Badge>
        {proyecto.areaAplicacion && <Tag variant="info">{proyecto.areaAplicacion}</Tag>}
      </div>

      <dl className={s.detailList}>
        <div className={s.detailRow}>
          <dt>Fecha de creación</dt>
          <dd>{proyecto.createdAt}</dd>
        </div>
        <div className={s.detailRow}>
          <dt>Instructor</dt>
          <dd>{proyecto.instructorName || '—'}</dd>
        </div>
        <div className={s.detailRow}>
          <dt>Ficha</dt>
          <dd>
            {fichaHref ? (
              <Link to={fichaHref} className={s.link}>
                {ficha ? `${ficha.codigo} · ${ficha.nombre}` : `#${proyecto.fichaId}`}
              </Link>
            ) : ficha ? (
              `${ficha.codigo} · ${ficha.nombre}`
            ) : (
              `#${proyecto.fichaId}`
            )}
          </dd>
        </div>
        <div className={s.detailRow}>
          <dt>Tipo de proyecto</dt>
          <dd>{proyecto.projectType === 'pagina_web' ? 'Página Web' : 'Aplicación'}</dd>
        </div>
        <div className={s.detailRow}>
          <dt>Integrantes</dt>
          <dd>{(proyecto.integrantes || []).join(', ') || proyecto.studentName || '—'}</dd>
        </div>
      </dl>

      <h3 className={s.subTitle}>Descripción</h3>
      <p className={s.paragraph}>{proyecto.description}</p>

      {tieneObjetivosNuevos ? (
        <>
          <h3 className={s.subTitle}>Objetivo general</h3>
          <p className={s.paragraph}>{proyecto.objetivoGeneral || 'Sin definir.'}</p>
          {objetivosEsp.length > 0 && (
            <>
              <h3 className={s.subTitle}>Objetivos específicos</h3>
              <ol className={s.objList}>
                {objetivosEsp.map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ol>
            </>
          )}
        </>
      ) : objetivosLegacy.length > 0 ? (
        <>
          <h3 className={s.subTitle}>Objetivos</h3>
          <ul className={s.objList}>
            {objetivosLegacy.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </>
      ) : null}

      {keywords.length > 0 && (
        <>
          <h3 className={s.subTitle}>Palabras clave</h3>
          <div className={s.chips}>
            {keywords.map((k) => (
              <Tag key={k} variant="success">
                {k}
              </Tag>
            ))}
          </div>
        </>
      )}
    </>
  )
}
