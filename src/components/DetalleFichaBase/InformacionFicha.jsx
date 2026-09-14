import { Link } from 'react-router-dom'
import Badge from '../Badge/Badge'
import Button from '../Button/Button'
import { displayNames, getRedDePrograma, findCentroById } from '../../data/mockData'
import s from './DetalleFichaBase.module.css'
import { ArrowRight, Users } from 'phosphor-react'

/**
 * Contenido compartido "Información de la ficha" — usado por
 * DetalleFicha (aprendiz) y DetalleFichaInstructor.
 * Diseño canónico: celdas DataPanel/infoCell (infoGridInstructor).
 */
export default function InformacionFicha({
  ficha,
  estudiantesCount,
  proyectosCount,
  instructorHref,
  showDirectorioLink = false,
  directorioTo,
}) {
  const red = getRedDePrograma(ficha.programa)
  const centro = ficha.centroId ? findCentroById(ficha.centroId) : null

  return (
    <>
      <dl className={s.infoGridInstructor}>
        <div className={s.infoCell}>
          <dt>Código</dt>
          <dd>
            <code className={s.codigo}>{ficha.codigo}</code>
          </dd>
        </div>
        <div className={s.infoCell}>
          <dt>Número de ficha</dt>
          <dd>N° {ficha.numero}</dd>
        </div>
        <div className={s.infoCell}>
          <dt>Red de conocimiento</dt>
          <dd>{red || '—'}</dd>
        </div>
        <div className={s.infoCell}>
          <dt>Programa</dt>
          <dd>{ficha.programa || '—'}</dd>
        </div>
        <div className={s.infoCell}>
          <dt>Centro de formación</dt>
          <dd>{centro ? `${centro.nombre}${centro.ciudad ? ` · ${centro.ciudad}` : ''}` : '—'}</dd>
        </div>
        <div className={s.infoCell}>
          <dt>Instructor</dt>
          <dd>
            {instructorHref ? (
              <Link to={instructorHref} className={s.link}>
                {ficha.instructorName || 'Sin asignar'}
              </Link>
            ) : (
              ficha.instructorName || 'Sin asignar'
            )}
          </dd>
        </div>
        <div className={s.infoCell}>
          <dt>Estado</dt>
          <dd>
            <Badge variant={ficha.estado === 'activo' ? 'success' : ficha.estado === 'finalizado' ? 'info' : 'neutral'}>
              {displayNames.classGroupStatus[ficha.estado] || ficha.estado}
            </Badge>
          </dd>
        </div>
        <div className={s.infoCell}>
          <dt>Aprendices</dt>
          <dd>{estudiantesCount}</dd>
        </div>
        <div className={s.infoCell}>
          <dt>Propuestas asociadas</dt>
          <dd>{proyectosCount}</dd>
        </div>
      </dl>
      {showDirectorioLink && directorioTo && (
        <Button as="link" to={directorioTo} className={s.directorioBtn}>
          <Users size={14} /> Ver directorio de aprendices <ArrowRight size={14} />
        </Button>
      )}
    </>
  )
}
