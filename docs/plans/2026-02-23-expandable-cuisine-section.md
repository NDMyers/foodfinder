# Expandable Cuisine Section Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Convert the always-visible cuisine chip list in FilterSheet into a collapsible section, collapsed by default, with a count badge when filters are active.

**Architecture:** Add local `useState` to FilterSheet for open/closed toggle. Replace the `fieldset` with a `div` containing a clickable header row (label + count badge + chevron) and a conditionally rendered chip grid.

**Tech Stack:** React (useState), Tailwind CSS, existing CuisineChip component

---

### Task 1: Implement expandable cuisine section in FilterSheet.tsx

**Files:**
- Modify: `src/components/revamp/FilterSheet.tsx:131-143`

**Step 1: Add useState import and cuisinesOpen state**

At the top of the component function body, add:

```tsx
const [cuisinesOpen, setCuisinesOpen] = useState(false);
```

Make sure `useState` is imported from React (add to existing import if needed).

**Step 2: Replace the cuisine fieldset with expandable section**

Replace lines 131–143 (the `<fieldset>` block) with:

```tsx
{/* Cuisines — expandable */}
<div className="border border-glass-border/40 rounded-xl overflow-hidden">
  <button
    type="button"
    onClick={() => setCuisinesOpen((o) => !o)}
    className="w-full flex items-center justify-between px-3 py-2.5 bg-white/40 hover:bg-white/60 transition-colors text-sm font-medium text-ink"
  >
    <span className="flex items-center gap-2">
      Cuisines
      {state.filters.cuisines.length > 0 && (
        <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
          {state.filters.cuisines.length}
        </span>
      )}
    </span>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`w-4 h-4 text-ink-soft transition-transform duration-200 ${cuisinesOpen ? "rotate-180" : ""}`}
    >
      <path
        fillRule="evenodd"
        d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  </button>

  {cuisinesOpen && (
    <div className="flex flex-wrap gap-2 px-3 py-3 bg-white/20">
      {CUISINES.map((cuisine) => (
        <CuisineChip
          key={cuisine.id}
          label={cuisine.label}
          active={state.filters.cuisines.includes(cuisine.id)}
          onToggle={() => toggleCuisine(cuisine.id)}
        />
      ))}
    </div>
  )}
</div>
```

**Step 3: Verify visually**

Run the dev server and confirm:
- Cuisine section is collapsed by default
- Clicking the row expands/collapses the chips
- Selecting chips while open and then closing shows a count badge on the header
- Chevron rotates when open

Run: `npm run dev` and check in browser.

**Step 4: Commit**

```bash
git add src/components/revamp/FilterSheet.tsx
git commit -m "feat: make cuisine section collapsible with count badge"
```
