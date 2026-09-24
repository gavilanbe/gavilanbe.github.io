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

- **El plató.** Toda la portada es un estudio fotográfico 3D infinito (three.js):
  sombras suaves reales, niebla, brillo (bloom) en pantallas y LEDs, y el color del
  estudio cambia con el plástico del cartucho que miras.
- **La cinta expositora.** Todos los cartuchos en 3D sobre una peana. Se gira
  arrastrando, con `←` `→`, con las flechas o con la cruceta de la consola; el
  enfocado se levanta bajo un foco. **Trasera** le da la vuelta: sinopsis y código
  de barras. Donde estaba el cartucho que está en la consola queda su contorno.
- **La consola.** *gavilanbe POCKET*: botones que se hunden (también cuando pulsas
  el teclado o un **mando real**), interruptor de encendido, rueda de volumen,
  pegatina detrás (arrástrala para girarla) y seis carcasas (**SELECT** o `S`).
  **A/START** juega, **B** es sorpresa.
- **Meter un cartucho.** Sale volando de la cinta, gira, baja por la ranura con
  un *clac*, la consola rebota, saltan chispas, sube el interruptor, se enciende
  el LED y arranca el logo pixelado hasta la pantalla de título. El anterior
  vuelve solo a su hueco. A veces hay **error de lectura**: sopla con el botón… o
  **soplando de verdad al micrófono**.
- **START.** La cámara **se mete dentro de la pantalla**, destello y el juego se
  abre en esta pestaña. Al volver atrás, la cámara sale y la consola te recibe con
  «¡HAS VUELTO! +1 PEGATINA». (↗ lo abre en otra pestaña.)
- **Los disquetes.** Los juegos de terminal van en disquetes escritos a mano. La
  cámara viaja por la cinta hasta un **ordenador retro** en su escritorio: el
  disquete entra en la disquetera (*ka-chunk* y ruido de cabezal) y el monitor
  teclea el `git clone`, que se copia con un clic.
- **Sorpresa** (`R` o **B**): el cartucho gira delante de la pantalla como una
  tragaperras cambiando de etiqueta hasta pararse.
- **La revista.** Debajo, el catálogo es una revista retro: portada con número y
  fecha, fichas en mosaico (las novedades y destacados a doble tamaño), el cartucho
  que asoma al pasar el ratón, trama de puntos, «El rincón del PC», búsqueda sin
  tildes (`/`) y filtros por formato y edición. Una cinta de novedades la cruza.
- **Álbum de pegatinas.** Cada juego que arrancas te deja su pegatina.
- Precarga con el logo pixelado que se encoge hasta convertirse en la pantalla de
  la consola, **música chiptune** de menú (opcional), efectos sintetizados,
  «continuar donde lo dejaste», enlaces directos (`#/invoca`) y un código antiguo
  que desbloquea la **edición dorada**.
- En el móvil la consola va arriba, la cinta en medio y el panel abajo. Sin WebGL
  se muestra la captura en plano. Respeta `prefers-reduced-motion`.

Tipografía: Bricolage Grotesque, DM Mono, Silkscreen y Caveat. La interfaz vive en
`index.html` y el plató en [`pocket3d.js`](pocket3d.js).

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
3. Si es de los buenos, ponlo en la lista `FEATURED` de `index.html`: sale antes en la cinta y a doble tamaño en la revista. Un modelo nuevo funciona solo; para darle nombre de plástico y color de plató añádelo a `EDITIONS` (`index.html`) y su material 3D a `edMat` (`pocket3d.js`).
4. Quita el `"new": true` de la hornada anterior.

El cartucho **TRAZO** es de edición `astra` (plástico fosforito) y se publica en [gavilanbe.github.io/trazo/](https://gavilanbe.github.io/trazo/). Su código vive en [gavilanbe/trazo](https://github.com/gavilanbe/trazo).

El cartucho **NAGU & GAVI · El corazón de la selva** también es `astra`: [jugar](https://gavilanbe.github.io/nagu-gavi/) · [código](https://github.com/gavilanbe/nagu-gavi). Incluye intro con retratos parlantes, cinco semillas de sol y 36 plumas.

El cartucho **INVOCA** (ajedrez de bestias isométrico en micro pixel art) es de edición `fable-5.1` (hielo): [jugar](https://gavilanbe.github.io/invoca/) · [código](https://github.com/gavilanbe/invoca).
