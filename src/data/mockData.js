const KEY = 'proyectwin_mock_v2'
const SEED_VERSION = 7

function hoyFormato(formato) {
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
  const d = new Date()
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  if (formato === 'd MMM yyyy') return `${d.getDate()} ${meses[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`
  return `${dd}/${mm}/${d.getFullYear()}`
}

export function generarCodigoFicha() {
  const letras = 'abcdefghijklmnopqrstuvwxyz'
  const bloque = (n) => Array.from({ length: n }, () => letras[Math.floor(Math.random() * letras.length)]).join('')
  return `${bloque(3)}-${bloque(4)}`
}

// Catálogo institucional — agrupación oficial por Redes de Conocimiento
// (Resolución 2423 de 2018, Normograma SENA). Única fuente de verdad.
// Persistido en state.redes (localStorage) para que el admin pueda gestionarlo.
const REDES_SEED = [
  {
    id: 1,
    nombre: 'Informática, Diseño y Desarrollo de Software',
    programas: ['ADSO', 'Infraestructura Redes'],
  },
  {
    id: 2,
    nombre: 'Artes Gráficas',
    programas: ['Produccion Multimedia'],
  },
]

// Bindings vivos — se sincronizan con state.redes tras cargar() y en cada CRUD.
export let REDES = REDES_SEED
export let PROGRAMAS = REDES.flatMap((r) => r.programas)
export let PROGRAMA_ACTIVO = PROGRAMAS[0]

function syncRedesDerivados() {
  if (state?.redes) {
    REDES = state.redes
    PROGRAMAS = REDES.flatMap((r) => r.programas)
    PROGRAMA_ACTIVO = PROGRAMAS[0] || null
  }
}

export function getRedes() {
  return state?.redes ?? REDES
}

export function getProgramas() {
  return state?.redes ? state.redes.flatMap((r) => r.programas) : PROGRAMAS
}

export function getProgramaActivo() {
  const progs = getProgramas()
  return progs[0] || null
}

export function getRedDePrograma(programa) {
  const redes = state?.redes ?? REDES
  return redes.find((r) => r.programas.includes(programa))?.nombre || null
}

export function getRedById(id) {
  const redes = state?.redes ?? REDES
  return redes.find((r) => r.id === Number(id)) || null
}

export function getRedByNombre(nombre) {
  const redes = state?.redes ?? REDES
  const q = String(nombre || '').trim().toLowerCase()
  return redes.find((r) => r.nombre.toLowerCase() === q) || null
}

function redEstaEnUso(red) {
  if (!red) return false
  const programas = new Set(red.programas)
  const fichaUsa = state.fichas.some((f) => programas.has(f.programa))
  if (fichaUsa) return true
  // Proyectos ligados a ficha cuyo programa pertenece a la red
  const proyectoUsa = state.proyectos.some((p) => {
    const f = state.fichas.find((x) => x.id === Number(p.fichaId))
    return f && programas.has(f.programa)
  })
  return proyectoUsa
}

export function getConteoFichasDeRed(redId) {
  const red = getRedById(redId)
  if (!red) return 0
  const progSet = new Set(red.programas)
  return state.fichas.filter((f) => progSet.has(f.programa)).length
}

export function isRedEnUso(redId) {
  const red = getRedById(redId)
  return red ? redEstaEnUso(red) : false
}

export function createRed({ nombre, programas }) {
  const nombreNorm = String(nombre || '').trim()
  if (!nombreNorm) return { ok: false, error: 'El nombre de la red es obligatorio.' }
  if (getRedByNombre(nombreNorm)) return { ok: false, error: 'Ya existe una red con ese nombre.' }
  const lista = (Array.isArray(programas) ? programas : [])
    .map((p) => String(p || '').trim())
    .filter(Boolean)
  if (lista.length === 0) return { ok: false, error: 'Debe haber al menos un programa.' }
  // Validar duplicados dentro de la lista
  const lower = lista.map((p) => p.toLowerCase())
  if (new Set(lower).size !== lower.length) return { ok: false, error: 'Hay programas duplicados en la lista.' }
  // Validar duplicados contra otras redes
  const todosProgramas = getProgramas().map((p) => p.toLowerCase())
  const dup = lower.find((p) => todosProgramas.includes(p))
  if (dup) return { ok: false, error: `El programa "${lista[lower.indexOf(dup)]}" ya existe en otra red.` }

  const nueva = { id: state.nextRedId++, nombre: nombreNorm, programas: lista }
  state.redes.push(nueva)
  syncRedesDerivados()
  guardar()
  return { ok: true, red: nueva }
}

export function updateRed(id, { nombre, programas }) {
  const idx = state.redes.findIndex((r) => r.id === Number(id))
  if (idx === -1) return { ok: false, error: 'Red no encontrada.' }
  const nombreNorm = String(nombre || '').trim()
  if (!nombreNorm) return { ok: false, error: 'El nombre de la red es obligatorio.' }
  const existeOtro = state.redes.some((r) => r.id !== Number(id) && r.nombre.toLowerCase() === nombreNorm.toLowerCase())
  if (existeOtro) return { ok: false, error: 'Ya existe otra red con ese nombre.' }
  const lista = (Array.isArray(programas) ? programas : [])
    .map((p) => String(p || '').trim())
    .filter(Boolean)
  if (lista.length === 0) return { ok: false, error: 'Debe haber al menos un programa.' }
  const lower = lista.map((p) => p.toLowerCase())
  if (new Set(lower).size !== lower.length) return { ok: false, error: 'Hay programas duplicados en la lista.' }
  // Validar duplicados contra otras redes (excluir la actual)
  const otrosProgramas = state.redes
    .filter((r) => r.id !== Number(id))
    .flatMap((r) => r.programas)
    .map((p) => p.toLowerCase())
  const dup = lower.find((p) => otrosProgramas.includes(p))
  if (dup) return { ok: false, error: `El programa "${lista[lower.indexOf(dup)]}" ya existe en otra red.` }
  // Bloquear eliminación de programas que están en uso por fichas
  const actual = state.redes[idx]
  const eliminados = actual.programas.filter((p) => !lower.includes(p.toLowerCase()))
  if (eliminados.length > 0) {
    const enUso = eliminados.find((p) => state.fichas.some((f) => f.programa === p))
    if (enUso) {
      return { ok: false, error: `No se puede quitar "${enUso}": hay fichas que lo usan. Reasigna o elimina esas fichas primero.` }
    }
  }

  state.redes[idx] = { ...state.redes[idx], nombre: nombreNorm, programas: lista }
  syncRedesDerivados()
  guardar()
  return { ok: true, red: state.redes[idx] }
}

export function deleteRed(id) {
  const idx = state.redes.findIndex((r) => r.id === Number(id))
  if (idx === -1) return { ok: false, error: 'Red no encontrada.' }
  const red = state.redes[idx]
  if (redEstaEnUso(red)) {
    return { ok: false, error: 'No se puede eliminar: hay fichas o proyectos usando programas de esta red. Reasigna o elimina esas fichas primero.' }
  }
  state.redes.splice(idx, 1)
  syncRedesDerivados()
  guardar()
  return { ok: true }
}

