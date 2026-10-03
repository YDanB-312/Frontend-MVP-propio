import { test, expect, login } from './helpers'

const RED_INFO = 'Informática, Diseño y Desarrollo de Software'

test.describe('Administración de usuarios (admin)', () => {
  test('crear instructor básico y verificarlo en listado y detalle', async ({ page }) => {
    await login(page, 'admin')

    // 1. Crear instructor: cuenta + documento; el sistema genera las credenciales
    await page.goto('/admin/usuarios')
    await page.getByRole('button', { name: /Nuevo Usuario/i }).click()

    const correo = `instructor.e2e.${Date.now()}@correo.com`
    const formulario = page.locator('form')
    await formulario.getByPlaceholder('Ej. María José').fill('Instructor')
    await formulario.getByPlaceholder('Ej. González Ruiz').fill('E2E Programa')
    await formulario.locator('select[name="tipoDocumento"]').selectOption('CC')
    await formulario.getByPlaceholder('Ej. 1234567890').fill(String(Date.now()).slice(-8))
    await formulario.getByPlaceholder('Correo personal').fill(correo)
    await formulario.locator('select[name="rol"]').selectOption('instructor')

    // Ya no existe selección de red/programas al crear el usuario
    await expect(formulario.locator('select[name="red"]')).toHaveCount(0)

    await formulario.getByRole('button', { name: /Crear usuario/i }).click()

    // 2. Credenciales generadas + usuario en el listado
    await expect(page.getByText(/creado\./i).first()).toBeVisible()
    await page.getByPlaceholder(/Nombre, documento, usuario o correo/i).fill(correo)
    await expect(page.getByText('Instructor E2E Programa')).toBeVisible()
  })

  test('cualquier instructor crea ficha eligiendo red y programa del catálogo', async ({ page }) => {
    await login(page, 'instructor')
    await page.goto('/instructor/fichas?crear=1')

    const red = page.locator('form select[name="red"]')
    const programa = page.locator('form select[name="programaId"]')

    // Cascada completa desde el catálogo oficial
    await red.selectOption(RED_INFO)
    await programa.selectOption({ label: 'Infraestructura Redes' })

    await page.getByPlaceholder('Ej. Análisis y Desarrollo 2718').fill('Ficha Redes E2E')
    await page.getByPlaceholder('Ej. 3142101').fill('8888')
    await page.locator('form').getByRole('button', { name: /^Crear ficha$/i }).click()

    // La ficha queda creada bajo el programa elegido (no heredado)
    await expect(page.getByText('Ficha creada correctamente.')).toBeVisible()
    await expect(page.getByText('Ficha Redes E2E')).toBeVisible()
    await expect(page.getByText('N° 8888 · Infraestructura Redes')).toBeVisible()
  })
})

