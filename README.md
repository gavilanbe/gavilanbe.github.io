<div align="center">

# 🔭 gavilanbe // OBSERVATORIO

**Un cielo navegable con toda mi colección de juegos: web, terminal y homebrew.**

[![entrar al observatorio](https://img.shields.io/badge/✦_entrar_al_observatorio-e9c16e?style=for-the-badge&labelColor=05060f)](https://gavilanbe.github.io/)

</div>

![Observatorio gavilanbe](og.jpg)

Cada **estrella es un juego** y cada **constelación es el modelo** que lo construyó
(Opus 4.6 · *La Fragua*, Opus 4.7 · *El Enjambre*, Opus 4.8 · *La Corona*,
Fable 5 · *La Pluma*, Fable 5.1 · *El Espejo*, Astra · *El Astrolabio* y
Opus 5.5 · *El Faro*). Una sola página estática, sin frameworks ni build
obligatorio: los juegos viven en [`data.js`](data.js) y las miniaturas en
[`thumbs/`](thumbs/).

## Qué hay dentro

- **I · El cielo.** Un planetario en `<canvas>` con proyección estereográfica:
  1.900 estrellas de fondo, vía láctea, nebulosas teñidas por constelación,
  retícula de coordenadas y una sierra con un pequeño observatorio cuyo
  telescopio apunta a la estrella que miras. Arrástralo (con inercia), pasa el
  ratón por encima y aparece una sonda con la captura. Las figuras de las
  constelaciones se calculan solas (árbol mínimo más un lazo) a partir de
  posiciones deterministas. Hay un HUD con ascensión recta, declinación, campo
  de visión y hora local.
  - **Estrellas** = juegos de navegador. **Púlsares** = juegos de terminal:
    parpadean como un cursor. **Novas** = lo más reciente, con un anillo que se
    expande. **Protoestrellas** = WIP. Los más destacados tienen destellos.
  - La **leyenda** enfoca una constelación: la cámara vuela hacia ella, la
    figura se dibuja y cada estrella muestra su nombre.
  - **Pide un deseo** (o tecla `R`): una estrella fugaz cruza el cielo, la
    cámara la sigue y abre un juego al azar. **Estrella del día**: rotación
    diaria determinista.
  - **El cielo suena**: activa el sonido y cada estrella toca una nota de una
    escala pentatónica (campana para las estrellas, *bleep* para los púlsares),
    con eco sintetizado en WebAudio. Pasar el ratón es tocar música.
  - **Modo planetario**: si nadie toca nada durante un rato, el cielo hace
    una visita guiada por los mejores juegos.
- **II · Cartas celestes.** Una carta por constelación con su figura (se traza
  al pasar el ratón), recuentos y miniaturas. Filtra el catálogo o te lleva a
  ella en el cielo.
- **Amanecer.** El cielo se hace de día al bajar; un gavilán cruza al ritmo del
  scroll.
- **III · Catálogo general.** Papel de carta astronómica: tarjetas con número de
  catálogo, constelación, captura, emoji y botón Jugar directo. Búsqueda (`/`)
  sin tildes y con varias palabras, filtros por tipo y constelación, orden
  (brillo, A→Z, constelación, sin observar) y transiciones con View Transitions.
- **La ficha.** Se abre como un iris desde la estrella o la tarjeta. La captura
  se «revela» como una placa fotográfica; incluye coordenadas, magnitud, carta de
  localización, vecinas de constelación, «Jugar ahora», código, copiar enlace y,
  para los juegos de terminal, el `git clone` listo para copiar. `←` `→`
  hojean, `Esc` cierra, el foco queda atrapado y vuelve a su sitio. Cada ficha
  tiene su enlace: `https://gavilanbe.github.io/#/invoca`.
- **IV · Bitácora.** Tu progreso en este navegador: estrellas observadas,
  juegos arrancados (ganan **una luna** que orbita su estrella en el cielo) y
  13 **descubrimientos**, algunos secretos (hay una constelación escondida,
  estrellas fugaces que se pueden atrapar, algo que pasa de madrugada y un
  código muy antiguo…).

Respeta `prefers-reduced-motion`, funciona con teclado y en el móvil (desliza
para girar, toca una estrella para verla y otra vez para abrirla).
Tipografía: Fraunces, Instrument Sans y JetBrains Mono.

La versión anterior (el arcade con la consola y los cartuchos) sigue viva en
[`/classic/`](https://gavilanbe.github.io/classic/) y en la etiqueta git
`arcade-v1`.

## Desarrollo

La página se sirve tal cual. `node scripts/build.mjs` valida el JavaScript y
copia lo publicable en `dist/`. Las comprobaciones de regresión:
`npm ci && npm test` (jsdom: catálogo, miniaturas, búsqueda, filtros, ficha,
foco, teclado, bitácora, logros y enlaces profundos).

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
  "wip": false,                                          // protoestrella (WIP)
  "new": true,                                           // nova: lo más nuevo
  "kind": "juego",
  "model": "astra"            // constelación: "opus-5.5" | "astra" | "fable-5.1" | "fable" | "opus-4.8" | "opus-4.7" | "opus-4.6"
}
```

2. Deja su captura en `thumbs/mi-juego.jpg` (640×400).
3. Si es de los buenos, ponlo en la lista `FEATURED` de `index.html` (brillará más en el cielo). Un modelo nuevo aparece solo como constelación; para darle color, apodo y sitio añádelo a `META`.
4. Quita el `"new": true` de la hornada anterior.

El juego **TRAZO** pertenece a la constelación `astra` y se publica en [gavilanbe.github.io/trazo/](https://gavilanbe.github.io/trazo/). Su código vive en [gavilanbe/trazo](https://github.com/gavilanbe/trazo).

El juego **NAGU & GAVI · El corazón de la selva** también es de `astra`: [jugar](https://gavilanbe.github.io/nagu-gavi/) · [código](https://github.com/gavilanbe/nagu-gavi). Incluye intro con retratos parlantes, cinco semillas de sol y 36 plumas.

El juego **INVOCA** (ajedrez de bestias isométrico en micro pixel art) brilla en `fable-5.1`: [jugar](https://gavilanbe.github.io/invoca/) · [código](https://github.com/gavilanbe/invoca).
