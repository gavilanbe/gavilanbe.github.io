<div align="center">

# 🕹️ gavilanbe // ARCADE

**El índice jugable de toda mi colección de juegos — web, terminal y homebrew.**

[![entrar al arcade](https://img.shields.io/badge/▶_entrar_al_arcade-5ee07a?style=for-the-badge&labelColor=080810)](https://gavilanbe.github.io/)

</div>

Una sola página estática, sin frameworks ni build: los juegos viven en
[`data.js`](data.js) y las miniaturas en [`thumbs/`](thumbs/). Con buscador
(tecla `/`), filtros por tipo, **juego del día** (rotación diaria determinista)
y botón **INSERT COIN** que abre un juego al azar.

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
  "kind": "juego"
}
```

2. Deja su captura en `thumbs/mi-juego.jpg` (640×400).
3. Si es de los buenos, ponlo en la lista `FEATURED` de `index.html`.
4. Quita el `"new": true` de la hornada anterior.
