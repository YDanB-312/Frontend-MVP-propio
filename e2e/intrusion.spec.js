import { test, expect, login } from './helpers'

test.describe('Autorización: instructor vs recursos ajenos', () => {
  test('el propietario accede a su ficha y sus propuestas', async ({ page }) => {
    await login(page, 'instructor') // Carlos Ruiz
    await page.goto('/instructor/detalle-ficha/1')
    await expect(page.getByRole('heading', { name: /Analisis y Desarrollo 2568/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Eliminar/i })).toBeVisible()

    await page.goto('/instructor/detalle-proyecto/4')
    await expect(page.getByText(/Plataforma de Ventas Online/).first()).toBeVisible()
    await expect(page.getByText(/Observaciones \(/i)).toBeVisible()
  })

  test('NO puede abrir el detalle de una ficha ajena', async ({ page }) => {
    await login(page, 'otro') // Carlos Rodríguez Díaz (fichas 2 y 3)
    await page.goto('/instructor/detalle-ficha/1')

    await expect(page.getByText(/no está a tu cargo/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /Eliminar/i })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /Editar/i })).toHaveCount(0)
  })

  test('propuesta ajena se ve en MODO LECTURA: contexto sí, acciones no', async ({ page }) => {
    await login(page, 'otro')
    await page.goto('/instructor/detalle-proyecto/1')

    // Contexto general visible
    await expect(page.getByText(/Sistema IoT para Agricultura/).first()).toBeVisible()
    await expect(page.getByText(/Información de la propuesta/i)).toBeVisible()

    // Sin acciones de intervención
    await expect(page.getByRole('button', { name: /Aprobar|Rechazar|Agregar observación/i })).toHaveCount(0)
    await expect(page.locator('textarea')).toHaveCount(0)

    // Banner de modo lectura presente
    await expect(page.getByText(/modo lectura/i)).toBeVisible()
  })


  test('las similitudes son globales: cualquier instructor las ve', async ({ page }) => {
    await login(page, 'otro')
    await page.goto('/instructor/similitudes')

    // El listado institucional muestra las coincidencias detectadas
    await expect(page.locator('table tbody tr').first()).toBeVisible()
  })

  test('en similitud ajena, sin botón Ver proyecto hacia fichas fuera de su cargo', async ({ page }) => {
    // Carlos Rodríguez Díaz (fichas 2 y 3) abre la similitud 2 (proyectos de ficha 1, de Carlos Ruiz)
    await login(page, 'otro')
    await page.goto('/instructor/detalle-similitud/2')

    // El contexto de la coincidencia SÍ es visible (tarjetas A/B)
    await expect(page.getByText(/Propuesta A/).first()).toBeVisible()

    // Pero sin enlaces profundos hacia propuestas fuera de su cargo
    await expect(page.getByRole('link', { name: /Ver proyecto/i })).toHaveCount(0)

    // Y sin formulario de observación
    await expect(page.locator('textarea')).toHaveCount(0)
  })

})
