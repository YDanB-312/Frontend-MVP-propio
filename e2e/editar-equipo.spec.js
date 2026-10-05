import { test, expect, login } from './helpers'

// El creador puede gestionar el equipo de su propuesta mientras es editable
// (borrador o rechazada), pero nunca quitarse a sí mismo. Los nombres se
// resuelven con el propio equipo (nunca "Usuario").
test('el creador agrega y quita integrantes, y no puede quitarse a sí mismo', async ({ page }) => {
  await login(page, 'aprendiz')

  // Propuesta propia en borrador (el equipo solo se gestiona si es editable).
  const titulo = `Borrador equipo E2E ${Date.now()}`
  await page.goto('/aprendiz/propuestas')
  await page.getByRole('main').getByRole('button', { name: /Nueva propuesta/i }).click()
  await page.getByPlaceholder(/Sistema de monitoreo ambiental/i).fill(titulo)
  await page.getByRole('button', { name: /Guardar borrador/i }).click()

  await expect(page.getByText(titulo)).toBeVisible({ timeout: 15000 })
  await page.getByText(titulo).first().click()
  await page.waitForURL('**/aprendiz/detalle-proyecto/**')

  await expect(page.getByText('Equipo', { exact: true })).toBeVisible()
  await expect(page.getByText(/\(creador\)/i)).toBeVisible()

  // La fila del creador no ofrece "Quitar".
  const filaCreador = page.locator('li', { hasText: '(creador)' }).first()
  await expect(filaCreador.getByRole('button', { name: /Quitar/i })).toHaveCount(0)

  // Ana Martínez está en la ficha 1 pero no en el equipo → disponible.
  const filaAna = page.locator('li', { hasText: 'Ana Martínez' }).first()
  await filaAna.getByRole('button', { name: /Agregar/i }).click()

  const anaEnEquipo = page.locator('li', { hasText: 'Ana Martínez' }).first()
  await expect(anaEnEquipo.getByRole('button', { name: /Quitar/i })).toBeVisible()

  await anaEnEquipo.getByRole('button', { name: /Quitar/i }).click()
  await expect(page.locator('li', { hasText: 'Ana Martínez' }).first()
    .getByRole('button', { name: /Agregar/i })).toBeVisible()
})

// Al salir de la ficha, el equipo sigue visible con nombres reales, en solo
// lectura (sin "Agregar") y sin errores crudos.
test('sin ficha: el equipo se ve con nombres y en solo lectura', async ({ page }) => {
  await login(page, 'aprendiz')

  // Salir de la ficha (idempotente frente a reintentos). Se espera a que la
  // página resuelva: o aparece "Salir de la ficha" (aún dentro) o "Buscar ficha".
  await page.goto('/aprendiz/ficha')
  const salir = page.getByRole('button', { name: /Salir de la ficha/i })
  const buscar = page.getByRole('button', { name: /Buscar ficha/i })
  await expect(salir.or(buscar).first()).toBeVisible({ timeout: 15000 })
  if (await salir.isVisible().catch(() => false)) {
    await salir.click()
    await page.getByRole('button', { name: /Sí, salir/i }).click()
    await expect(buscar).toBeVisible({ timeout: 15000 })
  }

  await page.goto('/aprendiz/detalle-proyecto/4')
  await expect(page.getByText('Equipo', { exact: true })).toBeVisible()

  // Nombres reales + creador detectado; sin "Usuario" ni errores crudos.
  await expect(page.getByText(/\(creador\)/i)).toBeVisible()
  await expect(page.getByText('Usuario', { exact: true })).toHaveCount(0)
  await expect(page.getByText(/No query results/i)).toHaveCount(0)

  // Solo lectura: no se puede agregar (el botón del equipo se llama exactamente
  // "Agregar"; "Agregar observación" no cuenta) ni quitar al creador.
  await expect(page.getByRole('button', { name: 'Agregar', exact: true })).toHaveCount(0)
  const filaCreador = page.locator('li', { hasText: '(creador)' }).first()
  await expect(filaCreador.getByRole('button', { name: /Quitar/i })).toHaveCount(0)
})

// En revisión el creador gestiona el equipo; aprobado queda en solo lectura.
test('en revisión se gestiona el equipo y aprobado queda bloqueado', async ({ page }) => {
  await login(page, 'aprendiz')

  // Un test anterior pudo dejar a María fuera de la ficha: se reincorpora
  // (idempotente) para comprobar la gestión del equipo en revisión.
  await page.goto('/aprendiz/ficha')
  const buscar = page.getByRole('button', { name: /Buscar ficha/i })
  const salir = page.getByRole('button', { name: /Salir de la ficha/i })
  await expect(salir.or(buscar).first()).toBeVisible({ timeout: 15000 })
  if (await buscar.isVisible().catch(() => false)) {
    await page.getByLabel(/Código de la ficha/i).fill('xkp-mqwr')
    await buscar.click()
    await page.getByRole('button', { name: /Unirme a esta ficha/i }).click()
    await expect(page.getByText(/Integrantes de la ficha/i)).toBeVisible({ timeout: 15000 })
  }

  // Proyecto 4 (pendiente) de María: el equipo es editable.
  await page.goto('/aprendiz/detalle-proyecto/4')
  await expect(page.getByText('Equipo', { exact: true })).toBeVisible({ timeout: 15000 })
  await expect(page.getByRole('button', { name: 'Agregar', exact: true }).first()).toBeVisible()

  // Proyecto 5 (aprobado): solo lectura.
  await page.goto('/aprendiz/detalle-proyecto/5')
  await expect(page.getByText('Equipo', { exact: true })).toBeVisible({ timeout: 15000 })
  await expect(page.getByRole('button', { name: 'Agregar', exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Quitar/i })).toHaveCount(0)
})
