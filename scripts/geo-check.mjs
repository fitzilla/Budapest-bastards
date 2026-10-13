// One-off geocoding from GitHub Actions (the dev sandbox can't reach OpenStreetMap).
import fs from 'node:fs';
const UA = 'BastardsOnTour-geo-check/1.0 (https://github.com/fitzilla/Budapest-bastards)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const out = {};
const nom = async (q) => {
  const r = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&q=${encodeURIComponent(q)}`, { headers: { 'User-Agent': UA } });
  return (await r.json()).map((x) => ({ name: x.display_name, lat: +x.lat, lng: +x.lon, type: x.type, cls: x.category }));
};
for (const q of ['Király utca 67, Budapest', 'Lemezkuckó, Budapest', 'Erzsébet körút, 1073 Budapest']) { out[q] = await nom(q); await sleep(1500); }
// the junction and the whole run of Erzsébet körút, from Overpass
const oq = `[out:json][timeout:25];
area["name"="Budapest"]["admin_level"="8"]->.b;
way(area.b)["name"="Erzsébet körút"]["highway"]->.e;
way(area.b)["name"="Király utca"]["highway"]->.k;
node(w.e)(w.k)->.x;
.x out;
.e out geom;`;
try {
  const r = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'data=' + encodeURIComponent(oq) });
  const j = await r.json();
  out.junction = j.elements.filter((e) => e.type === 'node').map((n) => ({ lat: n.lat, lng: n.lon }));
  out.erzsebetWays = j.elements.filter((e) => e.type === 'way').map((w) => ({ id: w.id, tags: { highway: w.tags.highway, oneway: w.tags.oneway }, from: w.geometry[0], to: w.geometry[w.geometry.length - 1] }));
} catch (e) { out.overpassError = String(e.message); }
fs.mkdirSync('image-check', { recursive: true });
fs.writeFileSync('image-check/geo.json', JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1).slice(0, 3000));
