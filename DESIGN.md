---
name: Adviento de Andrius
description: Teatro de papel recortado en 3D; un pueblo nevado de capas de papel donde cada mañana una casa se enciende a contraluz.
colors:
  night: "#161b45"
  night-deep: "#0e1233"
  indigo2: "#232a66"
  indigo3: "#323b85"
  indigo4: "#454ea0"
  snow: "#f3f4f8"
  snow2: "#e3e7f3"
  ink: "#11142e"
  ink-soft: "#3a3f66"
  vermilion: "#e5392b"
  vermilion-deep: "#b5261b"
  pine: "#1e6a4e"
  pine2: "#164e3a"
  gold: "#f0b22e"
  gold-deep: "#9a6a0c"
  candle: "#ffcf6b"
typography:
  display:
    fontFamily: "Bricolage Grotesque Variable, Arial Narrow, sans-serif"
    fontSize: "clamp(2.6rem, 11.5vw, 7.2rem)"
    fontWeight: 800
    lineHeight: 0.9
    letterSpacing: "-0.02em"
    fontVariation: "'wdth' 75"
  name:
    fontFamily: "Instrument Serif, Times New Roman, serif"
    fontSize: "clamp(5.2rem, 27vw, 13rem)"
    fontWeight: 400
    lineHeight: 0.8
    letterSpacing: "-0.035em"
  numeral:
    fontFamily: "Bricolage Grotesque Variable, Arial Narrow, sans-serif"
    fontSize: "clamp(64px, 16vw, 96px)"
    fontWeight: 800
    lineHeight: 0.8
    letterSpacing: "-0.04em"
    fontFeature: "'tnum' 1"
    fontVariation: "'wdth' 75"
  headline:
    fontFamily: "Bricolage Grotesque Variable, Arial Narrow, sans-serif"
    fontSize: "clamp(28px, 7vw, 40px)"
    fontWeight: 800
    lineHeight: 0.92
    letterSpacing: "-0.01em"
    fontVariation: "'wdth' 75"
  title:
    fontFamily: "Bricolage Grotesque Variable, Arial Narrow, sans-serif"
    fontSize: "24px"
    fontWeight: 800
    lineHeight: 1
    fontVariation: "'wdth' 75"
  body:
    fontFamily: "Bricolage Grotesque Variable, Arial Narrow, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.55
  button:
    fontFamily: "Bricolage Grotesque Variable, Arial Narrow, sans-serif"
    fontSize: "16px"
    fontWeight: 800
    letterSpacing: "0.04em"
    fontVariation: "'wdth' 80"
  label:
    fontFamily: "Bricolage Grotesque Variable, Arial Narrow, sans-serif"
    fontSize: "13px"
    fontWeight: 700
    letterSpacing: "0.2em"
    fontVariation: "'wdth' 85"
  typed:
    fontFamily: "Special Elite, Courier New, monospace"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.75
  hand:
    fontFamily: "La Belle Aurore, cursive"
    fontSize: "30px"
    fontWeight: 400
rounded:
  paper: "2px"
  sheet: "3px"
  sheet-mobile: "6px"
  badge: "9px"
spacing:
  hairline: "2px"
  xs: "8px"
  sm: "10px"
  md: "14px"
  gutter: "16px"
  card: "22px"
components:
  button-paper:
    backgroundColor: "{colors.vermilion}"
    textColor: "{colors.snow}"
    typography: "{typography.button}"
    rounded: "{rounded.paper}"
    padding: "0 20px"
    height: "48px"
  button-paper-locked:
    backgroundColor: "{colors.indigo2}"
    textColor: "#b8bfe8"
    typography: "{typography.button}"
    rounded: "{rounded.paper}"
    padding: "0 20px"
    height: "48px"
  button-paper-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    padding: "0 20px"
    height: "48px"
  header-pennant:
    backgroundColor: "{colors.snow}"
    textColor: "{colors.ink}"
    width: "44px"
    height: "52px"
  day-tab:
    backgroundColor: "{colors.indigo2}"
    textColor: "#aeb6e6"
    rounded: "{rounded.sheet}"
    width: "46px"
    height: "58px"
  day-tab-available:
    backgroundColor: "{colors.snow}"
    textColor: "{colors.vermilion}"
  day-tab-opened:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.ink}"
  day-tab-today:
    backgroundColor: "{colors.vermilion}"
    textColor: "{colors.snow}"
  door-pull-tab:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.ink}"
    padding: "0 12px 0 20px"
    height: "40px"
  day-sheet:
    backgroundColor: "{colors.snow}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sheet}"
    padding: "{spacing.card}"
    width: "min(520px, 100%)"
  voucher-wallet-row:
    backgroundColor: "{colors.night}"
    textColor: "{colors.snow}"
    padding: "{spacing.md}"
