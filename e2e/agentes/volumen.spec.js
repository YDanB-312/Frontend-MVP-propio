// Pruebas con VOLUMEN de datos: valida que con cientos de filas los listados,
// la paginación, los filtros y la búsqueda siguen funcionando.
//
// La siembra/restauración del volumen las hace `e2e/run-volumen.mjs` (config
// propia sin globalSetup, para no pisar el volumen con el reseed base).
import { test, expect, login } from '../helpers'

test.setTimeout(180000)

test('usuarios: paginación, filtro por rol y búsqueda con volumen', async ({ page }) => {
  await login(page, 'superadmin')
  await page.goto('/admin/usuarios')

  const nav = page.getByRole('navigation', { name: /Paginación/i })
  await expect(nav.getByText(/Mostrando 1–8 de \d+ usuarios/)).toBeVisible({ timeout: 15000 })
  await nav.getByRole('button', { name: /Página siguiente/i }).click()
  await expect(nav.getByText(/Mostrando 9–16 de \d+ usuarios/)).toBeVisible()

  // Filtro por rol aprendiz → muchas filas.
  await page.locator('label', { hasText: /^Rol/ }).locator('select').selectOption('aprendiz')
  await expect(nav.getByText(/Mostrando 1–8 de \d+ usuarios/)).toBeVisible()

  // Búsqueda por el apellido de las cuentas de volumen.
  await page.getByPlaceholder('Nombre o correo…').fill('volumen')
  await expect(page.locator('tbody').getByText(/Volumen/).first()).toBeVisible({ timeout: 10000 })
})

test('propuestas y reportes: paginación con volumen', async ({ page }) => {
  await login(page, 'superadmin')

  // Propuestas: hay muchas páginas (base 8 + 80 de volumen).
  await page.goto('/admin/proyectos')
  await expect(page.getByRole('navigation', { name: /Paginación/i }).getByText(/Mostrando 1–8 de \d{2,}/)).toBeVisible({ timeout: 15000 })
  await page.getByPlaceholder(/aprendiz/i).fill('Propuesta Volumen')
  await expect(page.locator('tbody').getByText(/Propuesta Volumen/).first()).toBeVisible({ timeout: 10000 })

  // Reportes: se encuentran los de volumen.
  await page.goto('/admin/reportes-fallas')
  await page.getByPlaceholder(/reportante/i).fill('Reporte volumen')
  await expect(page.locator('tbody').getByText(/Reporte volumen/).first()).toBeVisible({ timeout: 10000 })
})

test('fichas: aparecen las fichas de volumen', async ({ page }) => {
  await login(page, 'superadmin')
  await page.goto('/admin/fichas')
  await expect(page.getByText(/Ficha Volumen/).first()).toBeVisible({ timeout: 15000 })
})