const ESTADO_INICIAL = {
  nextUserId: 14,
  nextFichaId: 5,
  nextProjectId: 9,
  nextSimilitudId: 4,
  nextBugReportId: 7,
  nextNotificationId: 11,
  nextObservacionId: 4,
  nextRedId: 3,
  redes: JSON.parse(JSON.stringify(REDES_SEED)),
  users: [
    { id: 1, name: 'María González', email: 'maria.gonzalez@soy.sena.edu.co', role: 'aprendiz', fichaId: 1, programa: 'ADSO' },
    { id: 2, name: 'Carlos Ruiz', email: 'carlos.ruiz@sena.edu.co', role: 'instructor' },
    { id: 3, name: 'Administrador', email: 'admin@sena.edu.co', role: 'admin' },
    { id: 4, name: 'Ana Martínez', email: 'ana.martinez@soy.sena.edu.co', role: 'aprendiz', fichaId: 1, programa: 'ADSO' },
    { id: 5, name: 'Juan Pérez', email: 'juan.perez@soy.sena.edu.co', role: 'aprendiz', fichaId: 1, programa: 'ADSO' },
    { id: 6, name: 'Laura Gómez', email: 'laura.gomez@soy.sena.edu.co', role: 'aprendiz', fichaId: 2, programa: 'ADSO' },
    { id: 7, name: 'Carlos Rodríguez Díaz', email: 'carlos.rodriguez@sena.edu.co', role: 'instructor' },
    { id: 8, name: 'Andrés Martínez López', email: 'andres.martinez@sena.edu.co', role: 'instructor' },
    { id: 9, name: 'Laura Sánchez Pérez', email: 'laura.sanchez@soy.sena.edu.co', role: 'aprendiz', fichaId: 3, programa: 'Produccion Multimedia' },
    { id: 10, name: 'Diego Ramírez Castro', email: 'diego.ramirez@soy.sena.edu.co', role: 'aprendiz', fichaId: 4, programa: 'Infraestructura Redes' },
    { id: 11, name: 'Patricia Morales Vega', email: 'patricia.morales@soy.sena.edu.co', role: 'aprendiz', fichaId: 2, programa: 'ADSO' },
    { id: 12, name: 'María Fernanda Torres', email: 'maria.torres@sena.edu.co', role: 'admin' },
    { id: 13, name: 'Luis Fernando García', email: 'luis.garcia@sena.edu.co', role: 'instructor' },
  ],
  passwords: {
    'maria.gonzalez@soy.sena.edu.co': '123456',
    'carlos.ruiz@sena.edu.co': '123456',
    'admin@sena.edu.co': 'admin123',
    'ana.martinez@soy.sena.edu.co': '123456',
    'juan.perez@soy.sena.edu.co': '123456',
    'laura.gomez@soy.sena.edu.co': '123456',
    'carlos.rodriguez@sena.edu.co': '123456',
    'andres.martinez@sena.edu.co': '123456',
    'laura.sanchez@soy.sena.edu.co': '123456',
    'diego.ramirez@soy.sena.edu.co': '123456',
    'patricia.morales@soy.sena.edu.co': '123456',
    'maria.torres@sena.edu.co': '123456',
    'luis.garcia@sena.edu.co': '123456',
  },
  fichas: [
    { id: 1, codigo: 'xkp-mqwr', numero: '2568', nombre: 'Analisis y Desarrollo 2568', programa: 'ADSO', idPrograma: 1, aprendices: 28, proyectos: 5, estado: 'activo', instructorName: 'Carlos Ruiz', instructorId: 2, createdAt: '01/02/2026', estudiantes: [] },
    { id: 2, codigo: 'bnt-jhsa', numero: '2634', nombre: 'Analisis y Desarrollo 2634', programa: 'ADSO', idPrograma: 1, aprendices: 25, proyectos: 3, estado: 'activo', instructorName: 'Carlos Rodríguez Díaz', instructorId: 7, createdAt: '10/02/2026', estudiantes: [] },
    { id: 3, codigo: 'qwe-rtzu', numero: '3102', nombre: 'Produccion Multimedia 3102', programa: 'Produccion Multimedia', idPrograma: 2, aprendices: 22, proyectos: 4, estado: 'activo', instructorName: 'Carlos Rodríguez Díaz', instructorId: 7, createdAt: '15/02/2026', estudiantes: [] },
    { id: 4, codigo: 'mno-pqrs', numero: '2801', nombre: 'Infraestructura Redes 2801', programa: 'Infraestructura Redes', idPrograma: 3, aprendices: 20, proyectos: 0, estado: 'inactivo', instructorName: 'Andrés Martínez López', instructorId: 8, createdAt: '20/02/2026', estudiantes: [] },
  ],
  proyectos: [
    {
      id: 1, title: 'Sistema IoT para Agricultura', estado: 'pendiente', studentId: 4, instructorId: 2, fichaId: 1,
      createdAt: '15/11/2026', studentName: 'Ana Martínez', instructorName: 'Carlos Ruiz',
      keywords: 'IoT, sensores, agricultura, monitoreo, automatización',
      objetivoGeneral: 'Optimizar el uso del agua y los nutrientes en cultivos mediante el monitoreo continuo de variables ambientales con una red de sensores IoT.',
      objetivosEspecificos: 'Diseñar una red de sensores IoT para medir humedad, temperatura y nutrientes del suelo.\nDesarrollar una plataforma web que visualice los datos en tiempo real.\nImplementar alertas tempranas ante condiciones críticas en el cultivo.',
      objectives: '• Diseñar e implementar una red de sensores IoT para monitoreo de variables ambientales en cultivos.\n• Desarrollar una plataforma web para visualización de datos en tiempo real.\n• Implementar algoritmos de alerta temprana para condiciones críticas en los cultivos.\n• Generar reportes automáticos de rendimiento y predicciones basadas en datos históricos.',
      deliverables: '',
      technologies: '', areaAplicacion: 'Tecnología e Informática', projectType: 'aplicacion',
      observaciones: '', integrantes: ['Ana Martínez', 'Juan Pérez', 'Laura Gómez'],
      description: 'Sistema de monitoreo inteligente para cultivos utilizando sensores IoT que miden humedad, temperatura y nutrientes del suelo, permitiendo la toma de decisiones en tiempo real para optimizar el riego y la fertilización.',
    },
    {
      id: 2, title: 'App Móvil para Turismo Local', estado: 'pendiente', studentId: 5, instructorId: 2, fichaId: 1,
      createdAt: '14/11/2026', studentName: 'Juan Pérez', instructorName: 'Carlos Ruiz',
      keywords: 'turismo, app móvil, cultura, rutas turísticas, geolocalización',
      objectives: '• Desarrollar una aplicación móvil multiplataforma para promoción turística local.\n• Implementar sistema de geolocalización para rutas turísticas interactivas.\n• Crear un catálogo interactivo de sitios de interés cultural y natural.\n• Integrar calendario de eventos culturales y notificaciones personalizadas.',
      deliverables: '',
      technologies: '', areaAplicacion: 'Cultura y Entretenimiento', projectType: 'aplicacion',
      observaciones: '', integrantes: ['Juan Pérez'],
      description: 'Aplicación móvil que promueve el turismo local mostrando sitios de interés, rutas y eventos culturales, facilitando la exploración de destinos y la planificación de visitas.',
    },
    {
      id: 3, title: 'Plataforma E-learning para Música', estado: 'pendiente', studentId: 6, instructorId: 7, fichaId: 2,
      createdAt: '12/11/2026', studentName: 'Laura Gómez', instructorName: 'Carlos Rodríguez Díaz',
      keywords: 'e-learning, música, educación, instrumentos, plataforma',
      objectives: '• Crear una plataforma de aprendizaje musical con lecciones interactivas y multimedia.\n• Implementar sistema de seguimiento de progreso del estudiante.\n• Desarrollar reproductor de audio con control de velocidad y repetición.\n• Diseñar un sistema de evaluación y retroalimentación automática.',
      deliverables: '',
      technologies: '', areaAplicacion: 'Tecnología e Informática', projectType: 'aplicacion',
      observaciones: 'Se requiere definir mejor el alcance del proyecto y especificar las tecnologías para la reproducción de audio/video.',
      integrantes: ['Laura Gómez', 'Ana Martínez'],
      description: 'Plataforma web para aprendizaje de instrumentos musicales con lecciones interactivas, seguimiento de progreso y recursos multimedia para estudiantes de todos los niveles.',
    },
    {
      id: 4, title: 'Plataforma de Ventas Online', estado: 'pendiente', studentId: 1, instructorId: 2, fichaId: 1,
      createdAt: '10/11/2026', updatedAt: '18/11/2026', studentName: 'María González', instructorName: 'Carlos Ruiz',
      keywords: 'e-commerce, ventas, pagos, catálogo, comercio',
      objetivoGeneral: 'Facilitar la digitalización de pequeños comercios mediante una plataforma de ventas en línea con catálogo, carrito y pagos.',
      objetivosEspecificos: 'Implementar un catálogo de productos con búsqueda y filtros.\nDesarrollar un carrito de compras con proceso de pago seguro.\nCrear un panel de administración para la gestión de pedidos.',
      objectives: '• Desarrollar un catálogo de productos con búsqueda y filtros.\n• Implementar carrito de compras y proceso de pago seguro.\n• Crear panel de administración para gestión de pedidos.\n• Generar reportes de ventas en tiempo real.',
      deliverables: '',
      technologies: '', areaAplicacion: 'Tecnología e Informática', projectType: 'aplicacion',
      observaciones: '', integrantes: ['María González', 'Juan Pérez'],
      description: 'Aplicación web de comercio electrónico para pequeños comercios con catálogo de productos, carrito de compras y pasarela de pagos.',
    },
    {
      id: 5, title: 'Sistema de Gestión de Inventarios', estado: 'aprobado', studentId: 1, instructorId: 2, fichaId: 1,
      createdAt: '02/11/2026', updatedAt: '16/11/2026', studentName: 'María González', instructorName: 'Carlos Ruiz',
      keywords: 'inventarios, stock, almacén, control, reportes',
      objectives: '• Registrar entradas y salidas de mercancía.\n• Configurar alertas de stock mínimo.\n• Generar reportes de trazabilidad por lote.\n• Implementar búsqueda avanzada de productos.',
      deliverables: '',
      technologies: '', areaAplicacion: 'Logística y Operaciones', projectType: 'aplicacion',
      observaciones: '', integrantes: ['María González'],
      description: 'Herramienta para control de inventarios de almacén con alertas de stock, registro de entradas y salidas, y reportes de trazabilidad.',
    },
    {
      id: 6, title: 'App de Bienestar Deportivo', estado: 'pendiente', studentId: 5, instructorId: 2, fichaId: 1,
      createdAt: '08/11/2026', studentName: 'Juan Pérez', instructorName: 'Carlos Ruiz',
      keywords: 'deporte, bienestar, rutinas, actividad, salud',
      objectives: '• Registrar rutinas y progreso de ejercicio.\n• Implementar recordatorios de actividad física.\n• Visualizar estadísticas de rendimiento.\n• Integrar retos y logros comunitarios.',
      deliverables: '',
      technologies: '', areaAplicacion: 'Deporte y Recreación', projectType: 'aplicacion',
      observaciones: '', integrantes: ['Juan Pérez'],
      description: 'Aplicación móvil de seguimiento de rutinas de ejercicio, registro de actividad y metas de bienestar para la comunidad SENA.',
    },
    {
      id: 7, title: 'Portal de Transparencia SENA', estado: 'aprobado', studentId: 6, instructorId: 7, fichaId: 2,
      createdAt: '05/11/2026', studentName: 'Laura Gómez', instructorName: 'Carlos Rodríguez Díaz',
      keywords: 'transparencia, datos abiertos, presupuesto, contratación',
      objectives: '• Publicar indicadores institucionales.\n• Implementar visualizaciones de datos interactivas.\n• Garantizar accesibilidad y diseño inclusivo.\n• Integrar fuentes de datos institucionales.',
      deliverables: '',
      technologies: '', areaAplicacion: 'Gobierno y Ciudadanía', projectType: 'pagina_web',
      observaciones: '', integrantes: ['Laura Gómez'],
      description: 'Portal web de datos abiertos que publica información sobre presupuesto, contratación e indicadores institucionales del SENA.',
    },
    {
      id: 8, title: 'Chatbot de Atención Académica', estado: 'rechazado', studentId: 4, instructorId: 2, fichaId: 1,
      createdAt: '28/10/2026', studentName: 'Ana Martínez', instructorName: 'Carlos Ruiz',
      keywords: 'chatbot, atención, académico, asistente, IA',
      objectives: '• Implementar respuestas automáticas a preguntas frecuentes.\n• Integrar con la base de datos de programas.\n• Desarrollar panel de análisis de conversaciones.\n• Escalar a trámites transaccionales.',
      deliverables: '',
      technologies: '', areaAplicacion: 'Tecnología e Informática', projectType: 'aplicacion',
      observaciones: '', integrantes: ['Ana Martínez', 'Laura Gómez'],
      description: 'Asistente conversacional que responde dudas sobre programas de formación, requisitos de matrícula y trámites académicos.',
    },
  ],
  similitudes: [
    // Regla: las coincidencias se detectan únicamente contra propuestas APROBADAS (en producción)
    { id: 1, projectId1: 4, projectId2: 5, project1Title: 'Plataforma de Ventas Online', project2Title: 'Sistema de Gestión de Inventarios', project1Student: 'María González', project2Student: 'María González', similitud: 0.45, createdAt: '18/11/2026' },
    { id: 2, projectId1: 1, projectId2: 7, project1Title: 'Sistema IoT para Agricultura', project2Title: 'Portal de Transparencia SENA', project1Student: 'Ana Martínez', project2Student: 'Laura Gómez', similitud: 0.38, createdAt: '16/11/2026' },
    { id: 3, projectId1: 3, projectId2: 5, project1Title: 'Plataforma E-learning para Música', project2Title: 'Sistema de Gestión de Inventarios', project1Student: 'Laura Gómez', project2Student: 'María González', similitud: 0.52, createdAt: '15/11/2026' },
  ],
  bugReports: [
    { id: 1, titulo: 'Pantalla blanca en Dashboard', descripcion: 'Error al cargar la página de Dashboard, muestra pantalla blanca después de iniciar sesión', tipo: 'sistema', prioridad: 'critica', estado: 'pendiente', reporterId: 7, reporterName: 'Carlos Rodríguez Díaz', createdAt: '12/04/2026' },
    { id: 2, titulo: 'No se suben archivos PDF', descripcion: 'No se pueden subir archivos PDF en la sección de evidencias del proyecto', tipo: 'proyecto', prioridad: 'alta', estado: 'pendiente', reporterId: 1, reporterName: 'María González', createdAt: '11/04/2026' },
    { id: 3, titulo: 'Faltan notificaciones de revisión', descripcion: 'El sistema no envía Notificaciones cuando un instructor revisa un proyecto', tipo: 'sistema', prioridad: 'media', estado: 'en_revision', reporterId: 8, reporterName: 'Andrés Martínez López', createdAt: '10/04/2026' },
    { id: 4, titulo: 'Botón cerrar sesión roto', descripcion: 'El botón de Cerrar sesión no funciona correctamente en navegador Chrome', tipo: 'sistema', prioridad: 'baja', estado: 'en_revision', reporterId: 9, reporterName: 'Laura Sánchez Pérez', createdAt: '09/04/2026' },
    { id: 5, titulo: 'Reporte PDF corrupto', descripcion: 'Error en la generación de reportes PDF, el archivo descargado está corrupto', tipo: 'datos', prioridad: 'alta', estado: 'resuelto', reporterId: 10, reporterName: 'Diego Ramírez Castro', createdAt: '08/04/2026' },
    { id: 6, titulo: 'Logos de proyectos no se muestran', descripcion: 'Las imágenes de los logos de proyectos no se muestran en la vista de lista', tipo: 'proyecto', prioridad: 'baja', estado: 'rechazado', reporterId: 11, reporterName: 'Patricia Morales Vega', createdAt: '05/04/2026' },
  ],
  notificaciones: [
    { id: 1, mensaje: "Similitud del 45% detectada en tu proyecto 'Plataforma de Ventas Online'", tipo: 'similitud', userId: 1, projectId: 4, leido: false, createdAt: '18/11/2026' },
    { id: 2, mensaje: "Tu proyecto 'Plataforma de Ventas Online' ha sido recibido y está pendiente de revisión", tipo: 'revision', userId: 1, projectId: 4, leido: false, createdAt: '18/11/2026' },
    { id: 3, mensaje: "Tu proyecto 'Sistema de Gestión de Inventarios' ha sido Aprobado", tipo: 'revision', userId: 1, projectId: 5, leido: true, createdAt: '16/11/2026' },
    { id: 4, mensaje: 'Bienvenido a ProyecTwin', tipo: 'mensaje', userId: 1, leido: true, createdAt: '01/11/2026' },
    { id: 5, mensaje: 'Hay 3 propuestas pendientes de revisión', tipo: 'sistema', userId: 2, leido: false, createdAt: '15/11/2026' },
    { id: 6, mensaje: "Similitud detectada entre 'Sistema IoT para Agricultura' y 'Portal de Transparencia SENA'", tipo: 'similitud', userId: 2, projectId: 1, leido: false, createdAt: '16/11/2026' },
    { id: 7, mensaje: 'Bienvenido a ProyecTwin', tipo: 'mensaje', userId: 2, leido: true, createdAt: '01/11/2026' },
    { id: 8, mensaje: "Nuevo reporte de falla: 'Pantalla blanca en Dashboard'", tipo: 'sistema', userId: 3, reporteId: 1, leido: false, createdAt: '12/04/2026' },
    { id: 9, mensaje: 'Hay 2 reportes de falla en revisión', tipo: 'sistema', userId: 3, reporteId: 3, leido: false, createdAt: '10/04/2026' },
    { id: 10, mensaje: 'Bienvenido a ProyecTwin', tipo: 'mensaje', userId: 3, leido: true, createdAt: '01/11/2026' },
  ],
  observaciones: [
    { id: 1, projectId: 4, autor: 'Carlos Ruiz | Instructor', fecha: '10/05/2026', texto: 'El proyecto necesita mejorar la sección de análisis de requisitos. Se recomienda ampliar la documentación técnica antes de continuar con el desarrollo.' },
    { id: 2, projectId: 4, autor: 'María González | Aprendiz', fecha: '08/05/2026', texto: 'He realizado los ajustes sugeridos en la documentación. La nueva versión incluye diagramas de flujo y casos de uso detallados. Quedo atento a más retroalimentación.' },
    { id: 3, projectId: 4, autor: 'Carlos Ruiz | Instructor', fecha: '06/05/2026', texto: 'La propuesta inicial tiene buen enfoque, pero falta definir mejor los entregables del primer sprint. Recomiendo revisar la guía de proyectos para alinear expectativas.' },
  ],
}

