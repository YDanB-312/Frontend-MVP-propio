import { useCallback, useEffect, useState } from 'react'
import { THEME_KEY, ThemeContext } from './theme'

// Lee una cookie de primer nivel (no usa localStorage).
function leerCookie(nombre) {
  try {
    const m = document.cookie.match(new RegExp('(^|; )' + nombre + '=([^;]*)'))
    return m ? decodeURIComponent(m[2]) : null
  } catch {
    return null
  }
}

// Por defecto: claro (blanco). La preferencia persiste en una cookie (no
// localStorage) para que un refresco no cambie el modo.
function temaInicial() {
  const guardado = leerCookie(THEME_KEY)
  return guardado === 'dark' || guardado === 'light' ? guardado : 'light'
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(temaInicial)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      document.cookie = `${THEME_KEY}=${theme}; Path=/; Max-Age=31536000; SameSite=Lax`
    } catch {
      /* cookies no disponibles */
    }
  }, [theme])

  const alternarTema = useCallback(
    () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
    []
  )

  return (
    <ThemeContext.Provider value={{ theme, alternarTema }}>
      {children}
    </ThemeContext.Provider>
  )
}
