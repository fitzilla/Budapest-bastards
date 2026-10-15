// One-off: resolve a Google Maps short link and reverse-geocode it (the dev sandbox can't reach either).
import fs from 'node:fs';
const UA = 'Mozilla/5.0 (compatible; BastardsOnTour-geo-check/1.0; +https://github.com/fitzilla/Budapest-bastards)';
const out = { hops: [] };
let url = 'https://maps.app.goo.gl/7HFrrYRsWWryu2Q99?g_st=ic';
let body = '';
for (let i = 0; i < 8; i++) {
  const r = await fetch(url, { redirect: 'manual', headers: { 'User-Agent': UA, 'Accept-Language': 'en' } });
  out.hops.push({ status: r.status, url: url.slice(0, 400) });
  const loc = r.headers.get('location');
  if (!loc) { body = await r.text(); break; }
  url = new URL(loc, url).toString();
}
out.final = url;
const all = [url, body].join(' ');
const pick = (re) => { const m = all.match(re); return m ? { lat: +m[1], lng: +m[2] } : null; };
out.coords = { pin: pick(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/), at: pick(/@(-?\d+\.\d+),(-?\d+\.\d+)/), q: pick(/[?&](?:q|query|ll|center)=(-?\d+\.\d+)(?:,|%2C)(-?\d+\.\d+)/) };
const place = all.match(/\/maps\/place\/([^/@?"]+)/);
if (place) out.placeName = decodeURIComponent(place[1].replace(/\+/g, ' '));
const c = out.coords.pin || out.coords.q || out.coords.at;
if (c) {
  const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18&lat=${c.lat}&lon=${c.lng}`, { headers: { 'User-Agent': UA } });
  const j = await r.json(); out.reverse = { name: j.display_name, house: j.address?.house_number, road: j.address?.road };
}
fs.mkdirSync('image-check', { recursive: true });
fs.writeFileSync('image-check/geo.json', JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
