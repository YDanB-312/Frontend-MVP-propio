import s from './Pagination.module.css'

export default function Pagination({
  totalItems = 0,
  itemsPerPage = 10,
  paginaActual = 1,
  setPaginaActual,
  itemName = 'elementos',
  showInfo = true,
  filteredCount,
}) {
  const count = filteredCount ?? totalItems
  const totalPages = Math.max(1, Math.ceil(count / itemsPerPage))
  if (count === 0) return null

  const start = (paginaActual - 1) * itemsPerPage + 1
  const end = Math.min(paginaActual * itemsPerPage, count)

  const pages = []
  const from = Math.max(1, paginaActual - 2)
  const to = Math.min(totalPages, paginaActual + 2)
  if (from > 1) {
    pages.push(1)
    if (from > 2) pages.push('…')
  }
  for (let i = from; i <= to; i++) pages.push(i)
  if (to < totalPages) {
    if (to < totalPages - 1) pages.push('…')
    pages.push(totalPages)
  }

  return (
    <nav className={s.wrap} aria-label="Paginación">
      {showInfo && (
        <p className={s.info}>
          Mostrando <strong>{start}–{end}</strong> de <strong>{count}</strong> {itemName}
        </p>
      )}
      <div className={s.pages}>
        <button
          type="button"
          className={s.navBtn}
          disabled={paginaActual === 1}
          onClick={() => setPaginaActual(paginaActual - 1)}
          aria-label="Página anterior"
        >
          ‹
        </button>
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`e${i}`} className={s.ellipsis}>…</span>
          ) : (
            <button
              key={p}
              type="button"
              className={`${s.pageBtn} ${p === paginaActual ? s.active : ''}`}
              aria-current={p === paginaActual ? 'page' : undefined}
              onClick={() => setPaginaActual(p)}
            >
              {p}
            </button>
          )
        )}
        <button
          type="button"
          className={s.navBtn}
          disabled={paginaActual === totalPages}
          onClick={() => setPaginaActual(paginaActual + 1)}
          aria-label="Página siguiente"
        >
          ›
        </button>
      </div>
    </nav>
  )
}
