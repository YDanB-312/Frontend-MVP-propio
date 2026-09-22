// Runner de pruebas de VOLUMEN:
//   1) reseed base  2) siembra el volumen  3) corre el spec (config sin
//   globalSetup)  4) restaura el seed base.
// Uso: npm run test:volumen
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const raiz = path.resolve(here, '..')
const backend = path.resolve(raiz, '..', 'backend')

function artisan(...args) {
  const r = spawnSync('php', ['artisan', ...args], {
    cwd: backend,
    stdio: 'inherit',
    shell: true,
    timeout: 180000,
  })
  if (r.status !== 0) {
    console.error(`[volumen] falló: php artisan ${args.join(' ')}`)
    process.exit(1)
  }
}

console.log('[volumen] sembrando base…')
artisan('migrate:fresh', '--seed')
console.log('[volumen] sembrando volumen…')
artisan('db:seed', '--class=VolumenSeeder')

console.log('[volumen] corriendo spec…')
const r = spawnSync(
  'npx',
  [
    'playwright',
    'test',
    'e2e/agentes/volumen.spec.js',
    '--config=playwright.volumen.config.js',
    '--reporter=line',
    '--workers=1',
  ],
  { cwd: raiz, stdio: 'inherit', shell: true }
)

console.log('[volumen] restaurando seed base…')
artisan('migrate:fresh', '--seed')

process.exit(r.status === 0 ? 0 : 1)
