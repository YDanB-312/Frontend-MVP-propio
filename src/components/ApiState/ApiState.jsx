// Estados de una consulta a la API: cargando, error y vacío.
//
//   <ApiState cargando={cargando} error={error} vacio={!filas.length} onReintentar={recargar}>
//     ...contenido...
//   </ApiState>
import Button from '../Button/Button'
import EmptyState from '../EmptyState/EmptyState'
import LatticeLoader from '../LatticeLoader/LatticeLoader'
import { Warning, ArrowClockwise } from 'phosphor-react'
import s from './ApiState.module.css'

export default function ApiState({ cargando, error, vacio = false, onReintentar, mensajeVacio, iconoVacio, children }) {
  if (cargando) {
    return (
      <div className={s.cargando}>
        <LatticeLoader
          label="Cargando información"
          pattern="orbit"
          grid={3}
          shape="round"
          showTimer={false}
          idleOpacity={0.25}
        />
      </div>
    )
  }

  if (error) {
    return (
      <div className={s.error} role="alert">
        <p className={s.errorTexto}>
          <Warning size={16} weight="fill" /> {error.message || 'No se pudo cargar la información.'}
        </p>
        {onReintentar && (
          <Button type="button" variant="secondary" size="sm" onClick={onReintentar}>
            <ArrowClockwise size={14} /> Reintentar
          </Button>
        )}
      </div>
    )
  }

  if (vacio) {
    return <EmptyState icon={iconoVacio} message={mensajeVacio} />
  }

  return children
}
