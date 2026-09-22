import { test, expect, login } from './helpers'

const RED_INFO = 'Informática, Diseño y Desarrollo de Software'

test.describe('Administración de usuarios (superadmin)', () => {
  test('crear instructor básico y verificarlo en listado y detalle', async ({ page }) => {
    // El listado del admin de centro solo muestra gente adscrita a su centro;
    // un instructor recién creado (sin ficha) se ve en la vista global.
    await login(page, 'superadmin')

    // 1. Crear instructor: solo datos de cuenta — la taxonomía vive en la ficha
    await page.goto('/admin/usuarios')
    await page.getByRole('button', { name: /Nuevo Usuario/i }).click()

    const email = `instructor.e2e.${Date.now()}@sena.edu.co`
    const formulario = page.locator('form')
    await formulario.getByPlaceholder('Ej. María González').fill('Instructor E2E Programa')
    await formulario.getByPlaceholder('usuario@ejemplo.com').fill(email)
    await formulario.locator('input[name="password"]').fill('123456')
    await formulario.locator('select[name="role"]').selectOption('instructor')

    // Ya no existe selección de red/programas al crear el usuario
    await expect(formulario.locator('select[name="red"]')).toHaveCount(0)

    await formulario.getByRole('button', { name: /Crear usuario/i }).click()

    // 2. Éxito + usuario en el listado
    await expect(page.getByText('Usuario creado correctamente.')).toBeVisible()
    await page.getByPlaceholder('Nombre o correo…').fill(email)
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
    await page.locator('form select[name="centroId"]').selectOption({ index: 1 })
    await page.locator('form').getByRole('button', { name: /^Crear ficha$/i }).click()

    // La ficha queda creada bajo el programa elegido (no heredado)
    await expect(page.getByText('Ficha creada correctamente.')).toBeVisible()
    await expect(page.getByText('Ficha Redes E2E')).toBeVisible()
    await expect(page.getByText('N° 8888 · Infraestructura Redes')).toBeVisible()
  })
})
