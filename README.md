# Calendario de adviento

Una bola de nieve en 3D con 25 puertas: la 0 (carta de bienvenida, 30 de noviembre) y del 1 al 24 de diciembre. Hecho con Vite y Three.js.

## Requisitos

Node 18 o superior.

## Comandos

```bash
npm install       # una vez, instala dependencias
npm run dev       # servidor local: http://localhost:5173
npm run movil     # igual pero con HTTPS, para probar en el móvil (sensores de agitar)
npm run build     # genera la web en dist/
npm run preview   # sirve dist/ para comprobar la versión final
```

`npm run movil`: abre en el móvil la dirección `https://192.168.x.x:5173` que salga en la terminal y acepta el aviso del certificado (es casero).

### Modo pruebas (solo en local)

- `?modo=pruebas` → todo desbloqueado
- `?modo=pruebas&fecha=2026-12-05` → simula esa fecha
- `&saltar=1` salta el telón · `&abrir=7` abre directamente ese día

En la web publicada el modo pruebas no existe: nadie puede saltarse las fechas con la URL.

## Contenido

Todo el contenido se edita en [`src/config.js`](src/config.js): nombre, firma, fecha de la pregunta de entrada, motes, burlas y las 25 puertas.

- Fotos: `public/assets/fotos/` (por ejemplo `01.jpg`).
- Audios: `public/assets/audio/` (por ejemplo `dia19.mp3`).

## Publicar (Netlify)

El repositorio incluye `netlify.toml`: Netlify ejecuta `npm run build` y publica `dist/` con cabeceras de seguridad. Basta con conectar el repositorio en Netlify.

## Privacidad

Es una web estática: todo el contenido (cartas, respuesta de la pregunta de entrada, fotos) viaja dentro de la página y cualquiera con el enlace podría leerlo inspeccionando el código. Mantén el repositorio **privado** y comparte el enlace solo con quien quieras.