let state

function cargar() {
  try {
    const guardado = localStorage.getItem(KEY)
    if (guardado) {
      const parsed = JSON.parse(guardado)
      // Versionado de seed: si la versión guardada no coincide con la del código,
      // re-sembrar el seed definitivo. Garantiza que todos los fixes del seed
      // (tildes, notificaciones, taxonomía, numero) se apliquen sin borrado manual.
      if (parsed.__seedVersion !== SEED_VERSION) {
        const fresh = JSON.parse(JSON.stringify(ESTADO_INICIAL))
        fresh.__seedVersion = SEED_VERSION
        try { localStorage.setItem(KEY, JSON.stringify(fresh)) } catch { /* ignorar */ }
        return fresh
      }
      // Salvaguarda adicional: si alguna ficha quedó sin numero (corrupción puntual)
      // re-sembrar aunque la versión coincida.
      const hasCorruptFicha = Array.isArray(parsed.fichas) && parsed.fichas.some(f => f.numero == null || String(f.numero).trim() === '')
      if (hasCorruptFicha) {
        const fresh = JSON.parse(JSON.stringify(ESTADO_INICIAL))
        fresh.__seedVersion = SEED_VERSION
        try { localStorage.setItem(KEY, JSON.stringify(fresh)) } catch { /* ignorar */ }
        return fresh
      }
      let migrado = false
      // Migración redes: versiones previas no tenían redes/nextRedId
      if (!Array.isArray(parsed.redes) || typeof parsed.nextRedId !== 'number') {
        parsed.redes = JSON.parse(JSON.stringify(REDES_SEED))
        parsed.nextRedId = REDES_SEED.length + 1
        migrado = true
      } else {
        // Normalizar estructura (ids, programas array)
        let redesMigradas = false
        parsed.redes.forEach((r, idx) => {
          if (r.id == null) { r.id = idx + 1; redesMigradas = true }
          if (!Array.isArray(r.programas)) { r.programas = []; redesMigradas = true }
        })
        if (redesMigradas) migrado = true
        // Recalcular nextRedId si es menor que max id + 1
        const maxId = parsed.redes.reduce((m, r) => Math.max(m, Number(r.id) || 0), 0)
        if (parsed.nextRedId <= maxId) { parsed.nextRedId = maxId + 1; migrado = true }
      }
      if (typeof parsed.nextSimilitudId !== 'number') {
        parsed.nextSimilitudId = 4
        migrado = true
      }
      if (Array.isArray(parsed.users)) {
        parsed.users.forEach((u) => {
          if (u.role === 'instructor' && (u.areaEncargada || u.area || u.red || Array.isArray(u.programas))) {
            delete u.areaEncargada
            delete u.area
            delete u.red
            delete u.programas
            migrado = true
          }
          if ('estado' in u) {
            delete u.estado
            migrado = true
          }
        })
      }
      if (parsed.fichas) {
        // Migración robusta: cualquier ficha con código viejo FT-XXXXXX se regenera a formato Classroom (abc-defg)
        const esFormatoViejo = (c) => typeof c === 'string' && /^FT-[A-Z0-9]{6}$/.test(c)
        const tieneCodigoViejo = parsed.fichas.some(f => esFormatoViejo(f.codigo))
        if (tieneCodigoViejo) {
          const usados = new Set(parsed.fichas.filter(f => !esFormatoViejo(f.codigo)).map(f => f.codigo))
          parsed.fichas.forEach(f => {
            if (esFormatoViejo(f.codigo)) {
              let nuevo
              for (let i = 0; i < 1000; i++) {
                nuevo = generarCodigoFicha()
                if (!usados.has(nuevo)) break
              }
              f.codigo = nuevo
              usados.add(nuevo)
              migrado = true
            }
          })
        }
        parsed.fichas.forEach(f => {
          if (f.instructorId == null && f.instructorName) {
            const instructor = parsed.users?.find(
              u => u.role === 'instructor' && u.name === f.instructorName
            )
            if (instructor) { f.instructorId = instructor.id; migrado = true }
          }
          let cambio = false
          if (typeof f.numero !== 'string') { f.numero = f.numero == null ? '' : String(f.numero); cambio = true }
          if (!f.programa) {
            const fallback = Array.isArray(parsed.redes) ? parsed.redes.flatMap((r) => r.programas)[0] : PROGRAMA_ACTIVO
            f.programa = fallback || PROGRAMA_ACTIVO
            cambio = true
          }
          if ('horario' in f) { delete f.horario; cambio = true }
          if (cambio) migrado = true
        })
      }
      if (Array.isArray(parsed.bugReports)) {
        parsed.bugReports.forEach((r) => {
          if (!r.prioridad) {
            if (r.tipo === 'sistema') r.prioridad = 'alta'
            else if (r.tipo === 'error_datos' || r.tipo === 'datos') r.prioridad = 'alta'
            else if (r.tipo === 'seguridad') r.prioridad = 'critica'
            else if (r.tipo === 'rendimiento') r.prioridad = 'alta'
            else if (r.tipo === 'bug_ui') r.prioridad = 'media'
            else r.prioridad = 'baja'
            migrado = true
          }
        })
      }
      // Migración modelo 3 estados: normalizar proyectos con estados legacy (en_revision, requiere_ajustes, borrador, en_progreso, completado, cancelado) → pendiente
      if (Array.isArray(parsed.proyectos)) {
        const estadosValidos = new Set(['pendiente', 'aprobado', 'rechazado'])
        parsed.proyectos.forEach((p) => {
          if (!estadosValidos.has(p.estado)) {
            p.estado = 'pendiente'
            migrado = true
          }
        })
      }
      // Migración similitud: eliminar campo estado legacy
      if (Array.isArray(parsed.similitudes)) {
        parsed.similitudes.forEach((s) => {
          if ('estado' in s) {
            delete s.estado
            migrado = true
          }
        })
      }
      if (migrado) localStorage.setItem(KEY, JSON.stringify(parsed))
      return parsed
    }
  } catch {
    // ignorar y usar datos iniciales
  }
  const freshFallback = JSON.parse(JSON.stringify(ESTADO_INICIAL))
  freshFallback.__seedVersion = SEED_VERSION
  try { localStorage.setItem(KEY, JSON.stringify(freshFallback)) } catch { /* ignorar */ }
  return freshFallback
}

