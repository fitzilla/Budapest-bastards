/* Bastards on Tour — the lads' Budapest app. Vanilla JS, no build step. */
(() => {
  'use strict';

  const D = window.BB_DATA;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const app = $('#app');

  /* ---------------- storage (every access can throw in private mode) ---------------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem('bb.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('bb.' + k, JSON.stringify(v)); } catch { /* ignore */ } },
    del(k) { try { localStorage.removeItem('bb.' + k); } catch { /* ignore */ } },
  };
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const desktopMQ = matchMedia('(min-width: 1000px)');
  const darkMQ = matchMedia('(prefers-color-scheme: dark)');
  const isDark = () => {
    const t = document.documentElement.dataset.theme;
    return t ? t === 'dark' : darkMQ.matches;
  };

  /* ---------------- tiny helpers ---------------- */
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const fmtInt = (n) => (n == null ? '' : n >= 10000 ? Math.round(n / 1000) + 'k' : n.toLocaleString('en-GB'));
  const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
  const TZ = D.trip.utcOffset || '+02:00';
  const at = (date, time) => new Date(`${date}T${time}:00${TZ}`);
  const DAY_FMT = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Europe/Budapest' });
  const WEEKDAY = new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'Europe/Budapest' });
  const now = () => new Date();

  /* ---------------- icons (24px line set) ---------------- */
  const I = {
    search: '<circle cx="11" cy="11" r="7.5"/><path d="m20.5 20.5-4.2-4.2"/>',
    heart: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"/>',
    share: '<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="m16 6-4-4-4 4"/><path d="M12 2v13"/>',
    map: '<path d="M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20z"/><path d="M9 4v13.5M15 6.5V20"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    back: '<path d="m15 18-6-6 6-6"/>',
    chev: '<path d="m9 18 6-6-6-6"/>',
    star: '<path d="m12 2.8 2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z"/>',
    compass: '<circle cx="12" cy="12" r="9.5"/><path d="m16 8-2.2 5.8L8 16l2.2-5.8z"/>',
    ticket: '<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2M13 11v2M13 17v2"/>',
    guitar: '<path d="m11.9 12.1 5.6-5.6"/><path d="m17 4 3 3"/><path d="M19 2.5 21.5 5"/><path d="M8.6 9.4c.6-1 1.6-1.6 2.7-1.6a4.8 4.8 0 0 1 4.9 4.9c0 1.1-.6 2.1-1.6 2.7l-.8.4a2 2 0 0 0-1.1 1.6 4.2 4.2 0 0 1-4.2 4.1A6 6 0 0 1 2.5 15.5a4.2 4.2 0 0 1 4.1-4.2 2 2 0 0 0 1.6-1.1z"/><path d="m6 15.5 2.5 2.5"/>',
    beer: '<path d="M17 11h1a3 3 0 0 1 0 6h-1"/><path d="M9 12v6M13 12v6"/><path d="M14 7.5c-1 0-1.4.5-3 .5s-2-.5-3-.5-1.7.5-2.5.5a2.5 2.5 0 0 1 0-5c.8 0 1.6.5 2.5.5S9.4 2 11 2s2 1.5 3 1.5 1.7-.5 2.5-.5a2.5 2.5 0 0 1 0 5c-.8 0-1.5-.5-2.5-.5Z"/><path d="M5 8v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8"/>',
    brick: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M12 3v6M8 9v6M16 9v6M12 15v6"/>',
    sparkles: '<path d="M10 15.5a2 2 0 0 0-1.5-1.4l-6-1.6a.5.5 0 0 1 0-1l6-1.6A2 2 0 0 0 10 8.5l1.5-6a.5.5 0 0 1 1 0L14 8.5a2 2 0 0 0 1.5 1.4l6 1.6a.5.5 0 0 1 0 1l-6 1.6a2 2 0 0 0-1.5 1.4l-1.5 6a.5.5 0 0 1-1 0z"/>',
    martini: '<path d="M8 22h8M12 11v11M19 3l-7 8-7-8Z"/>',
    bottle: '<path d="M10 2h4v4.2l2 3V21a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V9.2l2-3z"/><path d="M8 13h8M8 17h8"/>',
    tv: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="m17 2-5 5-5-5"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    utensils: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
    soup: '<path d="M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z"/><path d="M7 21h10M19.5 12 22 6"/><path d="M16 3c.3.1.8.5.7 1.4 0 .8-.9 1.2-1 2-.1.8.3 1.2.7 1.6M11 3c.3.1.8.5.7 1.4 0 .8-.9 1.2-1 2-.1.8.3 1.2.7 1.6M6 3c.3.1.8.5.7 1.4 0 .8-.9 1.2-1 2-.1.8.3 1.2.7 1.6"/>',
    landmark: '<path d="M3 22h18M6 18v-7M10 18v-7M14 18v-7M18 18v-7M12 2l8 5H4z"/>',
    waves: '<path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5s2.4 2 5 2 2.5-2 5-2c1.3 0 1.9.5 2.5 1M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2s2.4 2 5 2 2.5-2 5-2c1.3 0 1.9.5 2.5 1M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2s2.4 2 5 2 2.5-2 5-2c1.3 0 1.9.5 2.5 1"/>',
    zap: '<path d="M4 14a1 1 0 0 1-.8-1.6l9.9-10.2a.5.5 0 0 1 .9.5l-1.9 6A1 1 0 0 0 13 10h7a1 1 0 0 1 .8 1.6l-9.9 10.2a.5.5 0 0 1-.9-.5l1.9-6A1 1 0 0 0 11 14z"/>',
    eighteen: '<circle cx="12" cy="12" r="9.5"/><path d="M7.5 9.5 9 8.5v7M13.2 11.8a1.6 1.6 0 1 1 0-3.3 1.6 1.6 0 0 1 0 3.3Zm0 0a1.85 1.85 0 1 1 0 3.7 1.85 1.85 0 0 1 0-3.7ZM17 10.5v3M15.5 12h3"/>',
    calendar: '<rect x="3" y="4.5" width="18" height="16.5" rx="2.5"/><path d="M16 2.5v4M8 2.5v4M3 10h18"/>',
    info: '<circle cx="12" cy="12" r="9.5"/><path d="M12 16.5v-5M12 7.6v.1"/>',
    home: '<path d="m3 9.5 9-7 9 7V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
    plane: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
    flag: '<path d="M4 22V4"/><path d="M4 4h16l-3 4.5 3 4.5H4"/><path d="M8 4v9M12 4v9M16 4v9" stroke-dasharray="2 2"/>',
    ball: '<circle cx="12" cy="12" r="9.5"/><path d="m12 7.2 4 2.9-1.5 4.7h-5L8 10.1z"/><path d="M12 2.5v4.7M16 10.1l5-1.6M14.5 14.8l3 4.1M9.5 14.8l-3 4.1M8 10.1 3 8.5"/>',
    nav: '<path d="M3 11 22 2l-9 19-2-8z"/>',
    ext: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    clock: '<circle cx="12" cy="12" r="9.5"/><path d="M12 6.5V12l3.5 2"/>',
    pin: '<path d="M20 10c0 5-5.5 10.2-7.4 11.8a1 1 0 0 1-1.2 0C9.5 20.2 4 15 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
    walk: '<circle cx="13.5" cy="4" r="2"/><path d="m9 21 2.5-6 3 3v3"/><path d="m6.5 12.5 2-4.5 4.5 1 2.5 3.5h3"/><path d="m11.5 15-.5-6"/>',
    cube: '<path d="M21 8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.7Z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/>',
    locate: '<path d="M2 12h3M19 12h3M12 2v3M12 19v3"/><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.5"/>',
    play: '<path d="M7 4.5v15a1 1 0 0 0 1.5.9l12-7.5a1 1 0 0 0 0-1.8l-12-7.5A1 1 0 0 0 7 4.5Z"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
    fit: '<path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/>',
    copy: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M4 16a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2"/>',
    car: '<path d="M19 17h2a1 1 0 0 0 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4a1 1 0 0 0 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
    tram: '<rect x="4" y="3" width="16" height="16" rx="2"/><path d="M4 11h16M12 3v8M8 19l-2 3M18 22l-2-3M8 15h.01M16 15h.01"/>',
    money: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>',
    phone: '<rect x="5" y="2" width="14" height="20" rx="2.5"/><path d="M12 18h.01"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.7 9a1 1 0 0 1-.6 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.6 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z"/><path d="M12 8v4M12 16h.01"/>',
    siren: '<path d="M7 18v-6a5 5 0 0 1 10 0v6"/><path d="M5 21a1 1 0 0 1-1-1v-1a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1zM21 12h1M18.5 4.5 18 5M2 12h1M12 2v1M4.9 4.9l.7.7"/>',
    plug: '<path d="M12 22v-5M9 8V2M15 8V2M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/>',
    chat: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"/>',
    cloudsun: '<path d="M12 2v2M4.9 4.9l1.4 1.4M20 12h2M19.1 4.9l-1.4 1.4M15.9 12.6a4 4 0 0 0-5.9-4.1"/><path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z"/>',
    cloud: '<path d="M17.5 19H9a7 7 0 1 1 6.7-9h1.8a4.5 4.5 0 1 1 0 9Z"/>',
    rain: '<path d="M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2"/><path d="M16 14v6M8 14v6M12 16v6"/>',
    fog: '<path d="M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2"/><path d="M16 17H7M17 21H9"/>',
    storm: '<path d="M6 16.3A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 .5 9"/><path d="m13 12-3 5h4l-3 5"/>',
    snow: '<path d="M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2"/><path d="M8 15h.01M8 19h.01M12 17h.01M12 21h.01M16 15h.01M16 19h.01"/>',
    globe: '<circle cx="12" cy="12" r="9.5"/><path d="M2.5 12h19M12 2.5a14.5 14.5 0 0 1 0 19 14.5 14.5 0 0 1 0-19"/>',
    camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3.5"/>',
    history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.7 2.8L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/>',
    alert: '<path d="m21.7 18-8-14a2 2 0 0 0-3.5 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3"/><path d="M12 9v4M12 17h.01"/>',
    bookmark: '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
    award: '<circle cx="12" cy="8.5" r="6"/><path d="M15.5 13.4 17 22l-5-3-5 3 1.5-8.6"/>',
    tag: '<path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4z"/><circle cx="7.5" cy="7.5" r="1.2"/>',
  };
  const icon = (name, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${I[name] || I.pin}</svg>`;

  /* ---------------- data model ---------------- */
  const has = (p, t) => p.tags?.includes(t);
  const hasAny = (p, ts) => ts.some((t) => has(p, t));
  const is = (p, type) => p.type === type || p.also?.includes(type);

  function kindOf(p) {
    if (p.type === 'event') return /fradi/.test(p.id) ? 'fradi' : /mtk/.test(p.id) ? 'mtk' : 'kart';
    if (p.type === 'bar' && hasAny(p, ['rock', 'metal'])) return 'rock';
    return p.type;
  }
  const KIND_ICON = { fradi: 'ball', mtk: 'ball', kart: 'flag', rock: 'guitar', bar: 'beer', food: 'utensils', sight: 'landmark', bath: 'waves', activity: 'zap', travel: 'plane', base: 'home' };
  const KIND_COLOR = { fradi: 'fradi', mtk: 'mtk', kart: 'event', rock: 'rock', bar: 'bar', food: 'food', sight: 'sight', bath: 'bath', activity: 'activity', travel: 'travel', base: 'base' };
  const iconOf = (p) => KIND_ICON[kindOf(p)] || 'pin';
  const colorVar = (p) => {
    const k = kindOf(p);
    if (k === 'base') return 'var(--paprika)';
    if (k === 'travel') return '#4a4440';
    return `var(--${{ fradi: 'fradi', mtk: 'mtk' }[k] || 'c-' + KIND_COLOR[k]})`;
  };

  function labelOf(p) {
    const t = p.tags || [];
    switch (p.type) {
      case 'event': return 'Booked';
      case 'travel': return 'Airport';
      case 'base': return 'Where we’re staying';
      case 'bar':
        if (t.includes('metal')) return 'Metal bar';
        if (t.includes('rock')) return t.includes('club') ? 'Rock club' : 'Rock bar';
        if (t.includes('ruin-bar')) return 'Ruin bar';
        if (t.includes('rooftop')) return 'Rooftop bar';
        if (t.includes('speakeasy')) return 'Speakeasy';
        if (t.includes('cocktail')) return 'Cocktail bar';
        if (t.includes('craft-beer')) return 'Craft beer';
        if (t.includes('sports')) return 'Sports bar';
        if (t.includes('club')) return 'Club';
        if (t.includes('live-music')) return 'Live music';
        return t.includes('quirky') ? 'Odd bar' : 'Bar';
      case 'food':
        if (p.also?.includes('bar')) return 'Ruin bar & kitchen';
        if (t.includes('michelin')) return 'Michelin Guide';
        if (t.includes('market')) return 'Market';
        if (t.includes('langos')) return 'Lángos';
        if (t.includes('street-food')) return 'Street food';
        if (t.includes('brunch')) return 'Brunch';
        if (t.includes('burger')) return 'Burgers';
        if (t.includes('steak')) return 'Steak & BBQ';
        if (t.includes('pizza')) return 'Pizza';
        if (t.includes('dessert')) return 'Cake & sweets';
        if (t.includes('jewish')) return 'Jewish Quarter kitchen';
        return 'Hungarian';
      case 'sight':
        if (t.includes('castle')) return 'Castle';
        if (t.includes('church')) return 'Church';
        if (t.includes('museum')) return 'Museum';
        if (t.includes('viewpoint')) return 'Viewpoint';
        return 'Landmark';
      case 'bath': return t.includes('sparty') ? 'Bath party' : 'Thermal bath';
      case 'activity':
        if (t.includes('shooting')) return 'Shooting range';
        if (t.includes('escape-room')) return 'Escape room';
        if (t.includes('cruise')) return 'River cruise';
        if (t.includes('beer-bike')) return 'Beer bus';
        if (t.includes('market')) return 'Market';
        if (t.includes('adrenaline')) return 'Adrenaline';
        if (t.includes('tour')) return 'Tour';
        return 'Things to do';
      default: return '';
    }
  }

  const TAG_LABEL = {
    'ruin-bar': 'Ruin bar', 'live-music': 'Live music', 'craft-beer': 'Craft beer', 'late-night': 'Open late',
    'booking-needed': 'Book ahead', 'group-friendly': 'Good for groups', 'street-food': 'Street food',
    'fine-dining': 'Fine dining', 'night-bathing': 'Night bathing', 'escape-room': 'Escape room',
    'beer-bike': 'Beer bus', ww2: 'WW2', langos: 'Lángos', palinka: 'Pálinka', michelin: 'Michelin Guide',
    sparty: 'Sparty', cheap: 'Cheap', quirky: 'Odd', speakeasy: 'Speakeasy',
  };
  const tagLabel = (t) => TAG_LABEL[t] || t.charAt(0).toUpperCase() + t.slice(1).replace(/-/g, ' ');
  const HIDDEN_TAGS = new Set(['booked', 'travel', 'bath', 'pub']);

  /* base (the Airbnb): data file wins, then this phone's own pin */
  function getBase() {
    const b = { ...D.base };
    if (b.lat == null || b.lng == null) {
      const local = store.get('base', null);
      if (local && typeof local.lat === 'number') Object.assign(b, { lat: local.lat, lng: local.lng, localPin: true });
    }
    return {
      id: 'base', type: 'base', name: b.name || 'The Airbnb',
      sub: b.address || (b.localPin ? 'Pinned on this phone' : b.near ? `Near ${b.near} · exact address TBC` : 'Address TBC'),
      address: b.address, lat: b.lat ?? null, lng: b.lng ?? null, localPin: !!b.localPin,
      approx: !b.address && !b.localPin && b.lat != null, near: b.near || null,
      tags: [], rating: {}, links: { web: b.listing || null }, checkIn: b.checkIn, note: b.note,
      hidePin: b.lat == null,
    };
  }
  let BASE = getBase();

  const NEAR_WALK_MIN = 15;
  const walkMin = (a, b) => Math.round((km(a, b) * 1.25 / 4.8) * 60);
  const nearFlat = (p) => BASE.lat != null && p.type !== 'base' && p.type !== 'event' && p.type !== 'travel' && p.lat != null && !p.hidePin && walkMin(BASE, p) <= NEAR_WALK_MIN;

  const PLACES = D.places;
  const EVENTS = D.events;
  const AIRPORT = D.airport;
  const byId = new Map();
  function reindex() {
    byId.clear();
    for (const p of [...EVENTS, AIRPORT, BASE, ...PLACES]) byId.set(p.id, p);
  }
  reindex();
  const allItems = () => [...EVENTS, AIRPORT, BASE, ...PLACES];
  const dishPlaceIds = new Set(D.dishes.flatMap((d) => d.where));

  // the gold badge, worded for what the place is
  const mustLabel = (p) => (!p.must ? '' : is(p, 'bar') ? 'Must visit' : p.type === 'sight' ? 'Must see' : p.type === 'food' ? 'Must eat' : 'Must do');

  /* ---------------- categories ---------------- */
  const CATS = [
    { id: 'all', label: 'All', icon: 'compass', test: (p) => p.type !== 'base' || !p.hidePin },
    { id: 'must', label: 'Must-sees', icon: 'award', test: (p) => !!p.must },
    { id: 'near', label: 'Near the flat', icon: 'home', needsBase: true, sort: 'dist', test: (p) => nearFlat(p) && !p.closed },
    { id: 'top', label: 'Top bars', icon: 'star', test: (p) => !!p.pick },
    { id: 'booked', label: 'Booked', icon: 'ticket', test: (p) => p.type === 'event' || p.type === 'travel' || p.type === 'base', sort: 'time' },
    { id: 'rock', label: 'Rock bars', icon: 'guitar', test: (p) => p.type === 'bar' && hasAny(p, ['rock', 'metal']) },
    { id: 'bars', label: 'All bars', icon: 'beer', test: (p) => is(p, 'bar') },
    { id: 'ruin', label: 'Ruin bars', icon: 'brick', test: (p) => is(p, 'bar') && has(p, 'ruin-bar') },
    { id: 'odd', label: 'Odd bars', icon: 'sparkles', test: (p) => p.type === 'bar' && hasAny(p, ['quirky', 'speakeasy', 'games']) },
    { id: 'rooftops', label: 'Rooftops & cocktails', icon: 'martini', test: (p) => p.type === 'bar' && hasAny(p, ['cocktail', 'rooftop', 'speakeasy']) },
    { id: 'late', label: 'Late & clubs', icon: 'moon', test: (p) => is(p, 'bar') && hasAny(p, ['club', 'late-night']) },
    { id: 'sports', label: 'Sports & beer', icon: 'tv', test: (p) => p.type === 'bar' && hasAny(p, ['sports', 'craft-beer']) },
    { id: 'eat', label: 'Eat', icon: 'utensils', test: (p) => p.type === 'food' },
    { id: 'dishes', label: 'Must-try food', icon: 'soup', dishes: true, test: (p) => dishPlaceIds.has(p.id) },
    { id: 'history', label: 'History', icon: 'landmark', test: (p) => is(p, 'sight') },
    { id: 'baths', label: 'Baths', icon: 'waves', test: (p) => p.type === 'bath' },
    { id: 'do', label: 'Things to do', icon: 'zap', test: (p) => p.type === 'activity' },
  ];
  const catById = new Map(CATS.map((c) => [c.id, c]));

  /* ---------------- state ---------------- */
  const state = {
    tab: 'explore',
    cat: 'all',
    q: '',
    view: 'list',
    filters: { tags: new Set(), price: new Set(), late: false, rated: false, sort: 'rec' },
    selected: null,
    faves: new Set(store.get('faves', [])),
    userLoc: null,
    onlyFaves: false,
    pendingSelect: null,
  };
  const filterCount = () => state.filters.tags.size + state.filters.price.size + (state.filters.late ? 1 : 0) + (state.filters.rated ? 1 : 0) + (state.filters.sort !== 'rec' ? 1 : 0);

  /* ---------------- distance ---------------- */
  const DEAK = { lat: 47.4979, lng: 19.0544 };
  function origin() {
    if (BASE.lat != null) return { ...BASE, label: BASE.approx ? 'the flat (roughly)' : 'the Airbnb' };
    if (state.userLoc) return { ...state.userLoc, label: 'you' };
    return { ...DEAK, label: 'Deák tér' };
  }
  function km(a, b) {
    const R = 6371, toR = (d) => (d * Math.PI) / 180;
    const dLat = toR(b.lat - a.lat), dLng = toR(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(toR(a.lat)) * Math.cos(toR(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  function distOf(p) { return p.lat == null || p.hidePin ? null : km(origin(), p); }
  function distText(p, long = false) {
    const d = distOf(p);
    if (d == null) return '';
    const o = origin().label;
    if (d < 0.08) return long ? `Right by ${o}` : 'Right here';
    const walk = Math.round((d * 1.25 / 4.8) * 60);
    if (walk <= 35) return long ? `${walk} min walk from ${o}` : `${walk} min walk`;
    const drive = Math.round(d / 28 * 60 + 6);
    return long ? `${d.toFixed(1)} km from ${o}, about ${drive} min by Bolt` : `${d.toFixed(1)} km · ~${drive} min by car`;
  }

  /* ---------------- ratings ---------------- */
  function score(p) { const r = p.rating || {}; return r.g ?? r.ta ?? null; }
  function reviews(p) { const r = p.rating || {}; return r.g != null ? r.gN : r.taN; }
  function ratingBadge(p) {
    const s = score(p);
    if (s == null) return '';
    const n = reviews(p);
    return `<span class="card-rating">${icon('star', 'ic-fill')}${s.toFixed(1)}${n ? `<span class="card-rating-n">(${fmtInt(n)})</span>` : ''}</span>`;
  }
  const priceText = (n) => (n ? '£'.repeat(n) : '');

  /* ---------------- links ---------------- */
  const placeQuery = (p) => (p.address ? `${p.venue || p.name}, ${p.address}` : p.lat != null ? `${p.lat},${p.lng}` : `${p.name}, Budapest`);
  const gmapsUrl = (p) => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(placeQuery(p));
  const gdirUrl = (p) => 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(placeQuery(p));
  const taUrl = (p) => p.links?.ta || 'https://www.tripadvisor.co.uk/Search?q=' + encodeURIComponent(`${p.name} Budapest`);
  const shareUrl = (id) => location.href.split('#')[0] + '#/p/' + id;

  /* ---------------- media ---------------- */
  // real photos: the item's own Commons photo first, else its Wikipedia article's lead image (fetched at runtime)
  const runtimeImg = new Map();
  const imgOf = (p) => p.image || runtimeImg.get(p.id) || null;
  const imgTag = (u, pid) => `<img src="${esc(u)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-pid="${esc(pid)}" onload="this.classList.add('ok')" onerror="window.__bbImgFail(this)">`;
  window.__bbImgFail = (img) => {
    const alt = runtimeImg.get(img.dataset.pid);
    if (alt && img.getAttribute('src') !== alt && !img.dataset.retried) { img.dataset.retried = '1'; img.src = alt; }
    else { if (img.nextElementSibling?.classList.contains('media-note')) img.nextElementSibling.remove(); img.remove(); }
  };
  // the photo's own Commons/Wikipedia page, which carries the photographer and licence
  function filePage(u) {
    if (!u) return null;
    let m = u.match(/commons\.wikimedia\.org\/wiki\/Special:FilePath\/([^?#]+)/);
    if (m) return 'https://commons.wikimedia.org/wiki/File:' + m[1];
    m = u.match(/upload\.wikimedia\.org\/wikipedia\/([a-z]+)\/(?:thumb\/)?[0-9a-f]\/[0-9a-f]{2}\/([^/?#]+)/);
    if (m) return (m[1] === 'commons' ? 'https://commons.wikimedia.org' : `https://${m[1]}.wikipedia.org`) + '/wiki/File:' + m[2];
    return null;
  }
  async function loadWikiImages() {
    const items = [...EVENTS, AIRPORT, ...PLACES, ...D.dishes].filter((x) => x.wiki);
    const cache = store.get('wikiimg', {});
    const key = (x) => x.wiki;
    const fresh = (e) => e && Date.now() - e.t < 7 * 864e5;
    const apply = () => { for (const x of items) { const c = cache[key(x)]; if (c?.u) runtimeImg.set(x.id, c.u); } paintImages(); };
    apply();
    const byLang = new Map();
    for (const x of items) {
      if (fresh(cache[key(x)])) continue;
      const lang = x.wiki.startsWith('hu:') ? 'hu' : 'en';
      if (!byLang.has(lang)) byLang.set(lang, new Set());
      byLang.get(lang).add(lang === 'hu' ? x.wiki.slice(3) : x.wiki);
    }
    for (const [lang, set] of byLang) {
      const titles = [...set];
      for (let i = 0; i < titles.length; i += 40) {
        const chunk = titles.slice(i, i + 40);
        try {
          const r = await fetch(`https://${lang}.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&origin=*&redirects=1&prop=pageimages&piprop=thumbnail&pithumbsize=960&titles=${encodeURIComponent(chunk.join('|'))}`);
          if (!r.ok) continue;
          const q = (await r.json()).query || {};
          const hop = new Map([...(q.normalized || []), ...(q.redirects || [])].map((n) => [n.from, n.to]));
          const thumbs = new Map((q.pages || []).map((pg) => [pg.title, pg.thumbnail?.source || null]));
          for (const t of chunk) {
            let k = t;
            for (let n = 0; n < 3 && hop.has(k); n++) k = hop.get(k);
            cache[(lang === 'hu' ? 'hu:' : '') + t] = { u: thumbs.get(k) || null, t: Date.now() };
          }
        } catch { /* offline: try again next launch */ }
      }
    }
    store.set('wikiimg', cache);
    apply();
  }
  // drop freshly fetched photos into placeholders that are already on screen
  function paintImages() {
    $$('.ph[data-pid]').forEach((ph) => {
      const u = runtimeImg.get(ph.dataset.pid);
      if (!u || ph.parentElement.querySelector('img')) return;
      ph.insertAdjacentHTML('afterend', imgTag(u, ph.dataset.pid));
    });
  }

  function media(p, { top } = {}) {
    const c = colorVar(p);
    const ph = `<div class="ph" data-pid="${esc(p.id)}" style="--c:${c}">
      <span class="ph-top">${esc(top ?? (p.district ? 'District ' + p.district : labelOf(p)))}</span>
      ${icon(iconOf(p), 'ph-ic')}
      <span class="ph-name">${esc(p.name)}</span>
    </div>`;
    const u = imgOf(p);
    if (!u) return ph;
    return ph + imgTag(u, p.id) + (p.imageKind === 'illustrative' ? '<span class="media-note">Illustrative</span>' : '');
  }

  /* ---------------- favourites ---------------- */
  const isFav = (id) => state.faves.has(id);
  function toggleFav(id, btn) {
    if (state.faves.has(id)) state.faves.delete(id); else state.faves.add(id);
    store.set('faves', [...state.faves]);
    const on = state.faves.has(id);
    $$(`[data-fav="${CSS.escape(id)}"]`).forEach((b) => {
      b.setAttribute('aria-pressed', on);
      b.setAttribute('aria-label', on ? 'Remove from faves' : 'Save to faves');
      if (on && !reduceMotion.matches) { b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); }
    });
    updateFavCount();
    toast(on ? `Saved to Faves` : `Removed from Faves`);
    if (state.tab === 'faves') renderFaves();
    if (!desktopMQ.matches || state.tab === 'faves') syncMarkers();
  }
  function updateFavCount() {
    const el = $('#favCount');
    el.textContent = state.faves.size;
    el.hidden = state.faves.size === 0;
  }
  const heartBtn = (p, cls = 'heart') =>
    `<button type="button" class="${cls}" data-fav="${esc(p.id)}" aria-pressed="${isFav(p.id)}" aria-label="${isFav(p.id) ? 'Remove from faves' : 'Save to faves'}"><svg viewBox="0 0 24 24" aria-hidden="true" class="ic">${I.heart}</svg></button>`;

  /* ---------------- cards ---------------- */
  function badgeFor(p) {
    if (p.type === 'event') return '<span class="card-badge is-booked">Booked</span>';
    if (p.closed) return '<span class="card-badge is-closed">Closed</span>';
    if (p.must) return `<span class="card-badge is-must">${icon('award', 'ic-sm')}${mustLabel(p)}</span>`;
    if (p.pick) return '<span class="card-badge">Top bar</span>';
    const r = p.rating || {};
    if (((r.g ?? 0) >= 4.6 && (r.gN ?? 0) >= 1000) || ((r.ta ?? 0) >= 4.5 && (r.taN ?? 0) >= 2000)) return '<span class="card-badge">Crowd favourite</span>';
    if (has(p, 'sparty')) return '<span class="card-badge">Sat 17 Oct</span>';
    if (nearFlat(p)) return `<span class="card-badge">${walkMin(BASE, p) <= 5 ? 'On the doorstep' : 'Near the flat'}</span>`;
    return '';
  }
  function cardLines(p, { long } = {}) {
    const lines = [];
    if (p.type === 'event') {
      const d = at(p.date, p.start || '00:00');
      lines.push(`<p class="card-line"><b>${esc(DAY_FMT.format(d))} · ${esc(p.start || 'TBC')}</b></p>`);
      lines.push(`<p class="card-line">${esc(p.venue)}</p>`);
      if (whoLabel(p.who)) lines.push(`<p class="card-line">${esc(whoLabel(p.who))}</p>`);
      return lines.join('');
    }
    if (p.type === 'base') {
      lines.push(`<p class="card-line">${esc(p.sub)}</p>`);
      return lines.join('');
    }
    const where = p.district ? `District ${p.district}` : p.sub || '';
    lines.push(`<p class="card-line">${esc(labelOf(p))}${where ? ' · ' + esc(where) : ''}</p>`);
    const bits = [distText(p), priceText(p.price)].filter(Boolean).join(' · ');
    if (bits) lines.push(`<p class="card-line">${esc(bits)}</p>`);
    if (long && p.blurb) lines.push(`<p class="card-line clamp">${esc(p.blurb)}</p>`);
    return lines.join('');
  }
  function card(p, opts = {}) {
    return `<article class="card" data-id="${esc(p.id)}">
      <a class="card-link" href="#/p/${esc(p.id)}" aria-label="${esc(p.name)}"></a>
      <div class="card-media">${media(p)}${badgeFor(p)}${p.type === 'base' ? '' : heartBtn(p)}</div>
      <div class="card-body">
        <div class="card-top"><h3 class="card-title">${esc(p.name)}</h3>${ratingBadge(p)}</div>
        ${cardLines(p, opts)}
      </div>
    </article>`;
  }
  function dishCard(d) {
    const fake = { id: d.id, name: d.name, type: d.kind === 'drink' ? 'bar' : 'food', tags: [], image: d.image };
    const where = d.where.map((id) => byId.get(id)).filter(Boolean);
    return `<article class="dish">
      <div class="card-media">${media(fake, { top: d.en })}</div>
      <div class="dish-body">
        <h3 class="dish-name">${esc(d.name)}</h3>
        <p class="dish-say">${esc(d.en)} · say “${esc(d.say)}”</p>
        <p class="dish-what">${esc(d.what)}</p>
        ${where.length ? `<div class="dish-where">${where.map((p) => `<a class="chip chip-sm" href="#/p/${esc(p.id)}">${esc(p.name)}</a>`).join('')}</div>` : d.whereText ? `<p class="card-line">${esc(d.whereText)}</p>` : ''}
      </div>
    </article>`;
  }

  /* ---------------- who ---------------- */
  function whoLabel(who) {
    if (!who || who === 'all') return '';
    if (who.only) return who.only.length === 1 ? `Just ${who.only[0]}` : who.only.slice(0, -1).join(', ') + ' & ' + who.only.at(-1);
    if (who.except) return `Everyone but ${who.except.join(' & ')}`;
    return '';
  }

  /* ---------------- trip times (one source: content/trip.json) ---------------- */
  const hm = (iso) => String(iso || '').slice(11, 16);
  const LAND = hm(D.trip.landing), AIRPORT_BY = hm(D.trip.airportBy);

  /* ---------------- flights ---------------- */
  const FL = D.flights || {};
  const flightOf = (it) => (it.flight ? FL[it.flight] : null);
  const trackUrl = (n) => 'https://www.flightradar24.com/data/flights/' + encodeURIComponent(String(n).replace(/\s+/g, '').toLowerCase());
  function flightChip(it) {
    const f = flightOf(it);
    if (!f) return '';
    if (!f.number) return `<span class="badge badge-idea">${icon('plane', 'ic-sm')}Flight no. TBC</span>`;
    return `<a class="badge badge-flight" href="${esc(trackUrl(f.number))}" target="_blank" rel="noopener">${icon('plane', 'ic-sm')}${esc(f.number)}</a>`;
  }
  function flightLine(f, dir) {
    if (!f?.number) return null;
    const where = dir === 'out' ? (f.from ? ` from ${f.from}` : '') : (f.to ? ` to ${f.to}` : '');
    const when = dir === 'out'
      ? `${f.departs ? `, departs ${f.departs} Irish time` : ''}, lands ${LAND}`
      : `${f.departs ? `, departs ${f.departs}` : ''}${f.arrives ? `, lands ${f.arrives} Irish time` : ''}`;
    return `${f.number}${where}${when}`;
  }

  /* ---------------- plan timeline helpers ---------------- */
  const PLAN = D.plan.flatMap((day) => day.items.map((it, i) => ({ ...it, date: day.date, at: at(day.date, it.time), key: `${day.date}-${i}` })));
  function nextUp() {
    const t = now().getTime();
    const mine = PLAN.filter((it) => it.booked || it.kind === 'travel');
    // something booked that started in the last 100 minutes counts as "now"
    const live = mine.find((it) => it.booked && it.at.getTime() <= t && t - it.at.getTime() < 100 * 60e3);
    if (live) return { item: live, live: true };
    const nxt = mine.find((it) => it.at.getTime() > t);
    return nxt ? { item: nxt, live: false } : null;
  }
  function untilText(date) {
    let ms = date.getTime() - now().getTime();
    if (ms <= 0) return 'now';
    const d = Math.floor(ms / 864e5); ms -= d * 864e5;
    const h = Math.floor(ms / 36e5); ms -= h * 36e5;
    const m = Math.round(ms / 6e4);
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m} min`;
  }

  /* ---------------- weather (Open-Meteo, no key) ---------------- */
  const WX = { daily: null, hourly: null, live: false };
  const WMO = (c) => {
    if (c == null) return { i: 'cloud', t: '' };
    if (c === 0) return { i: 'sun', t: 'Clear' };
    if (c === 1) return { i: 'sun', t: 'Mostly clear' };
    if (c === 2) return { i: 'cloudsun', t: 'Partly cloudy' };
    if (c === 3) return { i: 'cloud', t: 'Overcast' };
    if (c === 45 || c === 48) return { i: 'fog', t: 'Fog' };
    if (c >= 51 && c <= 57) return { i: 'rain', t: 'Drizzle' };
    if (c >= 61 && c <= 67) return { i: 'rain', t: 'Rain' };
    if (c >= 71 && c <= 77) return { i: 'snow', t: 'Snow' };
    if (c >= 80 && c <= 82) return { i: 'rain', t: 'Showers' };
    if (c >= 85 && c <= 86) return { i: 'snow', t: 'Snow showers' };
    if (c >= 95) return { i: 'storm', t: 'Thunderstorms' };
    return { i: 'cloud', t: '' };
  };
  const TRIP_DAYS = D.plan.map((d) => d.date);
  function wxDay(date) {
    const d = WX.daily;
    if (d) {
      const i = d.time.indexOf(date);
      if (i >= 0) return { live: true, hi: Math.round(d.temperature_2m_max[i]), lo: Math.round(d.temperature_2m_min[i]), rain: d.precipitation_probability_max?.[i], code: d.weather_code[i], sunset: d.sunset?.[i]?.slice(11) };
    }
    const c = D.climate || {};
    return { live: false, hi: c.avgHigh, lo: c.avgLow, rain: null, code: null, sunset: c.sunset?.[date] };
  }
  function wxAt(date, time) {
    const h = WX.hourly;
    if (!h || !time) return null;
    const key = `${date}T${time.slice(0, 2)}:00`;
    const i = h.time.indexOf(key);
    if (i < 0) return null;
    return { temp: Math.round(h.temperature_2m[i]), rain: h.precipitation_probability?.[i], code: h.weather_code?.[i] };
  }
  async function loadWeather() {
    const cached = store.get('wx', null);
    if (cached && cached.d && Date.now() - cached.t < 3 * 36e5) applyWx(cached.d);
    try {
      const url = 'https://api.open-meteo.com/v1/forecast?latitude=47.4979&longitude=19.0402'
        + '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunset'
        + '&hourly=temperature_2m,precipitation_probability,weather_code&timezone=Europe%2FBudapest&forecast_days=16';
      const r = await fetch(url, { cache: 'no-store' });
      if (!r.ok) throw new Error('weather ' + r.status);
      const d = await r.json();
      store.set('wx', { t: Date.now(), d });
      applyWx(d);
    } catch { /* offline or rate-limited: climate averages stay up */ }
  }
  function applyWx(d) {
    if (!d?.daily?.time) return;
    WX.daily = d.daily; WX.hourly = d.hourly; WX.live = TRIP_DAYS.some((x) => d.daily.time.includes(x));
    $$('[data-wx-slot]').forEach((el) => { el.innerHTML = wxSlot(el.dataset.wxSlot); });
    if (state.tab === 'plans') renderPlans(true);
    if (state.tab === 'info') renderInfo(true);
    if (detailOpenId) { const y = detailBody.scrollTop; openDetail(detailOpenId, { pushed: detailPushed, refresh: true }); detailBody.scrollTop = y; }
  }
  function wxSlot(kind) {
    if (kind === 'strip') {
      const days = TRIP_DAYS.map((date) => {
        const w = wxDay(date);
        const m = WMO(w.code);
        return `<div class="wx-day"><span>${esc(WEEKDAY.format(at(date, '12:00')))}</span>${icon(w.live ? m.i : 'cloudsun')}<b>${w.hi ?? '–'}°</b><small>${w.lo ?? '–'}°${w.rain != null ? ` · ${w.rain}%` : ''}</small></div>`;
      }).join('');
      const note = WX.live ? 'Live forecast for Budapest. High, low and chance of rain.' : 'Typical mid-October weather. The live forecast appears about 16 days out.';
      return `<div class="wx-strip">${days}</div><p class="wx-note">${note}</p>`;
    }
    return '';
  }

  /* ---------------- filtering ---------------- */
  function matchesQuery(p, q) {
    const hay = norm([p.name, p.sub, p.venue, p.address, p.district && 'district ' + p.district, labelOf(p), (p.tags || []).map(tagLabel).join(' '), p.blurb].join(' '));
    return q.split(/\s+/).every((w) => hay.includes(w));
  }
  function results() {
    const q = norm(state.q.trim());
    const cat = q ? catById.get('all') : catById.get(state.cat) || CATS[0];
    let list = allItems().filter((p) => cat.test(p));
    if (q) list = list.filter((p) => matchesQuery(p, q));
    const f = state.filters;
    if (f.tags.size) list = list.filter((p) => [...f.tags].some((t) => has(p, t)));
    if (f.price.size) list = list.filter((p) => p.price && f.price.has(p.price));
    if (f.late) list = list.filter((p) => hasAny(p, ['late-night', 'club']));
    if (f.rated) list = list.filter((p) => (score(p) ?? 0) >= 4.5);
    const sort = (cat.sort === 'time' || cat.sort === 'dist') && f.sort === 'rec' ? cat.sort : f.sort;
    if (sort === 'near' || sort === 'dist') list = list.slice().sort((a, b) => (distOf(a) ?? 1e9) - (distOf(b) ?? 1e9));
    else if (sort === 'az') list = list.slice().sort((a, b) => a.name.localeCompare(b.name, 'hu'));
    else if (sort === 'top') list = list.slice().sort((a, b) => (score(b) ?? 0) - (score(a) ?? 0) || (reviews(b) ?? 0) - (reviews(a) ?? 0));
    else if (sort === 'time') {
      const t = (p) => (p.type === 'event' ? at(p.date, p.start || '00:00').getTime() : p.type === 'travel' ? 0 : 1);
      list = list.slice().sort((a, b) => t(a) - t(b));
    } else {
      // recommended: closed places sink; once we know where the flat is, places on the doorstep float up
      list = list.slice().sort((a, b) => (a.closed ? 1 : 0) - (b.closed ? 1 : 0)
        || (b.must ? 1 : 0) - (a.must ? 1 : 0)
        || (nearFlat(b) ? 1 : 0) - (nearFlat(a) ? 1 : 0)
        || (nearFlat(a) && nearFlat(b) ? distOf(a) - distOf(b) : 0));
    }
    return list;
  }
  function dishResults() {
    const q = norm(state.q.trim());
    if (q) return D.dishes.filter((d) => norm([d.name, d.en, d.what].join(' ')).includes(q));
    return state.cat === 'dishes' ? D.dishes : [];
  }

  /* ---------------- rendering: categories ---------------- */
  function renderCats() {
    $('#cats').innerHTML = CATS.filter((c) => !c.needsBase || BASE.lat != null).map((c) => `<button type="button" class="cat${c.warn ? ' is-warn' : ''}" data-cat="${c.id}" aria-current="${state.cat === c.id && !state.q}">${icon(c.icon)}<span>${esc(c.label)}</span></button>`).join('');
  }
  function setCat(id, push = true) {
    if (!catById.has(id)) id = 'all';
    if (state.onlyFaves) { state.onlyFaves = false; $('#mapBanner').hidden = true; }
    const changed = state.cat !== id;
    state.cat = id;
    state.q = '';
    if (changed) { state.filters.tags.clear(); }
    $$('#cats .cat').forEach((b) => b.setAttribute('aria-current', b.dataset.cat === id));
    const btn = $(`#cats [data-cat="${id}"]`);
    const rail = $('#cats');
    if (btn && rail) {
      const l = btn.offsetLeft - 16, r = btn.offsetLeft + btn.offsetWidth + 16 - rail.clientWidth;
      if (rail.scrollLeft > l) rail.scrollTo({ left: l, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      else if (rail.scrollLeft < r) rail.scrollTo({ left: r, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    }
    if (push) history.replaceState(null, '', id === 'all' ? '#/' : '#/c/' + id);
    renderExplore();
    if (changed && state.tab === 'explore') window.scrollTo({ top: 0 });
    syncMarkers({ fit: changed && state.view === 'map' });
  }

  /* ---------------- rendering: explore ---------------- */
  let firstPaint = true;
  function renderExplore() {
    const pane = $('#pane-explore');
    const q = state.q.trim();
    const home = !q && state.cat === 'all' && filterCount() === 0;
    $('#filterCount').hidden = filterCount() === 0;
    $('#filterCount').textContent = filterCount();
    pane.innerHTML = home ? homeHtml() : listHtml();
    if (home && firstPaint && !reduceMotion.matches) pane.firstElementChild?.classList.add('reveal');
    firstPaint = false;
  }

  function heroHtml() {
    const t = now();
    const land = new Date(D.trip.landing);
    const fly = new Date(D.trip.airportBy);
    let big, small;
    if (t < land) {
      const days = Math.ceil((land - t) / 864e5);
      if (days > 1) { big = days; small = 'days until wheels down in Budapest'; }
      else { big = untilText(land); small = 'until wheels down. Passports, lads.'; }
    } else if (t < fly) {
      const dayN = TRIP_DAYS.findIndex((d) => d === new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Budapest' }).format(t)) + 1;
      big = `Day ${dayN || '–'}`; small = 'of four. Pace yourselves. Or don’t.';
    } else { big = 'GG'; small = 'Hope you survived. Same time next year?'; }
    const nx = nextUp();
    const nextHtml = nx ? (() => {
      const it = nx.item;
      const ref = it.ref ? byId.get(it.ref) : null;
      const href = ref ? `#/p/${ref.id}` : '#/plans';
      return `<a class="hero-next" href="${href}">${icon(it.kind === 'travel' ? 'plane' : ref ? iconOf(ref) : 'calendar')}
        <span class="hero-next-text"><small>${nx.live ? 'Happening now' : `Next up · ${esc(DAY_FMT.format(it.at))} ${esc(it.time)} · in ${esc(untilText(it.at))}`}</small><strong>${esc(it.title)}</strong></span>${icon('chev')}</a>`;
    })() : '';
    return `<section class="hero" aria-label="Trip">
      <p class="hero-eyebrow">Budapest · Thu 15 – Sun 18 Oct 2026</p>
      <div class="hero-count"><b class="tnum">${esc(big)}</b><span>${esc(small)}</span></div>
      ${nextHtml}
      <div data-wx-slot="strip">${wxSlot('strip')}</div>
    </section>`;
  }

  function rowSection(title, sub, catId, items, max = 10) {
    if (!items.length) return '';
    return `<section class="section">
      <div class="section-head"><div><h2>${esc(title)}</h2>${sub ? `<p>${esc(sub)}</p>` : ''}</div>
        <button type="button" class="see-all" data-cat="${catId}">See all ${items.length > max ? items.length : ''}</button></div>
      <div class="row">${items.slice(0, max).map((p) => card(p)).join('')}</div>
    </section>`;
  }
  function homeHtml() {
    const C = (id) => allItems().filter(catById.get(id).test).filter((p) => !p.closed)
      .sort((a, b) => (b.must ? 1 : 0) - (a.must ? 1 : 0) || (nearFlat(b) ? 1 : 0) - (nearFlat(a) ? 1 : 0) || (nearFlat(a) && nearFlat(b) ? distOf(a) - distOf(b) : 0));
    const booked = EVENTS.slice().sort((a, b) => at(a.date, a.start).getTime() - at(b.date, b.start).getTime());
    const dishes = D.dishes.slice(0, 10);
    return `<div>
      ${heroHtml()}
      ${rowSection('The must-sees', 'The best of Budapest: the landmarks, the baths, the bars and the food you shouldn’t miss', 'must', C('must'), 24)}
      ${BASE.lat != null ? rowSection('Around the flat', `Within a ${NEAR_WALK_MIN}-minute walk${BASE.approx ? ' of roughly where the flat is' : ''}, closest first`, 'near', allItems().filter(catById.get('near').test).sort((a, b) => distOf(a) - distOf(b)), 12) : ''}
      ${rowSection('Top bars in Budapest', 'The ones everyone should hit at least once, from ruin bars to rooftops and the post-it note pub', 'top', C('top'), 14)}
      ${rowSection('Booked and paid for', 'Two matches and karting. Times are Budapest time.', 'booked', booked)}
      ${rowSection('Rock bars', 'Sweaty basements, live covers and metal on the stereo', 'rock', C('rock'))}
      ${rowSection('Ruin bars', 'Derelict buildings full of bars. Budapest invented them.', 'ruin', C('ruin'))}
      ${rowSection('Odd bars', 'Speakeasies, magic and pubs in old shops', 'odd', C('odd'))}
      ${rowSection('Eat', 'Goulash canteens, Michelin dinners and 3am burgers', 'eat', C('eat'))}
      <section class="section">
        <div class="section-head"><div><h2>Must-try food & drink</h2><p>Order these at least once</p></div><button type="button" class="see-all" data-cat="dishes">See all</button></div>
        <div class="row">${dishes.map(dishCard).join('')}</div>
      </section>
      ${rowSection('History', 'Castles, bunkers and the 20th century’s worst bits', 'history', C('history'))}
      ${rowSection('The baths', 'Hot springs to sweat out last night', 'baths', C('baths'))}
      ${rowSection('Things to do', 'Guns, boats, caves and a children’s railway', 'do', C('do'))}
    </div>`;
  }

  function listHtml() {
    const q = state.q.trim();
    const cat = q ? null : catById.get(state.cat);
    const items = results();
    const dishes = dishResults();
    let head, intro = '';
    if (q) {
      head = `<div><h1>“${esc(q)}”</h1><p>${plural(items.length + dishes.length, 'result')}</p></div>`;
    } else {
      const n = cat.dishes ? dishes.length : items.length;
      head = `<div><h1>${esc(cat.label)}</h1><p>${cat.dishes ? plural(n, 'thing') + ' to eat and drink' : plural(n, 'place')}${cat.dishes ? '' : ` · ${esc(state.filters.sort === 'near' ? 'nearest first' : 'distances from ' + origin().label)}`}</p></div>`;
    }
    if (cat?.id === 'booked') {
      intro = `<p class="muted" style="margin-top:10px;font-size:14px">Everything here is booked and paid for. The full timeline is in <a href="#/plans">The plan</a>.</p>`;
    }
    if (cat?.id === 'baths') {
      intro = `<div class="callout" style="margin-top:16px">${icon('waves')}<div><strong>Gellért and Király are shut.</strong>Gellért closed in Oct 2025 for renovation until about 2028, and Király has no reopening date. Go to Széchenyi or Rudas.</div></div>`;
    }
    const chips = quickChips(cat);
    let body;
    if (cat?.dishes) body = `<div class="grid">${dishes.map(dishCard).join('')}</div>`;
    else if (!items.length && !dishes.length) body = `<div class="empty">${icon('search')}<h2>Nothing matches</h2><p>Try fewer filters, or search for something else.</p><button type="button" class="btn btn-line" data-act="clear-filters">Clear filters</button></div>`;
    else body = (dishes.length && q ? `<div class="grid">${dishes.map(dishCard).join('')}</div>` : '') + `<div class="grid">${items.map((p) => card(p, { long: true })).join('')}</div>`;
    return `<div><div class="list-head">${head}</div>${chips}${intro}${body}</div>`;
  }

  function quickChips(cat) {
    if (!cat || cat.dishes || cat.id === 'booked') return '';
    const pool = allItems().filter(cat.test);
    const counts = new Map();
    for (const p of pool) for (const t of p.tags || []) if (!HIDDEN_TAGS.has(t)) counts.set(t, (counts.get(t) || 0) + 1);
    const tags = [...counts].filter(([, n]) => n >= 2 && n < pool.length).sort((a, b) => b[1] - a[1]).slice(0, 8);
    if (!tags.length) return '';
    return `<div class="chip-row" style="margin-top:14px">${tags.map(([t]) => `<button type="button" class="chip chip-sm" data-tag="${esc(t)}" aria-pressed="${state.filters.tags.has(t)}">${esc(tagLabel(t))}</button>`).join('')}</div>`;
  }

  /* ---------------- rendering: plans ---------------- */
  function renderPlans(keepScroll) {
    const pane = $('#pane-plans');
    const y = window.scrollY;
    const t = now().getTime();
    const nx = nextUp();
    const days = D.plan.map((day) => {
      const w = wxDay(day.date);
      const m = WMO(w.code);
      const items = PLAN.filter((it) => it.date === day.date).map((it) => {
        const ref = it.ref ? byId.get(it.ref) : null;
        const refs = (it.refs || []).map((id) => byId.get(id)).filter(Boolean);
        const past = it.at.getTime() + 90 * 60e3 < t;
        const live = nx?.item.key === it.key && nx.live;
        const wx = it.booked && it.kind === 'event' ? wxAt(it.date, it.time) : null;
        const links = [];
        if (ref && ref.id !== 'base') links.push(`<a class="chip chip-sm" href="#/p/${esc(ref.id)}">${icon(iconOf(ref), 'ic-sm')}${esc(ref.type === 'event' ? 'Details' : ref.name)}</a>`);
        if (ref && ref.id === 'base') links.push(`<a class="chip chip-sm" href="#/p/base">${icon('home', 'ic-sm')}The Airbnb</a>`);
        if (ref && ref.lat != null && !ref.hidePin) links.push(`<a class="chip chip-sm" href="${esc(gdirUrl(ref))}" target="_blank" rel="noopener">${icon('nav', 'ic-sm')}Directions</a>`);
        for (const r of refs) links.push(`<a class="chip chip-sm" href="#/p/${esc(r.id)}">${esc(r.name)}</a>`);
        return `<li class="tl-item${it.booked ? ' is-booked' : ''}${it.kind === 'travel' ? ' is-travel' : ''}${past ? ' is-past' : ''}${live ? ' is-now' : ''}">
          <time class="tl-time" datetime="${it.at.toISOString()}">${esc(it.time)}</time>
          <span class="tl-dot" aria-hidden="true"></span>
          <div class="tl-body">
            <h3 class="tl-title">${esc(it.title)}</h3>
            ${it.sub ? `<p class="tl-sub">${esc(it.sub)}</p>` : ''}
            <div class="tl-meta">
              ${it.booked ? '<span class="badge badge-booked">Booked</span>' : it.kind === 'idea' ? '<span class="badge badge-idea">Idea</span>' : ''}
              ${wx ? `<span class="badge badge-wx">${icon(WMO(wx.code).i, 'ic-sm')}${wx.temp}°${wx.rain != null ? ` · ${wx.rain}% rain` : ''}</span>` : ''}
              ${whoLabel(it.who) ? `<span class="who">${icon('users')}${esc(whoLabel(it.who))}</span>` : ''}
              ${flightChip(it)}
            </div>
            ${links.length ? `<div class="tl-links">${links.join('')}</div>` : ''}
          </div>
        </li>`;
      }).join('');
      return `<section class="day" id="day-${day.date}">
        <div class="day-head"><h2>${esc(day.title)} ${esc(String(Number(day.date.slice(8))))}<small>${esc(day.theme)}</small></h2>
          <span class="day-wx" title="${w.live ? 'Forecast' : 'Typical for mid-October'}">${icon(w.live ? m.i : 'cloudsun')}${w.hi ?? '–'}° / ${w.lo ?? '–'}°${w.rain != null ? ` · ${w.rain}%` : ''}</span></div>
        ${items ? `<ol class="tl">${items}</ol>` : '<p class="tl-empty">Nothing booked.</p>'}
      </section>`;
    }).join('');
    const nextCard = nx ? `<div class="next-card"><small>${nx.live ? 'Happening now' : 'Next up'}</small><strong>${esc(nx.item.title)}</strong><span>${esc(DAY_FMT.format(nx.item.at))} at ${esc(nx.item.time)}${nx.live ? '' : ` · in ${esc(untilText(nx.item.at))}`}</span></div>` : '';
    pane.innerHTML = `<header class="page-head"><h1>The plan</h1><p>Thu 15 – Sun 18 Oct. All times are Budapest time, one hour ahead of home (Ireland and the UK).</p></header>

      ${nextCard}
      ${days}
      <p class="small-print">Only what's booked and paid for. Kick-off times come from your bookings and the club sites; check them again on the day. Tap a flight number to track it live.</p>`;
    if (keepScroll) window.scrollTo({ top: y });
  }

  /* ---------------- rendering: faves ---------------- */
  function renderFaves() {
    const pane = $('#pane-faves');
    const items = [...state.faves].map((id) => byId.get(id)).filter(Boolean);
    if (!items.length) {
      pane.innerHTML = `<header class="page-head"><h1>Faves</h1><p>Your shortlist. It lives on this phone only.</p></header>
        <div class="empty">${icon('heart')}<h2>Nothing saved yet</h2><p>Tap the heart on any bar, restaurant or sight and it lands here, ready to share with the group chat.</p><a class="btn btn-ink" href="#/c/rock">Start with the rock bars</a></div>`;
      return;
    }
    pane.innerHTML = `<header class="page-head"><h1>Faves</h1><p>${plural(items.length, 'place')} saved on this phone.</p></header>
      <div class="actions-row">
        <button type="button" class="btn btn-ink" data-act="share-faves">${icon('share')}Send to the group</button>
        <button type="button" class="btn btn-soft" data-act="faves-map">${icon('map')}Show on map</button>
      </div>
      <div class="fav-list">${items.map((p) => `<article class="fav card" data-id="${esc(p.id)}">
        <a class="card-link" href="#/p/${esc(p.id)}" aria-label="${esc(p.name)}"></a>
        <div class="card-media">${media(p)}</div>
        <div class="fav-body"><h3 class="card-title">${esc(p.name)}</h3>${cardLines(p)}</div>
        ${heartBtn(p)}
      </article>`).join('')}</div>`;
  }

  /* ---------------- rendering: info ---------------- */
  const PRACT_ICON = { taxis: 'car', transport: 'tram', money: 'money', phone: 'phone', safety: 'shield', emergency: 'siren', 'plugs-and-misc': 'plug' };
  function acc(id, ic, title, sub, body, open = false) {
    return `<details class="acc" id="info-${id}"${open ? ' open' : ''}><summary>${icon(ic)}<span>${esc(title)}${sub ? `<small>${esc(sub)}</small>` : ''}</span>${icon('chev', 'chev')}</summary><div class="acc-body">${body}</div></details>`;
  }
  function renderInfo(keepScroll) {
    const pane = $('#pane-info');
    const y = window.scrollY;
    const openIds = new Set($$('#pane-info details[open]').map((d) => d.id));
    const isOpen = (id, dflt) => (openIds.size ? openIds.has('info-' + id) : dflt);

    const SHORT = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', timeZone: 'Europe/Budapest' });
    const wxRows = TRIP_DAYS.map((date) => {
      const w = wxDay(date); const m = WMO(w.code);
      return `<div class="wx-row"><div><b>${esc(SHORT.format(at(date, '12:00')))}</b>${w.sunset ? `<small>Sunset ${esc(w.sunset)}</small>` : ''}</div><div class="wx-cond">${icon(w.live ? m.i : 'cloudsun')}<span>${esc(w.live ? m.t : 'Typical')}</span></div><div class="tnum">${w.hi ?? '–'}°<small>${w.lo ?? '–'}°</small></div><div class="tnum wx-rain">${w.rain != null ? icon('rain', 'ic-sm') + w.rain + '%' : ''}</div></div>`;
    }).join('');
    const kick = EVENTS.map((e) => { const w = wxAt(e.date, e.start); return w ? `<li>${esc(e.name)}: ${w.temp}°, ${esc(WMO(w.code).t.toLowerCase())}${w.rain != null ? `, ${w.rain}% chance of rain` : ''}</li>` : ''; }).join('');
    const weather = `<div class="wx-list">${wxRows}</div>
      ${kick ? `<div><h3>At kick-off</h3><ul style="margin:4px 0 0;padding-left:18px">${kick}</ul></div>` : ''}
      <p class="muted">${WX.live ? 'Live forecast from Open-Meteo, refreshed every few hours.' : `Typical mid-October: highs around ${D.climate.avgHigh}°, lows around ${D.climate.avgLow}°. The live forecast switches on once the trip is within 16 days.`} Bring a jacket for the matches.</p>`;

    const B = BASE;
    const baseBody = `<dl class="kv"><dt>Address</dt><dd>${esc(B.address || 'TBC, coming soon')}</dd><dt>Check-in</dt><dd>${esc(B.checkIn || 'TBC')}</dd></dl>
      <p>${esc(D.base.note)}</p>
      ${D.base.lat == null ? `<div class="base-form">
        <div class="field"><label for="basePaste">Paste a Google Maps link or coordinates</label><input id="basePaste" type="text" inputmode="url" placeholder="e.g. 47.4979, 19.0632" autocomplete="off"></div>
        <div class="actions-row" style="margin-top:0">
          <button type="button" class="btn btn-ink" data-act="base-paste">Save pin</button>
          <button type="button" class="btn btn-soft" data-act="base-drop">${icon('pin')}Drop it on the map</button>
          ${B.localPin ? `<button type="button" class="btn btn-line" data-act="base-clear">Remove my pin</button>` : ''}
        </div></div>` : ''}
      ${B.links.web ? `<a href="${esc(B.links.web)}" target="_blank" rel="noopener">Open the Airbnb listing ${icon('ext', 'ic-sm')}</a>` : ''}`;

    const A = AIRPORT;
    const airportBody = `<a class="btn btn-primary btn-block" href="${esc(gdirUrl(A))}" target="_blank" rel="noopener">${icon('nav')}Directions to the airport</a>
      <dl class="kv"><dt>Flight out</dt><dd>${esc(flightLine(FL.out, 'out') || 'Number TBC')}</dd><dt>Flight home</dt><dd>${esc(flightLine(FL.home, 'home') || 'Number TBC')}</dd><dt>Land</dt><dd>${esc(A.arrival)}</dd><dt>Fly home</dt><dd>${esc(A.departure)}</dd></dl>
      ${A.options.map((o) => `<div><h3>${esc(o.name)}</h3><p>${esc(o.price)}. ${esc(o.time)}. ${esc(o.howToPay)}</p></div>`).join('')}
      <div class="callout">${icon('clock')}<div><strong>Sunday leave-by</strong>${esc(A.leaveBy)}</div></div>`;

    const baths = PLACES.filter((p) => p.type === 'bath');
    const bathsBody = baths.map((p) => `<div><h3><a href="#/p/${esc(p.id)}">${esc(p.name)}</a>${p.closed ? ' · <span class="muted">closed</span>' : ''}</h3><p>${esc(p.blurb)}</p>
      <p>${p.links.book ? `<a href="${esc(p.links.book)}" target="_blank" rel="noopener">Book tickets ${icon('ext', 'ic-sm')}</a> · ` : ''}${p.links.web ? `<a href="${esc(p.links.web)}" target="_blank" rel="noopener">Official site ${icon('ext', 'ic-sm')}</a> · ` : ''}<a href="${esc(gmapsUrl(p))}" target="_blank" rel="noopener">Google Maps ${icon('ext', 'ic-sm')}</a></p></div>`).join('')
      + (D.sparty?.body ? `<div class="callout">${icon('sparkles')}<div><strong>Sparty</strong>${esc(D.sparty.body)} ${D.sparty.link ? `<a href="${esc(D.sparty.link)}" target="_blank" rel="noopener">Sparty tickets</a>` : ''}</div></div>` : '');

    const practical = D.practical.map((s) => {
      let body = s.items.map((it) => `<div><h3>${esc(it.title)}</h3><p>${esc(it.body)}${it.link ? ` <a href="${esc(it.link)}" target="_blank" rel="noopener">Source</a>` : ''}</p></div>`).join('');
      if (s.id === 'taxis') body = `<div class="callout">${icon('car')}<div><strong>Get these apps before you fly</strong>Bolt (cheapest, upfront prices), Uber (which now books licensed Főtaxi cars) and BudapestGO for tram and metro tickets.</div></div>` + body;
      return { id: s.id, html: acc(s.id, PRACT_ICON[s.id] || 'info', s.title, null, body, isOpen(s.id, false)) };
    });
    const P = (id) => practical.find((x) => x.id === id)?.html || '';

    const phrases = D.phrases.map((p) => `<div class="phrase"><div><b>${esc(p.hu)}</b><small>${esc(p.en)}</small></div><span>${esc(p.say)}</span></div>`).join('');
    const events = (D.localEvents || []).filter((e) => !/not in window/i.test(e.name)).map((e) => `<div><h3>${esc(e.name)}</h3><p class="muted">${esc(e.date)} · ${esc(e.where)}</p><p>${esc(e.body)}</p></div>`).join('');
    const homeScreen = `<p><b>iPhone:</b> open this page in Safari, tap Share, then <b>Add to Home Screen</b>. It opens full-screen like an app.</p>
      <p><b>Android:</b> in Chrome, tap ⋮ then <b>Add to Home screen</b> (or <b>Install app</b>).</p>
      <p>Every place has its own link. Tap share on any page to send it to the group chat.</p>
      <button type="button" class="btn btn-soft" data-act="copy-link">${icon('copy')}Copy app link</button>`;

    pane.innerHTML = `<header class="page-head"><h1>Info</h1><p>The 2026 essentials: weather, apps, money, scams and how to say cheers.</p></header>
      <div class="info-list">
        ${acc('weather', 'cloudsun', 'Weather', WX.live ? 'Live forecast' : 'Mid-October averages', weather, isOpen('weather', true))}
        ${acc('base', 'home', 'The Airbnb', B.address || (B.localPin ? 'Pinned on this phone' : 'Address TBC'), baseBody, isOpen('base', false))}
        ${acc('airport', 'plane', 'Airport & transfers', `Land ${LAND} Thu · back by ${AIRPORT_BY} Sun`, airportBody, isOpen('airport', false))}
        ${P('taxis')}
        ${P('transport')}
        ${acc('baths', 'waves', 'The main baths', 'Széchenyi, Rudas, Lukács and Sparty', bathsBody, isOpen('baths', false))}
        ${P('money')}
        ${P('phone')}
        ${P('safety')}
        ${P('emergency')}
        ${P('plugs-and-misc')}
        ${acc('phrases', 'chat', 'Say it in Hungarian', 'Egészségedre and friends', phrases, isOpen('phrases', false))}
        ${events ? acc('whatson', 'calendar', 'What else is on', '15–18 Oct', events, isOpen('whatson', false)) : ''}
        ${acc('homescreen', 'bookmark', 'Put it on your home screen', 'Works like an app, even offline', homeScreen, isOpen('homescreen', false))}
      </div>
      <p class="small-print">Researched in October 2026 from public sources (${D.sources.length} of them). Most venue pins are placed from street addresses, so treat them as close rather than exact. The Google Maps button always finds the real spot. Ratings appear only where we could verify them; otherwise the Google and Tripadvisor buttons take you to live reviews and photos. Built ${esc(D.built)}.</p>`;
    if (keepScroll) window.scrollTo({ top: y });
  }

  /* ---------------- detail sheet ---------------- */
  const detailRoot = $('#detailRoot');
  const detailBody = $('#detailBody');
  let detailOpenId = null;
  let detailPushed = false;
  let lastFocus = null;

  function detailHtml(p) {
    const kind = kindOf(p);
    const parts = [];
    const metaBits = [];
    if (p.type !== 'event') metaBits.push(`<span>${icon(iconOf(p), 'ic-sm')}${esc(labelOf(p))}</span>`);
    if (p.district) metaBits.push(`<span>${icon('pin', 'ic-sm')}District ${esc(p.district)}</span>`);
    const dt = distText(p, true);
    if (dt) metaBits.push(`<span>${icon('walk', 'ic-sm')}${esc(dt)}</span>`);
    if (p.price) metaBits.push(`<span>${esc(priceText(p.price))}</span>`);

    if (p.must) parts.push(`<p class="d-must">${icon('award', 'ic-sm')}${mustLabel(p)}</p>`);
    parts.push(`<div><h2 class="d-title" id="detailTitle">${esc(p.name)}</h2>${p.sub ? `<p class="d-sub">${esc(p.sub)}</p>` : ''}</div>`);
    if (metaBits.length) parts.push(`<div class="d-meta">${metaBits.join('')}</div>`);
    if (p.closed) parts.push(`<div class="callout is-warn">${icon('alert')}<div><strong>Closed during your trip</strong>${esc(p.hours || '')}</div></div>`);
    if (p.warn) parts.push(`<div class="callout is-warn">${icon('alert')}<div><strong>Heads up</strong>${esc(p.warn)}</div></div>`);
    if (p.unconfirmed) parts.push(`<div class="callout">${icon('info')}<div><strong>Check it’s open</strong>We couldn’t confirm this one is still trading in 2026. Look at Google Maps before you go.</div></div>`);

    if (p.type === 'event') {
      const d = at(p.date, p.start || '00:00');
      const wx = wxAt(p.date, p.start);
      parts.push(`<div class="d-event">
        <div><small>Date</small><b>${esc(WEEKDAY.format(d))} ${esc(String(Number(p.date.slice(8))))}</b><span>October</span></div>
        <div><small>${p.id.includes('kart') ? 'Start' : 'Kick-off'}</small><b>${esc(p.start || 'TBC')}</b><span>${p.start ? esc(ukTime(p.start)) + ' home time' : ''}</span></div>
        <div><small>${p.arriveFrom ? 'Gates' : 'Weather'}</small><b>${esc(p.arriveFrom || (wx ? wx.temp + '°' : '–'))}</b><span>${p.arriveFrom ? 'open' : wx ? esc(WMO(wx.code).t) : 'forecast soon'}</span></div>
      </div>`);
      if (whoLabel(p.who)) parts.push(`<p class="who" style="font-size:14px">${icon('users')}${esc(whoLabel(p.who))}</p>`);
    }
    if (p.type === 'base') {
      if (p.approx) parts.push(`<div class="callout">${icon('pin')}<div><strong>Roughly here</strong>This is where the flat shows on the Airbnb map${p.near ? `, beside ${esc(p.near)}` : ''}. The exact address comes later. Distances in the app are measured from this spot.</div></div>`);
      parts.push(`<p class="d-blurb">${esc(p.note || '')}</p>`);
      parts.push(`<div class="d-actions">${p.lat != null ? `<a class="btn btn-primary" href="${esc(gdirUrl(p))}" target="_blank" rel="noopener">${icon('nav')}Directions home</a>` : ''}<a class="btn btn-soft" href="#/info" data-act="goto-base-info">${icon('pin')}${p.lat != null ? 'Change pin' : 'Set the pin'}</a>${p.links.web ? `<a class="btn btn-soft" href="${esc(p.links.web)}" target="_blank" rel="noopener">${icon('ext')}Listing</a>` : ''}</div>`);
      return parts;
    }

    // ratings: real numbers where verified, otherwise a straight link to live reviews
    const r = p.rating || {};
    if (p.type !== 'travel') {
      parts.push(`<div class="d-ratings">
        <a class="d-rating" href="${esc(gmapsUrl(p))}" target="_blank" rel="noopener"><small>GOOGLE</small>${r.g != null ? `<b>${icon('star', 'ic-fill')}${r.g.toFixed(1)}</b><span>${r.gN ? fmtInt(r.gN) + ' reviews' : 'Reviews & photos'}</span>` : `<b>${icon('camera')}Photos</b><span>Live rating & reviews</span>`}</a>
        <a class="d-rating" href="${esc(taUrl(p))}" target="_blank" rel="noopener"><small>TRIPADVISOR</small>${r.ta != null ? `<b>${icon('star', 'ic-fill')}${r.ta.toFixed(1)}</b><span>${r.taN ? fmtInt(r.taN) + ' reviews' : 'Reviews'}</span>` : `<b>${icon('chat')}Reviews</b><span>What people say</span>`}</a>
      </div>`);
    }
    const actions = [];
    if (!p.hidePin || p.address) actions.push(`<a class="btn btn-primary" href="${esc(gdirUrl(p))}" target="_blank" rel="noopener">${icon('nav')}Directions in Google Maps</a>`);
    if (p.links?.book) actions.push(`<a class="btn btn-soft" href="${esc(p.links.book)}" target="_blank" rel="noopener">${icon('ticket')}${p.type === 'event' ? 'Tickets' : 'Book'}</a>`);
    if (p.links?.web) actions.push(`<a class="btn btn-soft" href="${esc(p.links.web)}" target="_blank" rel="noopener">${icon('globe')}Website</a>`);
    if (!p.hidePin && p.lat != null) actions.push(`<button type="button" class="btn btn-soft" data-act="show-on-map" data-id="${esc(p.id)}">${icon('map')}On our map</button>`);
    parts.push(`<div class="d-actions">${actions.join('')}</div>`);

    if (p.blurb) parts.push(`<p class="d-blurb">${esc(p.blurb)}</p>`);
    if (p.tip) parts.push(`<div class="callout">${icon('sparkles')}<div><strong>Insider tip</strong>${esc(p.tip)}</div></div>`);
    if (p.history) parts.push(`<div class="callout">${icon('history')}<div><strong>The history bit</strong>${esc(p.history)}</div></div>`);

    const facts = [];
    if (p.type === 'event') {
      if (p.getThere) facts.push(fact('tram', 'Getting there', p.getThere));
      if (p.rules) facts.push(fact('shield', 'Rules & entry', p.rules));
      facts.push(fact('pin', 'Venue', `${p.venue}${p.address ? ', ' + p.address : ''}`, true));
    } else if (p.type === 'travel') {
      const fo = flightLine(FL.out, 'out'), fh = flightLine(FL.home, 'home');
      facts.push(fact('plane', 'Flight out', fo || 'Flight number TBC'));
      facts.push(fact('plane', 'Flight home', fh || 'Flight number TBC'));
      facts.push(fact('plane', 'Arrival', p.arrival));
      facts.push(fact('clock', 'Departure', `${p.departure} ${p.leaveBy || ''}`));
      for (const o of p.options || []) facts.push(fact('car', o.name, `${o.price}. ${o.time}. ${o.howToPay}`));
    } else {
      if (p.hours) facts.push(fact('clock', 'Hours', p.hours));
      if (p.priceText) facts.push(fact('money', 'Prices', p.priceText));
      if (p.address) facts.push(fact('pin', 'Address', p.address, true));
    }
    if (facts.length) parts.push(`<div class="d-facts">${facts.join('')}</div>`);
    const tags = (p.tags || []).filter((t) => !HIDDEN_TAGS.has(t));
    if (tags.length) parts.push(`<div class="chip-wrap">${tags.map((t) => `<span class="tag">${esc(tagLabel(t))}</span>`).join('')}</div>`);
    const notes = [];
    if (p.approx) notes.push('Map pin placed from the street address, so it may be a few doors out. Google Maps has the exact spot.');
    if (p.notes) notes.push(p.notes);
    if (notes.length) parts.push(`<p class="d-note">${esc(notes.join(' '))}</p>`);
    void kind;
    return parts;
  }
  function fact(ic, label, text, copy = false) {
    return `<div class="d-fact">${icon(ic)}<div><b>${esc(label)}</b>${esc(text)}${copy ? `<button type="button" data-act="copy" data-text="${esc(text)}">Copy</button>` : ''}</div></div>`;
  }
  function ukTime(t) { const [h, m] = t.split(':').map(Number); return `${String((h + 23) % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`; }

  function openDetail(id, { pushed = true, refresh = false } = {}) {
    const p = byId.get(id);
    if (!p) return;
    detailPushed = pushed;
    const wasOpen = !!detailOpenId;
    detailOpenId = id;
    const creditText = !imgOf(p) ? '' : p.imageKind === 'illustrative' ? 'Illustrative photo, not this venue'
      : p.imageKind === 'building' ? `The building${p.imageCaption ? ': ' + p.imageCaption : ''} · Wikimedia Commons`
      : p.imageKind === 'street' ? `The street outside${p.imageCaption ? ': ' + p.imageCaption : ''} · Wikimedia Commons`
      : 'Photo: Wikimedia Commons';
    const page = filePage(imgOf(p));
    const credit = !creditText ? '' : page
      ? `<a class="d-credit" href="${esc(page)}" target="_blank" rel="noopener">${esc(creditText)} ↗</a>`
      : `<span class="d-credit">${esc(creditText)}</span>`;
    detailBody.innerHTML = `<div class="d-hero"><div class="card-media">${media(p)}</div>${credit}
      <div class="d-top"><button type="button" class="d-btn" data-close aria-label="Close">${icon(desktopMQ.matches ? 'x' : 'back')}</button>
        <div class="d-top-right"><button type="button" class="d-btn" data-act="share" data-id="${esc(p.id)}" aria-label="Share">${icon('share')}</button>
        ${p.type === 'base' ? '' : `<button type="button" class="d-btn" data-fav="${esc(p.id)}" aria-pressed="${isFav(p.id)}" aria-label="${isFav(p.id) ? 'Remove from faves' : 'Save to faves'}">${icon('heart')}</button>`}</div></div></div>
      <div class="d-body">${detailHtml(p).join('')}</div>`;
    detailBody.scrollTop = 0;
    if (!wasOpen) {
      lastFocus = document.activeElement;
      showSheet(detailRoot);
    }
    if (desktopMQ.matches && !refresh) selectPin(id, { fly: true, card: false });
    document.title = `${p.name} · Bastards on Tour`;
  }
  function closeDetail() {
    if (!detailOpenId) return;
    if (detailPushed) history.back();
    else { history.replaceState(null, '', baseHash()); closeDetailUI(); }
  }
  function closeDetailUI() {
    if (!detailOpenId) return;
    detailOpenId = null;
    hideSheet(detailRoot);
    document.title = 'Bastards on Tour';
    lastFocus?.focus?.({ preventScroll: true });
  }

  /* sheets: open/close + drag-to-dismiss on phones */
  function showSheet(root) {
    root.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    const sheet = $('.sheet', root);
    sheet.style.transform = '';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      root.classList.add('is-open');
      sheet.focus?.({ preventScroll: true });
    }));
  }
  function hideSheet(root) {
    root.classList.remove('is-open');
    const sheet = $('.sheet', root);
    sheet.style.transform = '';
    $('.sheet-backdrop', root).style.opacity = '';
    const done = () => { if (!root.classList.contains('is-open')) root.hidden = true; };
    if (reduceMotion.matches) done(); else setTimeout(done, 480);
    if (!$$('.sheet-root.is-open').length) document.documentElement.style.overflow = '';
  }
  function enableDrag(root, onDismiss) {
    const sheet = $('.sheet', root);
    const scroller = $('.sheet-scroll', root);
    const backdrop = $('.sheet-backdrop', root);
    let y0 = 0, t0 = 0, dy = 0, dragging = false, startTop = 0, tracking = false;
    sheet.addEventListener('touchstart', (e) => {
      if (desktopMQ.matches || e.touches.length > 1) return;
      tracking = true; dragging = false; dy = 0;
      y0 = e.touches[0].clientY; t0 = performance.now(); startTop = scroller.scrollTop;
    }, { passive: true });
    sheet.addEventListener('touchmove', (e) => {
      if (!tracking) return;
      const d = e.touches[0].clientY - y0;
      if (!dragging) {
        if (startTop <= 0 && scroller.scrollTop <= 0 && d > 6) { dragging = true; y0 = e.touches[0].clientY; t0 = performance.now(); }
        else if (d < -4 || scroller.scrollTop > 0) { tracking = false; return; }
        else return;
      }
      dy = Math.max(0, e.touches[0].clientY - y0);
      e.preventDefault();
      sheet.style.transition = 'none';
      sheet.style.transform = `translateY(${dy}px)`;
      backdrop.style.transition = 'none';
      backdrop.style.opacity = String(Math.max(0, 1 - dy / (sheet.offsetHeight * 0.9)));
    }, { passive: false });
    const end = () => {
      if (!tracking) return;
      tracking = false;
      if (!dragging) return;
      dragging = false;
      const v = dy / Math.max(1, performance.now() - t0);
      sheet.style.transition = '';
      backdrop.style.transition = '';
      if (dy > Math.min(160, sheet.offsetHeight * 0.25) || v > 0.55) {
        onDismiss();
      } else {
        sheet.style.transform = '';
        backdrop.style.opacity = '';
      }
    };
    sheet.addEventListener('touchend', end);
    sheet.addEventListener('touchcancel', end);
  }
  enableDrag(detailRoot, () => closeDetail());

  /* ---------------- filters sheet ---------------- */
  const filterRoot = $('#filterRoot');
  function openFilters() {
    renderFilterBody();
    showSheet(filterRoot);
  }
  function closeFilters() { hideSheet(filterRoot); }
  enableDrag(filterRoot, closeFilters);
  function renderFilterBody() {
    const f = state.filters;
    const cat = state.q ? catById.get('all') : catById.get(state.cat);
    const pool = allItems().filter(cat.test);
    const counts = new Map();
    for (const p of pool) for (const t of p.tags || []) if (!HIDDEN_TAGS.has(t)) counts.set(t, (counts.get(t) || 0) + 1);
    const tags = [...counts].sort((a, b) => b[1] - a[1]).slice(0, 24);
    const o = origin().label;
    $('#filterBody').innerHTML = `
      <section class="f-section"><h3>Sort</h3><p>Distances are measured from ${esc(o)}.</p>
        <div class="seg" role="group" aria-label="Sort">${[['rec', 'Recommended'], ['near', 'Nearest'], ['top', 'Top rated']].map(([k, l]) => `<button type="button" data-sort="${k}" aria-pressed="${f.sort === k}">${l}</button>`).join('')}</div></section>
      <section class="f-section"><h3>Price</h3><p>£ is cheap as chips. ££££ is a Michelin dinner.</p>
        <div class="chip-wrap">${[1, 2, 3, 4].map((n) => `<button type="button" class="chip" data-price="${n}" aria-pressed="${f.price.has(n)}">${'£'.repeat(n)}</button>`).join('')}</div></section>
      <section class="f-section"><h3>Quick ones</h3><p>Combine as many as you like.</p>
        <div class="chip-wrap">
          <button type="button" class="chip" data-flag="late" aria-pressed="${f.late}">${icon('moon', 'ic-sm')}Open late</button>
          <button type="button" class="chip" data-flag="rated" aria-pressed="${f.rated}">${icon('star', 'ic-sm')}Rated 4.5+</button>
        </div></section>
      ${tags.length ? `<section class="f-section"><h3>Vibe</h3><p>Shows places matching any of these.</p>
        <div class="chip-wrap">${tags.map(([t, n]) => `<button type="button" class="chip" data-tag="${esc(t)}" aria-pressed="${f.tags.has(t)}">${esc(tagLabel(t))} <span class="muted">${n}</span></button>`).join('')}</div></section>` : ''}`;
    const n = state.cat === 'dishes' && !state.q ? D.dishes.length : results().length;
    $('#filterApply').textContent = n ? `Show ${plural(n, 'place')}` : 'No matches';
  }

  /* ---------------- map ---------------- */
  let map = null;
  let mapReady = false;
  let styleOk = false;
  let styleQueue = [];
  const markers = new Map();
  let want3D = store.get('3d', true);
  let tour = null;
  const STYLES = {
    light: ['https://tiles.openfreemap.org/styles/liberty', 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'],
    dark: ['https://tiles.openfreemap.org/styles/dark', 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json', 'https://tiles.openfreemap.org/styles/liberty'],
  };
  const HOME_VIEW = { center: [19.0625, 47.4985], zoom: 13.4, pitch: 55, bearing: -18 };
  let mapKind = store.get('mapKind', 'map');
  let baseTileErrors = 0;
  const ESRI = (svc) => `https://server.arcgisonline.com/ArcGIS/rest/services/${svc}/MapServer/tile/{z}/{y}/{x}`;
  // satellite = Esri imagery with road and place labels; terrain = topo map (Esri, with OpenTopoMap as the backup)
  function rasterStyle(kind, backup = false) {
    const raster = (tiles, extra = {}) => ({ type: 'raster', tiles, tileSize: 256, maxzoom: 19, ...extra });
    const sources = {};
    const layers = [{ id: 'bg', type: 'background', paint: { 'background-color': kind === 'sat' ? '#1d2620' : '#e9e5dc' } }];
    if (kind === 'sat') {
      sources.base = raster([ESRI('World_Imagery')], { attribution: 'Imagery © Esri, Maxar, Earthstar Geographics' });
      sources.roads = raster([ESRI('Reference/World_Transportation')]);
      sources.places = raster([ESRI('Reference/World_Boundaries_and_Places')], { attribution: 'Labels © Esri' });
      layers.push({ id: 'base', type: 'raster', source: 'base' }, { id: 'roads', type: 'raster', source: 'roads', paint: { 'raster-opacity': 0.85 } }, { id: 'places', type: 'raster', source: 'places' });
    } else {
      sources.base = backup
        ? raster(['a', 'b', 'c'].map((x) => `https://${x}.tile.opentopomap.org/{z}/{x}/{y}.png`), { maxzoom: 17, attribution: '© OpenTopoMap (CC-BY-SA), © OpenStreetMap contributors' })
        : raster([ESRI('World_Topo_Map')], { attribution: '© Esri, HERE, Garmin, USGS, © OpenStreetMap contributors' });
      layers.push({ id: 'base', type: 'raster', source: 'base' });
    }
    return { version: 8, sources, layers };
  }
  function firstStyle() {
    baseTileErrors = 0;
    if (mapKind === 'sat' || mapKind === 'terrain') {
      styleQueue = mapKind === 'terrain' ? [rasterStyle('terrain', true)] : [];
      return rasterStyle(mapKind);
    }
    styleQueue = [...STYLES[isDark() ? 'dark' : 'light']];
    return styleQueue.shift();
  }
  function syncKindButtons() {
    $$('#mapStyles [data-kind]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.kind === mapKind));
  }
  function setMapKind(kind) {
    if (kind === mapKind) return;
    mapKind = kind;
    store.set('mapKind', kind);
    syncKindButtons();
    if (!map) return;
    styleOk = false;
    map.setStyle(firstStyle(), { diff: false });
  }

  function webglOk() {
    try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
  }
  function initMap() {
    if (map || !window.maplibregl) { if (!window.maplibregl) $('#mapFallback').hidden = false; return; }
    if (!webglOk()) { $('#mapFallback').hidden = false; return; }
    map = new maplibregl.Map({
      container: 'map',
      style: firstStyle(),
      center: BASE.lat != null ? [BASE.lng, BASE.lat] : HOME_VIEW.center,
      zoom: BASE.lat != null ? 14.4 : HOME_VIEW.zoom,
      pitch: want3D ? HOME_VIEW.pitch : 0,
      bearing: want3D ? HOME_VIEW.bearing : 0,
      maxPitch: 72,
      attributionControl: { compact: true },
      dragRotate: true,
      touchPitch: true,
    });
    if (/[?&]debug\b/.test(location.search)) window.__bbmap = map;
    map.on('style.load', () => {
      styleOk = true;
      decorateStyle();
      // keep the credits tucked behind the (i) so they don't sit over the List button
      requestAnimationFrame(() => $('.maplibregl-ctrl-attrib')?.classList.remove('maplibregl-compact-show'));
      if (!mapReady) {
        mapReady = true;
        buildMarkers();
        syncMarkers();
        if (state.pendingSelect) { const id = state.pendingSelect; state.pendingSelect = null; setTimeout(() => selectPin(id, { fly: true, card: true }), 100); }
        else if (state.cat !== 'all' || state.onlyFaves || state.tab !== 'explore') fitVisible();
      }
    });
    map.on('error', (e) => {
      if (e?.sourceId === 'bb-dem') { dropTerrain(); return; }
      if (e?.sourceId === 'base' && mapKind === 'terrain' && styleQueue.length && ++baseTileErrors >= 4) { map.setStyle(styleQueue.shift(), { diff: false }); return; }
      if (styleOk || e?.sourceId) return; // tile hiccups after load are harmless
      if (styleQueue.length) map.setStyle(styleQueue.shift());
      else $('#mapFallback').hidden = false;
    });
    map.on('click', (e) => {
      if (baseDropMode) { setBase(e.lngLat.lat, e.lngLat.lng); return; }
      if (!e.originalEvent.defaultPrevented) clearSelection();
    });
    const stopTour = () => { fitGen++; if (tour) endTour(); };
    map.on('dragstart', stopTour);
    map.on('zoomstart', (e) => { if (e.originalEvent) stopTour(); });
    $('#ctrl3d').setAttribute('aria-pressed', want3D);
  }

  // hills tiles failed: go flat, and re-seat the pins (they were placed on the old 3D ground)
  let terrainDead = false;
  function dropTerrain() {
    if (terrainDead) return;
    terrainDead = true;
    try { map.setTerrain(null); } catch { /* ignore */ }
    requestAnimationFrame(() => {
      for (const { m } of markers.values()) m.setLngLat(m.getLngLat());
      userMarker?.setLngLat(userMarker.getLngLat());
      if (lastFit && performance.now() - lastFit < 4000) fitVisible({ all: lastFitAll });
    });
  }

  function decorateStyle() {
    const style = map.getStyle();
    const dark = isDark();
    const vectorSrc = Object.keys(style.sources).find((k) => style.sources[k].type === 'vector');
    const firstSymbol = style.layers.find((l) => l.type === 'symbol')?.id;
    // 3D buildings, coloured to match the app
    const colour = dark
      ? ['interpolate', ['linear'], ['coalesce', ['get', 'render_height'], 10], 0, '#2b2724', 80, '#3d3733']
      : ['interpolate', ['linear'], ['coalesce', ['get', 'render_height'], 10], 0, '#ebe5de', 80, '#d6cdc3'];
    const existing = style.layers.filter((l) => l.type === 'fill-extrusion');
    try {
      if (existing.length) {
        for (const l of existing) {
          map.setPaintProperty(l.id, 'fill-extrusion-color', colour);
          map.setPaintProperty(l.id, 'fill-extrusion-opacity', 0.9);
          map.setLayoutProperty(l.id, 'visibility', want3D ? 'visible' : 'none');
        }
      } else if (vectorSrc) {
        map.addLayer({
          id: 'bb-3d', type: 'fill-extrusion', source: vectorSrc, 'source-layer': 'building', minzoom: 13.5,
          layout: { visibility: want3D ? 'visible' : 'none' },
          paint: {
            'fill-extrusion-color': colour,
            'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 13.5, 0, 15, ['coalesce', ['get', 'render_height'], ['get', 'height'], 9]],
            'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], ['get', 'min_height'], 0],
            'fill-extrusion-opacity': 0.9,
          },
        }, firstSymbol);
      }
    } catch { /* style without buildings: flat map is fine */ }
    // Buda hills in 3D
    try {
      if (!map.getSource('bb-dem')) {
        map.addSource('bb-dem', { type: 'raster-dem', tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'], encoding: 'terrarium', tileSize: 256, maxzoom: 13 });
      }
      map.setTerrain(want3D && !terrainDead ? { source: 'bb-dem', exaggeration: 1.35 } : null);
    } catch { /* terrain not supported */ }
    try {
      if (typeof map.setSky === 'function') {
        map.setSky(dark
          ? { 'sky-color': '#0d0b0a', 'horizon-color': '#2a1e22', 'fog-color': '#151312', 'sky-horizon-blend': 0.6, 'horizon-fog-blend': 0.5, 'fog-ground-blend': 0.6 }
          : { 'sky-color': '#cfe3f5', 'horizon-color': '#f7efe6', 'fog-color': '#f6f4f2', 'sky-horizon-blend': 0.5, 'horizon-fog-blend': 0.6, 'fog-ground-blend': 0.5 });
      }
    } catch { /* older engine */ }
    addRoute();
  }

  /* the weekend's booked route, drawn as a dashed line */
  function routeCoords() {
    const ids = ['airport', BASE.lat != null ? 'base' : null, 'fradi-plzen', 'karting-hungaroring', 'mtk-vasas', 'airport'].filter(Boolean);
    return ids.map((id) => byId.get(id)).filter((p) => p && p.lat != null).map((p) => [p.lng, p.lat]);
  }
  function addRoute() {
    try {
      const data = { type: 'Feature', geometry: { type: 'LineString', coordinates: routeCoords() } };
      if (map.getSource('bb-route')) { map.getSource('bb-route').setData(data); return; }
      map.addSource('bb-route', { type: 'geojson', data });
      map.addLayer({ id: 'bb-route', type: 'line', source: 'bb-route', layout: { 'line-cap': 'round', 'line-join': 'round', visibility: 'none' }, paint: { 'line-color': isDark() ? '#f0475a' : '#d7263d', 'line-width': 3, 'line-dasharray': [1.5, 2], 'line-opacity': 0.85 } });
    } catch { /* ignore */ }
  }

  function pinHtml(p) {
    if (p.type === 'travel') return `<span class="pin-dot">${icon('plane')}</span><span class="pin-label">Airport<small>Terminal 2 · BUD</small></span>`;
    if (p.type === 'base') return `<span class="pin-dot">${icon('home')}</span><span class="pin-label">The flat<small>${esc(p.approx ? 'roughly here' : p.address || 'our base')}</small></span>`;
    const label = p.type === 'event' ? `${esc(shortEventName(p))}<small>${esc(WEEKDAY.format(at(p.date, p.start || '00:00')))} ${esc(p.start || '')}</small>` : esc(p.name);
    return `<span class="pin-dot">${icon(iconOf(p))}</span><span class="pin-label">${label}</span>`;
  }
  function shortEventName(p) {
    if (/fradi/.test(p.id)) return 'Fradi v Plzeň';
    if (/mtk/.test(p.id)) return 'MTK v Vasas';
    if (/kart/.test(p.id)) return 'Karting';
    return p.name;
  }
  function buildMarkers() {
    for (const p of allItems()) addMarker(p);
  }
  function addMarker(p) {
    if (p.lat == null || p.hidePin || markers.has(p.id)) return;
    const el = document.createElement('button');
    el.type = 'button';
    el.className = `pin k-${kindOf(p)}${p.type === 'event' || p.type === 'base' || p.type === 'travel' ? ' is-labelled' : ''}${p.approx ? ' is-approx' : ''}${p.must ? ' is-must' : ''}`;
    el.setAttribute('aria-label', p.name);
    el.innerHTML = pinHtml(p);
    el.addEventListener('click', (e) => { e.stopPropagation(); e.preventDefault(); selectPin(p.id, { fly: false, card: true }); });
    const m = new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat([p.lng, p.lat]).addTo(map);
    markers.set(p.id, { m, el, p });
  }
  function removeMarker(id) { const x = markers.get(id); if (x) { x.m.remove(); markers.delete(id); } }

  function visibleIds() {
    const always = ['base', 'airport'];
    if (state.onlyFaves && state.tab === 'explore') return new Set([...state.faves, ...always]);
    if (state.tab === 'plans') {
      const ids = new Set(['airport', 'base']);
      for (const it of PLAN) { if (it.ref) ids.add(it.ref); (it.refs || []).forEach((r) => ids.add(r)); }
      return ids;
    }
    if (state.tab === 'faves') return new Set([...state.faves, ...always]);
    if (state.tab === 'info') return new Set([...EVENTS.map((e) => e.id), 'airport', 'base']);
    return new Set([...results().map((p) => p.id), ...always]);
  }
  function syncMarkers({ fit = false } = {}) {
    if (!mapReady) return;
    const vis = visibleIds();
    for (const [id, { el }] of markers) el.hidden = !vis.has(id);
    if (state.selected && !vis.has(state.selected)) clearSelection();
    try { map.setLayoutProperty('bb-route', 'visibility', (state.tab === 'explore' && state.cat === 'booked' && !state.q) || state.tab === 'plans' || state.tab === 'info' ? 'visible' : 'none'); } catch { /* ignore */ }
    if (fit) fitVisible();
  }
  let lastFit = 0, lastFitAll = false, fitGen = 0;
  function fitVisible({ all = false } = {}) {
    if (!mapReady) return;
    lastFit = performance.now(); lastFitAll = all;
    const gen = ++fitGen;
    const vis = [...markers.values()].filter(({ el }) => !el.hidden).map(({ p }) => p);
    if (!vis.length) return;
    // keep the city readable: drop far-flung pins unless the booked stuff is on show
    const far = (p) => km(DEAK, p) > 6;
    const showFar = all || (state.tab === 'explore' && state.cat === 'booked') || state.tab === 'plans' || state.tab === 'info';
    const pts = showFar ? vis : vis.filter((p) => !far(p));
    const use = pts.length ? pts : vis;
    const b = new maplibregl.LngLatBounds();
    use.forEach((p) => b.extend([p.lng, p.lat]));
    const pad = desktopMQ.matches ? { top: 90, bottom: 90, left: 80, right: 90 } : { top: 70, bottom: 170, left: 40, right: 70 };
    const bearing = want3D ? -18 : 0;
    // cameraForBounds assumes a flat map, so back off a little when tilted
    const cam = map.cameraForBounds(b, { padding: pad, bearing, maxZoom: 15.5 });
    if (!cam) return;
    const target = { center: cam.center, zoom: Math.min(15.5, cam.zoom - (want3D ? 0.15 : 0)), pitch: want3D ? 50 : 0, bearing };
    let tries = 0;
    // the tilt stretches whatever is nearest the camera, so check every pin landed on screen and back off if not
    // runs outside MapLibre's render loop, and gives up if a newer fit has started
    const check = () => setTimeout(() => {
      if (gen !== fitGen || tries++ > 4) return;
      const c = map.getContainer();
      const box = { l: pad.left ?? pad, r: c.clientWidth - (pad.right ?? pad), t: pad.top ?? pad, b: c.clientHeight - (pad.bottom ?? pad) };
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const p of use) {
        const pt = map.project([p.lng, p.lat]);
        minX = Math.min(minX, pt.x); maxX = Math.max(maxX, pt.x); minY = Math.min(minY, pt.y); maxY = Math.max(maxY, pt.y);
      }
      const inside = minX >= box.l - 8 && maxX <= box.r + 8 && minY >= box.t - 8 && maxY <= box.b + 8;
      const room = Math.min((box.r - box.l) / Math.max(1, maxX - minX), (box.b - box.t) / Math.max(1, maxY - minY));
      if (inside && room < 1.35) return;
      const mid = map.unproject([(minX + maxX) / 2 - ((box.l + box.r) / 2 - c.clientWidth / 2), (minY + maxY) / 2 - ((box.t + box.b) / 2 - c.clientHeight / 2)]);
      map.once('moveend', check);
      const dz = inside ? Math.min(1.5, Math.log2(room) * 0.8) : -0.4;
      const next = { center: mid, zoom: Math.min(16, map.getZoom() + dz) };
      if (reduceMotion.matches) map.jumpTo(next); else map.easeTo({ ...next, duration: 350 });
    }, 0);
    map.once('moveend', check);
    if (reduceMotion.matches) map.jumpTo(target); else map.easeTo({ ...target, duration: 900 });
  }
  function selectPin(id, { fly = false, card = true } = {}) {
    if (!mapReady) { state.selected = id; return; }
    const prev = markers.get(state.selected);
    prev?.el.classList.remove('is-active');
    state.selected = id;
    const cur = markers.get(id);
    if (!cur) return;
    cur.el.hidden = false;
    cur.el.classList.add('is-active');
    if (fly) flyToPlace(cur.p);
    if (card) showMapCard(cur.p);
  }
  function clearSelection() {
    markers.get(state.selected)?.el.classList.remove('is-active');
    state.selected = null;
    $('#mapCard').hidden = true;
  }
  function flyToPlace(p, opts = {}) {
    if (!mapReady || p.lat == null) return;
    const o = { center: [p.lng, p.lat], zoom: Math.max(map.getZoom(), 15.2), pitch: want3D ? 58 : 0, bearing: want3D ? map.getBearing() : 0, ...opts };
    if (reduceMotion.matches) map.jumpTo(o); else map.flyTo({ ...o, duration: opts.duration ?? 1400, curve: 1.5, essential: true });
  }
  function showMapCard(p) {
    const slot = $('#mapCard');
    slot.innerHTML = `<div class="map-card card">
      <a class="card-link" href="#/p/${esc(p.id)}" aria-label="Open ${esc(p.name)}"></a>
      <div class="card-media">${media(p)}</div>
      <div class="map-card-body">
        <p class="card-line">${esc(labelOf(p))}${p.district ? ' · District ' + esc(p.district) : ''}</p>
        <h3 class="card-title">${esc(p.name)}</h3>
        <p class="card-line">${esc(p.type === 'event' ? `${DAY_FMT.format(at(p.date, p.start))} · ${p.start}` : distText(p) || p.sub || '')}</p>
        ${p.lat != null ? `<div class="map-card-actions"><a class="btn btn-primary" href="${esc(gdirUrl(p))}" target="_blank" rel="noopener">${icon('nav')}Directions</a></div>` : ''}
      </div>
      <button type="button" class="map-card-close" data-act="close-card" aria-label="Close">${icon('x')}</button>
    </div>`;
    slot.hidden = false;
  }

  /* map view toggle (phones) */
  function setView(v) {
    state.view = v;
    app.dataset.view = v;
    document.documentElement.classList.toggle('map-open', v === 'map' && !desktopMQ.matches);
    const btn = $('#mapToggle');
    btn.innerHTML = v === 'map' ? `List ${icon('list')}` : `Map ${icon('map')}`;
    btn.setAttribute('aria-label', v === 'map' ? 'Show list' : 'Show map');
    if (v === 'map') {
      initMap();
      requestAnimationFrame(() => { map?.resize(); syncMarkers({ fit: !state.selected && !state.pendingSelect }); });
    } else {
      clearSelection();
      if (tour) endTour();
    }
  }

  /* fly the weekend */
  const evLabel = (id) => { const e = byId.get(id); return e?.start ? `${WEEKDAY.format(at(e.date, e.start))} ${e.start}` : ''; };
  function startTour() {
    if (!mapReady) return;
    const stops = [
      { id: 'airport', label: `Thu ${LAND}`, title: 'Wheels down at BUD' },
      BASE.lat != null ? { id: 'base', label: 'Thu afternoon', title: 'Bags down at the Airbnb' } : null,
      { id: 'fradi-plzen', label: evLabel('fradi-plzen'), title: 'Fradi v Plzeň at Groupama Aréna' },
      { id: 'karting-hungaroring', label: evLabel('karting-hungaroring'), title: 'Karting at the Hungaroring' },
      { id: 'mtk-vasas', label: evLabel('mtk-vasas'), title: 'MTK v Vasas' },
      { id: 'szimpla-kert', label: 'Every night', title: 'The ruin bars of District VII' },
      { id: 'airport', label: `Sun ${AIRPORT_BY}`, title: 'Home, broken' },
    ].filter(Boolean).filter((s) => byId.get(s.id)?.lat != null);
    tour = { stops, i: 0, timer: null };
    try { map.setLayoutProperty('bb-route', 'visibility', 'visible'); } catch { /* ignore */ }
    $('#ctrlTour').innerHTML = icon('stop');
    $('#ctrlTour').setAttribute('aria-label', 'Stop the fly-through');
    clearSelection();
    nextStop();
  }
  function nextStop() {
    if (!tour) return;
    const s = tour.stops[tour.i];
    if (!s) { endTour(true); return; }
    const p = byId.get(s.id);
    showCaption(s.label, s.title);
    markers.get(s.id)?.el.classList.add('is-hover');
    const prev = tour.stops[tour.i - 1];
    if (prev) markers.get(prev.id)?.el.classList.remove('is-hover');
    const opts = { center: [p.lng, p.lat], zoom: p.type === 'travel' ? 13.2 : 15.6, pitch: 62, bearing: -30 + tour.i * 38, duration: reduceMotion.matches ? 0 : 3200, curve: 1.6, essential: true };
    if (reduceMotion.matches) map.jumpTo(opts); else map.flyTo(opts);
    map.once('moveend', () => {
      if (!tour) return;
      tour.timer = setTimeout(() => { if (!tour) return; tour.i++; nextStop(); }, 1300);
    });
  }
  function endTour(finished = false) {
    if (!tour) return;
    clearTimeout(tour.timer);
    tour.stops.forEach((s) => markers.get(s.id)?.el.classList.remove('is-hover'));
    tour = null;
    $('#ctrlTour').innerHTML = icon('play');
    $('#ctrlTour').setAttribute('aria-label', 'Fly the weekend');
    $('.map-caption')?.remove();
    syncMarkers();
    if (finished) fitVisible({ all: true });
  }
  function showCaption(small, strong) {
    $('.map-caption')?.remove();
    const el = document.createElement('div');
    el.className = 'map-caption';
    el.innerHTML = `<small>${esc(small)}</small><strong>${esc(strong)}</strong>`;
    $('#mapwrap').appendChild(el);
  }

  function toggle3D() {
    want3D = !want3D;
    store.set('3d', want3D);
    $('#ctrl3d').setAttribute('aria-pressed', want3D);
    if (!mapReady) return;
    try {
      map.getStyle().layers.filter((l) => l.type === 'fill-extrusion').forEach((l) => map.setLayoutProperty(l.id, 'visibility', want3D ? 'visible' : 'none'));
      map.setTerrain(want3D && !terrainDead ? { source: 'bb-dem', exaggeration: 1.35 } : null);
    } catch { /* ignore */ }
    map.easeTo({ pitch: want3D ? 55 : 0, bearing: want3D ? -18 : 0, duration: reduceMotion.matches ? 0 : 700 });
  }

  let userMarker = null;
  function locate() {
    if (!navigator.geolocation) { toast('Location isn’t available on this device'); return; }
    navigator.geolocation.getCurrentPosition((pos) => {
      state.userLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      if (mapReady) {
        if (!userMarker) {
          const el = document.createElement('div');
          el.style.cssText = 'width:18px;height:18px;border-radius:50%;background:#2a63d4;border:3px solid #fff;box-shadow:0 0 0 6px rgba(42,99,212,.25)';
          userMarker = new maplibregl.Marker({ element: el }).setLngLat([state.userLoc.lng, state.userLoc.lat]).addTo(map);
        } else userMarker.setLngLat([state.userLoc.lng, state.userLoc.lat]);
        flyToPlace(state.userLoc, { zoom: 15.5 });
      }
      if (state.tab === 'explore') renderExplore();
    }, () => toast('Couldn’t get your location. Check location permissions.'), { enableHighAccuracy: true, timeout: 10000 });
  }

  /* ---------------- the Airbnb pin ---------------- */
  let baseDropMode = false;
  function setBase(lat, lng) {
    baseDropMode = false;
    $('#mapBanner').hidden = true;
    store.set('base', { lat, lng });
    refreshBase();
    toast('Airbnb pinned on this phone');
  }
  function clearBase() { store.del('base'); refreshBase(); toast('Pin removed'); }
  function refreshBase() {
    BASE = getBase();
    reindex();
    renderCats();
    if (mapReady) { removeMarker('base'); addMarker(BASE); addRoute(); syncMarkers(); }
    if (state.tab === 'info') renderInfo(true);
    if (state.tab === 'explore') renderExplore();
  }
  function parseCoords(text) {
    const s = String(text || '');
    const m = s.match(/@(-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)/) || s.match(/[?&](?:q|query|ll|destination)=(-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)/) || s.match(/!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)/) || s.match(/(-?\d{1,2}\.\d{3,})\s*[, ]\s*(-?\d{1,3}\.\d{3,})/);
    if (!m) return null;
    const lat = parseFloat(m[1]), lng = parseFloat(m[2]);
    if (lat < 47.3 || lat > 47.7 || lng < 18.8 || lng > 19.4) return null;
    return { lat, lng };
  }
  function startBaseDrop() {
    baseDropMode = true;
    location.hash = '#/';
    setTimeout(() => {
      if (!desktopMQ.matches) setView('map');
      initMap();
      const b = $('#mapBanner');
      b.innerHTML = `Tap the map where the Airbnb is.<button type="button" data-act="base-cancel">Cancel</button>`;
      b.hidden = false;
    }, 50);
  }

  /* ---------------- share / copy / toast ---------------- */
  let toastTimer = null;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('is-on'), 2200);
  }
  async function copy(text, okMsg = 'Copied') {
    try { await navigator.clipboard.writeText(text); toast(okMsg); }
    catch { toast('Couldn’t copy. Long-press to copy instead.'); }
  }
  async function share(title, text, url) {
    if (navigator.share) {
      try { await navigator.share({ title, text, url }); return; } catch (e) { if (e?.name === 'AbortError') return; }
    }
    copy([text, url].filter(Boolean).join('\n'), 'Link copied');
  }

  /* ---------------- tabs & routing ---------------- */
  function baseHash() {
    if (state.tab === 'explore') return state.cat === 'all' ? '#/' : '#/c/' + state.cat;
    return '#/' + state.tab;
  }
  function setTab(tab) {
    const changed = state.tab !== tab;
    state.tab = tab;
    app.dataset.tab = tab;
    for (const t of ['explore', 'plans', 'faves', 'info']) $('#pane-' + t).hidden = t !== tab;
    $$('#tabbar a').forEach((a) => (a.dataset.tab === tab ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
    if (tab === 'explore') renderExplore();
    if (tab === 'plans') renderPlans();
    if (tab === 'faves') renderFaves();
    if (tab === 'info') renderInfo();
    if (changed) {
      window.scrollTo({ top: 0 });
      if (tab !== 'explore' && state.view === 'map' && !desktopMQ.matches) setView('list');
      syncMarkers({ fit: desktopMQ.matches && mapReady });
    }
  }
  let booted = false;
  function route() {
    const [a, b] = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    if (a === 'p' && b && byId.has(b)) {
      if (!booted) setTab('explore');
      openDetail(b, { pushed: booted });
      return;
    }
    closeDetailUI();
    if (a === 'c' && b) { setTab('explore'); setCat(b, false); }
    else if (a === 'plans' || a === 'faves' || a === 'info') setTab(a);
    else if (booted && state.tab === 'explore' && state.cat !== 'all') setCat('all', false);
    else setTab('explore');
  }

  /* ---------------- events ---------------- */
  document.addEventListener('click', (e) => {
    const closer = e.target.closest('[data-close]');
    if (closer && closer.closest('.sheet-root')) {
      const root = closer.closest('.sheet-root');
      if (root === detailRoot) closeDetail(); else if (root === filterRoot) closeFilters();
      return;
    }
    const t = e.target.closest('button, a');
    if (!t) return;
    if (t.dataset.fav) { e.preventDefault(); e.stopPropagation(); toggleFav(t.dataset.fav, t); return; }
    if (t.dataset.cat) { setCat(t.dataset.cat); return; }
    if (t.dataset.tag) {
      const f = state.filters.tags;
      f.has(t.dataset.tag) ? f.delete(t.dataset.tag) : f.add(t.dataset.tag);
      t.setAttribute('aria-pressed', f.has(t.dataset.tag));
      if (filterRoot.contains(t)) { renderFilterBody(); renderExplore(); } else renderExplore();
      syncMarkers();
      return;
    }
    if (t.dataset.price) {
      const n = Number(t.dataset.price);
      state.filters.price.has(n) ? state.filters.price.delete(n) : state.filters.price.add(n);
      renderFilterBody(); renderExplore(); syncMarkers();
      return;
    }
    if (t.dataset.flag) {
      state.filters[t.dataset.flag] = !state.filters[t.dataset.flag];
      renderFilterBody(); renderExplore(); syncMarkers();
      return;
    }
    if (t.dataset.sort) {
      state.filters.sort = t.dataset.sort;
      renderFilterBody(); renderExplore();
      return;
    }
    const act = t.dataset.act;
    if (!act) return;
    switch (act) {
      case 'share': {
        const p = byId.get(t.dataset.id);
        share(p.name, `${p.name}, from the Bastards on Tour app`, shareUrl(p.id));
        break;
      }
      case 'copy': copy(t.dataset.text, 'Address copied'); break;
      case 'copy-link': copy(location.href.split('#')[0], 'App link copied'); break;
      case 'show-on-map': {
        const id = t.dataset.id;
        closeDetail();
        setTimeout(() => {
          if (state.tab !== 'explore') { location.hash = '#/'; }
          if (mapReady) { if (!desktopMQ.matches) setView('map'); setTimeout(() => selectPin(id, { fly: true, card: true }), 80); return; }
          state.pendingSelect = id;
          if (!desktopMQ.matches) setView('map');
          initMap();
        }, 80);
        break;
      }
      case 'close-card': e.preventDefault(); clearSelection(); break;
      case 'clear-filters': clearFilters(); break;
      case 'share-faves': {
        const items = [...state.faves].map((id) => byId.get(id)).filter(Boolean);
        const text = 'Bastards on Tour shortlist:\n' + items.map((p) => `• ${p.name} – ${gmapsUrl(p)}`).join('\n');
        share('Our Budapest shortlist', text, location.href.split('#')[0]);
        break;
      }
      case 'faves-map':
        if (desktopMQ.matches) { fitVisible({ all: true }); break; }
        state.onlyFaves = true;
        location.hash = '#/';
        setTimeout(() => {
          setView('map');
          const b = $('#mapBanner');
          b.innerHTML = `Showing your ${plural(state.faves.size, 'fave')}.<button type="button" data-act="faves-off">Show everything</button>`;
          b.hidden = false;
          const go = () => { syncMarkers(); fitVisible({ all: true }); };
          mapReady ? setTimeout(go, 60) : map?.once('style.load', () => setTimeout(go, 120));
        }, 50);
        break;
      case 'faves-off': state.onlyFaves = false; $('#mapBanner').hidden = true; syncMarkers({ fit: true }); break;
      case 'base-paste': {
        const c = parseCoords($('#basePaste')?.value);
        if (c) setBase(c.lat, c.lng); else toast('Couldn’t find Budapest coordinates in that. Try “47.4979, 19.0632”.');
        break;
      }
      case 'base-drop': startBaseDrop(); break;
      case 'base-cancel': baseDropMode = false; $('#mapBanner').hidden = true; break;
      case 'base-clear': clearBase(); break;
      case 'goto-base-info':
        e.preventDefault();
        closeDetailUI();
        history.replaceState(null, '', '#/info');
        setTab('info');
        setTimeout(() => { const d = $('#info-base'); if (d) { d.open = true; d.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }, 60);
        break;
    }
  });

  function clearFilters() {
    state.filters = { tags: new Set(), price: new Set(), late: false, rated: false, sort: 'rec' };
    renderExplore(); syncMarkers();
    if (!filterRoot.hidden) renderFilterBody();
  }

  $('#filterBtn').addEventListener('click', openFilters);
  $('#filterApply').addEventListener('click', closeFilters);
  $('#filterClear').addEventListener('click', clearFilters);
  $('#mapToggle').addEventListener('click', () => setView(state.view === 'map' ? 'list' : 'map'));
  $('#ctrl3d').addEventListener('click', toggle3D);
  $('#ctrlFit').addEventListener('click', () => fitVisible({ all: true }));
  $('#ctrlLocate').addEventListener('click', locate);
  $('#ctrlTour').addEventListener('click', () => (tour ? endTour() : startTour()));
  $('#ctrlAirport').addEventListener('click', () => {
    if (tour) endTour();
    if (mapReady) selectPin('airport', { fly: true, card: true });
    else { state.pendingSelect = 'airport'; initMap(); }
  });
  $('#ctrlAirport').innerHTML = icon('plane');
  $('#ctrlFit').innerHTML = icon('fit');
  $('#ctrlLocate').innerHTML = icon('locate');
  $('#ctrlTour').innerHTML = icon('play');


  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!filterRoot.hidden) closeFilters();
    else if (detailOpenId) closeDetail();
    else if (tour) endTour();
  });

  // list ↔ map hover link on desktop
  document.addEventListener('pointerover', (e) => {
    if (!desktopMQ.matches || !mapReady) return;
    const c = e.target.closest('.card[data-id]');
    $$('.pin.is-hover').forEach((el) => { if (!tour) el.classList.remove('is-hover'); });
    if (c) markers.get(c.dataset.id)?.el.classList.add('is-hover');
  });

  window.addEventListener('hashchange', route);
  window.addEventListener('scroll', () => { $('#exploreHead').classList.toggle('is-scrolled', window.scrollY > 4); }, { passive: true });

  // header height drives the phone map's top edge
  new ResizeObserver(([e]) => { document.documentElement.style.setProperty('--head-h', Math.round(e.borderBoxSize?.[0]?.blockSize ?? e.target.offsetHeight) + 'px'); }).observe($('#exploreHead'));

  // theme flips restyle the map
  darkMQ.addEventListener?.('change', () => {
    if (!map || mapKind !== 'map') return;
    styleOk = false;
    map.setStyle(firstStyle());
  });
  $('#mapStyles').addEventListener('click', (e) => { const b = e.target.closest('[data-kind]'); if (b) setMapKind(b.dataset.kind); });
  syncKindButtons();
  desktopMQ.addEventListener?.('change', (e) => {
    if (e.matches) { initMap(); setTimeout(() => map?.resize(), 50); setView('list'); }
  });

  // countdowns tick over once a minute
  setInterval(() => {
    if (state.tab === 'explore' && !state.q && state.cat === 'all') {
      const hero = $('.hero');
      if (hero) hero.outerHTML = heroHtml();
    }
    if (state.tab === 'plans') renderPlans(true);
  }, 60000);

  /* ---------------- boot ---------------- */
  store.del('me'); // the old who-are-you picker; a saved name must not dim anyone's plan
  renderCats();
  updateFavCount();
  setView('list');
  route();
  booted = true;
  if (desktopMQ.matches) initMap();
  loadWeather();
  loadWikiImages();
  // self-update: if the server has a newer build than this page, reload onto it (once per version)
  const myVersion = document.querySelector('meta[name="bb-version"]')?.content;
  async function checkForUpdate() {
    if (!myVersion || myVersion === 'dev' || location.protocol !== 'https:') return;
    try {
      const r = await fetch('version.json?t=' + Date.now(), { cache: 'no-store' });
      if (!r.ok) return;
      const { v } = await r.json();
      if (v && v !== myVersion && sessionStorage.getItem('bb.reloadedFor') !== v) {
        sessionStorage.setItem('bb.reloadedFor', v);
        // a fresh URL skips every cache between here and GitHub
        location.replace(`${location.pathname}?v=${encodeURIComponent(v)}${location.hash}`);
      }
    } catch { /* offline: carry on with what we have */ }
  }
  checkForUpdate();
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') checkForUpdate(); });

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    const hadController = !!navigator.serviceWorker.controller;
    let reloading = false;
    // when a fresh version takes over, reload once so nobody is stuck on an old copy
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (!hadController || reloading) return; reloading = true; location.reload(); });
    navigator.serviceWorker.register('sw.js').then((reg) => {
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update().catch(() => {}); });
    }).catch(() => { /* offline support is a bonus */ });
  }
})();
