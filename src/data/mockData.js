const KEY = 'proyectwin_mock_v2'

function hoyFormato(formato) {
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
  const d = new Date()
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  if (formato === 'd MMM yyyy') return `${d.getDate()} ${meses[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`
  return `${dd}/${mm}/${d.getFullYear()}`
}

export function generarCodigoFicha() {
  const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let codigo = 'FT-'
  for (let i = 0; i < 6; i++) {
    codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length))
  }
  return codigo
}

const ESTADO_INICIAL = {
  nextUserId: 14,
  nextFichaId: 5,
  nextProjectId: 9,
  nextBugReportId: 7,
  nextNotificationId: 11,
  nextObservacionId: 4,
  users: [
    { id: 1, name: 'María González', email: 'maria.gonzalez@soy.sena.edu.co', role: 'aprendiz', telefono: '3001112223', documentoIdentidad: '1000000001', fichaId: 1, estado: 1, programa: 'ADSO' },
    { id: 2, name: 'Carlos Ruiz', email: 'carlos.ruiz@sena.edu.co', role: 'instructor', telefono: '3002223334', documentoIdentidad: '1000000002', estado: 1, areaEncargada: 'ADSO' },
    { id: 3, name: 'Administrador', email: 'admin@sena.edu.co', role: 'admin', telefono: '3003334445', documentoIdentidad: '1000000003', estado: 1 },
    { id: 4, name: 'Ana Martínez', email: 'ana.martinez@soy.sena.edu.co', role: 'aprendiz', telefono: '3004445556', documentoIdentidad: '1000000004', fichaId: 1, estado: 1, programa: 'ADSO' },
    { id: 5, name: 'Juan Pérez', email: 'juan.perez@soy.sena.edu.co', role: 'aprendiz', telefono: '3005556667', documentoIdentidad: '1000000005', fichaId: 1, estado: 1, programa: 'ADSO' },
    { id: 6, name: 'Laura Gómez', email: 'laura.gomez@soy.sena.edu.co', role: 'aprendiz', telefono: '3006667778', documentoIdentidad: '1000000006', fichaId: 2, estado: 1, programa: 'ADSO' },
    { id: 7, name: 'Carlos Rodríguez Díaz', email: 'carlos.rodriguez@sena.edu.co', role: 'instructor', telefono: '3007778889', documentoIdentidad: '1000000007', estado: 1, areaEncargada: 'Produccion Multimedia' },
    { id: 8, name: 'Andrés Martínez López', email: 'andres.martinez@sena.edu.co', role: 'instructor', telefono: '3008889990', documentoIdentidad: '1000000008', estado: 1, areaEncargada: 'Infraestructura Redes' },
    { id: 9, name: 'Laura Sánchez Pérez', email: 'laura.sanchez@soy.sena.edu.co', role: 'aprendiz', telefono: '3009990001', documentoIdentidad: '1000000009', fichaId: 3, estado: 1, programa: 'Produccion Multimedia' },
    { id: 10, name: 'Diego Ramírez Castro', email: 'diego.ramirez@soy.sena.edu.co', role: 'aprendiz', telefono: '3011112223', documentoIdentidad: '1000000010', fichaId: 4, estado: 1, programa: 'Infraestructura Redes' },
    { id: 11, name: 'Patricia Morales Vega', email: 'patricia.morales@soy.sena.edu.co', role: 'aprendiz', telefono: '3012223334', documentoIdentidad: '1000000011', fichaId: 2, estado: 1, programa: 'ADSO' },
    { id: 12, name: 'María Fernanda Torres', email: 'maria.torres@sena.edu.co', role: 'admin', telefono: '3013334445', documentoIdentidad: '1000000012', estado: 1 },
    { id: 13, name: 'Luis Fernando García', email: 'luis.garcia@sena.edu.co', role: 'instructor', telefono: '3014445556', documentoIdentidad: '1000000013', estado: 0, areaEncargada: 'ADSO' },
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
    { id: 1, codigo: 'FT-X7K2MN', nombre: 'Analisis y Desarrollo 2568', programa: 'ADSO', idPrograma: 1, aprendices: 28, proyectos: 5, estado: 'activo', instructorName: 'Carlos Ruiz', instructorId: 2, createdAt: '01/02/2026', estudiantes: [] },
    { id: 2, codigo: 'FT-P4R8TL', nombre: 'Analisis y Desarrollo 2634', programa: 'ADSO', idPrograma: 1, aprendices: 25, proyectos: 3, estado: 'activo', instructorName: 'Carlos Rodríguez Díaz', instructorId: 7, createdAt: '10/02/2026', estudiantes: [] },
    { id: 3, codigo: 'FT-W2J5HQ', nombre: 'Produccion Multimedia 3102', programa: 'Produccion Multimedia', idPrograma: 2, aprendices: 22, proyectos: 4, estado: 'activo', instructorName: 'Carlos Rodríguez Díaz', instructorId: 7, createdAt: '15/02/2026', estudiantes: [] },
    { id: 4, codigo: 'FT-B9N3VK', nombre: 'Infraestructura Redes 2801', programa: 'Infraestructura Redes', idPrograma: 3, aprendices: 20, proyectos: 0, estado: 'inactivo', instructorName: 'Andrés Martínez López', instructorId: 8, createdAt: '20/02/2026', estudiantes: [] },
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
      id: 3, title: 'Plataforma E-learning para Música', estado: 'requiere_ajustes', studentId: 6, instructorId: 7, fichaId: 2,
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
      id: 4, title: 'Plataforma de Ventas Online', estado: 'en_revision', studentId: 1, instructorId: 2, fichaId: 1,
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
      id: 6, title: 'App de Bienestar Deportivo', estado: 'en_revision', studentId: 5, instructorId: 2, fichaId: 1,
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
    { id: 1, projectId1: 4, projectId2: 2, project1Title: 'Plataforma de Ventas Online', project2Title: 'App Móvil para Turismo Local', project1Student: 'María González', project2Student: 'Juan Pérez', similitud: 0.45, estado: 'pendiente', createdAt: '18/11/2026' },
    { id: 2, projectId1: 4, projectId2: 5, project1Title: 'Plataforma de Ventas Online', project2Title: 'Sistema de Gestión de Inventarios', project1Student: 'María González', project2Student: 'María González', similitud: 0.61, estado: 'revisada', createdAt: '17/11/2026' },
    { id: 3, projectId1: 1, projectId2: 6, project1Title: 'Sistema IoT para Agricultura', project2Title: 'App de Bienestar Deportivo', project1Student: 'Ana Martínez', project2Student: 'Juan Pérez', similitud: 0.38, estado: 'pendiente', createdAt: '16/11/2026' },
    { id: 4, projectId1: 3, projectId2: 7, project1Title: 'Plataforma E-learning para Música', project2Title: 'Portal de Transparencia SENA', project1Student: 'Laura Gómez', project2Student: 'Laura Gómez', similitud: 0.52, estado: 'revisada', createdAt: '15/11/2026' },
  ],
  bugReports: [
    { id: 1, titulo: 'Pantalla blanca en Dashboard', descripcion: 'Error al cargar la página de Dashboard, muestra pantalla blanca después de iniciar sesión', tipo: 'sistema', estado: 'pendiente', reporterId: 7, reporterName: 'Carlos Rodríguez Díaz', createdAt: '12/04/2026' },
    { id: 2, titulo: 'No se suben archivos PDF', descripcion: 'No se pueden subir archivos PDF en la sección de evidencias del proyecto', tipo: 'proyecto', estado: 'pendiente', reporterId: 1, reporterName: 'Maria Gonzalez', createdAt: '11/04/2026' },
    { id: 3, titulo: 'Faltan notificaciones de revisión', descripcion: 'El sistema no envía Notificaciones cuando un instructor revisa un proyecto', tipo: 'sistema', estado: 'en_revision', reporterId: 8, reporterName: 'Andrés Martínez López', createdAt: '10/04/2026' },
    { id: 4, titulo: 'Botón cerrar sesión roto', descripcion: 'El botón de Cerrar sesión no funciona correctamente en navegador Chrome', tipo: 'sistema', estado: 'en_revision', reporterId: 9, reporterName: 'Laura Sánchez Pérez', createdAt: '09/04/2026' },
    { id: 5, titulo: 'Reporte PDF corrupto', descripcion: 'Error en la generación de reportes PDF, el archivo descargado está corrupto', tipo: 'datos', estado: 'resuelto', reporterId: 10, reporterName: 'Diego Ramírez Castro', createdAt: '08/04/2026' },
    { id: 6, titulo: 'Logos de proyectos no se muestran', descripcion: 'Las imágenes de los logos de proyectos no se muestran en la vista de lista', tipo: 'proyecto', estado: 'rechazado', reporterId: 11, reporterName: 'Patricia Morales Vega', createdAt: '05/04/2026' },
  ],
  notificaciones: [
    { id: 1, mensaje: "Similitud del 45% detectada en tu proyecto 'Plataforma de Ventas Online'", tipo: 'similitud', userId: 1, projectId: 4, leido: false, createdAt: '18/11/2026' },
    { id: 2, mensaje: "Tu proyecto 'Plataforma de Ventas Online' ha pasado a En Revisión", tipo: 'revision', userId: 1, projectId: 4, leido: false, createdAt: '18/11/2026' },
    { id: 3, mensaje: "Tu proyecto 'Sistema de Gestión de Inventarios' ha sido Aprobado", tipo: 'revision', userId: 1, projectId: 5, leido: true, createdAt: '16/11/2026' },
    { id: 4, mensaje: 'Bienvenido a ProyecTwin', tipo: 'mensaje', userId: 1, leido: true, createdAt: '01/11/2026' },
    { id: 5, mensaje: 'Hay 3 propuestas pendientes de revisión', tipo: 'sistema', userId: 2, leido: false, createdAt: '15/11/2026' },
    { id: 6, mensaje: "Similitud detectada entre 'Sistema IoT para Agricultura' y 'App de Bienestar Deportivo'", tipo: 'similitud', userId: 2, projectId: 1, leido: false, createdAt: '16/11/2026' },
    { id: 7, mensaje: 'Bienvenido a ProyecTwin', tipo: 'mensaje', userId: 2, leido: true, createdAt: '01/11/2026' },
    { id: 8, mensaje: "Nuevo reporte de falla: 'Pantalla blanca en Dashboard'", tipo: 'sistema', userId: 3, reporteId: 1, leido: false, createdAt: '12/04/2026' },
    { id: 9, mensaje: 'Hay 2 reportes de falla en revisión', tipo: 'sistema', userId: 3, reporteId: 3, leido: false, createdAt: '10/04/2026' },
    { id: 10, mensaje: 'Bienvenido a ProyecTwin', tipo: 'mensaje', userId: 3, leido: true, createdAt: '01/11/2026' },
  ],
  observaciones: [
    { id: 1, projectId: 4, autor: 'Carlos Ruiz | Instructor', fecha: '10/05/2026', texto: 'El proyecto necesita mejorar la sección de análisis de requisitos. Se recomienda ampliar la documentación técnica antes de continuar con el desarrollo.' },
    { id: 2, projectId: 4, autor: 'Maria Gonzalez | Aprendiz', fecha: '08/05/2026', texto: 'He realizado los ajustes sugeridos en la documentación. La nueva versión incluye diagramas de flujo y casos de uso detallados. Quedo atento a más retroalimentación.' },
    { id: 3, projectId: 4, autor: 'Carlos Ruiz | Instructor', fecha: '06/05/2026', texto: 'La propuesta inicial tiene buen enfoque, pero falta definir mejor los entregables del primer sprint. Recomiendo revisar la guía de proyectos para alinear expectativas.' },
  ],
}

