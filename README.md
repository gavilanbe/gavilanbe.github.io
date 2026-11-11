<div align="center">

# 🎮 gavilanbe POCKET

**El catálogo de todos mis juegos: cada uno, en un cartucho del color del modelo que lo hizo. Elige uno, mételo en la consola y pulsa START.**

[![jugar](https://img.shields.io/badge/▶_abrir_la_colección-ff5b35?style=for-the-badge&labelColor=1c1a22)](https://gavilanbe.github.io/)

</div>

![gavilanbe POCKET](og.jpg)

Una página estática sin build: los juegos viven en [`data.js`](data.js), las ediciones de plástico
en [`editions.js`](editions.js), la interfaz en [`app.js`](app.js) y la consola 3D en
[`stage.js`](stage.js) (three.js empaquetado en [`lib/`](lib/) con solo lo que usa).

## Cómo funciona

- **El catálogo.** A la izquierda, papel: titular, buscador y un estante por modelo (lo más reciente,
  primero). Cada juego es un **cartucho del color de su modelo**, y no es un dibujo: es un render 3D
  horneado (`carts/<slug>.webp`) con el mismo modelo y la misma luz que la consola, con su captura,
  su título y el sello del modelo en la etiqueta. Los juegos de terminal llevan la banda `>_ TERMINAL`.
- **El plató.** A la derecha, siempre a la vista, la **gavilanbe POCKET** en 3D con luz de estudio
  sobre el color de la edición del juego que tiene dentro. Al elegir un cartucho, **sale volando de
  su hueco, gira y entra por la boca de la consola**; el que estaba dentro vuelve a su sitio en el
  estante. La consola da un respingo, se enciende el LED y la pantalla arranca.
- **La pantalla** es un LCD de 160×100 pintado a resolución nativa: arranque con el logo, carátula
  del juego y `START` parpadeando. En los juegos de terminal teclea el `git clone`.
- **START** (el botón grande, `↵`, o el botón A o la pantalla de la propia consola) mete la cámara
  en la pantalla y abre el juego. En los de terminal copia el comando.
- **La consola se toca**: se inclina hacia el cursor, se arrastra para girarla, la cruceta cambia de
  cartucho, B saca uno al azar y SELECT cambia la carcasa (cinco colores).
- **En el móvil** el plató es la portada; al tocar un cartucho sube a pantalla completa y, al
  cerrarlo, queda una barra con lo que hay en la consola.
- **Enlace directo**: `https://gavilanbe.github.io/#<slug>` abre con ese cartucho puesto.
- Sin WebGL, en el sitio de la consola queda la foto del cartucho y todo lo demás funciona igual.

Las versiones anteriores siguen en las etiquetas git `pocket-v8` (la consola con cinta de cartuchos,
estuches y álbum de cromos) y anteriores; la primera, en [`/classic/`](https://gavilanbe.github.io/classic/).

## Desarrollo

Para verla en local basta un servidor estático: `python3 -m http.server 4391` y abrir
`http://127.0.0.1:4391/`.

- `npm ci && npm test`: regresiones sin navegador (datos, miniaturas, cartuchos horneados, ediciones,
  ids, fuentes y que `lib/` exporte lo que usa el plató) y las de la versión clásica.
- `npm run smoke`: prueba en un Chromium de verdad (Playwright), en escritorio y móvil: carga, mete
  un cartucho, pulsa START, filtra y busca. Con `-- --shots` deja capturas en `dist/smoke/`.
  La primera vez: `npx playwright install chromium`.
- `npm run carts`: hornea los cartuchos nuevos o cambiados (`-- --all` para todos, obligado si se
  toca el modelo 3D, la etiqueta o `editions.js`).
- `npm run thumbs`: miniaturas pequeñas (`thumbs/s/*.webp`, 320×200); necesita ImageMagick.
- `npm run vendor`: vuelve a empaquetar three.js si `stage.js` usa algo nuevo de `THREE`.
- `npm run build`: valida y copia lo publicable en `dist/` (opcional; Pages sirve la raíz tal cual).

## Añadir un juego

1. Añade su entrada en `data.js` (orden alfabético por `name`):

```js
{
  "name": "mi-juego",                                   // slug del repo
  "title": "🎮 MI JUEGO · Un subtítulo",                // emoji, título y, si quieres, subtítulo tras « · »
  "tagline": "Una frase con gancho.",
  "type": "web",                                        // "web" | "terminal"
  "play": "https://gavilanbe.github.io/mi-juego/",      // vacío si es terminal
  "repo": "https://github.com/gavilanbe/mi-juego",
  "thumb": "thumbs/mi-juego.jpg",                       // 640×400 (16:10)
  "wip": false,                                          // cinta «WIP» en la etiqueta
  "new": true,                                           // pegatina «NUEVO»; sale puesto en la consola
  "kind": "juego",
  "model": "fable-5.2",                                  // una clave de editions.js
  "also": {"model": "opus-5.5", "note": "con"}           // opcional: un segundo modelo
}
```

2. Deja su captura en `thumbs/mi-juego.jpg` (640×400) y ejecuta `npm run thumbs && npm run carts`.
3. Quita el `"new": true` de la hornada anterior (y `npm run carts` rehace sus etiquetas).
4. `npm test`, commit y push a `main`.

**Un modelo nuevo** es una línea en `EDITIONS` de [`editions.js`](editions.js): nombre, color del
plástico, color del plató, tinta y material (`rough`, `coat`, `metal`, `irid` para iridiscente,
`opacity` + `board` para translúcido). Va arriba del todo si es el más reciente. Después,
`npm run carts -- --all`.

El cartucho **TRAZO** es de edición `astra` (plástico fosforito) y se publica en [gavilanbe.github.io/trazo/](https://gavilanbe.github.io/trazo/). Su código vive en [gavilanbe/trazo](https://github.com/gavilanbe/trazo).

El cartucho **NAGU & GAVI · El corazón de la selva** también es `astra`: [jugar](https://gavilanbe.github.io/nagu-gavi/) · [código](https://github.com/gavilanbe/nagu-gavi). Incluye intro con retratos parlantes, cinco semillas de sol y 36 plumas.

El cartucho **INVOCA** (ajedrez de bestias isométrico en micro pixel art) es de edición `fable-5.1` (hielo): [jugar](https://gavilanbe.github.io/invoca/) · [código](https://github.com/gavilanbe/invoca).

El cartucho **CEBA** (aventura 3D tipo Ocarina de una cebolla dulce, con arte estilo picoCAD) estrena la edición `fable-5.2` (coral): [jugar](https://gavilanbe.github.io/ceba/) · [código](https://github.com/gavilanbe/ceba).
