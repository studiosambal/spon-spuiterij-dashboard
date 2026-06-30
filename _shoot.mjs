import http from 'http';
import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

const ROOT = '/sessions/tender-sleepy-pascal/mnt/spuitwerkonline-dashboard/dist';
const OUT = '/sessions/tender-sleepy-pascal/mnt/outputs/shots';
fs.mkdirSync(OUT, { recursive: true });

const mime = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.svg':'image/svg+xml', '.webp':'image/webp', '.png':'image/png', '.json':'application/json', '.woff2':'font/woff2', '.woff':'font/woff', '.ttf':'font/ttf', '.ico':'image/x-icon' };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  let fp = path.join(ROOT, p);
  // SPA fallback for /v2/* and /v1/* client routes
  if (!fs.existsSync(fp) || fs.statSync(fp).isDirectory()) {
    if (p.startsWith('/v2/')) fp = path.join(ROOT, 'v2', 'index.html');
    else if (p.startsWith('/v1/')) fp = path.join(ROOT, 'v1', 'index.html');
    else if (fs.existsSync(path.join(fp,'index.html'))) fp = path.join(fp,'index.html');
    else fp = path.join(ROOT, 'index.html');
  }
  try {
    const data = fs.readFileSync(fp);
    res.setHeader('Content-Type', mime[path.extname(fp)] || 'application/octet-stream');
    res.end(data);
  } catch(e) { res.statusCode = 404; res.end('404'); }
});

await new Promise(r => server.listen(8099, r));
const BASE = 'http://localhost:8099';

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
const page = await ctx.newPage();

async function shot(name, urlPath, { full=false, before } = {}) {
  await page.goto(BASE + urlPath, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  if (before) { try { await before(page); } catch(e){ console.log('before err', name, e.message);} await page.waitForTimeout(400); }
  await page.screenshot({ path: path.join(OUT, name + '.png'), fullPage: full });
  console.log('shot', name, urlPath, full?'(full)':'');
}

// Dashboard
await shot('01-dashboard-top', '/v2/');
await shot('02-dashboard-full', '/v2/', { full:true });

// Order details per status
await shot('03-order-010-bevestigd', '/v2/order/SOL-2025-010', { full:true });
await shot('04-order-001-bevestigd-opmerking', '/v2/order/SOL-2025-001', { full:true });
await shot('05-order-002-meerwerk-wacht', '/v2/order/SOL-2025-002', { full:true });
await shot('06-order-003-inproductie-telaat', '/v2/order/SOL-2025-003', { full:true });
await shot('07-order-004-inproductie-mengkleur', '/v2/order/SOL-2025-004', { full:true });
await shot('08-order-005-productiegereed', '/v2/order/SOL-2025-005', { full:true });
await shot('09-order-006-klaar', '/v2/order/SOL-2025-006', { full:true });
await shot('10-order-007-afgerond', '/v2/order/SOL-2025-007', { full:true });

// Bottom-bar focus shots (viewport, scrolled to bottom)
await shot('11-order-010-bottombar', '/v2/order/SOL-2025-010', { before: async(pg)=>{ await pg.evaluate(()=>window.scrollTo(0, document.body.scrollHeight)); } });
await shot('12-order-005-bottombar', '/v2/order/SOL-2025-005', { before: async(pg)=>{ await pg.evaluate(()=>window.scrollTo(0, document.body.scrollHeight)); } });

// Controle
await shot('13-controle-001-ral', '/v2/order/SOL-2025-001/controle', { full:true });
await shot('14-controle-002-multi', '/v2/order/SOL-2025-002/controle', { full:true });
await shot('15-controle-010-kleurleeg', '/v2/order/SOL-2025-010/controle', { full:true });
// Controle: kleur editor open (klik 'Kleur vastleggen')
await shot('16-controle-010-kleureditor', '/v2/order/SOL-2025-010/controle', { full:true, before: async(pg)=>{
  const btn = pg.getByText('Kleur vastleggen').first();
  if (await btn.count()) await btn.click();
}});

// Meerwerk
await shot('17-meerwerk-002', '/v2/order/SOL-2025-002/meerwerk', { full:true });
// Meerwerk met categorie 'maten' geselecteerd
await shot('18-meerwerk-002-maten', '/v2/order/SOL-2025-002/meerwerk', { full:true, before: async(pg)=>{
  const b = pg.getByText('Maten / aantallen wijken af').first();
  if (await b.count()) await b.click();
}});

// Foto
await shot('19-foto-before-001', '/v2/order/SOL-2025-001/foto/before', { full:true });
await shot('20-foto-after-003', '/v2/order/SOL-2025-003/foto/after', { full:true });

// Profiel & Account
await shot('21-profiel', '/v2/profiel', { full:true });
await shot('22-account', '/v2/account', { full:true });

// viewport-only dashboard mid + bottom by scroll
await shot('23-dashboard-bottom', '/v2/', { before: async(pg)=>{ await pg.evaluate(()=>window.scrollTo(0, document.body.scrollHeight)); }});

await browser.close();
server.close();
console.log('DONE');
