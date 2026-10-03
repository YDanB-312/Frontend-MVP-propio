import { test, expect, login } from './helpers'

// Trazabilidad: al cambiar de ficha, las propuestas creadas en la ficha
// anterior se conservan allí y se marcan como "ficha anterior" (no se mueven).
test('tras cambiar de ficha, mis propuestas previas se marcan como de ficha anterior', async ({ page }) => {
  await login(page, 'aprendiz')

  // En la ficha original, la tarjeta muestra su ficha.
  await page.goto('/aprendiz/propuestas')
  await expect(page.getByText('xkp-mqwr').first()).toBeVisible()

  // Salir de la ficha y unirse a otra por código.
  await page.goto('/aprendiz/ficha')
  await page.getByRole('button', { name: /Salir de la ficha/i }).click()
  await page.getByRole('button', { name: /Sí, salir/i }).click()
  await page.getByLabel(/Código de la ficha/i).fill('bnt-jhsa')
  await page.getByRole('button', { name: /Buscar ficha/i }).click()
  await page.getByRole('button', { name: /Unirme a esta ficha/i }).click()
  await expect(page.getByRole('heading', { name: /Analisis y Desarrollo 2634/ })).toBeVisible({ timeout: 15000 })

  // Sus propuestas anteriores se conservan con su ficha y se avisa que no se movieron.
  await page.goto('/aprendiz/propuestas')
  await expect(page.getByText(/ficha anterior/i).first()).toBeVisible()
  await expect(page.getByText(/se conservan en la ficha donde las creaste/i)).toBeVisible()

  // La ficha nueva no lista las propuestas de la ficha anterior.
  await page.goto('/aprendiz/ficha')
  await expect(page.getByRole('heading', { name: /Analisis y Desarrollo 2634/ })).toBeVisible()
})
