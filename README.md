<div align="center">

# 🎮 gavilanbe POCKET

**Toda mi colección de juegos en cartuchos y disquetes. Elige uno, mételo en la consola y pulsa START.**

[![jugar](https://img.shields.io/badge/▶_abrir_la_colección-ff5b35?style=for-the-badge&labelColor=1c1a22)](https://gavilanbe.github.io/)

</div>

![gavilanbe POCKET](og.jpg)

Una sola página estática: los juegos viven en [`data.js`](data.js) y las miniaturas en
[`thumbs/`](thumbs/). La consola es 3D de verdad (three.js desde jsDelivr); el
resto es HTML, CSS y JavaScript sin build.

## Cómo funciona

- **La consola.** Una portátil original, *gavilanbe POCKET*, en 3D con luces y
  reflejos reales. Sigue al ratón, se gira arrastrando (por detrás lleva su
  pegatina) y sus botones funcionan: **A/START** juega, **B** mete un cartucho
  sorpresa, la **cruceta** cambia de cartucho y **SELECT** cambia el color de la
  carcasa (crema, carbón, cereza, kiwi o uva; se recuerda).
- **Los cartuchos.** Cada modelo es una **edición de plástico**: gris clásico
  (Opus 4.6), negro (Opus 4.7), oro (Opus 4.8), uva atómica translúcida
  (Fable 5), hielo (Fable 5.1), fosforito (Astra) y holográfico (Opus 5.5).
  En los translúcidos se ve la placa por dentro. La etiqueta se genera con la
  captura del juego.
- **Meterlo.** En el estuche, al tocar un cartucho sale volando de su ranura
  (que queda vacía: «en la consola»), baja por la ranura con un *clac*, se
  enciende el LED, arranca el logo pixelado y aparece la pantalla de título con
  PRESS START. El fondo toma el color del plástico. A veces hay **error de
  lectura** y toca **soplar el cartucho**.
- **Los disquetes.** Los juegos de terminal van en disquetes con la etiqueta
  escrita a mano, en un cajón. La consola «no lee disquetes» y enseña en su
  pantalla el `git clone`; el panel lo copia.
- **Sorpresa** (o `R`): el cartucho gira como una tragaperras cambiando de
  etiqueta hasta que se para en uno.
- Cartuchos destacados flotando junto a la consola (tócalos para meterlos),
  **cartucho del día** al entrar, pegatinas **NUEVO**, **WIP** y **✓ jugado**, barra
  de colección jugada, sonidos chiptune sintetizados, búsqueda sin tildes (`/`),
  filtros por formato y edición, enlaces directos (`#/invoca`), teclado
  (`←` `→`, `Enter`) y un código antiguo que desbloquea la **edición dorada**.
- En el móvil la colección va primero debajo de la consola y, al elegir un
  cartucho, la consola se abre a pantalla completa. Sin WebGL, se muestra la
  captura en plano. Respeta `prefers-reduced-motion`.

Tipografía: Bricolage Grotesque, DM Mono y Caveat.

La versión anterior (la consola horizontal y la tienda nocturna) sigue en
[`/classic/`](https://gavilanbe.github.io/classic/) y en la etiqueta git `arcade-v1`.

## Desarrollo

`node scripts/build.mjs` valida el JavaScript y copia lo publicable en `dist/`.
`npm ci && npm test` ejecuta las regresiones de la colección y de la versión clásica.

## Añadir un juego

1. Añade su entrada en `data.js` (orden alfabético por `name`):

```js
{
  "name": "mi-juego",                                   // slug del repo
  "title": "🎮 MI JUEGO",                               // con su emoji
  "tagline": "Una frase con gancho.",
  "type": "web",                                        // "web" | "terminal"
  "play": "https://gavilanbe.github.io/mi-juego/",      // vacío si es terminal
  "repo": "https://github.com/gavilanbe/mi-juego",
  "thumb": "thumbs/mi-juego.jpg",                       // 640×400 (16:10)
  "wip": false,                                          // cinta adhesiva "WIP"
  "new": true,                                           // pegatina "NUEVO"
  "kind": "juego",
  "model": "astra"            // edición de plástico: "opus-5.5" | "astra" | "fable-5.1" | "fable" | "opus-4.8" | "opus-4.7" | "opus-4.6"
}
```

2. Deja su captura en `thumbs/mi-juego.jpg` (640×400).
3. Si es de los buenos, ponlo en la lista `FEATURED` de `index.html`: sale primero en el estuche y puede flotar junto a la consola. Un modelo nuevo funciona solo; para darle nombre de plástico y color añádelo a `EDITIONS` (y su material 3D en `editionMat`).
4. Quita el `"new": true` de la hornada anterior.

El cartucho **TRAZO** es de edición `astra` (plástico fosforito) y se publica en [gavilanbe.github.io/trazo/](https://gavilanbe.github.io/trazo/). Su código vive en [gavilanbe/trazo](https://github.com/gavilanbe/trazo).

El cartucho **NAGU & GAVI · El corazón de la selva** también es `astra`: [jugar](https://gavilanbe.github.io/nagu-gavi/) · [código](https://github.com/gavilanbe/nagu-gavi). Incluye intro con retratos parlantes, cinco semillas de sol y 36 plumas.

El cartucho **INVOCA** (ajedrez de bestias isométrico en micro pixel art) es de edición `fable-5.1` (hielo): [jugar](https://gavilanbe.github.io/invoca/) · [código](https://github.com/gavilanbe/invoca).