---

# Design System: Adviento de Andrius

## Overview

**Creative North Star: "El teatro de papel a medianoche"**

Todo es papel recortado sobre un escenario: el pueblo nevado son capas de cartulina extruida en 3D real (Three.js), el telón es terciopelo bermellón pegado a la cámara y la interfaz son piezas de papel que se cuelgan, se tiran y se arrancan. La profundidad nunca es un efecto de pantalla; sale del solape de capas, del grosor del papel y de sombras proyectadas por una luna. La única luz que brilla es la de las velas detrás de las ventanas recortadas.

La densidad es baja y teatral: un escenario a pantalla completa, una tira de papel abajo y una hoja que se abre encima. Los gestos siguen el dedo 1:1 (cordón del telón, pestaña de la puerta, hoja inferior, polaroids, talón de la entrada) y el movimiento tiene peso de objeto físico. Rechaza la cuadrícula de 24 casillas, el mapa ilustrado con scroll y el cristal esmerilado.

**Key Characteristics:**
- Escena 3D de papel recortado: extrusiones finas, rake de escenario, perspectiva forzada, niebla índigo.
- Papel índigo de medianoche como suelo; blanco nieve como papel de lectura; bermellón, abeto y oro como tintas planas.
- Grano de papel (ruido SVG) sobre toda superficie de papel de la interfaz.
- Bricolage Grotesque estrecha y pesada en mayúsculas para todo lo que se lee como cartel; Instrument Serif cursiva solo para el nombre.
- Controles con silueta de papel: esquinas troqueladas, banderines colgantes, borde festoneado, pestañas con ojal.

## Colors

Tinta plana sobre papel de noche: un suelo índigo frío, papel nieve para leer y tres tintas saturadas con un papel cada una.

### Primary
- **Bermellón de telón** (vermilion): el telón de terciopelo, el botón principal «Abrir el día N», el día de hoy en la tira, los números grandes de día y los títulos de sorpresa. Es la tinta de acción.
- **Bermellón profundo** (vermilion-deep): fondo del documento mientras el telón está cerrado, mensajes de error y la firma manuscrita.

### Secondary
- **Pan de oro** (gold): título troquelado colgado de hilos, cordón, pestaña de la puerta, días ya abiertos, foco, sellos de goma y progreso. En 3D es metálico (metalness .75).
- **Oro viejo** (gold-deep): trazo del nudo del cordón.
- **Luz de vela** (candle): solo luz emitida. Ventanas, faroles, hilo de oro entre puertas y halo de la casa de hoy; en 3D se multiplica por 1.6-2.2 con toneMapped false para superar el umbral de bloom.

### Tertiary
- **Verde abeto** (pine / pine2): abetos alternando dos tonos por piso, coronas de puertas y respuesta correcta del quiz.

### Neutral
- **Papel índigo de medianoche** (night): cielo, niebla y fondo de escena; papel oscuro de pergamino, entradas y vales.
- **Noche profunda** (night-deep): reserva de fondo más oscuro; el velo de las hojas usa night-deep al 50%.
- **Índigos por capa** (indigo2, indigo3, indigo4): cordilleras de fondo de más cercana a más lejana (indigo4 → indigo2 hacia atrás) y estados bloqueados en la UI.
- **Nieve fría** (snow / snow2): papel de lectura (hojas, programa de mano, barra inferior, banderines) y bancos de nieve alternos.
- **Tinta** (ink / ink-soft): texto sobre nieve; ink-soft para texto secundario y pistas.

### Named Rules
**The Candle-Only Glow Rule.** El bloom tiene umbral 1.0 y solo la luz de vela (multiplicada, sin tone mapping) lo cruza. Ninguna superficie de papel brilla; si algo resplandece es porque hay una vela detrás.

**The One Ink Per Job Rule.** Bermellón actúa, oro marca lo ganado o lo que se tira, abeto confirma. No se intercambian.

## Typography

**Display Font:** Bricolage Grotesque Variable (con Arial Narrow, sans-serif)
**Name Font:** Instrument Serif cursiva (con Times New Roman, serif)
**Prop Faces:** Special Elite (máquina de escribir) y La Belle Aurore (manuscrita), solo dentro de objetos diegéticos.

