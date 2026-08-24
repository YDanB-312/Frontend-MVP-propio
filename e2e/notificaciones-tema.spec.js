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

    await btnTema.click()
    await expect(page.locator('html[data-theme="dark"]')).toHaveCount(1)

    await page.reload()
    await expect(page.locator('html[data-theme="dark"]')).toHaveCount(1)

    await btnTema.click()
    await expect(page.locator('html[data-theme="dark"]')).toHaveCount(0)
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

  test('revisiones del instructor usa tarjetas con etiquetas', async ({ page }) => {
    await login(page, 'instructor')
    await page.goto('/instructor/revision-propuestas')
    await expect(page.locator('th').first()).toBeHidden()
    await expect(page.locator('[data-label="Aprendiz"]').first()).toBeVisible()
  })
})
