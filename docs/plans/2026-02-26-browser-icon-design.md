# Browser Icon Design: Pastel Burger SVG Favicon

## Overview

Replace the default Vercel favicon with a pastel-colored burger SVG icon.

## Approach

SVG favicon placed in `src/app/favicon.svg` (Next.js App Router convention). Reference updated in `layout.tsx`.

## Visual Design

32×32 SVG burger with warm pastel layers (top to bottom):

| Layer       | Color     | Description           |
|-------------|-----------|----------------------|
| Top bun     | `#F9C9A0` | Soft peach, rounded dome |
| Lettuce     | `#B5E4B0` | Pale sage green, wavy edge |
| Patty       | `#E8A598` | Muted pink/rose |
| Cheese      | `#F9E4A0` | Pale yellow |
| Bottom bun  | `#F9C9A0` | Matching peach, flatter |

Flat fills, no outlines — soft and readable at 16×16.

## File Changes

1. `src/app/favicon.svg` — new burger SVG icon
2. `src/app/layout.tsx` — update `icon` and `apple` references to `/favicon.svg`

## Branch

`features/browser_icon` → merge to `main` → deploy to Vercel
