// Simulación cruzada "motor por centro":
//   el coordinador del centro 1 cambia el umbral de SU centro; el valor por
//   defecto global y el otro centro no se ven afectados.
import { expect } from '@playwright/test'
import { entrar, logout } from '../../helpers'

async function umbralMostrado(page) {
  const texto = await page.getByRole('main').innerText()
  const m = texto.match(/Umbral:\s*(\d+)%/i)
  return m ? Number(m[1]) : null
}

export async function simulacionMotor(h) {
  const { page } = h

  await h.paso('coordinador centro 1: cambia el umbral de su centro', async () => {
    await entrar(page, 'admin@sena.edu.co', 'admin123', '/admin/dashboard')
    await h.ir('/admin/config-similitud')
    await page.locator('input[type="number"]').first().fill('65')
    await page.locator('input[type="number"]').nth(1).fill('10')
    await page.getByRole('button', { name: /Guardar parámetros/i }).click()
    await h.esperar('Motor actualizado', 10000)
    expect(await umbralMostrado(page)).toBe(65)
  })

  await h.paso('otro coordinador sigue con el valor por defecto', async () => {
    await logout(page)
    await entrar(page, 'maria.torres@sena.edu.co', '123456', '/admin/dashboard')
    await h.ir('/admin/config-similitud')
    expect(await umbralMostrado(page)).toBe(20)
  })

  await h.paso('el superadmin conserva el valor por defecto global', async () => {
    await logout(page)
    await entrar(page, 'superadmin@sena.edu.co', 'super123', '/admin/dashboard')
    await h.ir('/admin/config-similitud')
    expect(await umbralMostrado(page)).toBe(20)
  })
}
