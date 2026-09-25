import { test, expect, login } from './helpers'

test.describe('Privacidad: aprendiz vs propuestas ajenas', () => {
  test('propuesta ajena NO muestra observaciones, formulario ni similitudes', async ({ page }) => {
    await login(page, 'aprendiz') // María (id 1)
    // Propuesta ajena: Sistema IoT para Agricultura (id 1, de Ana Martínez id 4)
    await page.goto('/aprendiz/detalle-proyecto/1')

    // Contexto general visible
    await expect(page.getByText(/Sistema IoT para Agricultura/).first()).toBeVisible()

    // PRIVACIDAD: sin panel de similitudes, sin observaciones, sin formulario
    await expect(page.getByText(/Similitudes detectadas/i)).toHaveCount(0)
    await expect(page.getByText(/Observaciones \(/i)).toHaveCount(0)
    await expect(page.locator('textarea')).toHaveCount(0)
    await expect(page.getByRole('button', { name: /Agregar observación/i })).toHaveCount(0)
  })

  test('propuesta propia SÍ muestra observaciones y similitudes', async ({ page }) => {
    await login(page, 'aprendiz')
    // Propuesta propia: Plataforma de Ventas Online (id 4)
    await page.goto('/aprendiz/detalle-proyecto/4')

    await expect(page.getByText(/Similitudes detectadas/i)).toBeVisible()
    await expect(page.getByText(/Observaciones \(/i)).toBeVisible()
  })

  test('integrante del equipo tiene derechos plenos sobre la propuesta compartida', async ({ page }) => {
    // Juan es integrante de "Plataforma de Ventas Online" (creada por María)
    await page.goto('/login')
    await page.getByPlaceholder(/Correo electr/i).fill('juan.perez@soy.sena.edu.co')
    await page.locator('input[type="password"]').fill('123456')
    await page.getByRole('button', { name: /Iniciar Sesión/i }).click()
    await page.waitForURL('**/aprendiz/dashboard')

    // La propuesta compartida aparece en SU lista
    await page.goto('/aprendiz/propuestas')
    await expect(page.getByText(/Plataforma de Ventas Online/)).toBeVisible()

    // Y sobre ella tiene derechos plenos: observaciones y similitudes visibles
    await page.goto('/aprendiz/detalle-proyecto/4')
    await expect(page.getByText(/Similitudes detectadas/i)).toBeVisible()
    await expect(page.getByText(/Observaciones \(/i)).toBeVisible()
  })

  test('detalle de similitud solo muestra observaciones de MI propuesta del par', async ({ page }) => {
    await login(page, 'aprendiz')
    await page.goto('/aprendiz/similitudes')
    // Expandir el primer grupo y abrir su primera similitud
    await page.getByRole('button', { name: /coincidencia/i }).first().click()
    await expect(page.locator('[class*="matchRow"]').first()).toBeVisible()

    // Abrir la primera similitud del listado
    await page.locator('[class*="matchRow"]').first().click()
    await page.waitForURL('**/aprendiz/detalle-similitud/**')

    const panelObs = page.getByText(/Observaciones de tu propuesta/i)
    await expect(panelObs).toBeVisible()
    const texto = await panelObs.innerText()
    expect(texto).toContain('tu propuesta')
  })
})
