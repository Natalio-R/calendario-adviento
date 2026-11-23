/* =========================================================
    ESTE ES EL ÚNICO ARCHIVO QUE TIENES QUE EDITAR
   ========================================================= */

window.CONFIG = {
  nombre: 'Andrius',
  firma: 'N.R',                      // ← cómo firmas tú
  anio: 2026,

  // Pregunta de entrada (solo la primera vez): elige la fecha en un taco de calendario
  pregunta: '¿Qué día nos conocimos?',
  conocimos: '2024-09-06',          // ← AAAA-MM-DD: el día que os conocisteis
  pistaLogin: 'Piensa en lo que llevabas puesto. Yo me acuerdo.',

  // Modo pruebas (solo con npm run dev / npm run movil; en la web publicada no existe):
  //   ?modo=pruebas                     → todo desbloqueado
  //   ?modo=pruebas&fecha=2026-12-05    → simula esa fecha
  claveSecreta: 'pruebas',

  // Música de fondo opcional (mp3). Si lo dejas vacío suena una caja de música generada.
  musica: '',

  // Motes. En cualquier texto puedes escribir {carino}, {picar} o {enfado} y sale uno al azar
  // de esa lista ({Carino}, {Picar}, {Enfado} con mayúscula si va al principio de la frase).
  motes: {
    carinosos: ['Mi vida', 'Amor', 'Mi trocito de mundo'],
    picar: ['Cabeza huevo', 'Cabeza espinaca', 'Cabesa', 'Ojitos juntos', 'Cerda'],
    enfadar: ['Imbesil'],
  },

  // Mensajes al intentar abrir una puerta antes de tiempo. {faltan} {dia} {nombre} + motes
  burlas: [
    'Quieta, {picar}. Esta puerta se abre dentro de {faltan}.',
    '{Carino}… el {dia} de diciembre. Ni un minuto antes.',
    '{Picar} impaciente. Faltan {faltan}.',
    'Que no, {enfado}. Faltan {faltan}.',
    'La puerta dice que no. Y yo estoy con la puerta.',
    'Hacer trampas no es de escritoras serias',
    'Te estoy viendo. El pueblo entero te está viendo',
    'Esto es un calendario, no una novela: no puedes saltar al final.',
    'Spoiler: no.',
    'Lo bueno se hace esperar. Yo, por ejemplo.',
  ],
};

/* ---------------------------------------------------------
   LAS 25 PUERTAS: la 0 (carta de bienvenida, se abre el 30 de noviembre) y del 1 al 24
   Tipos: carta · rasca · fotos · quiz · certificado · cancion
          pista · entrada · audio · regalo · pintar · final
   Si un día tiene "vale", se guarda en "Mis vales" al completarlo.
   --------------------------------------------------------- */

