// Playbook del agente SUPERADMIN: gobernanza global (centros, redes/programas,
// administradores), motor por defecto y bitácora global.
export async function superadmin(h) {
  const { page } = h
  const centroA = `Centro Agente A ${h.sufijo}`
  const centroB = `Centro Agente B ${h.sufijo}`
  const red = `Red Agente ${h.sufijo}`
  const redEditada = `${red} editada`
  const correoAdmin = `adminagente.${h.sufijo}@sena.edu.co`
  let adminUserId = null

  await h.paso('crear, editar y borrar un centro', async () => {
    await h.ir('/admin/training-centers')
    await h.auditar()
    h.usar('Crear Centro')
    await page.getByRole('button', { name: /Crear Centro/i }).click()
    await page.getByPlaceholder('Ej. Centro de Teleinformática y Producción Industrial').fill(centroA)
    await page.getByPlaceholder('Ej. Popayán').fill('Popayán')
    h.usar('Crear centro')
    await page.locator('form').getByRole('button', { name: /^Crear centro$/i }).click()
    await h.esperar('Centro creado correctamente.', 10000)

    const fila = page.locator('tr', { hasText: centroA })
    h.usar('Editar')
    await fila.getByRole('button', { name: /Editar/i }).click()
    await page.getByPlaceholder('Ej. Centro de Teleinformática y Producción Industrial').fill(`${centroA} editado`)
    h.usar('Guardar cambios')
    await page.locator('form').getByRole('button', { name: /Guardar cambios/i }).click()
    await h.esperar('Centro actualizado correctamente.', 10000)

    const fila2 = page.locator('tr', { hasText: `${centroA} editado` })
    h.usar('Eliminar')
    await fila2.getByRole('button', { name: /Eliminar/i }).click()
    await page.getByRole('button', { name: /Sí, eliminar/i }).click()
    await h.esperar('Centro eliminado.', 10000)
  })

  await h.paso('crear un centro y un administrador, y asignárselo', async () => {
    await h.ir('/admin/training-centers')
    await page.getByRole('button', { name: /Crear Centro/i }).click()
    await page.getByPlaceholder('Ej. Centro de Teleinformática y Producción Industrial').fill(centroB)
    await page.locator('form').getByRole('button', { name: /^Crear centro$/i }).click()
    await h.esperar('Centro creado correctamente.', 10000)

    await h.ir('/admin/usuarios')
    await page.getByRole('button', { name: /Nuevo Usuario/i }).click()
    const form = page.locator('form')
    await form.getByPlaceholder('Ej. María González').fill(`Admin Agente ${h.sufijo}`)
    await form.getByPlaceholder('usuario@ejemplo.com').fill(correoAdmin)
    await form.locator('input[name="password"]').fill('123456')
    await form.locator('select[name="role"]').selectOption('admin')
    const creado = await h.capturar('POST', '/v1/general-users', () =>
      form.getByRole('button', { name: /Crear usuario/i }).click()
    )
    adminUserId = creado?.id ?? null
    await h.esperar('Usuario creado correctamente.', 10000)

    await h.ir('/admin/administradores')
    const fila = page.locator('tr', { hasText: correoAdmin })
    await fila.getByRole('combobox').selectOption({ label: centroB })
    await h.esperar('Centro actualizado.', 10000)
  })

  await h.paso('crear, editar y borrar una red con programa', async () => {
    await h.ir('/admin/redes-conocimiento')
    await page.getByRole('button', { name: /Nueva Red/i }).click()
    await page.getByPlaceholder(/Ej\. Informática/i).fill(red)
    await page.getByPlaceholder(/Nuevo programa/i).fill(`Programa Agente ${h.sufijo}`)
    h.usar('Agregar')
    await page.getByRole('button', { name: /Agregar/i }).click()
    h.usar('Crear red')
    await page.getByRole('button', { name: /^Crear red$/i }).click()
    await h.esperar('Red creada correctamente.', 10000)

    const fila = page.locator('tr', { hasText: red })
    h.usar('Editar')
    await fila.getByRole('button', { name: /Editar/i }).click()
    await page.getByPlaceholder(/Ej\. Informática/i).fill(redEditada)
    h.usar('Guardar cambios')
    await page.getByRole('button', { name: /Guardar cambios/i }).click()
    await h.esperar('Red actualizada correctamente.', 10000)

    const fila2 = page.locator('tr', { hasText: redEditada })
    h.usar('Eliminar')
    await fila2.getByRole('button', { name: /Eliminar/i }).click()
    await page.getByRole('button', { name: /Sí, eliminar/i }).click()
    await h.esperar('Red eliminada correctamente.', 10000)
  })

  await h.paso('editar el motor por defecto y recalcular', async () => {
    await h.ir('/admin/config-similitud')
    await page.locator('input[type="number"]').first().fill('25')
    await page.locator('input[type="number"]').nth(1).fill('12')
    h.usar('Guardar parámetros')
    await page.getByRole('button', { name: /Guardar parámetros/i }).click()
    await page.getByText(/Motor actualizado/i).waitFor({ timeout: 10000 })

    h.usar('Recalcular base existente')
    await page.getByRole('button', { name: /Recalcular base existente/i }).click()
    await page.getByRole('button', { name: /Sí, recalcular/i }).click()
    await page.getByText(/Recalibración lista/i).waitFor({ timeout: 20000 })
  })

  await h.paso('eliminar un administrador', async () => {
    if (!adminUserId) throw new Error('no se obtuvo el id del administrador creado')
    await h.ir(`/admin/detalle-usuario/${adminUserId}`)
    h.usar('Eliminar')
    await page.getByRole('button', { name: /^Eliminar$/i }).click()
    await page.getByRole('button', { name: /Sí, eliminar/i }).click()
    await page.waitForURL('**/admin/usuarios', { timeout: 15000 })
  })

  await h.paso('ver la bitácora global', async () => {
    await h.ir('/admin/bitacora')
    await h.auditar()
    await page.locator('tbody tr').first().waitFor({ timeout: 10000 })
  })
}
