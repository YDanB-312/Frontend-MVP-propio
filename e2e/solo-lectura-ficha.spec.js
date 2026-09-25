import { test, expect, login } from './helpers'

// Regla Classroom: fuera de la ficha la propuesta es SOLO LECTURA. Se ve el
// historial, pero no se comenta, ni edita, ni elimina.
test('fuera de la ficha la propuesta es solo lectura', async ({ page }) => {
  await login(page, 'aprendiz')

  // Salir de la ficha (idempotente frente a reintentos).
  await page.goto('/aprendiz/ficha')
  const salir = page.getByRole('button', { name: /Salir de la ficha/i })
  const buscar = page.getByRole('button', { name: /Buscar ficha/i })
  await expect(salir.or(buscar).first()).toBeVisible({ timeout: 15000 })
  if (await salir.isVisible().catch(() => false)) {
    await salir.click()
    await page.getByRole('button', { name: /Sí, salir/i }).click()
    await expect(buscar).toBeVisible({ timeout: 15000 })
  }

  // Propuesta 4 (creada por María): se ve, pero en solo lectura.
  await page.goto('/aprendiz/detalle-proyecto/4')
  await expect(page.getByText('Plataforma de Ventas Online').first()).toBeVisible()
  await expect(page.getByText(/Solo lectura: ya no perteneces a esta ficha/i)).toBeVisible()

  await expect(page.getByRole('button', { name: /Agregar observación/i })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Editar', exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Eliminar', exact: true })).toHaveCount(0)
})
