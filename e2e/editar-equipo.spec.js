import { test, expect, login } from './helpers'

// El creador puede gestionar el equipo de su propuesta, pero nunca quitarse a
// sí mismo. Los nombres se resuelven con el propio equipo (nunca "Usuario").
test('el creador agrega y quita integrantes, y no puede quitarse a sí mismo', async ({ page }) => {
  await login(page, 'aprendiz')
  // Propuesta 4 (Plataforma de Ventas Online): creada por María en la ficha 1.
  await page.goto('/aprendiz/detalle-proyecto/4')

  await expect(page.getByText('Equipo', { exact: true })).toBeVisible()
  await expect(page.getByText(/\(creador\)/i)).toBeVisible()

  // La fila del creador no ofrece "Quitar".
  const filaCreador = page.locator('li', { hasText: '(creador)' }).first()
  await expect(filaCreador.getByRole('button', { name: /Quitar/i })).toHaveCount(0)

  // Ana Martínez está en la ficha 1 pero no en el equipo → disponible.
  const filaAna = page.locator('li', { hasText: 'Ana Martínez' }).first()
  await filaAna.getByRole('button', { name: /Agregar/i }).click()

  const anaEnEquipo = page.locator('li', { hasText: 'Ana Martínez' }).first()
  await expect(anaEnEquipo.getByRole('button', { name: /Quitar/i })).toBeVisible()

  await anaEnEquipo.getByRole('button', { name: /Quitar/i }).click()
  await expect(page.locator('li', { hasText: 'Ana Martínez' }).first()
    .getByRole('button', { name: /Agregar/i })).toBeVisible()
})


