import { test, expect, login } from './helpers'

// Alta/asociación de aprendices desde la ficha: el usuario existente solo se
// asocia (sin credenciales nuevas); el nuevo se crea y recibe credenciales.
test('la ficha asocia un aprendiz existente sin nuevas credenciales', async ({ page }) => {
  await login(page, 'admin')
  await page.goto('/admin/detalle-ficha/1')
  await expect(page.getByText(/Aprendices \(/)).toBeVisible({ timeout: 15000 })

  // Diego Ramírez existe (ficha 4) y todavía no está en la ficha 1.
  await page.getByPlaceholder(/Nombre, usuario, documento o correo/i).fill('dramirez')
  const fila = page.locator('li', { hasText: 'Diego Ramírez' }).first()
  await expect(fila.getByRole('button', { name: /Agregar/i })).toBeVisible({ timeout: 10000 })
  await fila.getByRole('button', { name: /Agregar/i }).click()

  await expect(page.getByText(/se asoció a la ficha/i)).toBeVisible({ timeout: 15000 })
  await expect(page.getByText('Diego Ramírez').first()).toBeVisible()
})

test('la ficha crea un aprendiz nuevo y le envía credenciales', async ({ page }) => {
  const sufijo = String(Date.now())
  const correo = `ficha.aprendiz.${sufijo}@correo.com`

  await login(page, 'admin')
  await page.goto('/admin/detalle-ficha/1')
  const buscador = page.getByPlaceholder(/Nombre, usuario, documento o correo/i)
  await buscador.fill(`Aprendiz Ficha ${sufijo}`)

  await page.getByRole('button', { name: /Crear aprendiz/i }).click()
  await page.getByLabel('Nombres').fill('Aprendiz')
  await page.getByLabel('Apellidos').fill(`Ficha ${sufijo}`)
  await page.getByLabel('Número de documento').fill(sufijo.slice(-8))
  await page.getByLabel('Correo personal').fill(correo)
  await page.getByRole('button', { name: /Crear y asociar/i }).click()

  // El sistema genera credenciales y las envía al correo personal.
  await expect(page.getByText(/Credenciales enviadas a/i)).toBeVisible({ timeout: 15000 })
  await expect(page.getByText(new RegExp(`Aprendiz Ficha ${sufijo}`)).first()).toBeVisible()
})
