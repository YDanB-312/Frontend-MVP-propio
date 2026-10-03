import { test, expect, login } from './helpers'

test.describe('Instructor: similitudes agrupadas por ficha', () => {
  test('muestra grupos colapsables con pares dentro', async ({ page }) => {
    await login(page, 'instructor')
    await page.goto('/instructor/similitudes')

    const grupo = page.getByRole('button', { name: /coincidencia/i }).first()
    await expect(grupo).toBeVisible()
    await expect(grupo).toHaveAttribute('aria-expanded', 'true')

    await expect(grupo).toContainText(/coincidencia/)
    await expect(page.getByRole('link', { name: /^Ver$/i }).first()).toBeVisible()

    // La contraparte (propuesta de otra ficha) muestra su título, no "Proyecto no disponible".
    await expect(page.getByText('Proyecto no disponible')).toHaveCount(0)
    await expect(page.getByText('Sistema de Gestión de Inventarios').first()).toBeVisible()

    await grupo.click()
    await expect(grupo).toHaveAttribute('aria-expanded', 'false')
    await grupo.click()
    await expect(grupo).toHaveAttribute('aria-expanded', 'true')
  })
})

async function entrarComo(page, correo, password) {
  await page.goto('/login')
  await page.getByPlaceholder(/Correo electr/i).fill(correo)
  await page.locator('input[type="password"]').fill(password)
  await page.getByRole('button', { name: /Iniciar Sesi/i }).click()
  await page.waitForURL('**/aprendiz/dashboard', { timeout: 15000 })
}

test.describe('Aprendiz: mi propuesta siempre es la "A"', () => {
  test('la sonda pendiente pone su propuesta como A y la aprobada como B', async ({ page }) => {
    // Ana Martínez es dueña de "Sistema de Gestión de Inventarios" (pendiente).
    await entrarComo(page, 'ana.martinez@soy.sena.edu.co', '123456')
    // S5 = proyecto 9 (de Ana, pendiente) ↔ proyecto 10 (de Juan, aprobado).
    await page.goto('/aprendiz/detalle-similitud/5')

    const cards = page.locator('[class*="projectCard"]')
    await expect(cards).toHaveCount(2)

    // A = la suya (con marca "Tu propuesta"); B = la aprobada con la que coincidió.
    await expect(cards.nth(0)).toContainText('Sistema de Gestión de Inventarios')
    await expect(cards.nth(0)).toContainText('Tu propuesta')
    await expect(cards.nth(1)).toContainText('Plataforma de Existencias del Almacén')
  })
})

test.describe('Regla de perspectiva: una pendiente nunca es coincidencia ajena', () => {
  test('el dueño de la aprobada no ve la pendiente que la comparó', async ({ page }) => {
    // María es dueña de la aprobada "Sistema de Gestión de Inventarios" (p5);
    // S4 la compara con la pendiente p9 de Ana: para María no es una coincidencia.
    await login(page, 'aprendiz')
    await page.goto('/aprendiz/detalle-similitud/4')
    await expect(page.getByRole('heading', { name: /Similitud no autorizada/i })).toBeVisible()
  })

  test('la dueña de la pendiente sí ve su coincidencia con la aprobada', async ({ page }) => {
    await entrarComo(page, 'ana.martinez@soy.sena.edu.co', '123456')
    await page.goto('/aprendiz/similitudes')

    // Su grupo es su propia propuesta; al expandirlo aparece la coincidencia
    // con la propuesta APROBADA de Laura.
    const grupo = page.getByRole('button', { name: /coincidencia/i }).filter({ hasText: 'Sistema IoT para Agricultura' })
    await expect(grupo).toBeVisible()
    await grupo.click()
    const regionId = await grupo.getAttribute('aria-controls')
    await expect(page.locator(`#${regionId}`)).toContainText('Portal de Transparencia SENA')
  })
})

test.describe('Admin: tira resumen de similitudes', () => {
  test('muestra pares, altas, programas y umbral', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/admin/similitudes')

    const tira = page.getByRole('status', { name: /Resumen de coincidencias/i })
    await expect(tira).toBeVisible()
    await expect(tira.getByText('Pares', { exact: true })).toBeVisible()
    await expect(tira.getByText('Sobre 70%', { exact: true })).toBeVisible()
    await expect(tira.getByText('Programas', { exact: true })).toBeVisible()
    await expect(tira.getByText('Umbral', { exact: true })).toBeVisible()
    await expect(tira.getByText('30%', { exact: true })).toBeVisible()
  })
})
