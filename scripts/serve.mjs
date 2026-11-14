// Servidor estático mínimo para las pruebas con navegador.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join, extname, normalize} from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const MIME = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml'};
export async function serve() {
  const server = createServer(async (req, res) => {
    try { let p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, ''); if (p.endsWith('/')) p += 'index.html'; res.writeHead(200, {'content-type': MIME[extname(p)] || 'application/octet-stream'}); res.end(await readFile(join(root, p))); }
    catch { res.writeHead(404); res.end(); }
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  return {server, base: `http://127.0.0.1:${server.address().port}/`, root};
}
