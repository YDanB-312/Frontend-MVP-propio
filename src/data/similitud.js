// Motor comparativo de propuestas — ProyecTwin.
//
// Compara el contenido real de dos propuestas (título, palabras clave,
// descripción, objetivos, tecnologías y área) con TF-IDF + similitud coseno,
// con normalización de español: tildes, sinónimos de dominio y stemming ligero.
//
// Es 100% local y sin dependencias: no envía datos de aprendices a terceros,
// no tiene costo y funciona sin conexión. Si a futuro el backend incorpora
// embeddings, este módulo es el punto único de reemplazo (misma firma).

// Palabras gramaticales sin carga temática. Las palabras genéricas de
// proyecto ("sistema", "plataforma") NO van aquí: las castiga el IDF solo.
const STOPWORDS_ES = new Set([
  'de', 'la', 'el', 'los', 'las', 'lo', 'un', 'una', 'unos', 'unas',
  'para', 'con', 'por', 'del', 'al', 'en', 'entre', 'hasta', 'desde',
  'sobre', 'tras', 'ante', 'bajo', 'hacia', 'segun',
  'que', 'cual', 'cuales', 'quien', 'quienes', 'cuyo', 'cuya', 'cuyos', 'cuyas',
  'este', 'esta', 'esto', 'estos', 'estas', 'ese', 'esa', 'eso', 'esos', 'esas',
  'aquel', 'aquella', 'aquello', 'mi', 'mis', 'tu', 'tus', 'su', 'sus',
  'nuestro', 'nuestra', 'nuestros', 'nuestras',
  'como', 'cuando', 'donde', 'porque', 'pues', 'pero', 'sino', 'aunque',
  'muy', 'mas', 'tan', 'tanto', 'asi', 'tambien', 'tampoco', 'solo', 'quizas',
  'hay', 'han', 'son', 'es', 'ser', 'sea', 'sean', 'fue', 'fueron',
  'tiene', 'tienen', 'tener', 'hace', 'hacen', 'hacer', 'permite', 'permiten', 'permitir',
  'cada', 'todo', 'toda', 'todos', 'todas', 'otro', 'otra', 'otros', 'otras',
  'mismo', 'misma', 'mismos', 'mismas', 'través', 'traves',
  'sus', 'les', 'nos', 'las', 'los', 'ello', 'ellos', 'ellas',
  'fin', 'mediante', 'forma', 'manera', 'caso', 'casos', 'vez', 'veces',
])

// Sinónimos de dominio SENA/proyectos. Claves y valores en minúsculas sin
// tildes; las claves ya vienen con stemming aplicado (ver stemEs).
// Un valor puede expandir a varios tokens separados por espacio.
const SINONIMOS = {
  app: 'sistema',
  apps: 'sistema',
  aplicativo: 'sistema',
  aplicacion: 'sistema',
  plataforma: 'sistema',
  software: 'sistema',
  tienda: 'comercio',
  ecommerce: 'comercio electronico',
  commerce: 'comercio electronico',
  online: 'linea',
  sitio: 'web',
  pagina: 'web',
  paginas: 'web',
  movil: 'movil',
  mobile: 'movil',
  celular: 'movil',
  artesano: 'artesania',
  comercializ: 'comercio',
  comercializa: 'comercio',
  comercial: 'comercio',
  vend: 'venta',
  vendedor: 'venta',
  expendio: 'venta',
  seguimiento: 'monitoreo',
  supervision: 'monitoreo',
  vigilancia: 'monitoreo',
  rastreo: 'monitoreo',
  administracion: 'gestion',
  administrar: 'gestion',
  stock: 'inventario',
  existencias: 'inventario',
  cultivo: 'agricultura',
  agricola: 'agricultura',
  agropecuario: 'agricultura',
  cosecha: 'agricultura',
  riego: 'agricultura',
  medico: 'salud',
  clinica: 'salud',
  hospital: 'salud',
  paciente: 'salud',
  elearning: 'aprendizaje',
  tutoria: 'aprendizaje',
  tutor: 'aprendizaje',
  reserva: 'reserva',
  cita: 'reserva',
}

