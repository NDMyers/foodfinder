# Design: Convert km to miles

## Overview
Replace all kilometers (km) distance displays with miles throughout the FoodFinder app.

## Changes

### Display Format
- Convert distances from km to miles using factor: 1 km = 0.621371 miles
- Format with 1 decimal place (e.g., "1.5 miles", "8.0 miles")
- Update both restaurant distance display and search radius filter options

### Files Affected
1. **src/components/revamp/ResultsList.tsx** (line 12)
   - `formatDistance()` function converts meters to km
   - Update to convert meters to miles instead

2. **src/components/revamp/FilterSheet.tsx** (line 185)
   - Radius filter options display km labels
   - Update to display miles labels

### Implementation Strategy
Direct conversion approach:
- Modify `formatDistance()` in ResultsList.tsx: multiply by 0.621371 instead of dividing by 1000
- Update filter label in FilterSheet.tsx: convert RADIUS_OPTIONS values to miles
- Keep display format consistent: "X.X miles"

## Success Criteria
- All distance displays show miles instead of km
- All values show exactly 1 decimal place
- Search radius filter reflects miles
- Restaurant result cards show distance in miles
