// Simulación cruzada "soporte → admin → notificación":
//   la aprendiz solicita soporte; el admin cierra la solicitud (lo que
//   notifica a la solicitante) y la aprendiz ve la alerta.
import { entrar, logout } from '../../helpers'

export async function simulacionReporte(h) {
  const { page } = h
  const titulo = `Soporte simulación ${h.sufijo}`

  await h.paso('aprendiz: solicitar soporte', async () => {
    await entrar(page, 'mgonzalez', '123456', '/aprendiz/dashboard')
    await h.ir('/aprendiz/reportar-falla')
    await page.getByLabel(/Título de la solicitud/i).fill(titulo)
    await page.getByLabel(/Descripción/i).fill('Solicitud creada en la simulación cruzada para validar la notificación al solicitante.')
    const creado = await h.capturar('POST', '/v1/bug-reports', () =>
      page.getByRole('button', { name: /Enviar solicitud/i }).click()
    )
    if (!creado?.id) throw new Error('la solicitud no se creó')
    await h.esperar('Gracias por escribirnos', 10000)
  })

  await h.paso('admin: cerrar la solicitud y notificar', async () => {
    await logout(page)
    await entrar(page, 'a', 'admin123', '/admin/dashboard')
    await h.ir('/admin/reportes-fallas')
    await page.getByPlaceholder(/Título, número de ficha, #id o reportante/i).fill(titulo)
    await page.locator('tbody tr', { hasText: titulo }).getByRole('link', { name: /Ver/i }).click()
    await page.waitForURL('**/admin/detalle-reporte/**')

    const sel = page.getByLabel('Cambiar estado')
    await sel.selectOption('resuelto')
    await page.getByRole('button', { name: /^Guardar$/ }).click()
    await h.esperar('se actualizó correctamente', 10000)
  })

  await h.paso('aprendiz: recibe la alerta de la solicitud', async () => {
    await logout(page)
    await entrar(page, 'mgonzalez', '123456', '/aprendiz/dashboard')
    await h.ir('/aprendiz/alertas')
    await h.esperar('fue atendida', 15000)
  })
}
