import { test, expect, login } from './helpers'

// Al salir de la ficha, las propuestas propias siguen visibles (no se ocultan);
// solo crear una nueva exige pertenecer a una ficha.
test('sin ficha: mis propuestas siguen visibles y crear me lleva a unirme', async ({ page }) => {
  await login(page, 'aprendiz')

  // Salir de la ficha, sin unirse a otra.
  await page.goto('/aprendiz/ficha')
  await page.getByRole('button', { name: /Salir de la ficha/i }).click()
  await page.getByRole('button', { name: /Sí, salir/i }).click()
  await expect(page.getByRole('button', { name: /Buscar ficha/i })).toBeVisible({ timeout: 15000 })

  // Sus propuestas propias siguen listadas, con el aviso de que no tiene ficha.
  await page.goto('/aprendiz/propuestas')
  await expect(page.getByText('Plataforma de Ventas Online')).toBeVisible()
  await expect(page.getByText(/No perteneces a ninguna ficha/i)).toBeVisible()

  // Crear exige ficha: el botón de la cabecera lleva a Mi Ficha.
  await page.getByRole('button', { name: /Nueva propuesta/i }).last().click()
  await page.waitForURL('**/aprendiz/ficha')
})
