# FoodFinder V2

FoodFinder is a mobile-first restaurant discovery app powered by geolocation and Google Places.

## Highlights

- Map + bottom-sheet interaction model optimized for touch devices
- Filter by radius, cuisine, open-now, and sort by distance/rating
- Random winner picker with confetti celebration and one-tap directions
- Hardened API boundary for Places requests via `POST /api/restaurants`
- PWA basics (manifest + service worker + offline fallback route)

## Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS + custom design tokens
- Google Maps JavaScript API + Google Places Nearby Search

## Environment Variables

Copy `.env.example` to `.env.local` and set values:

```bash
MAPS_API=...
```

Key guidance:

- Existing Vercel setup with `MAPS_API` is supported (no new env vars required).
- Optional compatibility aliases also work if already configured: `GOOGLE_PLACES_SERVER_KEY`, `NEXT_PUBLIC_MAPS_API_KEY`, `NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY`.

## Run

```bash
npm install
npm run dev
```

App routes:

- `/` main revamp experience
- `/revamp` revamp route for staged rollout parity
- `/offline` offline fallback page

## API Contracts

### `POST /api/restaurants`

Request:

```json
{
  "latitude": 37.7749,
  "longitude": -122.4194,
  "radiusMeters": 3000,
  "cuisines": ["japanese", "thai"],
  "openNow": true,
  "sortBy": "distance"
}
```

Response:

```json
{
  "restaurants": [],
  "meta": {
    "total": 0,
    "source": "google-places",
    "fetchedAt": "2026-02-12T00:00:00.000Z"
  }
}
```

Legacy endpoint:

- `GET/POST /api/location` remains available as a deprecated compatibility wrapper and returns deprecation metadata.

## Security Notes

- Request validation and allowlisted filter values in `src/lib/validation/restaurantsRequest.ts`
- Rate limiting and structured server errors in `src/app/api/restaurants/route.ts`
- Upstream query construction via `URLSearchParams` in `src/lib/google/placesClient.ts`
- Security headers defined in `next.config.mjs`
