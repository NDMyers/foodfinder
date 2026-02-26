# Browser Icon Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the default Vercel favicon with a pastel burger SVG icon in the browser tab.

**Architecture:** Create a new `favicon.svg` in Next.js App Router's `src/app/` directory (auto-served as `/favicon.svg`) and update `layout.tsx` to reference it instead of the current `favicon.ico`.

**Tech Stack:** Next.js 16 App Router, SVG

---

### Task 1: Create feature branch

**Files:**
- No file changes

**Step 1: Checkout the feature branch**

```bash
git checkout -b features/browser_icon
```

Expected: `Switched to a new branch 'features/browser_icon'`

**Step 2: Commit design doc**

```bash
git add docs/plans/2026-02-26-browser-icon-design.md docs/plans/2026-02-26-browser-icon.md
git commit -m "docs: add browser icon design and implementation plan"
```

---

### Task 2: Create the burger SVG favicon

**Files:**
- Create: `src/app/favicon.svg`

**Step 1: Create the SVG file**

Create `src/app/favicon.svg` with this content:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <!-- Top bun -->
  <ellipse cx="16" cy="9" rx="12" ry="6" fill="#F9C9A0"/>
  <!-- Lettuce -->
  <rect x="4" y="13" width="24" height="3" rx="1" fill="#B5E4B0"/>
  <!-- Patty -->
  <rect x="4" y="16" width="24" height="4" rx="1" fill="#E8A598"/>
  <!-- Cheese -->
  <rect x="4" y="20" width="24" height="2.5" rx="0.5" fill="#F9E4A0"/>
  <!-- Bottom bun -->
  <ellipse cx="16" cy="24" rx="12" ry="3.5" fill="#F9C9A0"/>
</svg>
```

**Step 2: Verify the file exists**

```bash
ls src/app/favicon.svg
```

Expected: `src/app/favicon.svg`

---

### Task 3: Update layout.tsx to reference the SVG

**Files:**
- Modify: `src/app/layout.tsx`

**Step 1: Open the file and find the icons section**

Current code at approximately line 23-26:
```ts
icons: {
  icon: "/favicon.ico",
  apple: "/favicon.ico",
},
```

**Step 2: Update to SVG**

Replace with:
```ts
icons: {
  icon: "/favicon.svg",
  apple: "/favicon.svg",
},
```

**Step 3: Verify the change**

```bash
grep -n "favicon" src/app/layout.tsx
```

Expected output includes `favicon.svg` (not `.ico`)

---

### Task 4: Verify locally

**Step 1: Start the dev server**

```bash
npm run dev
```

**Step 2: Open browser**

Navigate to `http://localhost:3000` and confirm the burger icon appears in the browser tab.

**Step 3: Stop the dev server**

`Ctrl+C`

---

### Task 5: Commit, merge to main, and deploy

**Step 1: Stage and commit the icon changes**

```bash
git add src/app/favicon.svg src/app/layout.tsx
git commit -m "feat: add pastel burger SVG as browser tab favicon"
```

**Step 2: Merge to main**

```bash
git checkout main
git merge features/browser_icon
```

**Step 3: Deploy to Vercel production**

```bash
vercel --prod
```

Expected: Deployment URL printed at end of output.
