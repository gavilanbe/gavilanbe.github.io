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

- **El cargador**: sol de rayos giratorio, el logo letra a letra en colores que caen y rebotan, un gavilán pixelado que cruza volando, barra arcoíris por celdas y un cierre en iris hacia la pantalla de la consola.
- **La consola.** *gavilanbe POCKET* en 3D (three.js): carcasa con biseles y la
  esquina inferior derecha redondeada, costura entre mitades, marco de pantalla
  con volumen, cruceta con flechas en relieve, botones A/B abombados y un frontal
  con **mapa de normales generado** (los huecos de los botones y la rejilla del
  altavoz reaccionan a la luz al girarla). Seis carcasas (**SELECT** o `S`).
- **La pantalla es un LCD de 160×100 de verdad**: todo se pinta a resolución nativa
  y se amplía ×3 sin suavizado con rejilla de matriz de puntos. El arranque:
  retroiluminación, el gavilán pixelado bajando píxel a píxel, *ding*, un brillo
  del color de la edición, «POCKET» letra a letra y disolución en bloques hasta la
  pantalla de título con PRESS START. A veces hay **error de lectura** y toca soplar
  (con el botón o con el micrófono).
- **La cinta**: todos los cartuchos en 3D delante de la consola; `←` `→`, arrastrar,
  la cruceta o un mando real. START mete la cámara en la pantalla y abre el juego;
  al volver, la consola te recibe. Los disquetes van a un PC retro que teclea el
  `git clone`.
- **Interfaz de videojuego**: cajas con borde de píxel escalonado y sombra dura,
  cuadro de diálogo de RPG que escribe la descripción, botones con glifos de la
  consola (Ⓐ, Ⓑ, START, SELECT), barra de controles, marcador de pegatinas,
  avisos de logro, cursor pixelado, tipografías Pixelify Sans y Silkscreen, y
  animaciones a pasos (`steps()`).
- **El archivo** (Mundo 2): un **estuche de coleccionista por modelo** (tapa de espuma, placa de latón, cierres). Los cartuchos son cajas 3D de verdad (CSS: frente, trasera, cantos y lomo) encajadas de pie en sus ranuras. El estuche gira hacia el cursor, el cartucho asoma al pasar por encima y al pulsarlo **sale tirando hacia arriba, gira en el aire y vuela** a la ficha, donde se **arrastra para girarlo 360°**. Al devolverlo cae en su ranura con un *clac* y el estuche tiembla. Los disquetes siguen en el archivador.
- **Álbum de cromos** (Mundo 3): un libro de piel cosida con **índice** (progreso total y barra por modelo) y una doble página por modelo con cinta de color, huecos con esquinas de foto y cromos con relieve y brillo holográfico que siguen al cursor. Cada juego arrancado da un **sobre** metalizado que se inclina hacia el cursor y se **rasga arrastrando por la línea** con unas tijeras: la tira sale volando, estallan destellos, los cromos salen, se abren en abanico y se revelan uno a uno (los holográficos con onda arcoíris, chispas y «¡HOLO!»). Al pegarlos, cada uno **vuela a su hueco exacto**, aterriza con aplastamiento, polvo y brillo de pegamento; al completar un modelo cae el sello «¡COMPLETO!» con confeti.
- Rendimiento: sin refracción, sombras dinámicas ni postprocesado; render bajo
  demanda y resolución adaptativa.

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
3. Si es de los buenos, ponlo en la lista `FEATURED` de `index.html`: sale antes en la cinta de la consola. Un modelo nuevo funciona solo; para darle nombre de plástico y color de plató añádelo a `EDITIONS` (`index.html`) y su material 3D a `edMat` (`pocket3d.js`).
4. Quita el `"new": true` de la hornada anterior.

El cartucho **TRAZO** es de edición `astra` (plástico fosforito) y se publica en [gavilanbe.github.io/trazo/](https://gavilanbe.github.io/trazo/). Su código vive en [gavilanbe/trazo](https://github.com/gavilanbe/trazo).

El cartucho **NAGU & GAVI · El corazón de la selva** también es `astra`: [jugar](https://gavilanbe.github.io/nagu-gavi/) · [código](https://github.com/gavilanbe/nagu-gavi). Incluye intro con retratos parlantes, cinco semillas de sol y 36 plumas.

El cartucho **INVOCA** (ajedrez de bestias isométrico en micro pixel art) es de edición `fable-5.1` (hielo): [jugar](https://gavilanbe.github.io/invoca/) · [código](https://github.com/gavilanbe/invoca).
