import { test, expect, login } from './helpers'

// El aprendiz puede salir de su ficha cuando quiera y unirse a otra con el
// código que le comparte un instructor.

const unico = () => `aprend.e2e.${Date.now()}@soy.sena.edu.co`

async function registrarAprendiz(page) {
  const email = unico()
  await page.goto('/register')
  await page.getByPlaceholder(/Mar.a Jos/i).fill('Test E2E')
  await page.getByPlaceholder(/Gonz.lez Ruiz/i).fill('Automatizado')
  await page.getByPlaceholder(/Correo electr/i).fill(email)
  await page.locator('input[type="password"]').first().fill('clave123')
  await page.locator('input[type="password"]').nth(1).fill('clave123')
  await page.getByRole('button', { name: /Crear Cuenta/i }).click()
  await page.waitForURL('**/confirmacion')
  return email
}

async function entrar(page, email, password) {
  await page.goto('/login')
  await page.getByPlaceholder(/Correo electr/i).fill(email)
  await page.locator('input[type="password"]').fill(password)
  await page.getByRole('button', { name: /Iniciar Sesi/i }).click()
  await page.waitForURL('**/aprendiz/dashboard')
}

async function abrirFicha(page) {
  await page.getByLabel(/Navegaci.n principal/).getByRole('link', { name: 'Ficha' }).click()
  await expect(page).toHaveURL(/\/aprendiz\/ficha/)
}

test.describe('Mi Ficha: salir y unirse por código', () => {
  test('un aprendiz sin ficha se une con el código del instructor', async ({ page }) => {
    const email = await registrarAprendiz(page)
    await entrar(page, email, 'clave123')
    await abrirFicha(page)

    // Recién registrado: no tiene ficha y ve el formulario del código.
    await expect(page.getByRole('button', { name: /Buscar ficha/i })).toBeVisible()
    await page.getByLabel(/Código de la ficha/i).fill('xkp-mqwr')
    await page.getByRole('button', { name: /Buscar ficha/i }).click()

    // Previsualización antes de unirse.
    const previa = page.getByRole('region', { name: /Ficha encontrada/i })
    await expect(previa.getByRole('heading', { name: /Analisis y Desarrollo 2568/ })).toBeVisible()
    await previa.getByRole('button', { name: /Unirme a esta ficha/i }).click()

    // Ya dentro: se ve la ficha, su código y sus integrantes.
    await expect(page.getByText('xkp-mqwr').first()).toBeVisible({ timeout: 15000 })
    await expect(page.getByText(/Integrantes de la ficha/i)).toBeVisible()
  })

  test('un código inválido avisa y no une a nadie', async ({ page }) => {
    const email = await registrarAprendiz(page)
    await entrar(page, email, 'clave123')
    await abrirFicha(page)

    await page.getByLabel(/Código de la ficha/i).fill('zzz-zzzz')
    await page.getByRole('button', { name: /Buscar ficha/i }).click()
    await expect(page.getByText(/No encontramos una ficha con ese código/i)).toBeVisible()
  })

  test('con ficha sale tras confirmar y luego se une a otra', async ({ page }) => {
    await login(page, 'aprendiz')
    await abrirFicha(page)
    await expect(page.getByRole('heading', { name: /Analisis y Desarrollo 2568/ })).toBeVisible()

    // Salir exige confirmación.
    await page.getByRole('button', { name: /Salir de la ficha/i }).click()
    await expect(page.getByText(/Seguro que quieres salir/i)).toBeVisible()
    await page.getByRole('button', { name: /Sí, salir/i }).click()

    // Al quedar sin ficha aparece el formulario del código.
    await expect(page.getByRole('button', { name: /Buscar ficha/i })).toBeVisible({ timeout: 15000 })
    await page.getByLabel(/Código de la ficha/i).fill('bnt-jhsa')
    await page.getByRole('button', { name: /Buscar ficha/i }).click()
    await page.getByRole('button', { name: /Unirme a esta ficha/i }).click()

    // Queda vinculado a la segunda ficha del seed.
    await expect(page.getByRole('heading', { name: /Analisis y Desarrollo 2634/ })).toBeVisible({ timeout: 15000 })
  })
})
