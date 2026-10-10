// Builds data.js from content/*.json.  Usage: node scripts/build-data.mjs
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));

const trip = read('content/trip.json');
const over = read('content/overrides.json');
const readOpt = (p, d) => (existsSync(join(root, p)) ? read(p) : d);
const ratings = readOpt('content/ratings.json', {});
const wiki = readOpt('content/wiki.json', {});
const images = readOpt('content/images.json', {});
// attach a Wikipedia title (for a runtime lead photo) and any extra verified Commons photo
function applyMedia(x) {
  const img = images[x.id];
  if (img?.image && !x.image && /^https:\/\/commons\.wikimedia\.org\/wiki\/Special:FilePath\//.test(img.image)) x.image = img.image;
  const w = img?.wiki || wiki[x.id]; // titles seen in search results beat ones from memory
  if (w && !x.id.startsWith('_')) x.wiki = String(w).replace(/^en:/, '');
  return x;
}
const R = {
  events: read('content/research/events_logistics.json'),
  bars: read('content/research/bars.json'),
  barsExtra: readOpt('content/research/bars_extra.json', { items: [], sources: [] }),
  food: read('content/research/food.json'),
  sights: read('content/research/sights.json'),
};

const warnings = [];
const BOUNDS = { latMin: 47.35, latMax: 47.65, lngMin: 18.9, lngMax: 19.35 };
const removed = new Set(over.remove);

// "Rudas Baths (Ottoman bath, rooftop pool & night bathing)" -> name + subtitle
function splitName(raw) {
  let name = String(raw).trim();
  let closed = false;
  if (/\(CLOSED\)/i.test(name)) { closed = true; name = name.replace(/\s*\(CLOSED\)\s*/i, ' ').trim(); }
  let sub = null;
  const m = name.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  if (m && m[1].length > 2) { name = m[1].trim(); sub = m[2].trim(); }
  return { name, sub, closed };
}

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

function normPlace(src, file) {
  const { name, sub, closed } = splitName(src.name);
  const r = src.rating || {};
  const l = src.links || {};
  const p = {
    id: src.id,
    name,
    sub,
    type: src.type,
    tags: [...new Set(src.tags || [])],
    district: src.district || null,
    address: src.address || null,
    lat: num(src.lat),
    lng: num(src.lng),
    approx: /estimated/i.test(src.coordSource || ''),
    rating: {
      ta: num(r.tripadvisor), taN: num(r.tripadvisorReviews),
      g: num(r.google), gN: num(r.googleReviews),
    },
    price: num(src.price),
    priceText: src.priceText || null,
    hours: src.hours || null,
    blurb: src.blurb || null,
    tip: src.tip || null,
    history: src.history || null,
    image: src.image || null,
    links: {
      ta: l.tripadvisor || null,
      web: l.website || null,
      book: l.booking || l.tickets || null,
    },
    unconfirmed: src.verification === 'not-confirmed-this-session' || undefined,
    closed: closed || undefined,
  };
  // Plain https only, and never the useless TripAdvisor stub without a slug.
  for (const k of Object.keys(p.links)) {
    const u = p.links[k];
    if (u && !/^https:\/\//.test(u)) p.links[k] = null;
  }
  if (p.links.ta && /Restaurant_Review-d\d+$/.test(p.links.ta)) p.links.ta = null;
  p._file = file;
  return p;
}

function applyPatch(p) {
  const patch = over.patch[p.id];
  if (!patch) return p;
  const { addTags, ...rest } = patch;
  Object.assign(p, rest);
  if (addTags) p.tags = [...new Set([...p.tags, ...addTags])];
  return p;
}

// content/ratings.json: verified review scores gathered separately, keyed by id
function applyRatings(p) {
  const r = ratings[p.id];
  if (!r || p.id.startsWith('_')) return p;
  const ok = (v, max) => typeof v === 'number' && v > 0 && v <= max;
  p.rating = {
    ta: ok(r.ta, 5) ? r.ta : p.rating?.ta ?? null,
    taN: ok(r.taN, 1e7) ? Math.round(r.taN) : p.rating?.taN ?? null,
    g: ok(r.g, 5) ? r.g : p.rating?.g ?? null,
    gN: ok(r.gN, 1e7) ? Math.round(r.gN) : p.rating?.gN ?? null,
  };
  // a score from a handful of reviews is noise, not a rating
  for (const [v, n] of [['ta', 'taN'], ['g', 'gN']]) if (p.rating[n] != null && p.rating[n] < 15) { p.rating[v] = null; p.rating[n] = null; }
  if (r.taUrl && /^https:\/\/www\.tripadvisor\.[a-z.]+\/.+-d\d+-/.test(r.taUrl)) p.links.ta = r.taUrl;
  if (r.image && !p.image && /^https:\/\/commons\.wikimedia\.org\/wiki\/Special:FilePath\//.test(r.image)) p.image = r.image;
  if (r.closed === true) p.closed = true;
  return p;
}

function validate(p) {
  if (!p.id || !/^[a-z0-9-]+$/.test(p.id)) warnings.push(`bad id: ${p.id}`);
  if (!p.hidePin) {
    if (p.lat == null || p.lng == null) warnings.push(`${p.id}: no coords`);
    else if (p.lat < BOUNDS.latMin || p.lat > BOUNDS.latMax || p.lng < BOUNDS.lngMin || p.lng > BOUNDS.lngMax)
      warnings.push(`${p.id}: coords out of bounds ${p.lat},${p.lng}`);
  }
}

// ---- places
const places = [];
for (const [file, data] of [['bars', R.bars], ['bars_extra', R.barsExtra], ['food', R.food], ['sights', R.sights]]) {
  for (const src of data.items) {
    if (removed.has(`${file}:${src.id}`)) continue;
    places.push(applyMedia(applyRatings(applyPatch(normPlace(src, file)))));
  }
}
const ids = new Map();
for (const p of places) {
  if (ids.has(p.id)) warnings.push(`duplicate id ${p.id} (${ids.get(p.id)} & ${p._file})`);
  ids.set(p.id, p._file);
  delete p._file;
  validate(p);
}

// ---- booked events
const events = R.events.events.map((e) => {
  const { name, sub } = splitName(e.name);
  const r = e.rating || {};
  let who = 'all';
  if (Array.isArray(e.who)) who = { only: e.who };
  else if (typeof e.who === 'string' && e.who.startsWith('all-except:')) who = { except: e.who.slice(11).split(',') };
  const ev = applyPatch({
    id: e.id, name, sub, type: 'event', tags: ['booked'],
    date: e.date, start: e.start, arriveFrom: e.arriveFrom, end: e.end, who,
    venue: e.venue, address: e.address, lat: num(e.lat), lng: num(e.lng), approx: false,
    rating: { ta: num(r.tripadvisor), taN: num(r.tripadvisorReviews), g: num(r.google), gN: num(r.googleReviews) },
    blurb: e.blurb, tip: e.tip, getThere: e.getThere, rules: e.rules, notes: e.notes || null,
    links: { web: e.links?.website || null, book: e.links?.tickets || null, ta: null },
    image: null, district: null, price: null,
  });
  applyRatings(ev);
  applyMedia(ev);
  validate(ev);
  return ev;
});
for (const e of events) if (ids.has(e.id)) warnings.push(`event id clashes with place: ${e.id}`); else ids.set(e.id, 'events');

// ---- airport
const A = R.events.airport;
const airport = applyPatch({
  id: 'airport', name: 'Budapest Airport', sub: 'Terminal 2 · BUD', type: 'travel', tags: ['travel'],
  address: 'Budapest Liszt Ferenc International Airport, 1185 Budapest', district: 'XVIII',
  lat: num(A.lat), lng: num(A.lng), approx: true,
  blurb: 'Land Thursday 12:20. Back here by 14:45 on Sunday, no excuses.',
  arrival: A.arrival, departure: A.departure, options: A.options, leaveBy: A.leaveBy,
  rating: {}, links: { web: 'https://www.bud.hu/en', ta: null, book: null }, image: null, price: null,
});
applyMedia(airport);
validate(airport);
ids.set('airport', 'airport');

// ---- dishes
const dishes = R.food.dishes.map((d) => ({
  id: d.id, name: d.name, en: d.en, say: d.say, kind: d.kind, what: d.what,
  where: (d.where || []).filter((w) => {
    if (!ids.has(w)) { warnings.push(`dish ${d.id}: unknown place ${w}`); return false; }
    return true;
  }),
  whereText: d.whereText || null, image: d.image || null,
})).map(applyMedia);

// ---- plan: check refs
for (const day of trip.plan) {
  for (const it of day.items) {
    for (const r of [it.ref, ...(it.refs || [])].filter(Boolean)) {
      if (r !== 'base' && !ids.has(r)) warnings.push(`plan ${day.date} ${it.time}: unknown ref ${r}`);
    }
  }
}

// ---- practical (drop emoji; the app draws its own icons)
const practical = R.events.practical.map(({ emoji, ...s }) => s);

const out = {
  built: new Date().toISOString().slice(0, 10),
  trip: trip.trip,
  crew: trip.crew,
  flights: trip.flights || null,
  base: trip.base,
  plan: trip.plan,
  events,
  airport,
  places,
  dishes,
  practical,
  phrases: R.events.phrases,
  climate: R.events.weatherClimate,
  localEvents: R.events.localEvents,
  sparty: R.sights.sparty,
  stripWarning: R.bars.stripWarning,
  sources: [...new Set([...R.events.sources, ...R.bars.sources, ...(R.barsExtra.sources || []), ...R.food.sources, ...R.sights.sources,
    ...Object.values(ratings).flatMap((r) => r?.sources || [])])],
};

writeFileSync(join(root, 'data.js'),
  `// Generated by scripts/build-data.mjs from content/*.json. Edit those, not this.\nwindow.BB_DATA = ${JSON.stringify(out, null, 1)};\n`);

const count = (t) => places.filter((p) => p.type === t).length;
const rated = places.filter((p) => p.rating.g != null || p.rating.ta != null).length;
console.log(`ratings: ${rated}/${places.length} places have a verified score`);
const all = [...places, ...events, airport, ...dishes];
console.log(`photos: ${all.filter((x) => x.image).length}/${all.length} have a Commons photo, ${all.filter((x) => !x.image && x.wiki).length} more get a Wikipedia lead photo at runtime`);
for (const id of Object.keys(wiki)) if (!id.startsWith('_') && !all.some((x) => x.id === id)) warnings.push(`wiki.json: unknown id ${id}`);
console.log(`data.js: ${events.length} events, ${count('bar')} bars, ${count('food')} food, ${count('sight')} sights, ${count('bath')} baths, ${count('activity')} activities, ${dishes.length} dishes`);
if (warnings.length) { console.log(`\n${warnings.length} warning(s):`); for (const w of warnings) console.log(' - ' + w); }
