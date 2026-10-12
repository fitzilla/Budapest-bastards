// Checks every Wikimedia photo the app uses: does the file exist, and what does it look like?
// Runs in GitHub Actions (.github/workflows/image-check.yml on the image-check branch) because the
// dev sandbox can't reach Wikimedia. Writes image-check/report.json, report.md and 330px thumbnails.
import fs from 'node:fs';
import vm from 'node:vm';

const UA = 'BastardsOnTour-image-check/1.0 (https://github.com/fitzilla/Budapest-bastards)';
const OUT = 'image-check';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(`${OUT}/thumbs`, { recursive: true });

const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync('data.js', 'utf8'), ctx);
const D = ctx.window.BB_DATA;
const illustrative = JSON.parse(fs.readFileSync('content/illustrative.json', 'utf8'));

// title -> where it's used
const uses = new Map();
const note = (t, label) => { if (!uses.has(t)) uses.set(t, []); uses.get(t).push(label); };
const addUrl = (u, label) => {
  const m = String(u || '').match(/commons\.wikimedia\.org\/wiki\/Special:FilePath\/([^?#]+)/);
  if (m) note(decodeURIComponent(m[1]).replace(/_/g, ' '), label);
};
// walk everything in data.js so events, the airport and dishes are covered too
(function walk(v, label) {
  if (typeof v === 'string') return addUrl(v, label);
  if (Array.isArray(v)) return v.forEach((x) => walk(x, label));
  if (v && typeof v === 'object') {
    const here = v.id ? `${v.id}${v.imageKind ? ` (${v.imageKind})` : ''}` : label;
    for (const [k, x] of Object.entries(v)) if (k !== 'sources') walk(x, k === 'gallery' ? `${here} gallery` : here);
  }
})(D, 'data');
for (const [pool, list] of Object.entries(illustrative)) if (Array.isArray(list)) list.forEach((e) => addUrl(e.image, `pool:${pool}`));

async function get(url, init = {}, tries = 4) {
  for (let i = 0; i < tries; i++) {
    const r = await fetch(url, { ...init, headers: { 'User-Agent': UA, ...(init.headers || {}) } });
    if (r.status !== 429 && r.status < 500) return r;
    await sleep(2000 * (i + 1));
  }
  throw new Error(`gave up on ${url}`);
}

// Commons: 50 titles per request
const titles = [...uses.keys()];
const info = new Map();
for (let i = 0; i < titles.length; i += 50) {
  const chunk = titles.slice(i, i + 50);
  const body = new URLSearchParams({
    action: 'query', format: 'json', formatversion: '2', prop: 'imageinfo',
    iiprop: 'url|size|mime|extmetadata', iiurlwidth: '330',
    iiextmetadatafilter: 'ImageDescription|DateTimeOriginal|ObjectName',
    titles: chunk.map((t) => `File:${t}`).join('|'),
  });
  const j = await (await get('https://commons.wikimedia.org/w/api.php', { method: 'POST', body })).json();
  const norm = new Map((j.query?.normalized || []).map((n) => [n.to, n.from]));
  for (const pg of j.query?.pages || []) {
    const asked = (norm.get(pg.title) || pg.title).replace(/^File:/, '');
    const ii = pg.imageinfo?.[0];
    const md = ii?.extmetadata || {};
    const strip = (s) => String(s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 240);
    info.set(asked, pg.missing || !ii ? { exists: false } : {
      exists: true, width: ii.width, height: ii.height, mime: ii.mime, thumb: ii.thumburl,
      desc: strip(md.ImageDescription?.value || md.ObjectName?.value), date: strip(md.DateTimeOriginal?.value),
    });
  }
  await sleep(300);
}

// Wikipedia lead photos the app pulls in at runtime
const wikiItems = [];
(function walk(v) {
  if (Array.isArray(v)) return v.forEach(walk);
  if (v && typeof v === 'object') {
    if (typeof v.wiki === 'string' && !v.image) wikiItems.push({ id: v.id || v.name || '?', wiki: v.wiki });
    for (const [k, x] of Object.entries(v)) if (k !== 'sources') walk(x);
  }
})(D);
const wikiInfo = [];
for (const it of wikiItems) {
  const lang = it.wiki.startsWith('hu:') ? 'hu' : 'en';
  const title = it.wiki.replace(/^(hu|en):/, '');
  const u = `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&redirects=1&prop=pageimages&piprop=thumbnail|name&pithumbsize=330&titles=${encodeURIComponent(title)}`;
  const j = await (await get(u)).json();
  const pg = j.query?.pages?.[0];
  wikiInfo.push({ ...it, file: pg?.pageimage || null, thumb: pg?.thumbnail?.source || null });
  await sleep(200);
}

// thumbnails, numbered so the contact sheets can refer to them
const rows = [];
let n = 0;
const save = async (thumb, row) => {
  row.n = ++n;
  if (thumb) {
    try {
      const r = await get(thumb);
      if (r.ok) { fs.writeFileSync(`${OUT}/thumbs/${String(n).padStart(3, '0')}.jpg`, Buffer.from(await r.arrayBuffer())); row.thumbSaved = true; }
      else row.thumbError = r.status;
    } catch (e) { row.thumbError = String(e.message); }
    await sleep(150);
  }
  rows.push(row);
};
for (const t of titles) await save(info.get(t)?.thumb, { kind: 'commons', title: t, uses: uses.get(t), ...(info.get(t) || { exists: false }) });
for (const w of wikiInfo) await save(w.thumb, { kind: 'wikipedia', title: w.file, uses: [`${w.id} (runtime from ${w.wiki})`], exists: !!w.thumb });

// image-queries.json: [{ label, q }] Commons searches whose top hits get thumbnailed, to pick replacements by eye
const queries = fs.existsSync('image-queries.json') ? JSON.parse(fs.readFileSync('image-queries.json', 'utf8')) : [];
for (const { label, q, limit = 10 } of queries) {
  const body = new URLSearchParams({
    action: 'query', format: 'json', formatversion: '2', generator: 'search', gsrsearch: `${q} filetype:bitmap`,
    gsrnamespace: '6', gsrlimit: String(limit), prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiurlwidth: '330',
    iiextmetadatafilter: 'ImageDescription|DateTimeOriginal|ObjectName',
  });
  let pages = [];
  try { pages = (await (await get('https://commons.wikimedia.org/w/api.php', { method: 'POST', body })).json()).query?.pages || []; } catch { /* skip */ }
  pages.sort((a, b) => (a.index || 0) - (b.index || 0));
  for (const pg of pages) {
    const ii = pg.imageinfo?.[0];
    if (!ii) continue;
    const md = ii.extmetadata || {};
    const strip = (s) => String(s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 240);
    await save(ii.thumburl, { kind: 'search', query: label, title: pg.title.replace(/^File:/, ''), uses: [`search:${label}`], exists: true,
      width: ii.width, height: ii.height, mime: ii.mime, thumb: ii.thumburl, desc: strip(md.ImageDescription?.value || md.ObjectName?.value) });
  }
  await sleep(300);
}

fs.writeFileSync(`${OUT}/report.json`, JSON.stringify(rows, null, 1));
const missing = rows.filter((r) => !r.exists);
fs.writeFileSync(`${OUT}/report.md`, [
  `# Image check`, '', `${rows.length} photos checked, ${missing.length} missing.`, '',
  ...missing.map((r) => `- MISSING ${r.kind} \`${r.title}\` used by ${r.uses.join(', ')}`),
].join('\n') + '\n');
console.log(`${rows.length} photos checked, ${missing.length} missing`);
for (const r of missing) console.log(`MISSING ${r.kind} ${r.title} <- ${r.uses.join(', ')}`);