function guardar() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // almacenamiento no disponible
  }
}

state = cargar()
syncRedesDerivados()

export function generarCodigoFichaUnico() {
  const usados = new Set(state.fichas.map(f => f.codigo))
  for (let i = 0; i < 1000; i++) {
    const codigo = generarCodigoFicha()
    if (!usados.has(codigo)) return codigo
  }
  throw new Error('No se pudo generar un código de ficha único')
}

// ---------------------------------------------------------------- Usuarios
export function getAllUsers() {
  return state.users
}

export function findUserById(id) {
  return state.users.find(u => u.id === Number(id)) || null
}

export function findUserByEmail(email) {
  return state.users.find(u => u.email === email) || null
}

export function validateCredentials(email, password) {
  return state.passwords[email] === password
}

export function emailExists(email) {
  return Object.prototype.hasOwnProperty.call(state.passwords, email)
}

export function createUser({ name, email, role, password = '123456' }) {
  const user = {
    id: state.nextUserId++,
    name,
    email,
    role,
  }
  state.users.push(user)
  state.passwords[email] = password
  guardar()
  return user
}

export function updateUser({ id, name = null, email = null }) {
  const index = state.users.findIndex(u => u.id === Number(id))
  if (index === -1) return
  const current = state.users[index]
  if (email && current.email !== email) {
    const pass = state.passwords[current.email]
    delete state.passwords[current.email]
    state.passwords[email] = pass
  }
  state.users[index] = {
    ...current,
    name: name ?? current.name,
    email: email ?? current.email,
  }
  guardar()
}

