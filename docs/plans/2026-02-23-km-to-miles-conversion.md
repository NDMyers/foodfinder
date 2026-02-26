# km to miles Conversion Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace all kilometer displays with miles throughout the FoodFinder app using direct conversion (0.621371 factor, 1 decimal place format).

**Architecture:** Update two formatting locations: `formatDistance()` function in ResultsList.tsx and the radius filter options in FilterSheet.tsx. Both convert meters to miles and format as "X.X miles".

**Tech Stack:** React, TypeScript, Framer Motion, Next.js

---

## Task 1: Update formatDistance function in ResultsList.tsx

**Files:**
- Modify: `src/components/revamp/ResultsList.tsx:9-13`

**Step 1: Read current implementation**

Location: `src/components/revamp/ResultsList.tsx` lines 9-13

Current code:
```typescript
const formatDistance = (distanceMeters: number | null): string => {
  if (typeof distanceMeters !== "number") return "Distance unavailable";
  if (distanceMeters < 1000) return `${distanceMeters} m`;
  return `${(distanceMeters / 1000).toFixed(1)} km`;
};
```

**Step 2: Update function to use miles**

Replace with:
```typescript
const formatDistance = (distanceMeters: number | null): string => {
  if (typeof distanceMeters !== "number") return "Distance unavailable";
  const miles = distanceMeters * 0.000621371; // meters to miles
  if (miles < 0.1) return `${distanceMeters} m`;
  return `${miles.toFixed(1)} miles`;
};
```

Note: 0.000621371 = 0.621371 / 1000 (converts meters directly to miles)

**Step 3: Verify change in context**

The `formatDistance` function is used on line 101 in the restaurant card display. Verify the change affects the distance badge.

**Step 4: Commit**

```bash
git add src/components/revamp/ResultsList.tsx
git commit -m "feat: convert distance display from km to miles"
```

---

## Task 2: Update search radius filter options in FilterSheet.tsx

**Files:**
- Modify: `src/components/revamp/FilterSheet.tsx:185`

**Step 1: Understand current implementation**

Location: `src/components/revamp/FilterSheet.tsx` line 185

Current code:
```typescript
options={RADIUS_OPTIONS.map((r) => ({ label: `${r / 1000} km`, value: r }))}
```

`RADIUS_OPTIONS` is imported from `@/types/filters` and contains radius values in meters.

**Step 2: Update to display miles**

Replace with:
```typescript
options={RADIUS_OPTIONS.map((r) => ({ label: `${(r * 0.000621371).toFixed(1)} miles`, value: r }))}
```

This converts the meter values to miles with 1 decimal place.

**Step 3: Verify the filter still functions**

The `value` prop remains the same (meters), so the backend logic doesn't change. Only the display label changes.

**Step 4: Commit**

```bash
git add src/components/revamp/FilterSheet.tsx
git commit -m "feat: convert search radius filter display from km to miles"
```

---

## Task 3: Test the changes

**Step 1: Start the development server**

```bash
npm run dev
```

Expected: Application starts without errors on `http://localhost:3000`

**Step 2: Manual testing - Distance display**

1. Click "Use Location" to request device location
2. Click "Find Food" to fetch restaurants
3. Verify each restaurant card shows distances in miles with 1 decimal place (e.g., "2.5 miles", "0.8 miles")

**Step 3: Manual testing - Radius filter**

1. Open the "Search Radius" dropdown filter
2. Verify all options show miles with 1 decimal place (e.g., "1.6 miles", "3.1 miles", "4.9 miles")
3. Select different radius options and verify searches still work

**Step 4: Verify no errors in console**

Check browser console for any JavaScript errors related to formatting or display.

---

## Task 4: Commit completed work

**Step 1: Verify git status**

```bash
git status
```

Expected: All changes should be committed from previous steps.

**Step 2: View commit history**

```bash
git log --oneline -3
```

Expected: Should show the two formatting commits at the top.

---

## Notes

- Conversion factor: 1 meter = 0.000621371 miles
- Display format: 1 decimal place (e.g., "2.5 miles")
- Meters below 0.1 miles stay displayed in meters for precision
- Backend values (radiusMeters, distanceMeters) remain unchanged in meters; only display formatting changes
