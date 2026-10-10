# Bastards on Tour

An Airbnb-style guide to Budapest for the lads' weekend, **Thu 15 – Sun 18 Oct 2026**. It's a static web app with no build step and no API keys. It works on phones and can be added to the home screen.

- **Explore**: the must-sees (24 gold-badged highlights: landmarks, baths, bars, food), top bars (including For Sale Pub, the post-it note bar), rock bars, ruin bars, odd bars, rooftops, clubs, restaurants, must-try food, history, baths and things to do. Includes filters and a 3D map with Buda's hills and extruded buildings.
- **The plan**: only what's booked: landing (with flight numbers once added in `content/trip.json` → `flights`), Thursday's football (Phil, Chris and Paul), karting, MTK and the airport deadline. Kick-off times include the live forecast for that hour.
- **Faves**: save places on your own phone and send the shortlist to the group chat.
- **Info**: weather, the airport, 2026 taxi apps and tariffs, transport, money, roaming, scams, emergency numbers, the baths and Hungarian phrases.
- Every place has a Google Maps directions button, plus links to its Google and Tripadvisor reviews and photos. Each place also has its own link (`#/p/<id>`) you can share.

## Put it online (one-time, about 30 seconds)

1. On GitHub, open **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to *Deploy from a branch*, choose **`main`** and **`/ (root)`**, then click **Save**.
3. After a minute it's live at **https://fitzilla.github.io/Budapest-bastards/**. Send that link to the group.

## Adding the Airbnb address

Edit `content/trip.json`. Under `base`, fill in `address`, `lat`, `lng` and `checkIn`. Then run:

```sh
node scripts/build-data.mjs
```

Commit and push `data.js`. Until then, anyone can drop their own pin from **Info → The Airbnb**. That pin is saved on their phone only.

## Editing content

- `content/research/*.json` holds the researched places (bars, food, sights and logistics).
- `content/overrides.json` holds hand corrections: map pin fixes, duplicates removed, and pins hidden where the address is unverified.
- `content/trip.json` holds the crew, the base and the day-by-day plan.
- `scripts/build-data.mjs` validates all of this (ids, coordinates, plan references) and writes `data.js`.

## What's verified and what isn't

- **Fradi v Plzeň:** kick-off at 21:00 is verified. Confirm on uefa.com before you go.
- **Karting:** the Hungaroring GoKart Center location is verified.
- **MTK v Vasas:** Fri 16 Oct, gates 18:00, kick-off 19:00 Budapest time, confirmed by the booking.
- **Map pins:** most venue pins are placed from street addresses and may be a few doors out. The Google Maps button always goes to the right place.
- **Ratings:** about 46 of 114 places have a verified Tripadvisor or Google score (`content/ratings.json`). Scores based on fewer than 15 reviews are hidden. Places without a score link to their live ratings and photos instead.
- **Closures:** Gellért Baths has been closed since Oct 2025 and Király Baths is also shut. Both are marked closed in the app.

## Tech

Plain HTML, CSS and JS. MapLibre GL 4.7.1 is vendored in `vendor/`, and so are the fonts (Big Shoulders Display and Barlow, SIL OFL). The map has three styles: **Map** (OpenFreeMap vector, falling back to CARTO), **Satellite** (Esri World Imagery with road and place labels) and **Terrain** (Esri World Topo, falling back to OpenTopoMap). All three sit on AWS Terrain Tiles for 3D hills. Every place has a photo: the venue itself, the building it's in, or the street outside (Wikimedia Commons, `content/images.json`); a Wikipedia lead photo fetched at runtime (`content/wiki.json`); or, for the last few, a clearly labelled illustrative photo (`content/illustrative.json`). Each credit links to the photo's Commons page for author and licence. Weather comes from Open-Meteo. A service worker caches the app, fonts, map tiles and photos so it copes with patchy roaming.
