<div align="center">

# 🕹️ gavilanbe // ARCADE

**El índice jugable de toda mi colección de juegos — web, terminal y homebrew.**

[![entrar al arcade](https://img.shields.io/badge/▶_entrar_al_arcade-5ee07a?style=for-the-badge&labelColor=080810)](https://gavilanbe.github.io/)

</div>

Una sola página estática, sin frameworks ni build: los juegos viven en
[`data.js`](data.js) y las miniaturas en [`thumbs/`](thumbs/). Con buscador
(tecla `/`), filtros por tipo y por **pegatina de modelo** (`✦ Fable 5.1` cromo
oscuro, `✦ Fable 5` holográfica u `Opus 4.8/4.7/4.6`, el modelo que construyó cada juego), **juego del día**
(rotación diaria determinista) y una ranura para **echar una moneda** que lanza
un juego al azar.

Cada juego web es un **Game Pak 3D** (CSS puro) de pie sobre las baldas de la
estantería: etiqueta grande con el arte, el título, su número y la pegatina del
chip; la carcasa delata el modelo — cromo oscuro tornasolado para Fable 5.1, nácar
para Fable 5; oro, plata y bronce para Opus — con tilt que sigue al ratón, brillo
especular y un pequeño respingo al cogerlo. Arriba, el **panel de mandos** es un
trozo de consola: interruptor deslizante de tres posiciones (todos · online ·
terminal), pegatinas de chip con su material y cuántos cartuchos lleva cada una,
buscador en una pantallita LCD y botón de sonido (SND, se recuerda).

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
reducido el juego se abre directamente.
Si no está claro dónde va, el cartucho hace una pequeña reverencia hacia la
ranura al abrir la ficha (hasta tu primera inserción) o al tocarlo.

Los juegos de terminal viven en **la sala de máquinas**: cada uno es un
monitor CRT encendido — fósforo verde, scanlines, reflejo en el cristal y LED —
que al pasar el ratón **ejecuta su programa**: imprime la descripción línea a
línea y renderiza su TUI real teñido de fósforo. Al entrar en pantalla, los
monitores se encienden con el destello CRT clásico. Clic → su código en GitHub.

El catálogo conserva los materiales de la Game Boy DMG: plástico cálido,
bisel oscuro, botón A magenta, ficha dorada y verde oliva para la sala de
máquinas. La consola de la ficha adopta la silueta y el índigo de la Advance.
Tipografía del catálogo: Unbounded + IBM Plex Sans/Mono.

La página se sigue sirviendo directamente, sin instalar dependencias. Para
preparar una copia publicable en `dist/`, ejecuta `node scripts/build.mjs`;
comprueba la sintaxis del JavaScript y copia únicamente los archivos públicos.

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
  "model": "fable-5.1"        // pegatina del cartucho: "fable-5.1" | "fable" (Fable 5) | "opus-4.8" | "opus-4.7" | "opus-4.6"
}
```

2. Deja su captura en `thumbs/mi-juego.jpg` (640×400).
3. Si es de los buenos, ponlo en la lista `FEATURED` de `index.html`.
4. Quita el `"new": true` de la hornada anterior.
