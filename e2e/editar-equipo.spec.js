import { test, expect, login } from './helpers'

// El creador puede gestionar el equipo de su propuesta, pero nunca quitarse a
// sí mismo. Los nombres se resuelven con el propio equipo (nunca "Usuario").
test('el creador agrega y quita integrantes, y no puede quitarse a sí mismo', async ({ page }) => {
  await login(page, 'aprendiz')
  // Propuesta 4 (Plataforma de Ventas Online): creada por María en la ficha 1.
  await page.goto('/aprendiz/detalle-proyecto/4')

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
