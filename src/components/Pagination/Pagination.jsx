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

  // Clamp: si el filtro encogió la lista, no mostrar rangos imposibles (9–8 de 8)
  const pagina = Math.min(Math.max(1, paginaActual), totalPages)
  const start = (pagina - 1) * itemsPerPage + 1
  const end = Math.min(pagina * itemsPerPage, count)

  const pages = []
  const from = Math.max(1, pagina - 2)
  const to = Math.min(totalPages, pagina + 2)
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
          disabled={pagina === 1}
          onClick={() => setPaginaActual(pagina - 1)}
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
              className={`${s.pageBtn} ${p === pagina ? s.active : ''}`}
              aria-current={p === pagina ? 'page' : undefined}
              onClick={() => setPaginaActual(p)}
            >
              {p}
            </button>
          )
        )}
        <button
          type="button"
          className={s.navBtn}
          disabled={pagina === totalPages}
          onClick={() => setPaginaActual(pagina + 1)}
          aria-label="Página siguiente"
        >
          ›
        </button>
      </div>
    </nav>
  )
}