export function updateUserPassword(email, newPassword) {
  if (!Object.prototype.hasOwnProperty.call(state.passwords, email)) return false
  state.passwords[email] = newPassword
  guardar()
  return true
}

export function deleteUser(id) {
  const index = state.users.findIndex(u => u.id === Number(id))
  if (index !== -1) {
    const email = state.users[index].email
    delete state.passwords[email]
    state.users.splice(index, 1)
    guardar()
  }
}

export function setUserFicha(userId, fichaId) {
  const index = state.users.findIndex(u => u.id === Number(userId))
  if (index !== -1) {
    const ficha = findFichaById(fichaId)
    state.users[index] = {
      ...state.users[index],
      fichaId,
      programa: ficha?.programa || state.users[index].programa,
    }
    guardar()
  }
}

// ---------------------------------------------------------------- Fichas
export function getAllFichas() {
  return state.fichas
}

export function findFichaById(id) {
  return state.fichas.find(f => f.id === Number(id)) || null
}

export function findFichaByCodigo(codigo) {
  return state.fichas.find(f => f.codigo === (codigo || '').trim().toLowerCase()) || null
}

export function getActiveFichas() {
  return state.fichas.filter(f => f.estado === 'activo')
}

export function createFicha({ nombre, numero, programa, instructorName, instructorId, codigo }) {
  const programasActuales = getProgramas()
  const activo = getProgramaActivo()
  const ficha = {
    id: state.nextFichaId++,
    codigo: codigo || generarCodigoFichaUnico(),
    numero,
    nombre,
    programa: programasActuales.includes(programa) ? programa : activo,
    aprendices: 0,
    proyectos: 0,
    estado: 'activo',
    instructorName,
    instructorId: instructorId ?? null,
    createdAt: hoyFormato('dd/MM/yyyy'),
    estudiantes: [],
  }
  state.fichas.unshift(ficha)
  guardar()
  return ficha
}

