import { Link } from 'react-router-dom'
import Badge from '../Badge/Badge'
import Button from '../Button/Button'
import { FICHA_ESTADO_VARIANT } from '../../constants/badgeVariants'
import { useApi } from '../../lib/useApi'
import { redes } from '../../lib/recursos'
import s from './DetalleFichaBase.module.css'
import { ArrowRight, Users } from 'phosphor-react'

// Etiquetas legibles del estado de la ficha (columnas reales de la API).
const ESTADO_LABEL = {
  activo: 'Activo',
  inactivo: 'Inactivo',
  finalizado: 'Finalizado',
  archivado: 'Archivado',
}

// Concatena nombre + apellido de un general_user.
function nombreCompleto(usuario) {
  return [usuario?.nombre, usuario?.apellido].filter(Boolean).join(' ').trim()
}

/**
 * Contenido compartido "Información de la ficha" — usado por
 * DetalleFicha (aprendiz), DetalleFichaInstructor y DetalleFichaAdmin.
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
  // Catálogo de redes: la ficha trae el id en program.knowledge_network_id.
  const { data: listaRedes } = useApi(() => redes.listar(), [], { inicial: [] })

  const programa = ficha.program || null
  const instructor = ficha.instructor?.generalUser

  // Red de conocimiento: relación anidada si viene incluida, o catálogo.
  const red = programa?.knowledgeNetwork?.nombre
    || programa?.knowledge_network?.nombre
    || (listaRedes || []).find((r) => Number(r.id) === Number(programa?.knowledge_network_id))?.nombre
    || null

  const instructorNombre = instructor ? nombreCompleto(instructor) : null

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
          <dd>{programa?.nombre || '—'}</dd>
        </div>
        <div className={s.infoCell}>
          <dt>Instructor</dt>
          <dd>
            {instructorHref && instructorNombre ? (
              <Link to={instructorHref} className={s.link}>
                {instructorNombre}
              </Link>
            ) : (
              instructorNombre || 'Sin asignar'
            )}
          </dd>
        </div>
        <div className={s.infoCell}>
          <dt>Estado</dt>
          <dd>
            <Badge variant={FICHA_ESTADO_VARIANT[ficha.estado] || 'neutral'}>
              {ESTADO_LABEL[ficha.estado] || ficha.estado}
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