**Character:** Una grotesca de cartel comprimida al 75-85% de anchura y en peso 800, como letras de imprenta de un programa de teatro, frente a una cursiva serif fina y enorme que solo dice «Andrius».

### Hierarchy
- **Display** (800, clamp(2.6rem, 11.5vw, 7.2rem), 0.9, wdth 75, mayúsculas): título troquelado en el telón.
- **Name** (cursiva 400, clamp(5.2rem, 27vw, 13rem), 0.8): «Andrius» cruzando el título; a 28px en la marca de cabecera, 56px en el certificado.
- **Numeral** (800, clamp(64px, 16vw, 96px), 0.8, cifras tabulares): número del día en la hoja; también 88-110px en funda de disco y marcador.
- **Headline** (800, clamp(28px, 7vw, 40px), 0.92, mayúsculas): título de la hoja del día y títulos de sorpresa (30-40px).
- **Title** (800, 24px, 1, mayúsculas): título del día en la barra de foco y números de la tira.
- **Body** (400, 17px, 1.55, text-wrap pretty): intro, porqués y cuerpo de sorpresas. Secundario a 14-15px en ink-soft.
- **Button** (800, 16px, 0.04em, wdth 80, mayúsculas): botones de papel.
- **Label** (700-800, 11-13px, 0.14-0.3em, mayúsculas): etiquetas de cordón, marca, entradas y sellos.

### Named Rules
**The Name Is Script Rule.** Instrument Serif cursiva se usa solo para el nombre de Andrius (y su inicial en el lacre). Nada más se escribe en cursiva serif.

**The Prop Face Rule.** Special Elite y La Belle Aurore solo aparecen dentro del objeto que las justifica (carta mecanografiada, firma, pie de polaroid, talón numerado). Nunca en interfaz.

## Layout

Un escenario fijo a pantalla completa (canvas WebGL) con la interfaz en capas por encima, sin scroll de documento. Arriba, una fila de banderines colgantes y el progreso; abajo, una barra de papel con borde festoneado que contiene la barra de foco y una tira horizontal de 24 pestañas con scroll-snap centrado. Las hojas de sorpresa se centran hasta 520px en escritorio y se convierten en hoja inferior a ancho completo por debajo de 720px. Márgenes laterales de 16px respetando safe-area en todos los bordes. Ritmo de espaciado corto (8, 10, 14, 16, 22px).

En la escena, las casas se reparten a lo largo de una calle sinuosa por longitud de arco igual, con escala de perspectiva forzada hacia el fondo, bancos de nieve festoneados por término, cordilleras índigo en tres planos y faroles intercalados.

## Elevation & Depth

Profundidad física, no tonal. En 3D: capas de papel extruido solapadas con sombras reales (PCF soft, luz de luna), niebla índigo de 30 a 75 unidades y NeutralToneMapping. En la interfaz: cada pieza de papel lleva una sombra de elevación con un filo de luz interior arriba, como el canto de una cartulina.

### Shadow Vocabulary
- **Lift** (`box-shadow: 0 1px 0 rgba(255,255,255,.25) inset, 0 6px 14px -4px rgba(6,8,30,.45), 0 2px 3px rgba(6,8,30,.25)`): papel apoyado; botones, pestañas, opciones de quiz.
- **Lift high** (`box-shadow: 0 1px 0 rgba(255,255,255,.3) inset, 0 14px 24px -8px rgba(6,8,30,.55), 0 3px 6px rgba(6,8,30,.3)`): papel levantado o suelto; hojas, programa de mano, polaroids, pestaña enfocada, toast.
- **Dock drop** (`filter: drop-shadow(0 -6px 14px rgba(6,8,30,.35))`): la barra inferior festoneada, porque la máscara recorta la box-shadow.

### Named Rules
**The Paper Has Thickness Rule.** Toda sombra es azul noche (rgb 6,8,30), nunca negra neutra, y siempre acompaña a un objeto de papel. Sin sombras decorativas sin objeto.

## Shapes

Esquinas casi rectas: papel cortado a 2-3px, hojas inferiores a 6px arriba. La forma se da por recorte, no por radio: clip-path con esquinas troqueladas a 8px en botones, banderín en V (polygon 0 0, 100% 0, 100% 80%, 50% 100%, 0 80%) en la cabecera, punta de flecha con ojal en la pestaña de la puerta, esquina doblada de 10px en opciones de quiz, borde festoneado por máscara radial (9px cada 18px) en la barra inferior y muescas semicirculares en vales. El círculo se reserva para objetos que son redondos: lacres, sellos, discos, muestras de color, botón de reproducir.

