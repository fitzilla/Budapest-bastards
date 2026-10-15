// Every bar, pub, club and beer garden within RADIUS of the Airbnb from OpenStreetMap (Overpass),
// plus anything in the wider centre whose name or tags say rock/metal/punk. -> image-check/osm-bars.json
import fs from 'node:fs';
const LAT = 47.50305, LNG = 19.0657, RADIUS = 1600;
const UA = 'BastardsOnTour-osm-scan/1.0 (https://github.com/fitzilla/Budapest-bastards)';
const q = `[out:json][timeout:90];
(
  nwr["amenity"~"^(bar|pub|nightclub|biergarten|music_venue)$"](around:${RADIUS},${LAT},${LNG});
  nwr["amenity"~"^(bar|pub|nightclub|music_venue|cafe|restaurant)$"]["name"~"rock|metal|punk|blues|music|zene",i](around:6000,${LAT},${LNG});
  nwr["amenity"~"^(bar|pub|nightclub|music_venue|cafe)$"]["music"~"rock|metal|punk",i](around:6000,${LAT},${LNG});
);
out center tags;`;
const endpoints = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter', 'https://overpass.private.coffee/api/interpreter', 'https://maps.mail.ru/osm/tools/overpass/api/interpreter'];
let data = null; const errors = [];
for (const url of endpoints) {
  try {
    const r = await fetch(url, { method: 'POST', headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' }, body: 'data=' + encodeURIComponent(q) });
    const t = await r.text();
    if (!r.ok || t.trim()[0] !== '{') { errors.push(`${url}: ${r.status} ${t.slice(0, 200)}`); continue; }
    data = JSON.parse(t); data.endpoint = url; break;
  } catch (e) { errors.push(`${url}: ${e.message}`); }
}
const toRad = (d) => d * Math.PI / 180;
const dist = (a, b) => { const R = 6371000, dLa = toRad(b.lat - a.lat), dLo = toRad(b.lng - a.lng); const h = Math.sin(dLa / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLo / 2) ** 2; return Math.round(2 * R * Math.asin(Math.sqrt(h))); };
const rows = (data?.elements || []).map((e) => {
  const lat = e.lat ?? e.center?.lat, lng = e.lon ?? e.center?.lon, t = e.tags || {};
  return { name: t.name || null, amenity: t.amenity, lat, lng, m: dist({ lat: LAT, lng: LNG }, { lat, lng }),
    addr: [t['addr:street'], t['addr:housenumber']].filter(Boolean).join(' ') || null, postcode: t['addr:postcode'] || null,
    hours: t.opening_hours || null, web: t.website || t['contact:website'] || t['contact:facebook'] || null, music: t.music || null,
    cuisine: t.cuisine || null, live: t.live_music || null, desc: t.description || null, osm: `${e.type}/${e.id}` };
}).filter((r) => r.name).sort((a, b) => a.m - b.m);
fs.mkdirSync('image-check', { recursive: true });
fs.writeFileSync('image-check/osm-bars.json', JSON.stringify({ endpoint: data?.endpoint || null, errors, count: rows.length, rows }, null, 1));
console.log('osm-scan:', rows.length, 'places', errors.length ? 'errors: ' + errors.join(' | ') : '');
