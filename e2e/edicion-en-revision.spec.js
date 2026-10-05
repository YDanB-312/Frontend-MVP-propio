import { test, expect, login } from './helpers'

// Regla nueva: el aprendiz edita su propuesta en revisión; sigue pendiente,
// el cambio queda en el historial y el equipo se gestiona en el mismo estado.
test('editar una propuesta en revisión no la aprueba y conserva el cambio', async ({ page }) => {
  await login(page, 'aprendiz')

  // Proyecto 4 (pendiente) de María en el seed.
  await page.goto('/aprendiz/detalle-proyecto/4')
  await expect(page.getByText('En revisión', { exact: true }).first()).toBeVisible({ timeout: 15000 })
  await expect(page.getByRole('button', { name: /^Editar$/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Enviar propuesta/i })).toHaveCount(0)

  const titulo = `Plataforma de Ventas Online ${Date.now()}`
  await page.getByRole('button', { name: /^Editar$/i }).click()
  await page.getByLabel('Título').fill(titulo)
  await page.getByRole('button', { name: /Guardar cambios/i }).click()

  await expect(page.getByText(/Propuesta actualizada\. Sigue en revisión/i)).toBeVisible({ timeout: 15000 })
  await expect(page.getByText('En revisión', { exact: true }).first()).toBeVisible()
  await expect(page.getByRole('button', { name: /Enviar propuesta/i })).toHaveCount(0)

  // El historial registra la modificación.
  await expect(page.getByText(/Contenido actualizado/i)).toBeVisible({ timeout: 15000 })

  // El cambio persiste tras recargar.
  await page.reload()
  await expect(page.getByRole('heading', { name: titulo })).toBeVisible({ timeout: 15000 })
})

test('en revisión el creador agrega y quita integrantes', async ({ page }) => {
  await login(page, 'aprendiz')
  await page.goto('/aprendiz/detalle-proyecto/4')
  await expect(page.getByText('Equipo', { exact: true })).toBeVisible({ timeout: 15000 })

  // Ana Martínez está en la ficha 1 y no en el equipo → disponible.
  const filaAna = page.locator('li', { hasText: 'Ana Martínez' }).first()
  await filaAna.getByRole('button', { name: /Agregar/i }).click()
  await expect(page.locator('li', { hasText: 'Ana Martínez' }).first()
    .getByRole('button', { name: /Quitar/i })).toBeVisible()

  // Persiste tras recargar.
  await page.reload()
  const anaTrasRecarga = page.locator('li', { hasText: 'Ana Martínez' }).first()
  await expect(anaTrasRecarga.getByRole('button', { name: /Quitar/i })).toBeVisible()

  // Quitar (las reglas existentes siguen aplicando).
  await anaTrasRecarga.getByRole('button', { name: /Quitar/i }).click()
  await expect(page.locator('li', { hasText: 'Ana Martínez' }).first()
    .getByRole('button', { name: /Agregar/i })).toBeVisible()
})
