import { test, expect, login } from './helpers'

test.describe('Admin: redes de conocimiento CRUD', () => {
  test('valida nombre y programas al crear', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/admin/redes-conocimiento')
    await page.getByRole('button', { name: /Nueva Red/i }).click()
    await page.getByRole('button', { name: /^Crear red$/i }).click()
    await expect(page.getByRole('alert').filter({ hasText: /El nombre es obligatorio/i })).toBeVisible()
    await expect(page.getByRole('alert').filter({ hasText: /al menos un programa/i })).toBeVisible()
  })

  test('programa duplicado muestra error', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/admin/redes-conocimiento')
    await page.getByRole('button', { name: /Nueva Red/i }).click()
    await page.getByPlaceholder(/Nuevo programa/i).fill('ADSO')
    await page.getByRole('button', { name: /Agregar/i }).click()
    await page.getByPlaceholder(/Nuevo programa/i).fill('adso')
    await page.getByRole('button', { name: /Agregar/i }).click()
    await expect(page.getByText(/ya está en la lista/i)).toBeVisible()
  })

  test('crea, edita y elimina una red libre', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/admin/redes-conocimiento')
    await page.getByRole('button', { name: /Nueva Red/i }).click()
    await page.getByPlaceholder(/Ej\. Informática/i).fill('Red E2E Temporal')
    await page.getByPlaceholder(/Nuevo programa/i).fill('Programa E2E Uno')
    await page.getByRole('button', { name: /Agregar/i }).click()
    await page.getByRole('button', { name: /^Crear red$/i }).click()
    await expect(page.getByText('Red creada correctamente.')).toBeVisible()
    await expect(page.getByText('Red E2E Temporal')).toBeVisible()

    const fila = page.locator('tr', { hasText: 'Red E2E Temporal' })
    await fila.getByRole('button', { name: /Editar/i }).click()
    await page.getByPlaceholder(/Ej\. Informática/i).fill('Red E2E Temporal Editada')
    await page.getByRole('button', { name: /Guardar cambios/i }).click()
    await expect(page.getByText('Red actualizada correctamente.')).toBeVisible()
    await expect(page.getByText('Red E2E Temporal Editada')).toBeVisible()

    const fila2 = page.locator('tr', { hasText: 'Red E2E Temporal Editada' })
    await fila2.getByRole('button', { name: /Eliminar/i }).click()
    await expect(page.getByText('Eliminar red')).toBeVisible()
    await page.getByRole('button', { name: /Sí, eliminar/i }).click()
    await expect(page.getByText('Red eliminada correctamente.')).toBeVisible()
    await expect(page.getByText('Red E2E Temporal Editada')).toHaveCount(0)
  })
})


