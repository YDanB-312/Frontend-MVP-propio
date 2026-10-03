import { test, expect, crearUsuarioApi } from './helpers'

// Recuperación de contraseña por correo. En local el correo se escribe en el log
// y la API devuelve `reset_url`, así que el flujo completo es probable.

// El registro público no existe; para este flujo se crea la cuenta desde el
// admin y se recupera la contraseña con el correo personal registrado.
async function crearAprendiz(request) {
  return crearUsuarioApi(request, { nombre: 'Reset E2E', apellido: 'Prueba' })
}

test.describe('Recuperar contraseña', () => {
  test('valida el correo y muestra el aviso genérico', async ({ page }) => {
    await page.goto('/recuperar-contrasena')

    await page.getByPlaceholder(/Correo electr/i).fill('no-es-correo')
    await page.getByRole('button', { name: /Enviar enlace/i }).click()
    await expect(page.getByText(/correo electrónico válido/i)).toBeVisible()

    await page.getByPlaceholder(/Correo electr/i).fill('maria.gonzalez@soy.sena.edu.co')
    await page.getByRole('button', { name: /Enviar enlace/i }).click()
    await expect(page.getByRole('heading', { name: /Revisa tu correo/i })).toBeVisible()
  })
})

test.describe('Restablecer contraseña', () => {
  test('flujo completo: enlace, nueva clave y login', async ({ page, request }) => {
    const { username, correo } = await crearAprendiz(request)

    // Solicita el enlace y lo toma del aviso de modo local.
    await page.goto('/recuperar-contrasena')
    await page.getByPlaceholder(/Correo electr/i).fill(correo)
    await page.getByRole('button', { name: /Enviar enlace/i }).click()

    const enlace = page.getByRole('link', { name: /abrir enlace de restablecimiento/i })
    await expect(enlace).toBeVisible({ timeout: 15000 })
    const href = await enlace.getAttribute('href')

    // Se navega en relativo para quedarse en el mismo origen (preview/E2E).
    await page.goto('/restablecer-contrasena' + href.slice(href.indexOf('?')))
    const campos = page.locator('input[autocomplete="new-password"]')
    await campos.nth(0).fill('nuevaClave123')
    await campos.nth(1).fill('nuevaClave123')
    await page.getByRole('button', { name: /Restablecer contraseña/i }).click()

    await expect(page.getByRole('heading', { name: /Contraseña restablecida/i })).toBeVisible()

    // La nueva contraseña queda activa.
    await page.getByRole('link', { name: /Ir al login/i }).click()
    await page.waitForURL('**/login')
    await page.getByPlaceholder('Usuario').fill(username)
    await page.locator('input[type="password"]').fill('nuevaClave123')
    await page.getByRole('button', { name: /Iniciar Sesi/i }).click()
    await page.waitForURL('**/aprendiz/dashboard', { timeout: 15000 })
  })

  test('un enlace inválido avisa y ofrece pedir otro', async ({ page }) => {
    await page.goto('/restablecer-contrasena')
    await expect(page.getByRole('heading', { name: /Enlace inválido/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Solicitar un nuevo enlace/i })).toBeVisible()
  })
})
