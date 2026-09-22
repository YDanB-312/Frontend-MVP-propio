import { test, expect, login } from './helpers'

test.describe('Admin: centros de formación', () => {
  test('lista seed de Popayán y crea uno nuevo', async ({ page }) => {
    await login(page, 'superadmin')
    await page.goto('/admin/training-centers')
    await expect(page.getByText('Centro de Teleinformática y Producción Industrial')).toBeVisible()
    await expect(page.getByText('Centro de Comercio y Servicios')).toBeVisible()

    await page.getByRole('button', { name: /Crear Centro/i }).click()
    await page.getByPlaceholder('Ej. Centro de Teleinformática y Producción Industrial').fill('Centro E2E del Oriente')
    await page.getByPlaceholder('Ej. Popayán').fill('Popayán')
    await page.locator('form').getByRole('button', { name: /Crear centro/i }).click()

    await expect(page.getByText('Centro creado correctamente.')).toBeVisible()
    await expect(page.getByText('Centro E2E del Oriente')).toBeVisible()
  })

  test('valida nombre corto y duplicado al crear', async ({ page }) => {
    await login(page, 'superadmin')
    await page.goto('/admin/training-centers')
    await page.getByRole('button', { name: /Crear Centro/i }).click()
    await page.getByPlaceholder('Ej. Centro de Teleinformática y Producción Industrial').fill('Abc')
    await page.locator('form').getByRole('button', { name: /Crear centro/i }).click()
    await expect(page.getByText(/al menos 5 caracteres/i)).toBeVisible()

    await page.getByPlaceholder('Ej. Centro de Teleinformática y Producción Industrial').fill('Centro de Comercio y Servicios')
    await page.locator('form').getByRole('button', { name: /Crear centro/i }).click()
    await expect(page.getByText(/Ya existe un centro/i)).toBeVisible()
  })

  test('edita un centro y confirma el cambio', async ({ page }) => {
    await login(page, 'superadmin')
    await page.goto('/admin/training-centers')
    const fila = page.locator('tr', { hasText: 'Centro de Comercio y Servicios' })
    await fila.getByRole('button', { name: /Editar/i }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Editar centro' })).toBeVisible()
    await page.getByPlaceholder('Ej. Centro de Teleinformática y Producción Industrial').fill('Centro de Comercio y Servicios E2E')
    await page.locator('form').getByRole('button', { name: /Guardar cambios/i }).click()
    await expect(page.getByText('Centro actualizado correctamente.')).toBeVisible()
    await expect(page.getByText('Centro de Comercio y Servicios E2E')).toBeVisible()
  })

  test('eliminar libre pide confirmación; en uso está bloqueado', async ({ page }) => {
    await login(page, 'superadmin')
    await page.goto('/admin/training-centers')

    await page.getByRole('button', { name: /Crear Centro/i }).click()
    await page.getByPlaceholder('Ej. Centro de Teleinformática y Producción Industrial').fill('Centro Temporal E2E')
    await page.locator('form').getByRole('button', { name: /Crear centro/i }).click()
    await expect(page.getByText('Centro Temporal E2E')).toBeVisible()

    const fila = page.locator('tr', { hasText: 'Centro Temporal E2E' })
    await fila.getByRole('button', { name: /Eliminar/i }).click()
    await expect(page.getByText('Eliminar centro')).toBeVisible()
    await page.getByRole('button', { name: /Sí, eliminar/i }).click()
    await expect(page.getByText('Centro eliminado.')).toBeVisible()
    await expect(page.getByText('Centro Temporal E2E')).toHaveCount(0)

    const enUso = page.locator('tr', { hasText: 'Centro de Teleinformática y Producción Industrial' })
    const btn = enUso.getByRole('button', { name: /Eliminar/i })
    await expect(btn).toBeDisabled()
    await expect(btn).toHaveAttribute('title', /fichas asociadas/i)
  })

  test('la ficha muestra su centro de formación', async ({ page }) => {
    await login(page, 'instructor')
    await page.goto('/instructor/detalle-ficha/1')
    await expect(page.getByText('Centro de formación').first()).toBeVisible()
    await expect(page.getByText(/Teleinformática y Producción Industrial/i).first()).toBeVisible()
  })
})

