// Transiciones de vista con la API nativa del navegador (cero dependencias).
// Respeta prefers-reduced-motion y navegadores sin soporte (fallback directo).

export function reduceMovimiento() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

export function transitionView(actualizar) {
  if (
    reduceMovimiento() ||
    typeof document === 'undefined' ||
    typeof document.startViewTransition !== 'function'
  ) {
    actualizar()
    return
  }
  document.startViewTransition(() => actualizar())
}
