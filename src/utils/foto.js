const MAX_BYTES = 5 * 1024 * 1024
const LADO = 256

export async function procesarFoto(file) {
  if (!file) throw new Error('Selecciona un archivo.')
  if (!file.type.startsWith('image/')) throw new Error('El archivo debe ser una imagen.')
  if (file.size > MAX_BYTES) throw new Error('La imagen no debe superar 5MB.')

  const dataUrl = await leerComoDataUrl(file)
  const img = await cargarImagen(dataUrl)

  const lado = Math.min(img.naturalWidth, img.naturalHeight)
  const sx = (img.naturalWidth - lado) / 2
  const sy = (img.naturalHeight - lado) / 2

  const canvas = document.createElement('canvas')
  canvas.width = LADO
  canvas.height = LADO
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, sx, sy, lado, lado, 0, 0, LADO, LADO)
  return canvas.toDataURL('image/jpeg', 0.82)
}

function leerComoDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('No fue posible leer la imagen.'))
    reader.readAsDataURL(file)
  })
}

function cargarImagen(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('La imagen no es válida.'))
    img.src = src
  })
}
