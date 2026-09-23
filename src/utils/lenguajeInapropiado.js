// Filtro de nombre al reservar — la lista de palabras la definió Enzo
// (garabatos/insultos chilenos + genéricos en español). Acá vive el CÓMO se
// compara: normaliza el texto (sin tildes, minúsculas, corrige "leet speak"
// tipo "c0ncha" o "put@") y busca por RAÍZ, no por la palabra tal cual —
// "tula" agarra también "tulita"/"tulon"/"tuloncitos", "pichula" agarra
// "pichulita"/"pichulon", sin necesidad de que Enzo escriba cada variante a
// mano en la lista.
//
// La raíz es la palabra sin su vocal final (a/e/o) — "tula" -> "tul",
// "pichula" -> "pichul" — y se exige que alguna palabra completa del nombre
// EMPIECE con esa raíz (no que la CONTENGA en cualquier parte): así
// "Virgilio" sigue libre (no empieza con "gil", esas letras están en el
// medio) pero "Gilberto" sí quedaría bloqueado por empezar con "gil" — un
// nombre real menos común que decidimos igual bloquear porque Enzo pidió
// explícitamente que no se escape nada. Si alguna raíz quedara muy corta
// (2 letras o menos, ej. "peo" -> "pe", que chocaría con "Pedro"/"Perez"),
// no se acorta — se usa la palabra completa para no reventar apellidos
// comunes por accidente.
//
// Además, las raíces de 5 letras o más también se buscan ya pegadas (sin
// espacios) en cualquier parte del nombre completo — agarra a quien separa
// las letras a propósito para saltarse el filtro ("c u l i a o"). Las
// raíces cortas no se buscan así (solo como inicio de palabra) porque ahí
// sí es donde vive el riesgo real de romper un nombre común.
const LISTA_BLOQUEADA = [
  'culiao',
  'aweonao',
  'puto',
  'homosexual',
  'conchetumare',
  'ctm',
  'csm',
  'tula',
  'pene',
  'vagina',
  'zorra',
  'puta',
  'putita',
  'putito',
  'culia',
  'culiado',
  'culiada',
  'chucha',
  'cagada',
  'caga',
  'cagar',
  'poto',
  'peo',
  'gay',
  'weon',
  'weona',
  'reconchetumadre',
  'conchetumadre',
  'pico',
  'pico en el ojo',
  'chupa pico',
  'tulon',
  'tulona',
  'maricon',
  'perkin',
  'perquin',
  'bastardo',
  'bastarda',
  'barsa',
  'cuma',
  'flaite',
  'longi',
  'gil',
  'gila',
  'puta la wea',
  'mierda',
  'webeo',
  'webea',
  'webeame',
  'torpe',
  'hijo de puta',
  'hija de puta',
  'pichula',
  'hoyo',
  'orto',
  'maricona',
  'patudo',
  'pajaron',
  'pajarona',
  'sapo',
  'hocicon',
  'sapa',
  'hocicona',
  // Sumadas después, investigando jerga/garabatos chilenos (a pedido de
  // Enzo, "inclusive los que dices que no ya que igual es considerado una
  // burla") — ver bitácora para las fuentes.
  'guacho',
  'huacho',
  'pendejo',
  'maraco',
  'charcha',
  'chochera',
  'pija',
  'cipote',
  'manguaco',
  'pajarito',
  'chota',
  'coño',
  'chirla',
  'cresta',
  'ql',
  'qlo',
  'wn',
  'wea',
  'pato',
  'gato',
  'choro',
  'fome',
  'cuatico',
  'jote',
  'guey',
  'pituco',
  'cuico',
  'roto',
]

// Largo mínimo de una raíz para buscarla también pegada en cualquier parte
// del nombre (no solo al inicio de una palabra) — por debajo de esto, el
// riesgo de chocar con un nombre real de casualidad es demasiado alto.
const LARGO_MINIMO_RAIZ_LIBRE = 5

// Nunca se acorta una raíz a menos de esto — "peo" perdería su "o" y
// quedaría en "pe" (2 letras), que es el inicio de "Pedro", "Perez",
// "Peña"... casi cualquier nombre empezado en "Pe".
const LARGO_MINIMO_RAIZ = 3

// Mecanismo para tratar una palabra puntual SOLO como coincidencia exacta
// (sin extenderla a variantes con sufijo) — hoy vacío a pedido de Enzo: se
// detectaron 3 choques reales ("pene" -> "pen" agarraba "Peña"/
// "Peñailillo"; "coño" -> "con" agarraba "Constanza"/"Consuelo"/
// "Contreras"; "pato" -> "pat" agarraba el nombre "Patricio"/"Patricia"
// entero, no solo el apodo "Pato") y se decidió priorizar que no se escape
// ningún garabato por sobre esos nombres reales — bloquear de más es
// preferible a dejar pasar algo. Queda el mecanismo por si en el futuro
// aparece un choque que sí convenga tratar así.
const SOLO_COINCIDENCIA_EXACTA = new Set()

const SUSTITUCIONES_LEET = {
  0: 'o',
  1: 'i',
  3: 'e',
  4: 'a',
  5: 's',
  7: 't',
  '@': 'a',
  $: 's',
  '|': 'i',
}

// Minúsculas, sin tildes, con los reemplazos de "leet speak" ya hechos, y
// las letras repetidas seguidas colapsadas a una sola ("weeeon" -> "weon",
// "puutoo" -> "puto") — nada en la lista bloqueada tiene letras dobles
// intencionales, así que esto no rompe ninguna coincidencia real.
function normalizarBase(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split('')
    .map((c) => SUSTITUCIONES_LEET[c] ?? c)
    .join('')
    .replace(/(.)\1+/g, '$1')
}

function palabrasDe(texto) {
  return normalizarBase(texto)
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

function sinEspaciosDe(texto) {
  return normalizarBase(texto).replace(/[^a-z]/g, '')
}

// Saca la vocal final para enganchar diminutivos/aumentativos pegados a la
// raíz — pero nunca la deja más corta que LARGO_MINIMO_RAIZ (ver arriba).
function raizDe(palabraNormalizada) {
  const sinVocalFinal = palabraNormalizada.replace(/[aeo]$/, '')
  return sinVocalFinal.length >= LARGO_MINIMO_RAIZ ? sinVocalFinal : palabraNormalizada
}

export function nombreTieneLenguajeInapropiado(nombre) {
  if (!nombre) return false
  const palabras = palabrasDe(nombre)
  const pegado = sinEspaciosDe(nombre)

  return LISTA_BLOQUEADA.some((entrada) => {
    const normalizada = normalizarBase(entrada)
    if (normalizada.includes(' ')) {
      return pegado.includes(normalizada.replace(/\s+/g, ''))
    }
    if (SOLO_COINCIDENCIA_EXACTA.has(normalizada)) {
      return palabras.includes(normalizada)
    }
    const raiz = raizDe(normalizada)
    if (palabras.some((palabra) => palabra.startsWith(raiz))) return true
    return raiz.length >= LARGO_MINIMO_RAIZ_LIBRE && pegado.includes(raiz)
  })
}
