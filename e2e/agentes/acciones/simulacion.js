// Simulación cruzada multi-rol: un mismo escenario donde intervienen los 4
// roles en cadena.
//
//   Superadmin crea un centro + un instructor + una ficha (en ese centro).
//   El instructor nuevo ve su ficha.
//   Un aprendiz se une con el código y registra una propuesta.
//   El instructor aprueba la propuesta.
//   El aprendiz comprueba que quedó aprobada.
//
// Es de solo-acción y determinista (datos con sufijo). El runner restaura el
// seed al terminar.
import { entrar, logout } from '../../helpers'

export async function simulacion(h) {
  const { page } = h
  const centro = `Centro Simulación ${h.sufijo}`
  const correoInstructor = `instructor.sim.${h.sufijo}@sena.edu.co`
  const nombreInstructor = `Instructor Sim ${h.sufijo}`
  const nombreFicha = `Ficha Simulación ${h.sufijo}`
  const tituloPropuesta = `Propuesta Simulación ${h.sufijo}`
  let codigoFicha = null

  await h.paso('superadmin: crear centro, instructor y ficha', async () => {
    await entrar(page, 'superadmin@sena.edu.co', 'super123', '/admin/dashboard')
    await h.auditar()

    // Centro nuevo (sin ciudad para que la etiqueta del select sea el nombre).
    await h.ir('/admin/training-centers')
    await page.getByRole('button', { name: /Crear Centro/i }).click()
    await page.getByPlaceholder('Ej. Centro de Teleinformática y Producción Industrial').fill(centro)
    await page.locator('form').getByRole('button', { name: /^Crear centro$/i }).click()
    await h.esperar('Centro creado correctamente.', 10000)

    // Instructor nuevo.
    await h.ir('/admin/usuarios')
    await page.getByRole('button', { name: /Nuevo Usuario/i }).click()
    const form = page.locator('form')
    await form.getByPlaceholder('Ej. María González').fill(nombreInstructor)
    await form.getByPlaceholder('usuario@ejemplo.com').fill(correoInstructor)
    await form.locator('input[name="password"]').fill('123456')
    await form.locator('select[name="role"]').selectOption('instructor')
    await form.getByRole('button', { name: /Crear usuario/i }).click()
    await h.esperar('Usuario creado correctamente.', 10000)

    // Ficha en el centro nuevo, a cargo del instructor nuevo.
    await h.ir('/admin/fichas')
    await page.getByRole('button', { name: /Crear Ficha/i }).click()
    await page.locator('form select[name="red"]').selectOption('Informática, Diseño y Desarrollo de Software')
    await page.locator('form select[name="programa"]').selectOption('ADSO')
    await page.locator('form select[name="centroId"]').selectOption({ label: centro })
    await page.locator('form select[name="instructorId"]').selectOption({ label: nombreInstructor })
    await page.getByPlaceholder('Ej. Análisis y Desarrollo 2718').fill(nombreFicha)
    await page.getByPlaceholder('Ej. 3142101').fill('7' + h.sufijo.slice(0, 4))

    const creada = await h.capturar('POST', '/v1/class-groups', () =>
      page.locator('form').getByRole('button', { name: /^Crear ficha$/i }).click()
    )
    codigoFicha = creada?.codigo ?? null
    await h.esperar('Ficha creada correctamente.', 10000)
    if (!codigoFicha) throw new Error('no se obtuvo el código de la ficha creada')
  })

  await h.paso('instructor nuevo: ver su ficha asignada', async () => {
    await logout(page)
    await entrar(page, correoInstructor, '123456', '/instructor/dashboard')
    await h.ir('/instructor/fichas')
    await h.esperar(nombreFicha, 15000)
  })

  await h.paso('aprendiz: unirse por código y registrar propuesta', async () => {
    await logout(page)
    await entrar(page, 'maria.gonzalez@soy.sena.edu.co', '123456', '/aprendiz/dashboard')

    await h.ir('/aprendiz/ficha')
    const salir = page.getByRole('button', { name: /Salir de la ficha/i })
    const codigoInput = page.getByLabel(/Código de la ficha/i)
    // Espera a que la vista resuelva: o muestra su ficha (con salir) o el código.
    await Promise.race([
      salir.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {}),
      codigoInput.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {}),
    ])
    if ((await salir.count()) > 0) {
      await salir.click()
      await page.getByRole('button', { name: /Sí, salir/i }).click()
      await codigoInput.waitFor({ state: 'visible', timeout: 15000 })
    }
    await codigoInput.fill(codigoFicha)
    await page.getByRole('button', { name: /Buscar ficha/i }).click()
    await page.getByRole('button', { name: /Unirme a esta ficha/i }).click()
    await h.esperar(nombreFicha, 15000)

    await h.ir('/aprendiz/propuestas')
    await page.getByRole('main').getByRole('button', { name: /Nueva propuesta/i }).click()
    await page.getByPlaceholder(/Sistema de monitoreo ambiental/i).fill(tituloPropuesta)
    await page.locator('textarea').nth(0).fill('Propuesta creada en la simulación cruzada para validar el flujo multi-rol completo de la plataforma.')
    await page.locator('textarea').nth(1).fill('Validar el ciclo centro, instructor, ficha, aprendiz y propuesta.')
    await page.locator('textarea').nth(2).fill('Crear la ficha desde gobernanza.\nUnir al aprendiz por código.\nAprobar la propuesta registrada.')
    await page.locator('select').nth(0).selectOption({ index: 1 })
    await page.getByRole('button', { name: /Enviar propuesta/i }).click()
    await page.waitForURL('**/aprendiz/analizando-proyecto', { timeout: 15000 })
    await page.waitForURL('**/aprendiz/resultado-analisis**', { timeout: 20000 })
  })

  await h.paso('instructor nuevo: aprobar la propuesta del aprendiz', async () => {
    await logout(page)
    await entrar(page, correoInstructor, '123456', '/instructor/dashboard')
    await h.ir('/instructor/revision-propuestas')

    const nodo = page
      .getByRole('list', { name: /Cola de revisión/i })
      .getByRole('button', { name: new RegExp(tituloPropuesta) })
    await nodo.waitFor({ timeout: 15000 })
    await nodo.click()
    await page.getByRole('button', { name: /^Aprobar /i }).click()
    await page.getByRole('button', { name: /Sí, aprobar/i }).click()
    await page.getByRole('button', { name: /^Aprobar /i }).waitFor({ state: 'detached', timeout: 10000 })
  })

  await h.paso('aprendiz: comprobar que su propuesta quedó aprobada', async () => {
    await logout(page)
    await entrar(page, 'maria.gonzalez@soy.sena.edu.co', '123456', '/aprendiz/dashboard')
    await h.ir('/aprendiz/propuestas')
    await page.getByText(tituloPropuesta).first().click()
    await page.waitForURL('**/aprendiz/detalle-proyecto/**')
    await h.esperar('Aprobado', 10000)
  })
}
