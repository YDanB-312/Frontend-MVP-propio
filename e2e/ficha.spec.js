import { test, expect } from './helpers'

const unico = () => `aprend.e2e.${Date.now()}@soy.sena.edu.co`

async function registrarAprendiz(page) {
  const email = unico()
  await page.goto('/register')
  await page.getByPlaceholder('María José').fill('Test E2E')
  await page.getByPlaceholder('González Ruiz').fill('Automatizado')
  await page.getByPlaceholder('nombre.correo@soy.sena.edu.co').fill(email)
  await page.locator('input[type="password"]').first().fill('clave123')
  await page.locator('input[type="password"]').nth(1).fill('clave123')
  await page.getByRole('button', { name: /Crear Cuenta/i }).click()
  await page.waitForURL('**/confirmacion')
  return email
}

test.describe('Ciclo de Ficha (unirse → persistir → salir)', () => {
  let email

  test.beforeEach(async ({ page }) => {
    email = await registrarAprendiz(page)
    // tras confirmación, ir a login y entrar
    await page.goto('/login')
    await page.getByPlaceholder('nombre.correo@soy.sena.edu.co').fill(email)
    await page.locator('input[type="password"]').fill('clave123')
    await page.getByRole('button', { name: /Iniciar Sesión/i }).click()
    await page.waitForURL('**/aprendiz/dashboard')
  })

  test('sin ficha muestra formulario de código; al unirse cambia a Mi Ficha y persiste', async ({ page }) => {
    // Sidebar lleva a la sección unificada
    await page.getByRole('link', { name: 'Ficha' }).click()
    await expect(page).toHaveURL(/\/aprendiz\/ficha/)
    await expect(page.getByPlaceholder('FT-X7K2MN')).toBeVisible()

    // Buscar ficha del seed y unirse
    await page.getByPlaceholder('FT-X7K2MN').fill('FT-X7K2MN')
    await page.getByRole('button', { name: /Buscar/i }).click()
    await expect(page.getByText(/Analisis y Desarrollo 2568/).first()).toBeVisible()
    await page.getByRole('button', { name: /Unirse a esta ficha/i }).click()
    await page.getByRole('button', { name: /Sí, unirme/i }).click()

    // La misma página cambia a Mi Ficha
    await expect(page.getByRole('heading', { name: /Analisis y Desarrollo 2568/ })).toBeVisible()

    // Persistencia tras recargar
    await page.reload()
    await expect(page.getByRole('heading', { name: /Analisis y Desarrollo 2568/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Salir de la ficha/i })).toBeVisible()
  })

  test('salir de la ficha vuelve al modo código y permite re-unirse', async ({ page }) => {
    await page.getByRole('link', { name: 'Ficha' }).click()
    await page.getByPlaceholder('FT-X7K2MN').fill('FT-X7K2MN')
    await page.getByRole('button', { name: /Buscar/i }).click()
    await page.getByRole('button', { name: /Unirse a esta ficha/i }).click()
    await page.getByRole('button', { name: /Sí, unirme/i }).click()
    await expect(page.getByRole('button', { name: /Salir de la ficha/i })).toBeVisible()

    await page.getByRole('button', { name: /Salir de la ficha/i }).click()
    await page.getByRole('button', { name: /Sí, salir/i }).click()

    await expect(page.getByPlaceholder('FT-X7K2MN')).toBeVisible()

    // Re-unirse para verificar que el ciclo es repetible
    await page.getByPlaceholder('FT-X7K2MN').fill('FT-X7K2MN')
    await page.getByRole('button', { name: /Buscar/i }).click()
    await page.getByRole('button', { name: /Unirse a esta ficha/i }).click()
    await page.getByRole('button', { name: /Sí, unirme/i }).click()
    await expect(page.getByRole('heading', { name: /Analisis y Desarrollo 2568/ })).toBeVisible()
  })
})
