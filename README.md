<div align="center">

# 🕹️ gavilanbe // ARCADE

**El índice jugable de toda mi colección de juegos — web, terminal y homebrew.**

[![entrar al arcade](https://img.shields.io/badge/▶_entrar_al_arcade-5ee07a?style=for-the-badge&labelColor=080810)](https://gavilanbe.github.io/)

</div>

Una sola página estática, sin frameworks ni build obligatorio: los juegos viven en
[`data.js`](data.js) y las miniaturas en [`thumbs/`](thumbs/). Con buscador
(tecla `/`), filtros por tipo y por **pegatina de modelo** (`✦ Astra` azul petróleo y oro, `✦ Fable 5.1` cromo
oscuro, `✦ Fable 5` holográfica u `Opus 4.8/4.7/4.6`, el modelo que construyó cada juego), **juego del día**
(rotación diaria determinista) y una ranura para **echar una moneda** que lanza
un juego al azar.

Cada juego web es un **Game Pak 3D horizontal** (CSS puro), con el rebaje de
los hombros, los cantos, los contactos dorados y una etiqueta con su captura.
El título y la descripción también aparecen debajo para explorar la colección
sin abrir cada ficha. La carcasa delata el modelo: cromo oscuro tornasolado
para Fable 5.1, nácar para Fable 5 y oro, plata y bronce para Opus. El brillo y
el tilt responden al ratón; los acabados del catálogo descansan cuando no se
están tocando.

La página es una **tienda retro nocturna**: todo oscuro y coherente. Una barra
fija arriba lleva la marca, el buscador y el sonido. La portada enseña la propia
consola con **el cartucho del día metido** y su pantalla de título en la LCD:
tocarla (o el botón morado) arranca ese juego. Debajo, una tira de filtros
fija separa el tipo de juego de las pegatinas de modelo, y las secciones
«Para empezar», «Todos los cartuchos» y «La sala de máquinas» dejan aire
alrededor de cartuchos grandes. La búsqueda admite varias palabras, con o sin
tildes; los recuentos se actualizan y «Ver toda la colección» restablece todos
los filtros. El botón de sonido recuerda su estado.

Al tocar un cartucho se abre su **ficha**: el cartucho gira en la sala oscura
sobre una **handheld horizontal índigo**, inspirada en la Game Boy Advance,
con gatillos, cruceta, botones A/B, altavoz, LED verde y pantalla LCD 3:2.
Arrástralo hasta la ranura iluminada o toca la consola: el cartucho gira al
frente, se ajusta al ancho de la ranura y baja detrás de la carcasa hasta
encajar. El cartucho insertado acompaña a la consola durante el acercamiento.
El arranque sucede dentro de la misma pantalla, que conserva sus proporciones:
las nueve letras del logo vectorial `GAVILANBE` entran por separado con giro,
escala y colores, se ordenan en azul y reciben un barrido magenta sobre fondo
blanco, con `games™` debajo. Un arpegio y una campana sintetizados acompañan
la secuencia. La referencia visual es el
[arranque original de GBA](https://www.mariowiki.com/File:GBA_Startup.gif);
no se incluyen la BIOS ni el audio original. El logo está en
[`assets/gavilanbe.svg`](assets/gavilanbe.svg) y no necesita descargar una fuente.
Tras el logo, la LCD muestra la **pantalla de título** del juego con `PRESS START`
parpadeando: pulsa la consola, el botón dorado o Enter y el juego se abre en otra
pestaña. Como esa pestaña nace de una pulsación nueva, los bloqueadores de
ventanas emergentes no se la comen. Durante el logo, el botón permite **saltar la
intro**. Cerrar la ficha cancela el arranque y sus sonidos; con movimiento
reducido el juego se abre directamente.

Para quien llega por primera vez: la cabecera explica el juego en tres pasos
(elige, mete, START), cada cartucho enseña `▶ JUGAR` al pasar por encima y la
ficha tiene un botón **Jugar** bien visible (en el móvil, justo bajo la
descripción). Las flechas ‹ › de la sala y la cruceta de la consola hojean los
cartuchos; A y START también juegan. Los cartuchos ya jugados en ese navegador
llevan la marca `✓ JUGADO`. Los juegos de terminal avisan de que se juegan en
tu terminal y abren su código. El foco del teclado queda dentro de
la ficha y vuelve al elemento de origen al cerrarla; los atajos del catálogo
no actúan detrás del diálogo.
Si no está claro dónde va, el cartucho hace una pequeña reverencia hacia la
ranura al abrir la ficha (hasta tu primera inserción) o al tocarlo.

Los juegos de terminal viven en **la sala de máquinas**: cada uno es un
monitor CRT encendido — fósforo verde, scanlines, reflejo en el cristal y LED —
que al pasar el ratón **ejecuta su programa**: imprime la descripción línea a
línea y renderiza su TUI real teñido de fósforo. Al entrar en pantalla, los
monitores se encienden con el destello CRT clásico. Clic → su código en GitHub.

La ficha comparte el mismo fondo nocturno que el catálogo.
Tipografía: Unbounded + IBM Plex Sans/Mono.

La página se sigue sirviendo directamente, sin instalar dependencias. Para
preparar una copia publicable en `dist/`, ejecuta `node scripts/build.mjs`;
comprueba la sintaxis del JavaScript y copia únicamente los archivos públicos.

Para ejecutar las comprobaciones de regresión: `npm ci && npm test`.
Las dependencias son solo de desarrollo. Se comprueban la inserción y su
cancelación, el arrastre, el movimiento reducido, la búsqueda, los filtros,
el teclado, el juego del día y la existencia de las imágenes locales.

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
  "wip": false,                                          // cinta dorada "WIP"
  "new": true,                                           // cinta verde "NUEVO"
  "kind": "juego",
  "model": "astra"            // pegatina del cartucho: "astra" | "fable-5.1" | "fable" (Fable 5) | "opus-4.8" | "opus-4.7" | "opus-4.6"
}
```

2. Deja su captura en `thumbs/mi-juego.jpg` (640×400).
3. Si es de los buenos, ponlo en la lista `FEATURED` de `index.html`.
4. Quita el `"new": true` de la hornada anterior.

El cartucho **TRAZO** usa la pegatina `astra`, carcasa azul petróleo y acentos dorados, y se publica en [gavilanbe.github.io/trazo/](https://gavilanbe.github.io/trazo/). Su código vive en [gavilanbe/trazo](https://github.com/gavilanbe/trazo).

El cartucho **NAGU & GAVI · El corazón de la selva** sigue la edición `astra` (002): [jugar](https://gavilanbe.github.io/nagu-gavi/) · [código](https://github.com/gavilanbe/nagu-gavi). Incluye intro con retratos parlantes, cinco semillas de sol y 36 plumas.

El cartucho **INVOCA** (ajedrez de bestias isométrico en micro pixel art) lleva la pegatina `fable-5.1`: [jugar](https://gavilanbe.github.io/invoca/) · [código](https://github.com/gavilanbe/invoca).
