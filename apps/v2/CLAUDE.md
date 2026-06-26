# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

This is the **v2** workspace (the newest proposal) of an npm-workspaces monorepo (see the root `README.md`). Run commands from the repo root.

```bash
npm run dev:v2   # Start v2 dev server at http://localhost:5174
npm run build    # Build all versions → dist/ (v2 lands in dist/v2)
```

This app is served under base `/v2/` and builds to `dist/v2`. There are no tests configured.

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

- **`meerwerk_wacht`** is a side-state within the flow, not a linear step. `OrderDetail.vue` maps it back to `ontvangen` for the process-steps display via `effectiveStatus`.
- **`ontvangen` → `in_productie`**: This transition is now **automated**. Once the spuiter takes the before-photo (`markBeforeFoto`), the status automatically shifts to `in_productie`. 
  *UX Rationale*: The manual "Start opdracht" button was removed because it proved to be an unrealistic administrative burden. In reality, a spuiter has dirty hands (gloves, paint) when starting the actual spraying and will not grab their phone to press a "Start" button. Automating this upon intake (before-photo) matches the reality of the workshop floor.
- **Meerwerk melden**: The option to report extra work ("Meer- of minderwerk melden") is available during the `in_productie` phase, because extra work is typically discovered during sanding/prep.

### Routing

`src/router/index.ts` uses **history mode** (`createWebHistory(import.meta.env.BASE_URL)`), so routes resolve under the version base (e.g. `/v2/order/123`). Netlify SPA-fallback for deep links is configured in the root `netlify.toml`.

| Route | View |
|-------|------|
| `/` | Dashboard — active + completed order list |
| `/order/:id` | OrderDetail — full order + status-driven actions |
| `/order/:id/bevestig` | BevestigOntvangst — product intake checklist |
| `/order/:id/meerwerk` | Meerwerk — additional/less work reporting |
| `/order/:id/foto/:type` | ProductieFoto — photo documentation (`before`/`after`) |
| `/profiel` | Profiel — spuiter profile with financial/payout overview |
| `/account` | Account — account settings (password change, logout) |

### UI setup

- **PrimeVue 4** with a custom `SkyPreset` (Lara base, sky-500 primary). Components registered globally in `main.ts` with `P` prefix: `PButton`, `PTag`, `PMessage`, `PCheckbox`, `PInputText`, `PTextarea`, `PAvatar`.
- **PrimeIcons** for all icons (class `pi pi-*`).
- **No Tailwind** — all styling is in `src/assets/main.css` using CSS custom properties (`--primary`, `--surface`, `--card`, `--border`, `--muted`, `--radius`, etc.). Views use these global CSS classes (`card`, `badge`, `order-item`, `detail-row`, `bottom-bar`, etc.) — avoid scoped styles.
- Font: **Fira Sans** (Google Fonts).
- Build output goes to **`dist/v2`** at the repo root (configured in `vite.config.ts`).

### Language

All UI text, variable names, and code comments are in **Dutch**.

### Known duplication

`kleurToHex()` is duplicated in `Dashboard.vue`, `OrderDetail.vue`, and `BevestigOntvangst.vue`. If extending color logic, update all three.
