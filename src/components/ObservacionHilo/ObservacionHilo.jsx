import s from './ObservacionHilo.module.css'

function rolDe(autor) {
  return (String(autor || '').split('|')[1] || '').trim()
}

function ChipRol({ autor }) {
  const rol = rolDe(autor) || 'Comentario'
  const clase =
    rol === 'Instructor' ? s.rolInstructor :
    rol === 'Admin' ? s.rolAdmin :
    rol === 'Aprendiz' ? s.rolAprendiz : s.rolNeutro
  return <span className={`${s.chipRol} ${clase}`}>{rol}</span>
}

function Tarjeta({ obs, permitirResponder, onRespuesta, compacta = false }) {
  return (
    <article className={`${s.tarjeta} ${compacta ? s.compacta : ''}`}>
      <header className={s.cabecera}>
        <ChipRol autor={obs.autor} />
        <span className={s.autor}>{String(obs.autor || '').split('|')[0]}</span>
        <time className={s.fecha}>{obs.fecha}</time>
      </header>
      <p className={s.texto}>{obs.texto}</p>
      {permitirResponder && (
        <button type="button" className={s.responder} onClick={() => onRespuesta?.(obs)}>
          Responder
        </button>
      )}
    </article>
  )
}

export default function ObservacionHilo({ grupos, permitirResponder = false, onRespuesta = null }) {
  if (!grupos || grupos.length === 0) {
    return <p className={s.vacio}>Aún no hay observaciones.</p>
  }

  return (
    <div className={s.hilos}>
      {grupos.map((g) => (
        <div key={g.id} className={s.hilo}>
          <Tarjeta obs={g} permitirResponder={permitirResponder} onRespuesta={onRespuesta} />
          {(g.respuestas || []).length > 0 && (
            <div className={s.respuestas}>
              {g.respuestas.map((r) => (
                <Tarjeta key={r.id} obs={r} permitirResponder={false} onRespuesta={null} compacta />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