let state

function cargar() {
  try {
    const guardado = localStorage.getItem(KEY)
    if (guardado) {
      const parsed = JSON.parse(guardado)
      let migrado = false
      if (parsed.fichas) {
        parsed.fichas.forEach(f => {
          if (f.instructorId == null && f.instructorName) {
            const instructor = parsed.users?.find(
              u => u.role === 'instructor' && u.name === f.instructorName
            )
            if (instructor) { f.instructorId = instructor.id; migrado = true }
          }
        })
      }
      if (migrado) localStorage.setItem(KEY, JSON.stringify(parsed))
      return parsed
    }
  } catch {
    // ignorar y usar datos iniciales
  }
  return JSON.parse(JSON.stringify(ESTADO_INICIAL))
}

function guardar() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // almacenamiento no disponible
  }
}

state = cargar()

function resetMockData() {
  state = JSON.parse(JSON.stringify(ESTADO_INICIAL))
  guardar()
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

export function createUser({ name, email, role, fichaId = null, estado = 1, programa = null, areaEncargada = null, fechaIngreso = null, telefono = null, password = '123456' }) {
  const user = {
    id: state.nextUserId++,
    name,
    email,
    role,
    telefono,
    fichaId,
    estado,
    programa,
    areaEncargada,
    fechaIngreso,
  }
  state.users.push(user)
  state.passwords[email] = password
  guardar()
  return user
}

export function updateUser({ id, name, email, role = null, fichaId = null, estado = null, programa = null, areaEncargada = null, fechaIngreso = null, telefono = null }) {
  const index = state.users.findIndex(u => u.id === Number(id))
  if (index === -1) return
  const current = state.users[index]
  if (current.email !== email) {
    const pass = state.passwords[current.email]
    delete state.passwords[current.email]
    state.passwords[email] = pass
  }
  state.users[index] = {
    ...current,
    name,
    email,
    role: role ?? current.role,
    fichaId: fichaId ?? current.fichaId,
    estado: estado ?? current.estado,
    programa: programa ?? current.programa,
    areaEncargada: areaEncargada ?? current.areaEncargada,
    fechaIngreso: fechaIngreso ?? current.fechaIngreso,
    telefono: telefono ?? current.telefono,
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

export function setUserActive(id, active) {
  const index = state.users.findIndex(u => u.id === Number(id))
  if (index !== -1) {
    state.users[index] = { ...state.users[index], estado: active ? 1 : 0 }
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

export function isUserActive(id) {
  return (findUserById(id)?.estado ?? 1) === 1
}

// ---------------------------------------------------------------- Fichas
export function getAllFichas() {
  return state.fichas
}

export function findFichaById(id) {
  return state.fichas.find(f => f.id === Number(id)) || null
}

export function findFichaByCodigo(codigo) {
  return state.fichas.find(f => f.codigo === (codigo || '').trim().toUpperCase()) || null
}

export function getActiveFichas() {
  return state.fichas.filter(f => f.estado === 'activo')
}

export function createFicha({ nombre, programa, instructorName, instructorId }) {
  const ficha = {
    id: state.nextFichaId++,
    codigo: generarCodigoFicha(),
    nombre,
    programa,
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

export function updateFicha({ id, nombre, programa, estado = null, instructorName = null, instructorId = null }) {
  const index = state.fichas.findIndex(f => f.id === Number(id))
  if (index !== -1) {
    state.fichas[index] = {
      ...state.fichas[index],
      nombre: nombre ?? state.fichas[index].nombre,
      programa: programa ?? state.fichas[index].programa,
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
  const index = state.fichas.findIndex(f => f.codigo === (codigo || '').trim().toUpperCase())
  if (index === -1) return null
  const ficha = state.fichas[index]
  if (ficha.estado === 'inactivo') return null
  if (!ficha.estudiantes.some(e => e.id === estudiante.id)) {
    state.fichas[index] = { ...ficha, estudiantes: [...ficha.estudiantes, estudiante], aprendices: ficha.aprendices + 1 }
  }
  return state.fichas[index]
}

export function getEstudiantesDeFicha(fichaId) {
  const directos = findFichaById(fichaId)?.estudiantes || []
  const asignados = state.users.filter(u => u.fichaId === Number(fichaId) && u.role === 'aprendiz')
  const ids = new Set()
  const result = []
  ;[...directos, ...asignados].forEach(u => {
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
  return state.proyectos.filter(p => p.studentId === Number(studentId))
}

export function getProjectsByInstructor(instructorId) {
  return state.proyectos.filter(p => p.instructorId === Number(instructorId))
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

export function updateProjectEstado(id, estado) {
  const index = state.proyectos.findIndex(p => p.id === Number(id))
  if (index !== -1) {
    state.proyectos[index] = { ...state.proyectos[index], estado, updatedAt: hoyFormato('dd/MM/yyyy') }
    guardar()
  }
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

export function findSimilarityById(id) {
  return state.similitudes.find(s => s.id === Number(id)) || null
}

export function getSimilaritiesByProject(projectId) {
  return state.similitudes.filter(s => s.projectId1 === Number(projectId) || s.projectId2 === Number(projectId))
}

export function updateSimilarityEstado(id, estado) {
  const index = state.similitudes.findIndex(s => s.id === Number(id))
  if (index !== -1) {
    state.similitudes[index] = { ...state.similitudes[index], estado }
    guardar()
  }
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

export function createBugReport({ titulo, descripcion, tipo, reporterId = null, reporterName, pasos = null }) {
  const report = {
    id: state.nextBugReportId++,
    titulo,
    descripcion,
    tipo,
    estado: 'pendiente',
    reporterId,
    reporterName,
    pasos,
    createdAt: hoyFormato('dd/MM/yyyy'),
  }
  state.bugReports.unshift(report)
  const admins = state.users.filter(u => u.role === 'admin' && u.estado === 1)
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

export function addObservacion(projectId, autor, texto) {
  const observacion = {
    id: state.nextObservacionId++,
    projectId: Number(projectId),
    autor,
    fecha: hoyFormato('d MMM yyyy'),
    texto,
  }
  state.observaciones.unshift(observacion)
  guardar()
  return observacion
}

export function removeObservacion(id) {
  state.observaciones = state.observaciones.filter(o => o.id !== Number(id))
  guardar()
}

export const constants = {
  ProjectStatus: {
    BORRADOR: 'borrador',
    PENDIENTE: 'pendiente',
    EN_REVISION: 'en_revision',
    APROBADO: 'aprobado',
    RECHAZADO: 'rechazado',
    REQUIERE_AJUSTES: 'requiere_ajustes',
    EN_PROGRESO: 'en_progreso',
    COMPLETADO: 'completado',
    CANCELADO: 'cancelado',
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
    SISTEMA: 'sistema',
    PROYECTO: 'proyecto',
    DATOS: 'datos',
    OTRO: 'otro',
  },
  SimilarityStatus: {
    PENDIENTE: 'pendiente',
    REVISADA: 'revisada',
    RESUELTA: 'resuelta',
  },
  NotificationType: {
    SIMILITUD: 'similitud',
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
  projectStatus: {
    borrador: 'Borrador',
    pendiente: 'Pendiente',
    en_revision: 'En Revisión',
    aprobado: 'Aprobado',
    rechazado: 'Rechazado',
    requiere_ajustes: 'Requiere Ajustes',
    en_progreso: 'En Progreso',
    completado: 'Completado',
    cancelado: 'Cancelado',
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
    sistema: 'Sistema',
    proyecto: 'Proyecto',
    datos: 'Datos',
    otro: 'Otro',
  },
  similarityStatus: {
    pendiente: 'Pendiente',
    revisada: 'Revisada',
    resuelta: 'Resuelta',
  },
  notificationType: {
    similitud: 'Similitud',
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
