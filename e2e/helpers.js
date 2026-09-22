import { test, expect } from '@playwright/test'

const CUENTAS = {
  aprendiz: { email: 'maria.gonzalez@soy.sena.edu.co', password: '123456', home: '/aprendiz/dashboard', nombre: 'María' },
  instructor: { email: 'carlos.ruiz@sena.edu.co', password: '123456', home: '/instructor/dashboard', nombre: 'Carlos' },
  admin: { email: 'admin@sena.edu.co', password: 'admin123', home: '/admin/dashboard', nombre: 'admin' },
  superadmin: { email: 'superadmin@sena.edu.co', password: 'super123', home: '/admin/dashboard', nombre: 'Super' },
  otro: { email: 'carlos.rodriguez@sena.edu.co', password: '123456', home: '/instructor/dashboard', nombre: 'Carlos R' },
}

// Login genérico con credenciales explícitas (sirve para cuentas creadas en
// tiempo de ejecución, p. ej. la simulación cruzada).
export async function entrar(page, email, password, home) {
  await page.goto('/login')
  await page.getByPlaceholder('tu.correo@ejemplo.com').fill(email)
  await page.locator('input[type="password"]').fill(password)
  await page.getByRole('button', { name: /Iniciar Sesión/i }).click()
  await page.waitForURL(`**${home}`, { timeout: 15000 })
}

export async function login(page, role) {
  const cta = CUENTAS[role]
  await entrar(page, cta.email, cta.password, cta.home)
  return cta
}

export async function logout(page) {
  await page.getByRole('button', { name: 'Cerrar sesión' }).click()
  await page.waitForURL('**/login')
}

export async function esperarDashboard(page, role) {
  await page.waitForURL(`**/${role}/dashboard`)
}

export { CUENTAS, expect, test }
