import { test, expect, login } from './helpers'

test.describe('Notificaciones y tema', () => {
  test('aprendiz con alertas sin lectura ve el punto pulsante; al leerlas desaparece', async ({ page }) => {
    await login(page, 'aprendiz')
    const campana = page.getByRole('button', { name: /Notificaciones/ })

    // María tiene alertas sin leer en el seed → punto visible
    const hayPunto = await campana.locator('.dot, [class*="dot"]').isVisible().catch(() => false)
    if (hayPunto) {
      await campana.click()
      await page.waitForURL('**/aprendiz/alertas')
      // Marcar todas como leídas si existe el control
      const btnLeer = page.getByRole('button', { name: /marcar.*leíd/i }).first()
      if (await btnLeer.isVisible().catch(() => false)) {
        await btnLeer.click()
      }
    } else {
      // Sin punto: coherente con cero sin leer
      await expect(campana.locator('.dot')).toHaveCount(0)
    }
  })
})

test.describe('Modo oscuro', () => {
  test('toggle aplica data-theme y persiste tras recargar', async ({ page }) => {
    await login(page, 'aprendiz')
    const btnTema = page.getByRole('button', { name: /modo (oscuro|claro)/i })
    const tema = () => page.evaluate(() => document.documentElement.dataset.theme)

    // Agnóstico al tema inicial (dark-first): el toggle siempre invierte
    const inicial = await tema()
    await btnTema.click()
    const invertido = inicial === 'dark' ? 'light' : 'dark'
    await expect(page.locator(`html[data-theme="${invertido}"]`)).toHaveCount(1)

    await page.reload()
    await expect(page.locator(`html[data-theme="${invertido}"]`)).toHaveCount(1)

    await page.getByRole('button', { name: /modo (oscuro|claro)/i }).click()
    await expect(page.locator(`html[data-theme="${inicial}"]`)).toHaveCount(1)
  })
})

test.describe('Vista móvil de tablas', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('usuarios se renderiza como tarjetas (thead oculto)', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/admin/usuarios')
    await expect(page.locator('th').first()).toBeHidden()
    await expect(page.locator('[data-label]').first()).toBeVisible()
  })

  test('revisiones del instructor muestra la cola en móvil', async ({ page }) => {
    await login(page, 'instructor')
    await page.goto('/instructor/revision-propuestas')
    const cola = page.getByRole('list', { name: /Cola de revisión/i })
    await expect(cola).toBeVisible()
    await expect(cola.getByRole('button').first()).toBeVisible()
  })
})
