// Genera thumbs/s/<nombre>.webp (320×200, recorte centrado) a partir de cada captura de thumbs/.
// Las etiquetas de los cartuchos, los cromos, la cinta 3D y el LCD usan estas (pesan ~10 KB);
// la ficha de inspección y el asomar de los disquetes siguen usando la grande.
// Uso: node scripts/thumbs.mjs   (necesita ImageMagick: `magick`)
import {readdir, stat, mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {join, parse} from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const src = join(root, 'thumbs'), out = join(src, 's');
await mkdir(out, {recursive: true});
const mtime = p => stat(p).then(s => s.mtimeMs, () => 0);
let made = 0;
for (const f of await readdir(src)) {
  if (!/\.(jpe?g|png|webp)$/i.test(f)) continue;
  const from = join(src, f), to = join(out, parse(f).name + '.webp');
  if (await mtime(to) >= await mtime(from)) continue;
  execFileSync('magick', [from, '-resize', '320x200^', '-gravity', 'center', '-extent', '320x200', '-quality', '82', '-define', 'webp:method=6', '-define', 'webp:use-sharp-yuv=true', to]);
  made++;
}
console.log(made ? `${made} miniaturas pequeñas generadas en thumbs/s/.` : 'Miniaturas pequeñas al día.');
