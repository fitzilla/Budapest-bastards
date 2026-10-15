// Batch geocoding from GitHub Actions (the dev sandbox can't reach OpenStreetMap).
// geo-queries.json: [{ id, name, address }] -> image-check/geo.json with the best OSM match per place
import fs from 'node:fs';
const UA = 'BastardsOnTour-geo-check/1.0 (https://github.com/fitzilla/Budapest-bastards)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const list = fs.existsSync('geo-queries.json') ? JSON.parse(fs.readFileSync('geo-queries.json', 'utf8')) : [];
const out = {};
const search = async (q) => {
  const r = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=3&countrycodes=hu&q=${encodeURIComponent(q)}`, { headers: { 'User-Agent': UA } });
  const j = await r.json(); await sleep(1100);
  return j.map((x) => ({ name: x.display_name, lat: +x.lat, lng: +x.lon, type: x.type, house: x.address?.house_number, road: x.address?.road }));
};
for (const p of list) {
  const byName = await search(`${p.name}, Budapest`);
  const byAddr = await search(p.address);
  out[p.id] = { byName, byAddr };
}
fs.mkdirSync('image-check', { recursive: true });
fs.writeFileSync('image-check/geo.json', JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1).slice(0, 4000));
