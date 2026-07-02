# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

This is the **v2** workspace (the newest proposal) of an npm-workspaces monorepo (see the root `README.md`). Run commands from the repo root.

```bash
npm run dev:v2          # Start v2 dev server at http://localhost:5174
npm run build -w v2     # Type-check (vue-tsc) then build this workspace → dist/v2
npm run build           # Build all versions → dist/ (v2 lands in dist/v2)
```

This app is served under base `/v2/` and builds to `dist/v2`. There are no tests configured. Type errors surface via `vue-tsc` during the build (config in `apps/v2/tsconfig.json`, scoped to `src/`).

## Architecture

A **Vue 3 + TypeScript + Vite** mobile-first SPA for spray painters (*spuiters*) at SpuitwerkOnline. Designed for smartphone use (max-width 430px). **No backend** — all data is mock in-memory state.

### Global state via composables

Module-level `ref()` objects act as a simple global store (no Pinia/Vuex):

- **`src/composables/useOrders.ts`** — the central data layer. Contains all TypeScript types (`Order`, `OrderStatus`, enum types), label maps (`STATUS_LABELS`, `TYPE_SERVICE_LABELS`, etc.), status ordering (`STATUS_ORDER`), and the reactive `orders` array with mock data. Reads go through `getOrder()`; mutations through `updateStatus()`, `markBeforeFoto()`, `updateKleur()`, and `updateVerwachtGereed()`.
- **`src/composables/useAuth.ts`** — mock logged-in spuiter identity (name, company, initials).

### Order status flow

```
bevestigd → (meerwerk_wacht) → ontvangen → in_productie → productie_gereed → klaar → afgerond
```

- **`meerwerk_wacht`** is a side-state within the flow, not a linear step (an afwijking was reported to SpuitwerkOnline and the order waits for office-arranged customer approval).
- **Receipt and inspection are split into two separate moments** (per Robert's working practice — goods are accepted quickly, then checked later at a quiet moment, often at the start of spraying):
  - **`bevestigd` → `ontvangen` = receipt**: a tap "Bevestig ontvangst" on `OrderDetail.vue` routes to a **confirmation step** (`Ontvangst.vue`, `/order/:id/ontvangst`), which calls `ontvangGoederen()` on mount — **no questions asked**, because whoever accepts the delivery (often an intern/bookkeeper, or a spuiter mid-spray) has no time. The confirmation screen reassures that inspection happens **later** (at the start of spraying) and offers an optional photo, then lets you continue to the order or the overview. Receipt flips the status **and starts the delivery clock**: it records `ontvangstdatum` (today) and sets `verwacht_gereed_datum` to **15 workdays from receipt** (`WERKDAGEN_STANDAARD`, computed by `opleverdatum()`, skipping weekends). The window runs from *receipt*, not from controle — so delaying the controle no longer slides the deadline, and the spuiter has **no input** into it. The arrival/start photo is **optional** and offered at several points so it isn't lost once production starts: a secondary button in the `ontvangen` state, on the Controle success screen ("Controle afgerond"), and persistently in the `in_productie` state until the opleverfoto is made (all route to `/foto/before`). `markBeforeFoto` runs the same receipt logic (`markOntvangen`) when the order is still `bevestigd` — so taking the photo first also counts as receipt and starts the clock; from `in_productie` it just sets `beforeFotoGemaakt` without changing status or dates.
  - **`ontvangen` → `in_productie` = Controle** (`Controle.vue`): later, at the start of spraying, the spuiter checks colour and panel counts, then confirms to start production. The spuiter **no longer sets the lead time** — the expected completion date was already fixed at receipt (15 workdays); Controle only verifies colour/measurements. Confirming starts production. Deviations are reported via Meerwerk.
- **Meerwerk / afwijking melden**: reporting runs through SpuitwerkOnline (office arranges customer approval); the spuiter never confirms customer approval themselves. **Only offered during the controle window** (status `ontvangen` — both the Controle screen and the OrderDetail footer link). Once production starts (`in_productie`) the footer link disappears: deviations must be caught at controle, not after. (Note: this slightly overrides Robert's earlier "discoverable during sanding/prep" rationale — a deliberate product choice by Patrick.)

### Routing

`src/router/index.ts` uses **history mode** (`createWebHistory(import.meta.env.BASE_URL)`), so routes resolve under the version base (e.g. `/v2/order/123`). Netlify SPA-fallback for deep links is configured in the root `netlify.toml`.

| Route | View |
|-------|------|
| `/` | Dashboard — active + completed order list |
| `/order/:id` | OrderDetail — full order + status-driven actions |
| `/order/:id/ontvangst` | Ontvangst — receipt-confirmation step (registers receipt on mount, starts the clock, offers a photo) |
| `/order/:id/controle` | Controle — colour & dimension check at start of spraying → in productie |
| `/order/:id/meerwerk` | Meerwerk — afwijking/extra-work reporting (via SpuitwerkOnline) |
| `/order/:id/foto/:type` | ProductieFoto — photo documentation (`before`/`after`) |
| `/profiel` | Profiel — spuiter profile with financial/payout overview |
| `/account` | Account — account settings (password change, logout) |

### UI setup

- **PrimeVue 4** with a custom `SkyPreset` (Lara base, sky-500 primary). Components registered globally in `main.ts` with `P` prefix: `PButton`, `PTag`, `PCheckbox`, `PInputText`, `PTextarea`, `PAvatar`.
- **Message/alert boxes** use the app's own `.alert` classes (`.alert-info`, `.alert-warning`, `.alert-success`, `.alert-error`), **not** PrimeVue's `PMessage`. The custom alert keeps body text dark/high-contrast (PMessage tints the whole body in the severity colour, which reads poorly). Markup: `<div class="alert alert-info"><strong>Heading</strong> body…</div>` — `.alert strong` auto-styles the uppercase heading.
- **Headers**: the global `.top-bar` (logo + avatar) in `App.vue` renders **only on the dashboard** (`route.path === '/'`). All sub-pages have their own sticky `.app-header` (back button + title) at `top:0` — this avoids two stacked headers eating vertical space on mobile.
- **Tabler Icons** for all icons (class `ti ti-*`), loaded as a webfont — `@tabler/icons-webfont` is imported in `main.ts`. (Outline only; the project migrated off PrimeIcons.)
- **No Tailwind** — all styling is in `src/assets/main.css` using CSS custom properties (`--primary`, `--surface`, `--card`, `--border`, `--muted`, `--radius`, etc.). Views use these global CSS classes (`card`, `badge`, `order-item`, `detail-row`, `bottom-bar`, `alert`, etc.) — avoid scoped styles.
- Font: **Fira Sans** (Google Fonts).
- Build output goes to **`dist/v2`** at the repo root (configured in `vite.config.ts`).

### Language

All UI text, variable names, and code comments are in **Dutch**.

### Known duplication

`kleurToHex()` is duplicated in `Dashboard.vue`, `OrderDetail.vue`, and `BevestigOntvangst.vue`. If extending color logic, update all three.
