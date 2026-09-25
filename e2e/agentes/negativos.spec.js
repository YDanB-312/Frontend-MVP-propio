// Casos negativos por rol: formularios inválidos, acciones bloqueadas y
// conflictos. Verifica el mensaje/estado correcto y que NO se muta nada.
import { test, expect, login } from '../helpers'

test.setTimeout(180000)

test('aprendiz: propuesta vacía muestra validaciones', async ({ page }) => {
  await login(page, 'aprendiz')
  await page.goto('/aprendiz/propuestas')
  await page.getByRole('main').getByRole('button', { name: /Nueva propuesta/i }).click()
  await page.getByRole('button', { name: /Enviar propuesta/i }).click()

  await expect(page.getByText(/al menos 5 caracteres/i)).toBeVisible()
  await expect(page.getByText(/al menos 20 caracteres/i)).toBeVisible()
  await expect(page.getByText(/al menos 15 caracteres/i)).toBeVisible()
})

test('instructor: ficha inválida y borrado bloqueado', async ({ page }) => {
  await login(page, 'instructor')

  // Crear ficha vacía → errores de validación.
  await page.goto('/instructor/fichas?crear=1')
  await page.locator('form').getByRole('button', { name: /^Crear ficha$/i }).click()
  await expect(page.getByText(/Selecciona la red de conocimiento/i)).toBeVisible()
  await expect(page.getByText(/El nombre de la ficha es obligatorio/i)).toBeVisible()

  // Ficha con aprendices/propuestas → el instructor puede eliminarla (cascada)
  // con confirmación reforzada.
  await page.goto('/instructor/detalle-ficha/1')
  await expect(page.getByRole('button', { name: /Eliminar ficha/i })).toBeEnabled()
})

test('admin: validaciones y conflictos', async ({ page }) => {
  await login(page, 'admin')

  // Editar a un correo ya existente → error.
  await page.goto('/admin/detalle-usuario/4')
  await page.getByRole('button', { name: /^Editar$/i }).click()
  await page.getByLabel('Correo electrónico').fill('maria.gonzalez@soy.sena.edu.co')
  await page.getByRole('button', { name: /Guardar cambios/i }).click()
  await expect(page.getByText(/Ya existe un usuario/i)).toBeVisible()

  // Motor fuera de rango → validación del formulario.
  await page.goto('/admin/config-similitud')
  await page.locator('input[type="number"]').first().fill('200')
  await page.getByRole('button', { name: /Guardar parámetros/i }).click()
  await expect(page.getByText(/entre 5 y 95/i)).toBeVisible()

  // Borrar ficha con datos: ya no se bloquea (cascada con confirmación).
  await page.goto('/admin/detalle-ficha/1')
  await expect(page.getByRole('button', { name: /Eliminar ficha/i })).toBeEnabled()
})

test('admin: crear ficha vacía muestra validaciones', async ({ page }) => {
  await login(page, 'admin')
  await page.goto('/admin/fichas')
  await page.getByRole('button', { name: /Crear Ficha/i }).click()
  await page.locator('form').getByRole('button', { name: /^Crear ficha$/i }).click()

  await expect(page.getByText(/Selecciona la red de conocimiento/i)).toBeVisible()
  await expect(page.getByText(/Selecciona el programa de formación/i)).toBeVisible()
  await expect(page.getByText(/Asigna un instructor a cargo/i)).toBeVisible()
  await expect(page.getByText(/El nombre de la ficha es obligatorio/i)).toBeVisible()
})
