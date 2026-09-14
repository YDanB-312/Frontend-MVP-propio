/*global Buffer*/
import { test, expect, login } from './helpers'

const PNG_1x1 = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
  0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
  0x42, 0x60, 0x82,
])

test.describe('Foto de perfil y lightbox', () => {
  test('sin editar no hay controles de foto', async ({ page }) => {
    await login(page, 'aprendiz')
    await page.goto('/aprendiz/perfil')
    await expect(page.getByRole('button', { name: /Subir foto de perfil|Cambiar foto/i })).toHaveCount(0)
    await expect(page.locator('input[type="file"]')).toHaveCount(0)
  })

  test('subir foto, verla en visor, cerrarlo y quitarla', async ({ page }) => {
    await login(page, 'aprendiz')
    await page.goto('/aprendiz/perfil')
    await page.getByRole('button', { name: /Editar perfil/i }).click()

    await page.locator('input[type="file"]').setInputFiles({
      name: 'foto.png',
      mimeType: 'image/png',
      buffer: PNG_1x1,
    })
    await expect(page.getByText(/Foto actualizada/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /Quitar foto/i })).toBeVisible()

    await page.getByRole('button', { name: /Ver foto de/i }).click()
    const visor = page.getByRole('dialog', { name: /Vista de imagen|Foto de/i })
    await expect(visor).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(visor).toHaveCount(0)

    await page.getByRole('button', { name: /Quitar foto/i }).click()
    await expect(page.getByText(/Foto eliminada/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /Subir foto de perfil/i })).toBeVisible()
  })

  test('archivo no imagen es rechazado', async ({ page }) => {
    await login(page, 'aprendiz')
    await page.goto('/aprendiz/perfil')
    await page.getByRole('button', { name: /Editar perfil/i }).click()
    await page.locator('input[type="file"]').setInputFiles({
      name: 'nota.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('no soy una imagen'),
    })
    await expect(page.getByText(/debe ser una imagen/i)).toBeVisible()
  })
})
