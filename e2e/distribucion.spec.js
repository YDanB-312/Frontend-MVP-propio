import { test, expect, login, logout } from './helpers'

test.describe('Navegación lateral (sidebar)', () => {
  test('admin ve sus enlaces sin títulos de sección', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/admin/dashboard')
    const sidebar = page.locator('aside')
    for (const nombre of ['Dashboard', 'Propuestas', 'Similitudes', 'Reportes de Fallas', 'Alertas', 'Usuarios', 'Fichas', 'Configuración', 'Mi Perfil']) {
      await expect(sidebar.getByRole('link', { name: nombre })).toBeVisible()
    }
    // Sin títulos separadores
    await expect(sidebar.locator('p')).toHaveCount(0)
  })

  test('instructor y aprendiz ven sus enlaces', async ({ page }) => {
    await login(page, 'instructor')
    await page.goto('/instructor/dashboard')
    let sidebar = page.locator('aside')
    for (const nombre of ['Dashboard', 'Revisión Propuestas', 'Similitudes', 'Fichas', 'Alertas', 'Mi Perfil', 'Reportar Falla']) {
      await expect(sidebar.getByRole('link', { name: nombre })).toBeVisible()
    }
    await expect(sidebar.locator('p')).toHaveCount(0)

    await logout(page)
    await page.goto('/login')
    await page.getByPlaceholder('tu.correo@ejemplo.com').fill('maria.gonzalez@soy.sena.edu.co')
    await page.locator('input[type="password"]').fill('123456')
    await page.getByRole('button', { name: /Iniciar Sesión/i }).click()
    await page.waitForURL('**/aprendiz/dashboard')
    await page.goto('/aprendiz/dashboard')
    sidebar = page.locator('aside')
    for (const nombre of ['Dashboard', 'Propuestas', 'Similitudes', 'Ficha', 'Alertas', 'Mi Perfil', 'Reportar Falla']) {
      await expect(sidebar.getByRole('link', { name: nombre })).toBeVisible()
    }
  })

  test('el enlace queda activo en las subrutas de detalle', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/admin/detalle-proyecto/4')
    const activo = page.locator('aside a[href="/admin/proyectos"]')
    await expect(activo).toHaveClass(/linkActive/)
    await expect(activo).toContainText('Propuestas')
  })
})

test.describe('Footer espejo y migas', () => {
  test('footer admin cubre las secciones clave', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/admin/dashboard')
    const footer = page.locator('footer')
    for (const nombre of ['Dashboard', 'Usuarios', 'Propuestas', 'Similitudes', 'Configuración', 'Mi Perfil']) {
      await expect(footer.getByRole('link', { name: nombre })).toBeVisible()
    }
  })

  test('listas admin con miga Dashboard › Sección', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/admin/proyectos')
    await expect(page.getByText('Dashboard').first()).toBeVisible()
    await page.goto('/admin/similitudes')
    await expect(page.getByText('Dashboard').first()).toBeVisible()
    await page.goto('/admin/reportes-fallas')
    await expect(page.getByText('Dashboard').first()).toBeVisible()
  })
})
