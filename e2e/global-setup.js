// Resetea el backend local antes de cada archivo de specs para que todos
// partan de un seed conocido (el frontend ya no tiene mock: consume la API).
// Si el reseed falla, se reintenta una vez y se avisa con claridad.
import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const esperar = (ms) => new Promise((r) => setTimeout(r, ms))

export default async function globalSetup() {
  const backend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'backend')
  let ultimoError = null
  for (let intento = 1; intento <= 2; intento++) {
    try {
      execSync('php artisan migrate:fresh --seed', { cwd: backend, stdio: 'pipe', timeout: 180000 })
      console.log('[e2e] backend resembrado (migrate:fresh --seed)')
      await esperar(500) // deja asentar el seed antes de abrir el navegador
      return
    } catch (err) {
      ultimoError = err
      await esperar(1500)
    }
  }
  console.error('[e2e] AVISO: no se pudo resembrar la base. Detalle:', String(ultimoError?.message || ultimoError).slice(0, 300))
}