export function updateFicha({ id, nombre, numero, estado = null, instructorName = null, instructorId = null }) {
  const index = state.fichas.findIndex(f => f.id === Number(id))
  if (index !== -1) {
    state.fichas[index] = {
      ...state.fichas[index],
      nombre: nombre ?? state.fichas[index].nombre,
      numero: numero ?? state.fichas[index].numero,
      estado: estado ?? state.fichas[index].estado,
      instructorName: instructorName ?? state.fichas[index].instructorName,
      instructorId: instructorId ?? state.fichas[index].instructorId,
    }
    guardar()
  }
}

export function deleteFicha(id) {
  const numericId = Number(id)
  const index = state.fichas.findIndex(f => f.id === numericId)
  if (index === -1) return false
  state.fichas.splice(index, 1)
  state.users.forEach(u => { if (u.fichaId === numericId) u.fichaId = null })
  guardar()
  return true
}

export function joinFicha(codigo, estudiante) {
  const index = state.fichas.findIndex(f => f.codigo === (codigo || '').trim().toLowerCase())
  if (index === -1) return null
  const ficha = state.fichas[index]
  if (ficha.estado === 'inactivo') return null
  if (!ficha.estudiantes.some(e => e.id === estudiante.id)) {
    state.fichas[index] = { ...ficha, estudiantes: [...ficha.estudiantes, estudiante], aprendices: ficha.aprendices + 1 }
  }
  const uIdx = state.users.findIndex(u => u.id === Number(estudiante.id))
  if (uIdx !== -1 && !state.users[uIdx].fichaId) {
    state.users[uIdx] = {
      ...state.users[uIdx],
      fichaId: ficha.id,
      programa: state.users[uIdx].programa || ficha.programa || null,
    }
  }
  guardar()
  return state.fichas[index]
}

export function leaveFicha(userId) {
  const uIdx = state.users.findIndex(u => u.id === Number(userId))
  if (uIdx === -1 || !state.users[uIdx].fichaId) return false
  const fichaId = state.users[uIdx].fichaId
  const fIdx = state.fichas.findIndex(f => f.id === Number(fichaId))
  if (fIdx !== -1) {
    const restantes = state.fichas[fIdx].estudiantes.filter(e => e.id !== Number(userId))
    if (restantes.length !== state.fichas[fIdx].estudiantes.length) {
      state.fichas[fIdx] = { ...state.fichas[fIdx], estudiantes: restantes, aprendices: Math.max(0, state.fichas[fIdx].aprendices - 1) }
    }
  }
  state.users[uIdx] = { ...state.users[uIdx], fichaId: null }
  guardar()
  return true
}

export function getEstudiantesDeFicha(fichaId) {
  const directos = findFichaById(fichaId)?.estudiantes || []
  const asignados = state.users.filter(u => u.fichaId === Number(fichaId) && u.role === 'aprendiz')
  const ids = new Set()
  const result = []
  // Priorizar el registro completo del usuario (asignados) sobre el snapshot {id,name}
  // guardado en ficha.estudiantes — así el email/fotoPerfil no queda en blanco para
  // aprendices que se unieron por código (joinFicha guardaba solo {id,name}).
  ;[...asignados, ...directos].forEach(u => {
    if (!ids.has(u.id)) {
      ids.add(u.id)
      result.push(u)
    }
  })
  return result
}

// ---------------------------------------------------------------- Proyectos
export function getAllProjects() {
  return state.proyectos
}

export function findProjectById(id) {
  return state.proyectos.find(p => p.id === Number(id)) || null
}

export function getProjectsByStudent(studentId) {
  // Propuestas creadas por el aprendiz O donde figura como integrante del equipo
  const uid = Number(studentId)
  const usuario = state.users.find(u => u.id === uid)
  return state.proyectos.filter(p =>
    Number(p.studentId) === uid ||
    (usuario && (p.integrantes || []).includes(usuario.name))
  )
}

export function getProjectsByInstructor(instructorId) {
  return state.proyectos.filter(p => p.instructorId === Number(instructorId))
}

// Fichas a cargo de un instructor
export function getFichasDelInstructor(instructorId) {
  return state.fichas.filter(f => f.instructorId === Number(instructorId))
}

// Autorización: el proyecto pertenece a una ficha a cargo del instructor
export function instructorVeProyecto(proyecto, instructorId) {
  if (!proyecto || !instructorId && instructorId !== 0) return false
  const uid = Number(instructorId)
  if (Number(proyecto.instructorId) === uid) return true
  return state.fichas.some(f => f.instructorId === uid && f.id === Number(proyecto.fichaId))
}

// Autorización: la ficha está a cargo del instructor
export function instructorVeFicha(ficha, instructorId) {
  if (!ficha) return false
  return Number(ficha.instructorId) === Number(instructorId)
}

export function getProjectsByFicha(fichaId) {
  return state.proyectos.filter(p => p.fichaId === Number(fichaId))
}

export function getPendingProjects() {
  return state.proyectos.filter(p => p.estado === 'pendiente')
}