## Components

### Buttons
Piezas de papel troqueladas, firmes y planas.
- **Shape:** rectángulo con dos esquinas opuestas cortadas a 8px (paper 2px de radio debajo).
- **Primary:** bermellón con grano, texto nieve, 48px de alto, 0 20px de relleno, sombra lift.
- **Hover / Focus:** brightness 1.06 solo con puntero fino; foco con contorno oro de 2px a 3px de distancia. Presión: scale .97 en 140ms con ease-out.
- **Locked:** índigo2 con texto lavanda; **Ghost:** transparente con contorno interior tinta de 2px. **Link:** mayúsculas subrayadas 2px a 5px.

### Day Tabs (tira)
- **Style:** pestaña 46×58 con agujero de perforación arriba, número en Title tabular.
- **State:** cerrado índigo2; disponible nieve con número y filete bermellón; abierto oro; hoy bermellón con filete oro. Foco sube 6px con lift high.

### Header Pennants
Banderines nieve de 44px que cuelgan del borde superior (incluida la safe-area), icono SVG de trazo 1.75. Al pulsar se comprimen en scaleY .94 desde arriba. Contador de vales como insignia bermellón de 18px.

### Cards / Containers (hoja del día)
- **Corner Style:** 3px; 6px arriba como hoja inferior móvil.
- **Background:** nieve con grano; separador de cabecera de 2px en tinta.
- **Shadow Strategy:** lift high.
- **Internal Padding:** 22px.
- **Motion:** escritorio translateY 16px + scale .97 → reposo en 420ms; móvil sube desde abajo con ease-drawer en 520ms y se descarta arrastrando.

### Inputs / Fields
- **Style:** sin caja; solo línea inferior de 2px en tinta, 48px de alto, texto 600.
- **Focus:** la línea pasa a bermellón; cursor bermellón.
- **Error:** mensaje en bermellón profundo y sacudida horizontal de 450ms.

### Door Pull-Tab (firma)
Etiqueta oro con punta y ojal en tinta, anclada a la puerta de hoy en 3D; insinúa el tirón cada 2.6s y se arrastra 1:1. Bloqueada pasa a índigo3.

### Telón y título troquelado (firma)
Terciopelo físico bermellón con pliegues, galería y cenefa oro, pegado a la cámara. El título es texto extruido en oro colgado de hilos; al tirar del cordón sube a la tramoya, el telón se recoge y la cámara entra en el pueblo.

### Sellos de goma
Texto en mayúsculas con borde oro de 3px, girado ±10-12°, que cae desde scale 1.5-1.6 con ease-back. Uso: canjeado, ganado, admitido.

## Do's and Don'ts

### Do:
- **Do** cubrir toda superficie de papel de la interfaz con el grano (`var(--grain)`) sobre su color plano.
- **Do** usar ease-out (cubic-bezier(.23,1,.32,1)) para entradas y presión, ease-drawer (cubic-bezier(.32,.72,0,1)) para hojas y la barra inferior, ease-in-out (cubic-bezier(.77,0,.175,1)) para movimientos de objeto de ida y vuelta.
- **Do** reservar ease-back (cubic-bezier(.34,1.56,.64,1)) para sellos que caen y piezas que se sueltan tras arrastrarlas.
- **Do** hacer que todo gesto siga el dedo 1:1 y sea interrumpible.
- **Do** respetar prefers-reduced-motion: animaciones a 1ms y transiciones de hojas y paneles reducidas a opacidad en 200ms.
- **Do** dar a la luz de vela valores por encima de 1.0 sin tone mapping cuando deba brillar; todo lo demás queda bajo el umbral.

### Don't:
- **Don't** volver a la cuadrícula de 24 casillas ni al mapa ilustrado con scroll.
- **Don't** usar cristal esmerilado ni backdrop-filter; la profundidad es solape de papel.
- **Don't** usar Instrument Serif cursiva para nada que no sea el nombre de Andrius.
- **Don't** usar sombras negras neutras ni sombras sin un papel que las proyecte.
- **Don't** redondear rectángulos por encima de 6px; si una forma necesita carácter, se recorta.
- **Don't** dejar que una superficie de papel cruce el umbral de bloom.
