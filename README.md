<div align="center">

# 🕹️ gavilanbe // ARCADE

**El índice jugable de toda mi colección de juegos — web, terminal y homebrew.**

[![entrar al arcade](https://img.shields.io/badge/▶_entrar_al_arcade-5ee07a?style=for-the-badge&labelColor=080810)](https://gavilanbe.github.io/)

</div>

Una sola página estática, sin frameworks ni build: los juegos viven en
[`data.js`](data.js) y las miniaturas en [`thumbs/`](thumbs/). Con buscador
(tecla `/`), filtros por tipo y por **pegatina de modelo** (`✦ Fable` holográfica
u `Opus 4.8/4.7/4.6`, el modelo que construyó cada juego), **juego del día**
(rotación diaria determinista) y una ranura para **echar una moneda** que lanza
un juego al azar.

Cada juego web es un **cartucho 3D flotante** (CSS puro): la carcasa delata su
chip — nácar tornasolado para Fable; oro, plata y bronce para Opus — con tilt
que sigue al ratón y brillo especular. Al tocarlo se abre su **ficha**: el
cartucho gira en una sala oscura sobre la **ranura de carga** de la consola,
que es el propio botón de jugar. Arrástralo hasta la ranura (se enciende al
acercarse) o toca la ranura: la consola lo traga, arranca el destello
`GAVILANBE games™` estilo Game Boy Color con su chime chiptune (Web Audio) y el
juego se abre en otra pestaña. Si no está claro dónde va, el cartucho hace una
pequeña reverencia hacia la ranura al abrir la ficha (hasta tu primera
inserción) o al tocarlo.

Los juegos de terminal viven en **la sala de máquinas**: cada uno es un
monitor CRT encendido — fósforo verde, scanlines, reflejo en el cristal y LED —
que al pasar el ratón **ejecuta su programa**: imprime la descripción línea a
línea y renderiza su TUI real teñido de fósforo. Al entrar en pantalla, los
monitores se encienden con el destello CRT clásico. Clic → su código en GitHub.

El diseño está inspirado en el chasis de la Game Boy DMG: plástico cálido,
bisel oscuro de pantalla, botón A magenta, ficha dorada y verde oliva para la
sala de máquinas. Tipografía: Unbounded + IBM Plex Sans/Mono.

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
  "model": "fable"            // pegatina del cartucho: "fable" | "opus-4.8" | "opus-4.7" | "opus-4.6"
}
```

2. Deja su captura en `thumbs/mi-juego.jpg` (640×400).
3. Si es de los buenos, ponlo en la lista `FEATURED` de `index.html`.
4. Quita el `"new": true` de la hornada anterior.
