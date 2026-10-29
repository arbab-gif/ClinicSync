// Minimal static server for local preview (no installs needed): node serve.js [port]
const http = require('http'), fs = require('fs'), path = require('path');
const root = __dirname, port = Number(process.argv[2]) || 3000;
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.json': 'application/json', '.svg': 'image/svg+xml' };
http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  // The organizer prototype is the site for now: it starts at sign in. The player prototype (index.html)
  // stays on disk but isn't linked, and the design gallery isn't served.
  if (url === '/') { res.writeHead(302, { Location: '/organizer/sign-in.html' }); return res.end(); }
  if (url.startsWith('/design-gallery')) { res.writeHead(404); return res.end('Not found'); }
  let file = path.normalize(path.join(root, url.endsWith('/') ? url + 'index.html' : url));
  if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(port, () => console.log(`Serving on http://localhost:${port}`));
