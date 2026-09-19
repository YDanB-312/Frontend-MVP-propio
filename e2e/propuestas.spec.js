import { test, expect, login, logout } from './helpers'

test.describe('Propuestas del aprendiz', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'aprendiz')
    await page.getByRole('link', { name: 'Propuestas' }).first().click()
    await page.waitForURL('**/aprendiz/propuestas')
  })

  test('lista las propuestas existentes como tarjetas', async ({ page }) => {
    await expect(page.locator('[class*="card"]').first()).toBeVisible()
  })

  test('validaciones del formulario de nueva propuesta', async ({ page }) => {
    await page.getByRole('main').getByRole('button', { name: /Nueva propuesta/i }).click()

    // La ficha se deriva del perfil: nota visible y un solo select (área)
    await expect(page.getByText(/Ficha de formación:/i)).toBeVisible()
    await expect(page.locator('select')).toHaveCount(1)

    // Enviar vacío → errores obligatorios
    await page.getByRole('button', { name: /Enviar propuesta/i }).click()
    await expect(page.getByText(/al menos 5 caracteres/i)).toBeVisible()
    await expect(page.getByText(/al menos 20 caracteres/i)).toBeVisible()
    await expect(page.getByText(/al menos 15 caracteres/i)).toBeVisible()

    // Un solo objetivo específico → rechaza al re-enviar
    const objetivos = page.locator('textarea').nth(2)
    await objetivos.fill('Implementar el módulo principal.')
    await page.getByRole('button', { name: /Enviar propuesta/i }).click()
    await expect(page.getByText(/al menos 2 objetivos específicos/i)).toBeVisible()
  })

  test('crear propuesta individual fluye a análisis y resultados', async ({ page }) => {
    await page.getByRole('main').getByRole('button', { name: /Nueva propuesta/i }).click()
    await page.getByPlaceholder(/Sistema de monitoreo ambiental/i).fill('Plataforma E2E de Tutorías')
    await page.locator('textarea').nth(0).fill('Conecta aprendices con tutores académicos para reforzar temas vistos en clase mediante sesiones cortas.')
    await page.locator('textarea').nth(1).fill('Centralizar la solicitud de tutorías académicas por área.')
    await page.locator('textarea').nth(2).fill('Diseñar el flujo de reserva de tutorías.\nImplementar el panel de tutores disponibles.')
    await page.locator('select').nth(0).selectOption({ index: 1 })
    await page.getByRole('button', { name: /Enviar propuesta/i }).click()

    await page.waitForURL('**/aprendiz/analizando-proyecto', { timeout: 15000 })
    await page.waitForURL('**/aprendiz/resultado-analisis**', { timeout: 20000 })
    await expect(page.getByText(/Resultado del análisis|Coincidencia/i).first()).toBeVisible()
  })

  test('crear propuesta en equipo seleccionando un compañero de ficha', async ({ page }) => {
    await page.getByRole('main').getByRole('button', { name: /Nueva propuesta/i }).click()
    await page.getByPlaceholder(/Sistema de monitoreo ambiental/i).fill('Propuesta Equipo E2E')
    await page.locator('textarea').nth(0).fill('Propuesta creada por el flujo automatizado para validar el trabajo en equipo entre aprendices.')
    await page.locator('textarea').nth(1).fill('Validar el flujo completo de propuestas colaborativas en la plataforma.')
    await page.locator('textarea').nth(2).fill('Seleccionar integrantes desde la ficha.\nVerificar los derechos plenos del compañero añadido.')

    // Seleccionar a Juan Pérez como integrante
    const chipJuan = page.getByRole('button', { name: 'Juan Pérez' })
    await chipJuan.click()
    await expect(chipJuan).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByText(/Integrantes del equipo \(1\)/i)).toBeVisible()

    await page.locator('select').nth(0).selectOption({ index: 1 })
    await page.getByRole('button', { name: /Enviar propuesta/i }).click()
    await page.waitForURL('**/aprendiz/analizando-proyecto', { timeout: 15000 })
    await page.waitForURL('**/aprendiz/resultado-analisis**', { timeout: 20000 })

    // Juan ve la propuesta compartida y tiene derechos plenos sobre ella
    await logout(page)
    await page.getByPlaceholder('tu.correo@ejemplo.com').fill('juan.perez@soy.sena.edu.co')
    await page.locator('input[type="password"]').fill('123456')
    await page.getByRole('button', { name: /Iniciar Sesión/i }).click()
    await page.waitForURL('**/aprendiz/dashboard')

    await page.goto('/aprendiz/propuestas')
    await expect(page.getByText(/Propuesta Equipo E2E/)).toBeVisible()

    await page.getByText(/Propuesta Equipo E2E/).click()
    await page.waitForURL('**/aprendiz/detalle-proyecto/**')
    await expect(page.getByText(/Observaciones \(/i)).toBeVisible()
    await expect(page.getByText(/Juan Pérez/).first()).toBeVisible()
  })
})
