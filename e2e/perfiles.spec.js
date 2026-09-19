import { test, expect, login } from './helpers'

test.describe('Perfiles de otros usuarios (solo lectura)', () => {  test('el detalle de compañero se ve como el perfil propio, sin edición', async ({ page }) => {
    await login(page, 'aprendiz')
    await page.goto('/aprendiz/perfil-companero/5') // Juan Pérez

    // Misma estructura que el perfil propio: filas Rol y Ficha
    await expect(page.getByText('Rol', { exact: true })).toBeVisible()
    await expect(page.getByText('Aprendiz SENA')).toBeVisible()
    await expect(page.getByText(/Ficha/).first()).toBeVisible()

    // Sin acciones de auto-servicio
    await expect(page.getByRole('button', { name: /Editar perfil/i })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /Cambiar contraseña/i })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /Quitar foto/i })).toHaveCount(0)

    // Panel de propuestas del compañero
    await expect(page.getByText(/Propuestas de Juan/i)).toBeVisible()
  })

  test('el detalle de mi instructor muestra su rol y fichas a cargo', async ({ page }) => {
    await login(page, 'aprendiz')
    await page.goto('/aprendiz/perfil-instructor')

    await expect(page.getByText('Rol', { exact: true })).toBeVisible()
    await expect(page.getByText('Instructor SENA')).toBeVisible()

    // Sin acciones de auto-servicio
    await expect(page.getByRole('button', { name: /Editar perfil/i })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /Cambiar contraseña/i })).toHaveCount(0)

    // Panel de fichas del instructor
    await expect(page.getByText(/Fichas de Carlos/i)).toBeVisible()
  })
})

test.describe('Mi perfil: el rol no se edita', () => {
  test('durante la edición el rol es de solo lectura', async ({ page }) => {
    await login(page, 'aprendiz')
    await page.goto('/aprendiz/perfil')
    await page.getByRole('button', { name: /Editar perfil/i }).click()

    const rol = page.getByRole('textbox', { name: 'Rol' })
    await expect(rol).toHaveValue('Aprendiz')
    await expect(rol).not.toBeEditable()
  })
})
