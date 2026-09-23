// Simulación cruzada "reporte de falla → coordinador → notificación":
//   la aprendiz reporta; el admin cambia el estado del reporte
//   (lo que notifica al reportante) y la aprendiz ve la alerta.
import { entrar, logout } from '../../helpers'

export async function simulacionReporte(h) {
  const { page } = h
  const titulo = `Reporte simulación ${h.sufijo}`

  await h.paso('aprendiz: reportar una falla', async () => {
    await entrar(page, 'maria.gonzalez@soy.sena.edu.co', '123456', '/aprendiz/dashboard')
    await h.ir('/aprendiz/reportar-falla')
    await page.getByLabel(/Título del reporte/i).fill(titulo)
    await page.getByLabel(/Descripción/i).fill('Falla reportada en la simulación cruzada para validar la notificación al reportante.')
    const creado = await h.capturar('POST', '/v1/bug-reports', () =>
      page.getByRole('button', { name: /Enviar reporte/i }).click()
    )
    if (!creado?.id) throw new Error('el reporte no se creó')
    await h.esperar('Gracias por reportar', 10000)
  })

  await h.paso('admin: atender el reporte y notificar', async () => {
    await logout(page)
    await entrar(page, 'admin@sena.edu.co', 'admin123', '/admin/dashboard')
    await h.ir('/admin/reportes-fallas')
    await page.getByPlaceholder(/Título, #id o reportante/i).fill(titulo)
    await page.locator('tbody tr', { hasText: titulo }).getByRole('link', { name: /Ver/i }).click()
    await page.waitForURL('**/admin/detalle-reporte/**')

    const sel = page.getByLabel('Cambiar estado')
    const actual = await sel.inputValue()
    await sel.selectOption(actual === 'resuelto' ? 'en_revision' : 'resuelto')
    await page.getByRole('button', { name: /Guardar estado/i }).click()
    await h.esperar('se actualizó correctamente', 10000)
  })

  await h.paso('aprendiz: recibe la alerta del reporte', async () => {
    await logout(page)
    await entrar(page, 'maria.gonzalez@soy.sena.edu.co', '123456', '/aprendiz/dashboard')
    await h.ir('/aprendiz/alertas')
    await h.esperar(titulo, 15000)
  })
}
