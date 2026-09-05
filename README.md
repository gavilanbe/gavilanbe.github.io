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

La cabecera comparte el logo vectorial de la consola y destaca **el cartucho
del día**, que abre su ficha. Los destacados se recorren deslizando o con sus
botones de avance. El panel fijo separa la búsqueda y el tipo de juego de las
pegatinas de modelo. La búsqueda admite varias palabras, con o sin tildes;
los recuentos se actualizan y «Ver toda la colección» restablece todos los
filtros. El botón de sonido recuerda su estado.

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
Después el juego se abre en otra pestaña (o en la misma si el navegador la
bloquea). Cerrar la ficha cancela el arranque y sus sonidos; con movimiento
reducido el juego se abre directamente. El foco del teclado queda dentro de
la ficha y vuelve al elemento de origen al cerrarla; los atajos del catálogo
no actúan detrás del diálogo.
Si no está claro dónde va, el cartucho hace una pequeña reverencia hacia la
ranura al abrir la ficha (hasta tu primera inserción) o al tocarlo.

Los juegos de terminal viven en **la sala de máquinas**: cada uno es un
monitor CRT encendido — fósforo verde, scanlines, reflejo en el cristal y LED —
que al pasar el ratón **ejecuta su programa**: imprime la descripción línea a
línea y renderiza su TUI real teñido de fósforo. Al entrar en pantalla, los
monitores se encienden con el destello CRT clásico. Clic → su código en GitHub.

El catálogo combina superficies de nácar e índigo con baldas oscuras y
acabados de cartucho. La sala de máquinas conserva sus monitores de fósforo.
Tipografía del catálogo: Unbounded + IBM Plex Sans/Mono.

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
