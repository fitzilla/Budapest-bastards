// One-off geocoding from GitHub Actions (the dev sandbox can't reach OpenStreetMap).
import fs from 'node:fs';
const UA = 'BastardsOnTour-geo-check/1.0 (https://github.com/fitzilla/Budapest-bastards)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const out = {};
for (const q of ['Erzsébet körút 58, 1073 Budapest', 'Erzsébet krt. 58, Budapest, Hungary']) {
  const r = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&q=${encodeURIComponent(q)}`, { headers: { 'User-Agent': UA } });
  out[q] = (await r.json()).map((x) => ({ name: x.display_name, lat: +x.lat, lng: +x.lon, type: x.type, cls: x.category, house: x.address?.house_number, road: x.address?.road, postcode: x.address?.postcode }));
  await sleep(1500);
}
const s = await fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&street=' + encodeURIComponent('58 Erzsébet körút') + '&city=Budapest&country=Hungary', { headers: { 'User-Agent': UA } });
out.structured = (await s.json()).map((x) => ({ name: x.display_name, lat: +x.lat, lng: +x.lon, type: x.type, house: x.address?.house_number }));
fs.mkdirSync('image-check', { recursive: true });
fs.writeFileSync('image-check/geo.json', JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
