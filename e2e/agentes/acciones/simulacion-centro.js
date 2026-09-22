// Simulación cruzada "administrador de centro":
//   1) Superadmin crea un centro + instructor + ficha + un coordinador.
//   2) El coordinador entra y SOLO ve lo de su centro.
//   3) Gestiona al instructor (suspender/reactivar) y su ficha (archivar/borrar).
import { expect } from '@playwright/test'
import { entrar, logout } from '../../helpers'

export async function simulacionCentro(h) {
  const { page } = h
  const centro = `Centro Coordinación ${h.sufijo}`
  const correoInstructor = `instructor.centro.${h.sufijo}@sena.edu.co`
  const nombreInstructor = `Instructor Centro ${h.sufijo}`
  const nombreFicha = `Ficha Centro ${h.sufijo}`
  const correoAdmin = `coordinador.${h.sufijo}@sena.edu.co`
  let fichaId = null
  let instructoresUserId = null
  let adminUserId = null

  await h.paso('superadmin: centro, instructor, ficha y coordinador', async () => {
    await entrar(page, 'superadmin@sena.edu.co', 'super123', '/admin/dashboard')

    await h.ir('/admin/training-centers')
    await page.getByRole('button', { name: /Crear Centro/i }).click()
    await page.getByPlaceholder('Ej. Centro de Teleinformática y Producción Industrial').fill(centro)
    await page.locator('form').getByRole('button', { name: /^Crear centro$/i }).click()
    await h.esperar('Centro creado correctamente.', 10000)

    // Instructor del centro.
    await h.ir('/admin/usuarios')
    await page.getByRole('button', { name: /Nuevo Usuario/i }).click()
    let form = page.locator('form')
    await form.getByPlaceholder('Ej. María González').fill(nombreInstructor)
    await form.getByPlaceholder('usuario@ejemplo.com').fill(correoInstructor)
    await form.locator('input[name="password"]').fill('123456')
    await form.locator('select[name="role"]').selectOption('instructor')
    const inst = await h.capturar('POST', '/v1/general-users', () =>
      form.getByRole('button', { name: /Crear usuario/i }).click()
    )
    instructoresUserId = inst?.id ?? null
    await h.esperar('Usuario creado correctamente.', 10000)

    // Ficha en el centro, a cargo del instructor.
    await h.ir('/admin/fichas')
    await page.getByRole('button', { name: /Crear Ficha/i }).click()
    await page.locator('form select[name="red"]').selectOption('Informática, Diseño y Desarrollo de Software')
    await page.locator('form select[name="programa"]').selectOption('ADSO')
    await page.locator('form select[name="centroId"]').selectOption({ label: centro })
    await page.locator('form select[name="instructorId"]').selectOption({ label: nombreInstructor })
    await page.getByPlaceholder('Ej. Análisis y Desarrollo 2718').fill(nombreFicha)
    await page.getByPlaceholder('Ej. 3142101').fill('6' + h.sufijo.slice(0, 4))
    const ficha = await h.capturar('POST', '/v1/class-groups', () =>
      page.locator('form').getByRole('button', { name: /^Crear ficha$/i }).click()
    )
    fichaId = ficha?.id ?? null
    await h.esperar('Ficha creada correctamente.', 10000)

    // Coordinador y su asignación de centro.
    await h.ir('/admin/usuarios')
    await page.getByRole('button', { name: /Nuevo Usuario/i }).click()
    form = page.locator('form')
    await form.getByPlaceholder('Ej. María González').fill(`Coordinador ${h.sufijo}`)
    await form.getByPlaceholder('usuario@ejemplo.com').fill(correoAdmin)
    await form.locator('input[name="password"]').fill('123456')
    await form.locator('select[name="role"]').selectOption('admin')
    const admin = await h.capturar('POST', '/v1/general-users', () =>
      form.getByRole('button', { name: /Crear usuario/i }).click()
    )
    adminUserId = admin?.id ?? null
    await h.esperar('Usuario creado correctamente.', 10000)

    await h.ir('/admin/administradores')
    await page.locator('tr', { hasText: correoAdmin }).getByRole('combobox').selectOption({ label: centro })
    await h.esperar('Centro actualizado.', 10000)

    if (!fichaId || !instructoresUserId || !adminUserId) throw new Error('faltan ids de la simulación')
  })

  await h.paso('coordinador: solo ve su centro', async () => {
    await logout(page)
    await entrar(page, correoAdmin, '123456', '/admin/dashboard')

    await h.ir('/admin/fichas')
    await expect(page.getByText(nombreFicha)).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('xkp-mqwr')).toHaveCount(0)

    await h.ir('/admin/usuarios')
    await expect(page.getByText(nombreInstructor).first()).toBeVisible({ timeout: 10000 })
  })

  await h.paso('coordinador: suspender y reactivar al instructor', async () => {
    await h.ir('/admin/detalle-usuario/' + instructoresUserId)
    h.usar('Suspender')
    await page.getByRole('button', { name: /^Suspender$/i }).click()
    await h.esperar('Suspendido', 10000)
    h.usar('Activar cuenta')
    await page.getByRole('button', { name: /Activar cuenta/i }).click()
    await h.esperar('Activo', 10000)
  })

  await h.paso('coordinador: archivar y borrar su ficha', async () => {
    await h.ir(`/admin/detalle-ficha/${fichaId}`)
    h.usar('Editar')
    await page.getByRole('button', { name: /^Editar$/i }).first().click()
    await page.locator('form select[name="estado"]').selectOption('archivado')
    h.usar('Guardar cambios')
    await page.locator('form').getByRole('button', { name: /Guardar cambios/i }).click()
    await h.esperar('Ficha actualizada correctamente.', 10000)

    h.usar('Eliminar ficha')
    await page.getByRole('button', { name: /Eliminar ficha/i }).click()
    await page.getByRole('button', { name: /Sí, eliminar/i }).click()
    await page.waitForURL('**/admin/fichas', { timeout: 15000 })
  })
}
