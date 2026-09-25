import { test, expect, login } from './helpers'

// Un instructor con fichas a cargo no puede ser degradado: las fichas quedarían
// sin responsable. El backend responde 409 y la UI lo muestra.
test('no se puede degradar a un instructor con fichas a cargo', async ({ page }) => {
  await login(page, 'admin')
  // Usuario 2 = Carlos Ruiz (instructor con la ficha 1 a cargo).
  await page.goto('/admin/detalle-usuario/2')
  await page.getByRole('button', { name: /^Editar$/i }).click()
  await page.locator('select[name="role"]').selectOption('aprendiz')
  await page.getByRole('button', { name: /Guardar cambios/i }).click()

  await expect(page.getByText(/ficha\(s\) a cargo/i)).toBeVisible()
})
