import { test, expect, login } from './helpers'

test.describe('Revisión: rechazar propuesta', () => {
  test('rechazar pide confirmación y marca el estado', async ({ page }) => {
    await login(page, 'instructor')
    await page.goto('/instructor/revision-propuestas')
    const cola = page.getByRole('list', { name: /Cola de revisión/i })
    await expect(cola.getByRole('button').first()).toBeVisible({ timeout: 15000 })
    const nodo = cola.getByRole('button', { name: /Pendiente/ }).first()
    if ((await nodo.count()) === 0) test.skip(true, 'No hay pendientes para este instructor en el seed actual')

    const titulo = (await nodo.innerText()).split('\n')[0]
    await nodo.click()
    await page.getByRole('button', { name: /^Rechazar /i }).click()
    await expect(page.getByText('Rechazar propuesta')).toBeVisible()
    await page.getByRole('button', { name: /Sí, rechazar/i }).click()

    await expect(page.getByRole('button', { name: /^Rechazar /i })).toHaveCount(0, { timeout: 10000 })
    await expect(cola.getByRole('button', { name: /Rechazado/ }).first()).toBeVisible()
    expect(titulo.length).toBeGreaterThan(0)
  })
})