export function createProject({ title, description, studentId, instructorId, fichaId, studentName, instructorName, keywords = '', objectives = '', objetivoGeneral = '', objetivosEspecificos = '', deliverables = '', technologies = '', areaAplicacion = '', observaciones = '', integrantes = [], projectType = 'aplicacion', estado = 'pendiente' }) {
  const fecha = hoyFormato('dd/MM/yyyy')
  const project = {
    id: state.nextProjectId++,
    title,
    description,
    estado,
    studentId: Number(studentId),
    instructorId,
    fichaId,
    createdAt: fecha,
    updatedAt: fecha,
    studentName,
    instructorName,
    keywords,
    objectives,
    objetivoGeneral,
    objetivosEspecificos,
    deliverables,
    technologies,
    areaAplicacion,
    observaciones,
    integrantes,
    projectType,
  }
  state.proyectos.unshift(project)
  guardar()
  return project
}

export function updateProject({ id, title, description, keywords = null, objectives = null, deliverables = null, technologies = null, areaAplicacion = null, observaciones = null, integrantes = null, projectType = null }) {
  const index = state.proyectos.findIndex(p => p.id === Number(id))
  if (index === -1) return
  const current = state.proyectos[index]
  state.proyectos[index] = {
    ...current,
    title: title ?? current.title,
    description: description ?? current.description,
    keywords: keywords ?? current.keywords,
    objectives: objectives ?? current.objectives,
    deliverables: deliverables ?? current.deliverables,
    technologies: technologies ?? current.technologies,
    areaAplicacion: areaAplicacion ?? current.areaAplicacion,
    observaciones: observaciones ?? current.observaciones,
    integrantes: integrantes ?? current.integrantes,
    projectType: projectType ?? current.projectType,
    updatedAt: hoyFormato('dd/MM/yyyy'),
  }
  guardar()
}

export function updateUserFoto(id, foto) {
  const index = state.users.findIndex(u => u.id === Number(id))
  if (index === -1) return null
  state.users[index] = { ...state.users[index], fotoPerfil: foto || null }
  guardar()
  return state.users[index]
}

export function updateProjectEstado(id, estado) {
  const index = state.proyectos.findIndex(p => p.id === Number(id))
  if (index !== -1) {
    state.proyectos[index] = { ...state.proyectos[index], estado, updatedAt: hoyFormato('dd/MM/yyyy') }
    guardar()
    if (estado === 'aprobado') {
      return detectarSimilitudes(state.proyectos[index].id)
    }
  }
  return 0
}

export function deleteProject(id) {
  const numId = Number(id)
  state.proyectos = state.proyectos.filter(p => p.id !== numId)
  state.similitudes = state.similitudes.filter(s => s.projectId1 !== numId && s.projectId2 !== numId)
  state.notificaciones = state.notificaciones.filter(n => n.projectId !== numId)
  state.observaciones = state.observaciones.filter(o => o.projectId !== numId)
  guardar()
}

// ---------------------------------------------------------------- Similitudes
export function getAllSimilarities() {
  return state.similitudes
}

// Regla de negocio: solo coincidencias contra propuestas APROBADAS e intra-programa
// (ADSO solo con ADSO, etc. — sin importar ficha; misma regla que detectarSimilitudes)
export function getSimilitudesValidas() {
  return state.similitudes.filter((x) => {
    const p1 = findProjectById(x.projectId1)
    const p2 = findProjectById(x.projectId2)
    if (!p1 || !p2) return false
    if (getProgramaDeProyecto(p1) !== getProgramaDeProyecto(p2)) return false
    return p1.estado === 'aprobado' || p2.estado === 'aprobado'
  })
}

export function findSimilarityById(id) {
  return state.similitudes.find(s => s.id === Number(id)) || null
}

export function getSimilaritiesByProject(projectId) {
  // Mismo idioma que getSimilitudesValidas: intra-programa + al menos un aprobado
  const pid = Number(projectId)
  return getSimilitudesValidas().filter((s) => s.projectId1 === pid || s.projectId2 === pid)
}

export function updateSimilarityEstado() {
  // deprecated: similitud.estado eliminado (modelo 3 estados: el instructor decide sobre la propuesta)
}

// ------------------------------------------------- Detección (simulada)
// Regla de negocio: una propuesta aprobada se compara contra el corpus
// histórico APROBADO del mismo programa. En producción este cálculo vive
// en el backend; aquí se simula con Jaccard sobre título + palabras clave.
const STOPWORDS = new Set([
  'de', 'la', 'el', 'los', 'las', 'un', 'una', 'para', 'con', 'del', 'al',
  'en', 'y', 'o', 'a', 'que', 'por', 'su', 'es', 'son',
])

function tokenizar(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t))
}

function jaccard(a, b) {
  const A = new Set(a)
  const B = new Set(b)
  if (!A.size || !B.size) return 0
  let inter = 0
  for (const t of A) {
    if (B.has(t)) inter++
  }
  return inter / (A.size + B.size - inter)
}

const UMBRAL_SIMILITUD = 0.2

export function getProgramaDeProyecto(proyecto) {
  if (!proyecto) return null
  return findFichaById(proyecto.fichaId)?.programa || null
}

export function detectarSimilitudes(projectId) {
  const propio = findProjectById(projectId)
  if (!propio) return 0
  const tokensPropios = tokenizar(`${propio.title} ${propio.keywords}`)
  const programaPropio = getProgramaDeProyecto(propio)

  const corpus = state.proyectos.filter(
    (p) =>
      p.id !== propio.id &&
      p.estado === 'aprobado' &&
      getProgramaDeProyecto(p) === programaPropio
  )

  let creadas = 0
  for (const otro of corpus) {
    const yaExiste = state.similitudes.some(
      (s) =>
        (s.projectId1 === propio.id && s.projectId2 === otro.id) ||
        (s.projectId1 === otro.id && s.projectId2 === propio.id)
    )
    if (yaExiste) continue

    const tokensOtro = tokenizar(`${otro.title} ${otro.keywords}`)
    const score = jaccard(tokensPropios, tokensOtro)
    if (score < UMBRAL_SIMILITUD) continue

    state.similitudes.unshift({
      id: state.nextSimilitudId++,
      projectId1: propio.id,
      projectId2: otro.id,
      project1Title: propio.title,
      project2Title: otro.title,
      project1Student: propio.studentName,
      project2Student: otro.studentName,
      similitud: Math.round(score * 100) / 100,
      createdAt: hoyFormato('dd/MM/yyyy'),
    })
    creadas++

    createNotification({
      mensaje: `Similitud del ${Math.round(score * 100)}% detectada entre '${propio.title}' y '${otro.title}'`,
      tipo: 'similitud',
      userId: propio.studentId,
      projectId: propio.id,
    })
  }

  return creadas
}

// ---------------------------------------------------------------- Reportes
export function getAllBugReports() {
  return state.bugReports
}

export function findBugReportById(id) {
  return state.bugReports.find(r => r.id === Number(id)) || null
}

export function getBugReportsByReporter(reporterId) {
  return state.bugReports.filter(r => r.reporterId === Number(reporterId))
}

export function updateBugReportEstado(id, estado) {
  const index = state.bugReports.findIndex(r => r.id === Number(id))
  if (index !== -1) {
    state.bugReports[index] = { ...state.bugReports[index], estado, updatedAt: hoyFormato('dd/MM/yyyy') }
    guardar()
  }
}

