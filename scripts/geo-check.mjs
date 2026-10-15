import fs from 'node:fs';
const UA = 'BastardsOnTour-geo-check/1.0 (https://github.com/fitzilla/Budapest-bastards)';
const out = {};
for (const q of ['Erzsébet körút 41, 1073 Budapest', 'Trap Café, Budapest']) {
  const r = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=4&q=${encodeURIComponent(q)}`, { headers: { 'User-Agent': UA } });
  out[q] = (await r.json()).map((x) => ({ name: x.display_name, lat: +x.lat, lng: +x.lon, type: x.type, house: x.address?.house_number }));
  await new Promise((r) => setTimeout(r, 1500));
}
fs.mkdirSync('image-check', { recursive: true });
fs.writeFileSync('image-check/geo.json', JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
