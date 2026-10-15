// Opens the LIVE site like a phone, scrolls each list and records every photo request to Wikimedia
// and which cards end up with no photo. -> image-check/live.json
import fs from 'node:fs';
import { chromium, devices } from 'playwright';
const SITE = 'https://fitzilla.github.io/Budapest-bastards/';
const b = await chromium.launch();
const ctx = await b.newContext({ ...devices['iPhone 13'] });
const p = await ctx.newPage();
const net = [];
p.on('response', (r) => { const u = r.url(); if (/wikimedia\.org|wikipedia\.org/.test(u)) net.push({ status: r.status(), u: u.slice(0, 220), type: r.headers()['content-type'] || '' }); });
p.on('requestfailed', (r) => { const u = r.url(); if (/wikimedia\.org|wikipedia\.org/.test(u)) net.push({ status: 'FAILED ' + (r.failure()?.errorText || ''), u: u.slice(0, 220) }); });
const WANT = JSON.parse(fs.readFileSync('version.json', 'utf8')).v;
for (let i = 0; i < 30; i++) { const r = await fetch(SITE + 'version.json?x=' + Date.now()).then((r) => r.json()).catch(() => ({})); if (r.v === WANT) break; await new Promise((r) => setTimeout(r, 10000)); }
const out = { lists: {}, want: WANT };
for (const c of ['bars', 'rock', 'late', 'sports', 'eat', 'near']) {
  await p.goto(SITE + '#/c/' + c, { waitUntil: 'networkidle' }).catch(() => {});
  await p.waitForTimeout(1500);
  for (let i = 0; i < 40; i++) { await p.mouse.wheel(0, 700); await p.waitForTimeout(350); }
  await p.waitForTimeout(6000);
  out.lists[c] = await p.$$eval('.card', (cards) => cards.map((el) => {
    const img = el.querySelector('img'); const t = el.querySelector('.card-title')?.textContent;
    return { t, img: img ? (img.classList.contains('ok') ? 'ok' : (img.complete && img.naturalWidth === 0 ? 'broken' : 'pending')) : 'none', src: img?.getAttribute('src')?.slice(0, 120) || null, tile: !!el.querySelector('.ph, .ph-top, .card-ph') };
  }));
}
out.version = await p.evaluate(() => window.BB_DATA?.version || null);
out.net = { total: net.length, byStatus: net.reduce((a, x) => (a[x.status] = (a[x.status] || 0) + 1, a), {}), bad: net.filter((x) => x.status !== 200 && x.status !== 304) };
fs.mkdirSync('image-check', { recursive: true });
fs.writeFileSync('image-check/live.json', JSON.stringify(out, null, 1));
console.log('live-check', JSON.stringify(out.net.byStatus));
await b.close();
