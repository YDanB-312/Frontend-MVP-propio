import { test, expect, login } from './helpers'

// Regresión FICHA-01: el instructor guarda una ficha CON aprendices. El PUT
// debe enviar solo escalares (no relaciones) y el roster debe conservarse.
test('el instructor edita una ficha con aprendices sin perder el roster', async ({ page }) => {
  await login(page, 'instructor')
  await page.goto('/instructor/detalle-ficha/1')
  await expect(page.getByRole('heading', { name: /Analisis y Desarrollo 2568/ })).toBeVisible({ timeout: 15000 })

  // Roster visible antes de editar.
  await expect(page.getByText('Ana Martínez').first()).toBeVisible()

  await page.getByRole('button', { name: /^Editar$/i }).click()
  const nombre = 'Analisis y Desarrollo 2568 E2E'
  await page.getByLabel('Nombre de la ficha').fill(nombre)
  await page.getByRole('button', { name: /Guardar cambios/i }).click()

  // Guardado correcto: el formulario se cierra y el nombre nuevo queda visible.
  await expect(page.getByRole('heading', { name: nombre })).toBeVisible({ timeout: 15000 })
  await expect(page.getByRole('button', { name: /^Editar$/i })).toBeVisible()

  // El roster sigue asociado a la ficha.
  await expect(page.getByText('Ana Martínez').first()).toBeVisible()
})
