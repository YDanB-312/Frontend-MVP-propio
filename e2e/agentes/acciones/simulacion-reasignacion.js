// Simulación cruzada "reasignación entre centros":
//   el superadmin mueve un aprendiz de una ficha (centro 1) a otra (centro 2);
//   el coordinador del centro destino lo ve y el instructor de esa ficha también.
import { expect } from '@playwright/test'
import { entrar, logout } from '../../helpers'

export async function simulacionReasignacion(h) {
  const { page } = h

  await h.paso('superadmin: mover un aprendiz de centro', async () => {
    await entrar(page, 'superadmin@sena.edu.co', 'super123', '/admin/dashboard')
    await h.ir('/admin/detalle-usuario/10') // Diego Ramírez: ficha 4 (centro 1)
    await page.getByRole('button', { name: /^Editar$/i }).click()
    await page.locator('select[name="fichaId"]').selectOption('3') // ficha 3 (centro 2)
    await expect(page.getByText(/cambia de centro/i)).toBeVisible()
    await page.getByRole('button', { name: /Guardar cambios/i }).click()
    await h.esperar('Usuario actualizado correctamente.', 10000)
  })

  await h.paso('coordinador del centro destino: ve al aprendiz trasladado', async () => {
    await logout(page)
    await entrar(page, 'maria.torres@sena.edu.co', '123456', '/admin/dashboard')
    await h.ir('/admin/usuarios')
    await page.getByPlaceholder('Nombre o correo…').fill('diego.ramirez')
    await expect(page.getByText('Diego Ramírez Castro')).toBeVisible({ timeout: 10000 })
  })

  await h.paso('instructor de la ficha destino: lo ve en el directorio', async () => {
    await logout(page)
    await entrar(page, 'carlos.rodriguez@sena.edu.co', '123456', '/instructor/dashboard')
    await h.ir('/instructor/directorio-ficha/3')
    await expect(page.getByText('Diego Ramírez Castro')).toBeVisible({ timeout: 10000 })
  })
}