window.DAYS = {
  0: {   // la primera casa del camino: solo la carta de bienvenida
    tipo: 'carta',
    titulo: 'Bienvenida a tu pueblo',
    texto: `Andrius:

Bienvenida a tu pueblo. Lo he construido casa por casa, farola por farola, solo para ti.

A partir de mañana, cada día de diciembre se podrá abrir una puerta nueva, hasta Nochebuena. Detrás habrá cartas, juegos, canciones, vales que podrás cobrarme (sí, de verdad) y alguna que otra tontería, porque si no, no sería yo.

Cada puerta que abras encenderá una casa. Y el árbol de la plaza se irá iluminando contigo.

Una sola regla: nada de trampas, {picar}. Las puertas lo saben.

Te quiero. Más de lo que cabe en este pueblo.`,
  },

  1: {
    tipo: 'cancion',
    titulo: 'La primera que te pasé',
    cancion: 'LONDON',
    artista: 'EAZBOI, Antony Z y ALEGAREN',
    motivo: 'Fue la primera canción que te dije que escucharas, jeje. La primera de muchas.',
    enlace: 'https://open.spotify.com/search/LONDON%20EAZBOI%20Antony%20Z%20ALEGAREN',   // ← cámbialo por el enlace exacto si quieres
    color: '#2f4fb0',
  },

  2: {
    tipo: 'rasca',
    titulo: 'Rasca, rasca…',
    vale: 'Una cena que cocino yo',
    detalle: 'Tú eliges el menú. Yo me peleo con la cocina. Velas incluidas.',
    emoji: '',
  },

  3: {
    tipo: 'cancion',
    titulo: 'La primera que me pusiste',
    cancion: 'Aprender a quererte',
    artista: 'Morat',
    motivo: 'Morat es tu grupo favorito, y esta fue la primera canción que pusiste conmigo en el coche para enseñarme cuál era la que te gustaba.',
    enlace: 'https://open.spotify.com/search/Aprender%20a%20quererte%20Morat',   // ← cámbialo por el enlace exacto si quieres
    color: '#8e2c3a',
  },

  4: {
    tipo: 'certificado',
    titulo: 'Documento oficial',
    honor: 'Cabeza Espinaca Oficial del Reino',
    merito: 'Por su extraordinaria capacidad para ser adorable, testaruda y preciosa a la vez, y por tener una cabeza que, a ciertas horas, recuerda vagamente a una espinaca.',
    sello: 'APROBADO',
  },

  5: {
    tipo: 'fotos',
    titulo: 'Nuestro año en fotos',
    texto: 'Algunos de mis momentos favoritos contigo:',
    fotos: [
      { src: 'assets/fotos/01.jpg', texto: 'Aquí ya me tenías loco' },
      { src: 'assets/fotos/02.jpg', texto: 'Ese día que…' },
      { src: 'assets/fotos/03.jpg', texto: 'Mi foto favorita tuya' },
      { src: 'assets/fotos/04.jpg', texto: 'Cara de Cirkewa nivel máximo' },
      { src: 'assets/fotos/05.jpg', texto: 'Y los que nos quedan' },
    ],
  },

  6: {
    tipo: 'pista',
    titulo: 'Busca y encontrarás',
    acertijo: `Donde descansan tus sueños
y tu pelo hace un nido,
mira bien por debajo:
algo te he escondido.`,
    respuestas: ['almohada', 'cojin', 'cama'],
    revelado: 'Mira debajo de tu almohada',   // ← esconde ahí algo pequeño (una carta, un chocolate…)
  },

  7: {
    tipo: 'quiz',
    titulo: '¿Cuánto me conoces?',
    preguntas: [
      { p: '¿Qué fue lo primero que pensé al verte?', opciones: ['Qué guapa', 'Qué ilusión por una taza…', 'Tiene cara de llamarse Cirkewa'], correcta: 1, si: 'Exacto. Esa cara de ilusión no se me olvida.', no: 'Casi… pero no.' },
      { p: '¿Cuál es mi comida favorita?', opciones: ['Kebab', 'Pasta', 'Pizza'], correcta: 0 },   // ← 0 Kebab · 1 Pasta · 2 Pizza: pon la buena
      { p: '¿Quién se duerme antes viendo una peli?', opciones: ['Andrius', 'Nat', 'Los dos caemos redondos'], correcta: 0, si: 'Siempre tú. Siempre.', no: 'Mentirosa. Siempre eres tú.' },
      { p: '¿Qué haría yo con un día libre?', opciones: ['Trabajar', 'Estar con mi mujer', 'Las dos cosas'], correcta: 2 },
      { p: '¿Qué es lo que más me gusta de ti?', opciones: ['Tu risa', 'Cómo escribes', 'Todo'], correcta: 2, si: 'Pregunta trampa: era todo.', no: 'Error. Era todo.' },
    ],
    resultado: {
      alto: 'Sobresaliente. Me conoces mejor que yo.',
      medio: 'Aprobada. Con nota de cariño.',
      bajo: 'Suspenso… pero te dejo recuperar con besos.',
    },
  },

  8: {
    tipo: 'rasca',
    titulo: 'Otro rasca',
    vale: 'Un masaje de 20 minutos',
    detalle: 'Sin prisas, sin quejas, con aceite y todo.',
    emoji: '',
  },

  9: {
    tipo: 'carta',
    titulo: 'Lo que me gusta de verte escribir',
    texto: `Andrius:

Hay algo que no te digo lo suficiente: me encanta verte escribir.

Me gusta cómo te quedas mirando a la nada cuando una frase no te convence. Cómo te ilusionas con tus historias, con sus personajes, con lo que les va a pasar. Y luego vienes a contármelas y se te ve tan feliz que yo también lo soy.

Esa ilusión tuya es de mis cosas favoritas del mundo.

Tú te pasas el día haciéndote feliz con lo que creas. Así que ahora me toca a mí: hacerte feliz con algo que he hecho yo.

Sigue escribiendo. Yo seguiré escuchándote.`,
  },

  10: {
    tipo: 'cancion',
    titulo: 'Volumen al máximo',
    cancion: 'Pokeros Cayetanos',
    artista: 'Los Ruinas',
    motivo: 'La que ponemos siempre en el coche para cantar y bailar como locos. Prohibido escucharla sin bailar.',
    enlace: 'https://open.spotify.com/search/Pokeros%20Cayetanos%20Los%20Ruinas',   // ← cámbialo por el enlace exacto si quieres
    color: '#2f6b5a',
  },

  11: {
    tipo: 'entrada',
    titulo: 'Noche de cine',
    vale: 'Una noche de cine',
    emoji: '',
    evento: 'CINE',
    detalle: 'Tú eliges la peli. Yo pago las palomitas. Y no me quejo (prometido).',
    fila: '24',
    numero: 'Nº0016',
    asiento: 'Junto a mí',
    cuando: 'Tú decides',
  },

  12: {   // la librería del pueblo
    tipo: 'regalo',
    titulo: 'La librería',
    texto: 'Tarde de libros, chocolate y churros',
    detalle: 'Nos perdemos entre estanterías mirando libros y acabamos con chocolate caliente y churros. Y ojo: algún libro cae de regalo.',
    vale: 'Tarde de libros, churros y un libro de regalo',
    emoji: '',
    color: '#2f5d50',
  },

  13: {
    tipo: 'certificado',
    titulo: 'La cabesa más cabesa',
    honor: 'La Cabesa Más Cabesa del Reino',
    merito: 'Por su testarudez de récord: cuando algo se le mete en la cabesa, no hay quien se lo saque. Ni con argumentos, ni con pruebas, ni con churros. El jurado (yo) se rinde por unanimidad.',
    sello: 'CABESA',
  },

  14: {
    tipo: 'pintar',
    titulo: 'Tu adorno para el árbol',
    texto: 'Eres la artista de la casa. Pinta un adorno y cuélgalo en el árbol de la plaza: se quedará ahí para siempre.',
  },

  15: {
    tipo: 'rasca',
    titulo: 'El último rasca',
    vale: 'Desayuno en la cama',
    detalle: 'Zumo, tostadas y lo que pidas. Tú solo tienes que despertarte (bueno, ni eso).',
    emoji: '',
  },

  16: {
    tipo: 'cancion',
    titulo: 'Suena a ti',
    cancion: 'Tu y Yo',
    artista: 'Luani',
    motivo: 'Cada vez que la escucho me acuerdo de ti. No sé explicarlo mejor: suena a ti.',
    enlace: 'https://open.spotify.com/search/Tu%20y%20Yo%20Luani',   // ← cámbialo por el enlace exacto si quieres
    color: '#3f5f8f',
  },

  17: {
    tipo: 'quiz',
    titulo: 'Edición Disney',
    preguntas: [
      { p: '¿Cómo se llama el reno de Kristoff?', opciones: ['Olaf', 'Sven', 'Rodolfo'], correcta: 1 },
      { p: '¿Cuántos dálmatas hay en el título del clásico?', opciones: ['99', '101', '102'], correcta: 1 },
      { p: '¿Qué pierde Cenicienta a medianoche?', opciones: ['Un zapato de cristal', 'Una tiara', 'Un guante'], correcta: 0 },
      { p: '¿Qué flor marca el tiempo en La Bella y la Bestia?', opciones: ['Un tulipán', 'Una rosa', 'Una margarita'], correcta: 1 },
      { p: '¿Qué colecciona Ariel?', opciones: ['Conchas', 'Objetos humanos', 'Perlas'], correcta: 1 },
      { p: '¿Quién es la princesa más bonita?', opciones: ['Bella', 'Rapunzel', 'Tú, obviamente'], correcta: 2, si: 'Correcto. Era facilita.', no: 'Incorrecto. La respuesta era tú.' },
    ],
    resultado: {
      alto: 'Princesa Disney certificada',
      medio: 'Nada mal. Esta noche, peli Disney para repasar.',
      bajo: '¿Seguro que eres Andrius? Maratón Disney urgente.',
    },
  },

  18: {   // el castillito
    tipo: 'entrada',
    titulo: 'Función especial',
    vale: 'Maratón Disney con manta',
    emoji: '',
    evento: 'FUNCIÓN ESPECIAL',
    detalle: '3 pelis a tu elección, manta, palomitas y chocolate. Prohibido dormirse antes de la segunda.',
    fila: 'Sofá',
    numero: 'Nº0024',
    asiento: 'Abrazados',
    cuando: 'Este finde',
  },

  19: {
    tipo: 'audio',
    titulo: 'Una cosa que quería decirte',
    texto: 'Sube el volumen. Y no te rías (bueno, un poco sí).',
    src: 'assets/audio/dia19.mp3',
  },

  20: {
    tipo: 'cancion',
    titulo: 'Lo que tú sientes',
    cancion: 'Los columpios',
    artista: 'Lola Tunduri',
    motivo: 'Me dijiste que esta canción es lo que sientes por mí. Así que cada vez que suena, te escucho decírmelo.',
    enlace: 'https://open.spotify.com/search/Los%20columpios%20Lola%20Tunduri',   // ← cámbialo por el enlace exacto si quieres
    color: '#7a2e5c',
  },

  21: {
    tipo: 'regalo',
    titulo: 'Algo que te he guardado',
    texto: 'Un regalo que te tengo preparado',       // ← cámbialo cuando sepas qué es
    detalle: 'No te digo qué es. Solo que lo he elegido pensando en ti y que ya lo tengo escondido.',
    emoji: '',
    color: '#7a2e5c',
  },

  22: {
    tipo: 'regalo',
    titulo: '¿Qué habrá aquí dentro?',
    texto: 'Un día entero de plan sorpresa',
    detalle: 'Tú solo tienes que dejarte llevar. Yo me encargo de todo lo demás.',
    vale: 'Un día de plan sorpresa',
    emoji: '',
    color: '#525a8c',
  },

  23: {
    tipo: 'cancion',
    titulo: 'La vida que quiero contigo',
    cancion: 'Mi apodo',
    artista: 'Warma y RADE',
    motivo: 'Me recuerda mucho a la vida que quiero tener a tu lado. Pero no sin ti: es la vida que quiero cumplir contigo, y dártelo todo.',
    enlace: 'https://open.spotify.com/search/Mi%20apodo%20Warma%20RADE',   // ← cámbialo por el enlace exacto si quieres
    color: '#9a6a0c',
  },

  24: {   // el gran final
    tipo: 'final',
    titulo: 'Nochebuena',
    texto: `Andrius:

Lo has conseguido: 24 puertas, 24 días y un pueblo entero encendido solo para ti.

Mientras lo construía me di cuenta de algo: cada casa, cada farola y cada tontería que he escondido aquí venía del mismo sitio. De lo feliz que soy contigo.

Eres mi persona favorita. Mi vida, mi trocito de mundo, mi cabeza huevo, mi cerda preciosa. La chica que pinta, escribe, canta villancicos en octubre y llora con las pelis de Disney (no lo niegues).

Feliz Navidad, mi amor. Este es solo el primero de muchos pueblos.

Y ahora… queda una última cosa.`,
    regalo: {
      texto: 'Mira debajo del árbol',
      detalle: 'Tu último regalo no cabe en una pantalla. Ya lo verás debajo del árbol.',
      emoji: '',
      color: '#b8343c',
    },
  },
};

// (no hace falta tocar esto) Sustituye {carino} {picar} {enfado} por un mote al azar de su lista
window.conMotes = s => String(s).replace(/\{(carino|picar|enfado)\}/gi, (m, k) => {
  const l = (window.CONFIG.motes || {})[{ carino: 'carinosos', picar: 'picar', enfado: 'enfadar' }[k.toLowerCase()]] || [''];
  const v = l[Math.floor(Math.random() * l.length)];
  return k[0] === k[0].toUpperCase() ? v.charAt(0).toUpperCase() + v.slice(1) : v.charAt(0).toLowerCase() + v.slice(1);
});
