// Empaqueta en lib/three.pocket.js solo lo que usa pocket3d.js de three.js: minificado y del mismo
// origen (una petición, sin CDN ni cascada de addons). Regenerar al usar algo nuevo de THREE o de un addon.
// Uso: npm run vendor
import {build} from 'esbuild';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const ADDONS = {
  RoundedBoxGeometry: 'three/addons/geometries/RoundedBoxGeometry.js',
  RoomEnvironment: 'three/addons/environments/RoomEnvironment.js',
  mergeGeometries: 'three/addons/utils/BufferGeometryUtils.js',
};
const src = await readFile(join(root, 'pocket3d.js'), 'utf8');
const core = [...new Set([...src.matchAll(/\bTHREE\.([A-Za-z_]\w*)/g)].map(m => m[1]))].sort();
const named = [...src.matchAll(/import\s*\{([^}]*)\}\s*from\s*'\.\/lib\/three\.pocket\.js'/g)].flatMap(m => m[1].split(',').map(s => s.trim()).filter(Boolean));
const addons = named.filter(n => !core.includes(n));
for (const n of addons) if (!ADDONS[n]) throw new Error(`Añade la ruta del addon «${n}» a ADDONS en scripts/vendor-three.mjs`);
const {version} = JSON.parse(await readFile(join(root, 'node_modules/three/package.json'), 'utf8'));
await build({
  stdin: {contents: `export {${core.join(', ')}} from 'three';\n${addons.map(n => `export {${n}} from '${ADDONS[n]}';`).join('\n')}\n`, resolveDir: root, loader: 'js'},
  bundle: true, format: 'esm', minify: true, legalComments: 'inline',
  banner: {js: `// three.js ${version} · solo lo que usa pocket3d.js. Generado con: npm run vendor`},
  outfile: join(root, 'lib/three.pocket.js'),
});
console.log(`lib/three.pocket.js: three ${version}, ${core.length} piezas del núcleo y ${addons.length} addons.`);