export function createBugReport({ titulo, descripcion, tipo, prioridad = 'media', reporterId = null, reporterName, pasos = null }) {
  const report = {
    id: state.nextBugReportId++,
    titulo,
    descripcion,
    tipo,
    prioridad,
    estado: 'pendiente',
    reporterId,
    reporterName,
    pasos,
    createdAt: hoyFormato('dd/MM/yyyy'),
  }
  state.bugReports.unshift(report)
  const admins = state.users.filter(u => u.role === 'admin')
  admins.forEach(a => {
    createNotification({
      mensaje: `Nuevo reporte de falla: "${titulo}"`,
      tipo: 'sistema',
      userId: a.id,
      reporteId: report.id,
    })
  })
  guardar()
  return report
}

// ---------------------------------------------------------------- Notificaciones
export function getNotificationsByUser(userId) {
  return state.notificaciones.filter(n => n.userId === Number(userId))
}

export function getUnreadNotificationsByUser(userId) {
  return getNotificationsByUser(userId).filter(n => !n.leido)
}

export function getUnreadCount(userId) {
  return getUnreadNotificationsByUser(userId).length
}

export function markNotificationAsRead(notificationId) {
  const index = state.notificaciones.findIndex(n => n.id === Number(notificationId))
  if (index !== -1) {
    state.notificaciones[index] = { ...state.notificaciones[index], leido: true }
    guardar()
  }
}

export function markAllNotificationsAsRead(userId) {
  state.notificaciones = state.notificaciones.map(n =>
    n.userId === Number(userId) ? { ...n, leido: true } : n
  )
  guardar()
}

export function createNotification({ mensaje, tipo, userId, projectId = null, reporteId = null }) {
  const n = {
    id: state.nextNotificationId++,
    mensaje,
    tipo,
    userId: Number(userId),
    projectId,
    reporteId,
    leido: false,
    createdAt: hoyFormato('dd/MM/yyyy'),
  }
  state.notificaciones.unshift(n)
  guardar()
  return n
}

// ---------------------------------------------------------------- Observaciones
export function getObservaciones(projectId) {
  return state.observaciones.filter(o => o.projectId === Number(projectId))
}

export function addObservacion(projectId, autor, texto, respuestaA = null) {
  const observacion = {
    id: state.nextObservacionId++,
    projectId: Number(projectId),
    autor,
    fecha: hoyFormato('d MMM yyyy'),
    texto,
    respuestaA: respuestaA ? Number(respuestaA) : null,
  }
  state.observaciones.unshift(observacion)
  guardar()
  notificarObservacion(observacion)
  return observacion
}

function notificarObservacion(obs) {
  const proyecto = state.proyectos.find(p => p.id === obs.projectId)
  if (!proyecto) return
  const partes = obs.autor.split('|').map(s => s.trim())
  const autorNombre = partes[0] || 'Alguien'
  const rolAutor = (partes[1] || '').toLowerCase()

  // Equipo de la propuesta: creador + integrantes mapeados a usuarios registrados
  const equipo = state.users.filter(u =>
    u.id === Number(proyecto.studentId) ||
    (proyecto.integrantes || []).includes(u.name)
  )

  let destinatarios = []
  if (rolAutor === 'aprendiz') {
    // El aprendiz respondió → avisa al instructor a cargo
    if (proyecto.instructorId) {
      destinatarios.push(state.users.find(u => u.id === Number(proyecto.instructorId)))
    }
  } else {
    // Instructor/Admin observó → avisa a todo el equipo
    destinatarios.push(...equipo)
  }

  destinatarios.filter(Boolean).forEach(u => {
    createNotification({
      mensaje: `${autorNombre} ${rolAutor === 'aprendiz' ? 'respondió en' : 'agregó una observación en'} '${proyecto.title}'`,
      tipo: 'observacion',
      userId: u.id,
      projectId: proyecto.id,
    })
  })
}

export function removeObservacion(id) {
  state.observaciones = state.observaciones.filter(o => o.id !== Number(id))
  guardar()
}

export const constants = {
  // Modelo vigente: solo 3 estados (pendiente → aprobado / rechazado)
  ProjectStatus: {
    PENDIENTE: 'pendiente',
    APROBADO: 'aprobado',
    RECHAZADO: 'rechazado',
  },
  ClassGroupStatus: {
    ACTIVO: 'activo',
    INACTIVO: 'inactivo',
    FINALIZADO: 'finalizado',
  },
  BugReportStatus: {
    PENDIENTE: 'pendiente',
    EN_REVISION: 'en_revision',
    RESUELTO: 'resuelto',
    CERRADO: 'cerrado',
    RECHAZADO: 'rechazado',
  },
  BugReportType: {
    // Legado (seed anterior) — se mantiene por compatibilidad
    SISTEMA: 'sistema',
    PROYECTO: 'proyecto',
    DATOS: 'datos',
    // Formulario actual (ReportarFallaBase)
    BUG_UI: 'bug_ui',
    ERROR_DATOS: 'error_datos',
    RENDIMIENTO: 'rendimiento',
    SEGURIDAD: 'seguridad',
    OTRO: 'otro',
  },
  SimilarityStatus: {
    // deprecated: similitud.estado eliminado
  },
  NotificationType: {
    SIMILITUD: 'similitud',
    OBSERVACION: 'observacion',
    REVISION: 'revision',
    MENSAJE: 'mensaje',
    SISTEMA: 'sistema',
  },
  UserRole: {
    APRENDIZ: 'aprendiz',
    INSTRUCTOR: 'instructor',
    ADMIN: 'admin',
  },
}

export const displayNames = {
  // Modelo vigente: solo 3 estados
  projectStatus: {
    pendiente: 'Pendiente',
    aprobado: 'Aprobado',
    rechazado: 'Rechazado',
  },
  classGroupStatus: {
    activo: 'Activo',
    inactivo: 'Inactivo',
    finalizado: 'Finalizado',
  },
  bugReportStatus: {
    pendiente: 'Pendiente',
    en_revision: 'En Revisión',
    resuelto: 'Resuelto',
    cerrado: 'Cerrado',
    rechazado: 'Rechazado',
  },
  bugReportType: {
    // Legado (seed anterior)
    sistema: 'Sistema',
    proyecto: 'Proyecto',
    datos: 'Datos',
    // Formulario actual
    bug_ui: 'Bug de UI',
    error_datos: 'Error de datos',
    rendimiento: 'Rendimiento',
    seguridad: 'Seguridad',
    otro: 'Otro',
  },
  similarityStatus: {
    // deprecated: similitud.estado eliminado
  },
  notificationType: {
    similitud: 'Similitud',
    observacion: 'Observación',
    revision: 'Revisión',
    mensaje: 'Mensaje',
    sistema: 'Sistema',
  },
  userRole: {
    aprendiz: 'Aprendiz',
    instructor: 'Instructor',
    admin: 'Administrador',
  },
}
