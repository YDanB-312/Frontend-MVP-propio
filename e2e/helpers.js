import { test, expect } from '@playwright/test'

const CUENTAS = {
  aprendiz: { email: 'maria.gonzalez@soy.sena.edu.co', password: '123456', home: '/aprendiz/dashboard', nombre: 'María' },
  instructor: { email: 'carlos.ruiz@sena.edu.co', password: '123456', home: '/instructor/dashboard', nombre: 'Carlos' },
  admin: { email: 'admin@sena.edu.co', password: 'admin123', home: '/admin/dashboard', nombre: 'admin' },
  otro: { email: 'carlos.rodriguez@sena.edu.co', password: '123456', home: '/instructor/dashboard', nombre: 'Carlos R' },
}

export async function login(page, role) {
  const cta = CUENTAS[role]
  await page.goto('/login')
  await page.getByPlaceholder('tu.correo@ejemplo.com').fill(cta.email)
  await page.locator('input[type="password"]').fill(cta.password)
  await page.getByRole('button', { name: /Iniciar Sesión/i }).click()
  await page.waitForURL(`**${cta.home}`, { timeout: 15000 })
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
