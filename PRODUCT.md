# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Vite + Three.js (npm). Build estático (`npm run build`) que se sube a un hosting estático (Netlify / GitHub Pages / Vercel). Elegido por el usuario el 2026-11-17.

## Users

- **Andrius** (destinataria única): escritora; le gustan los libros, la música, pintar, escribir, la Navidad y Disney. Abre la web cada día del 1 al 24 de diciembre de 2026, sobre todo desde su **iPhone reciente** (iPhone 12 o posterior), a veces quizá desde un ordenador. Su tarea: abrir la puerta del día, disfrutar la sorpresa y volver a las anteriores.
- **El autor** (su pareja): rellena el contenido en un único archivo de configuración y prueba todo antes de enviarlo con un modo de pruebas.

## Product Purpose

Un calendario de Adviento digital hecho a mano como regalo de pareja. Cada día desbloquea una sorpresa distinta (cartas, vales canjeables, canciones, juegos, pistas para regalos físicos escondidos en casa, notas de voz, el gran final del día 24). Éxito: que a Andrius le haga ilusión abrirlo cada mañana y que se sienta algo único, hecho solo para ella; no una plantilla.

## Positioning

Es privado y personal: su nombre, sus motes («cabeza espinaca», «cerda», «Cirkewa»), vuestras fotos, vuestra voz y regalos reales escondidos en vuestra casa. Ningún otro calendario puede copiar eso.

## Operating Context

- Vivís juntos: los regalos físicos (cenas, masajes, cine…) se canjean en casa enseñando el vale.
- Presupuesto bajo: los regalos son sobre todo experiencias y detalles.
- Se abre por la mañana, normalmente con sonido; un día a día, con la fecha real.

## Capabilities and Constraints

- 24 días con apertura bloqueada por fecha real (diciembre 2026). Intentar abrir antes → respuesta burlona y cariñosa.
- Entrada con pregunta secreta la primera vez («¿De qué tienes cara?» → «Cirkewa»).
- Progreso guardado en el navegador (localStorage); «Mis vales» para canjear vales.
- Tipos de día existentes que deben seguir funcionando: carta, rasca, fotos, quiz, certificado, canción, pista, entrada, audio, regalo, pintar (adorno que se cuelga en el árbol) y final.
- Modo pruebas por URL (`?modo=pruebas`, `&fecha=`, `&saltar=1`, `&abrir=N`).
- Todo el contenido vive en un único archivo de configuración editable por el autor.
- Sonido sintetizado (WebAudio) con opción de silenciar.
- Debe ir fluido en iPhone reciente; tablet y PC también soportados.
- Idioma: español de España.

## Brand Commitments

- Tono: mezcla de romántico y divertido.
- Motivo binding pedido por el usuario: **pueblo navideño nevado** como mundo del calendario.
- Nivel de acabado pedido: estudio/agencia premium, 3D y animación cinematográfica; referencias dadas por el usuario: bruno-simon.com, motion.zajno.com, breakthroughenergy.org, hashgraphvc.com, steven.com/creator-tech, sakazuki.io, fromanother.love.
- Tipografía «más moderna y estilizada» (petición explícita del usuario).

## Evidence on Hand

- Contenido de ejemplo en `js/config.js` (cartas, vales, quiz, certificados).
- Fotos, vídeos y notas de voz: **pendientes** de que el autor los aporte (`assets/fotos/`, `assets/audio/`). No inventar fotos de la pareja.
- Firma del autor: pendiente (placeholder «Tu chico»).

## Product Principles

1. Es para una sola persona: cada detalle debe sentirse hecho para Andrius, no genérico.
2. La sorpresa diaria es el centro; todo lo demás la escenifica.
3. Fácil de rellenar para el autor: el contenido no se mezcla con el código.
4. El ritual importa: la espera hasta la fecha forma parte del juego.

## Accessibility & Inclusion

Respetar «reducir movimiento» del sistema; textos legibles; objetivos táctiles cómodos en móvil.