// Stemming ligero de español: recorta sufijos flexivos comunes con guardas
// de longitud para no destrozar raíces cortas. Se aplica igual a todo el
// corpus y a la consulta, así que lo importante es la consistencia.
export function stemEs(palabra) {
  let w = String(palabra || '')
  if (w.length <= 3) return w
  if (w.length > 7 && w.endsWith('mente')) w = w.slice(0, -5)
  if (w.length > 6 && (w.endsWith('ando') || w.endsWith('iendo'))) {
    w = w.slice(0, -4)
  } else if (w.length > 5 && (w.endsWith('ado') || w.endsWith('ido') || w.endsWith('ada') || w.endsWith('ida'))) {
    w = w.slice(0, -3)
  }
  if (w.length > 6 && (w.endsWith('ciones') || w.endsWith('siones'))) {
    w = w.slice(0, -5)
  }
  if (w.length > 5 && (w.endsWith('ar') || w.endsWith('er') || w.endsWith('ir'))) {
    w = w.slice(0, -2)
  }
  if (w.length > 4 && w.endsWith('es')) {
    w = w.slice(0, -2)
  } else if (w.length > 4 && w.endsWith('s')) {
    w = w.slice(0, -1)
  }
  return w
}

function normalizar(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9ñ]+/)
}

// Tokeniza un fragmento: normaliza, filtra ruido, aplica stemming y expande
// sinónimos. Devuelve la lista de tokens (con repeticiones para el TF).
export function tokenizar(texto) {
  const tokens = []
  for (const crudo of normalizar(texto)) {
    if (!crudo || crudo.length <= 2 || STOPWORDS_ES.has(crudo)) continue
    const raiz = stemEs(crudo)
    if (!raiz || raiz.length <= 2 || STOPWORDS_ES.has(raiz)) continue
    const canonico = SINONIMOS[raiz]
    if (canonico) {
      for (const t of canonico.split(' ')) {
        if (t && t.length > 2 && !STOPWORDS_ES.has(t)) tokens.push(t)
      }
    } else {
      tokens.push(raiz)
    }
  }
  return tokens
}

// Peso por campo: el título y las palabras clave concentran el tema;
// la descripción y los objetivos aportan el vocabulario de fondo.
const PESO_CAMPOS = [
  ['title', 3],
  ['keywords', 3],
  ['objetivoGeneral', 2],
  ['objetivosEspecificos', 2],
  ['technologies', 2],
  ['areaAplicacion', 2],
  ['description', 1],
  ['deliverables', 1],
]

// Vector TF ponderado de una propuesta: Map token -> peso acumulado.
export function vectorDeProyecto(proyecto) {
  const vec = new Map()
  if (!proyecto) return vec
  for (const [campo, peso] of PESO_CAMPOS) {
    for (const t of tokenizar(proyecto[campo])) {
      vec.set(t, (vec.get(t) || 0) + peso)
    }
  }
  return vec
}

// IDF suavizado sobre los vectores del corpus del programa.
// Términos omnipresentes ("sistema", "datos") tienden a 1; los distintivos pesan más.
export function construirIdf(vectores) {
  const df = new Map()
  for (const vec of vectores) {
    for (const t of vec.keys()) df.set(t, (df.get(t) || 0) + 1)
  }
  const n = Math.max(vectores.length, 1)
  const idf = new Map()
  for (const [t, f] of df) idf.set(t, Math.log((n + 1) / (f + 1)) + 1)
  return idf
}

// Coseno entre vectores TF-IDF. 1 = idénticos, 0 = sin nada en común.
export function similitudEntre(vecA, vecB, idf) {
  if (!vecA?.size || !vecB?.size) return 0
  const [corto, largo] = vecA.size <= vecB.size ? [vecA, vecB] : [vecB, vecA]
  let punto = 0
  let normaA = 0
  let normaB = 0
  for (const [t, w] of vecA) {
    const idfT = idf?.get(t) ?? 1
    normaA += (w * idfT) ** 2
  }
  for (const [t, w] of vecB) {
    const idfT = idf?.get(t) ?? 1
    normaB += (w * idfT) ** 2
  }
  if (!normaA || !normaB) return 0
  for (const [t, w] of corto) {
    const otro = largo.get(t)
    if (otro == null) continue
    const idfT = idf?.get(t) ?? 1
    punto += w * otro * idfT * idfT
  }
  return punto / (Math.sqrt(normaA) * Math.sqrt(normaB))
}

// Atajo para un par de propuestas con su corpus (para IDF).
export function similitudProyectos(a, b, corpus = []) {
  const vecA = vectorDeProyecto(a)
  const vecB = vectorDeProyecto(b)
  const idf = construirIdf([vecA, vecB, ...corpus.map(vectorDeProyecto)])
  return similitudEntre(vecA, vecB, idf)
}
