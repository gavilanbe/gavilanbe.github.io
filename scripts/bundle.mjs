// Empaqueta la habitación (g64/*.js + three.js) en lib/g64/ y genera el index.html de la raíz
// a partir de g64/index.html, que es la página de desarrollo (carga los módulos sueltos).
// Uso: npm run bundle
import {build} from 'esbuild';
import {readFile, writeFile, rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url)), out = join(root, 'lib/g64');
await rm(out, {recursive: true, force: true});
await build({entryPoints: [join(root, 'g64/main.js')], outdir: out, bundle: true, splitting: true, format: 'esm', minify: true, target: 'es2022', chunkNames: '[name]-[hash]', legalComments: 'none', logLevel: 'warning'});
let html = await readFile(join(root, 'g64/index.html'), 'utf8');
html = html.replace(' data-root="../"', '').replaceAll('../fonts/', 'fonts/').replace('../favicon.svg', 'favicon.svg').replace('../data.js', 'data.js')
  .replace(/<script type="importmap">.*?<\/script>\n/, '').replace('src="main.js"', 'src="lib/g64/main.js"')
  .replace('<link rel="icon"', `<link rel="canonical" href="https://gavilanbe.github.io/">
<meta property="og:type" content="website">
<meta property="og:title" content="gavilanbe 64 · La colección de juegos en cartucho">
<meta property="og:description" content="Una habitación de los 90 con todos los juegos de gavilanbe en cartucho. Coge uno, mételo en la consola y pulsa START.">
<meta property="og:image" content="https://gavilanbe.github.io/og.jpg">
<meta property="og:url" content="https://gavilanbe.github.io/">
<meta name="twitter:card" content="summary_large_image">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<link rel="modulepreload" href="lib/g64/main.js">
<link rel="icon"`);
if (/\.\.\//.test(html.replace(/<style>[\s\S]*?<\/style>/, ''))) throw new Error('quedan rutas ../ en el index generado');
await writeFile(join(root, 'index.html'), '<!-- Generado por scripts/bundle.mjs a partir de g64/index.html: edita aquel. -->\n' + html);
console.log('lib/g64/ e index.html generados.');
