// For venues with no free photo: read the venue's own website and pull its Open Graph share image
// (the picture the venue itself chose for link previews). -> image-check/og.json + image-check/og/<id>.*
import fs from 'node:fs';
const list = fs.existsSync('og-queries.json') ? JSON.parse(fs.readFileSync('og-queries.json', 'utf8')) : [];
if (!list.length) process.exit(0);
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const out = {};
fs.mkdirSync('image-check/og', { recursive: true });
const pick = (html, base) => {
  const metas = [...html.matchAll(/<meta[^>]+>/gi)].map((m) => m[0]);
  const get = (re) => { for (const m of metas) if (re.test(m)) { const c = m.match(/content=["']([^"']+)["']/i); if (c) return c[1]; } return null; };
  const imgs = [get(/property=["']og:image(:secure_url)?["']/i), get(/name=["']twitter:image(:src)?["']/i)].filter(Boolean);
  const title = (html.match(/<title[^>]*>([^<]*)<\/title>/i) || [])[1]?.trim() || null;
  const desc = get(/property=["']og:description["']/i) || get(/name=["']description["']/i);
  // also big <img> tags on the page, in case there's no og:image
  const pageImgs = [...html.matchAll(/<img[^>]+src=["']([^"']+\.(?:jpe?g|png|webp)(?:\?[^"']*)?)["']/gi)].map((m) => m[1]).slice(0, 12);
  const abs = (u) => { try { return new URL(u, base).href; } catch { return null; } };
  return { title, desc: desc?.slice(0, 200) || null, og: imgs.map(abs).filter(Boolean), pageImgs: pageImgs.map(abs).filter(Boolean) };
};
for (const { id, urls } of list) {
  for (const url of urls) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html' }, redirect: 'follow', signal: AbortSignal.timeout(15000) });
      if (!r.ok) { (out[id] ||= { tried: [] }).tried.push(`${url}: ${r.status}`); continue; }
      const html = await r.text();
      const info = pick(html, r.url);
      const saved = [];
      for (const [i, img] of [...info.og, ...info.pageImgs].slice(0, 6).entries()) {
        try {
          const ir = await fetch(img, { headers: { 'User-Agent': UA, Referer: r.url }, signal: AbortSignal.timeout(15000) });
          const ct = ir.headers.get('content-type') || '';
          if (!ir.ok || !/^image\//.test(ct)) { saved.push({ img, status: ir.status, ct }); continue; }
          const buf = Buffer.from(await ir.arrayBuffer());
          const ext = ct.includes('png') ? 'png' : ct.includes('webp') ? 'webp' : 'jpg';
          const f = `image-check/og/${id}-${i}.${ext}`; fs.writeFileSync(f, buf);
          // hotlink test without a referrer, the way the app loads photos
          const hr = await fetch(img, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15000) });
          saved.push({ img, file: f, bytes: buf.length, ct, og: i < info.og.length, hotlink: hr.status });
        } catch (e) { saved.push({ img, error: e.message }); }
      }
      out[id] = { ...(out[id] || {}), url: r.url, ...info, saved };
      break;
    } catch (e) { (out[id] ||= { tried: [] }).tried.push(`${url}: ${e.message}`); }
  }
}
fs.writeFileSync('image-check/og.json', JSON.stringify(out, null, 1));
console.log('og-check', Object.keys(out).length);
