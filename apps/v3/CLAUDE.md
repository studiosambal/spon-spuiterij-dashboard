# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

This is the **v3** workspace (the newest proposal) of an npm-workspaces monorepo (see the root `README.md`). Run commands from the repo root.

```bash
npm run dev:v3          # Start v3 dev server at http://localhost:5175
npm run build -w v3     # Type-check (vue-tsc) then build this workspace → dist/v3
npm run build           # Build all versions → dist/ (v3 lands in dist/v3)
```

This app is served under base `/v3/` and builds to `dist/v3`. There are no tests configured. Type errors surface via `vue-tsc` during the build (config in `apps/v3/tsconfig.json`, scoped to `src/`).

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

### Geld per order

`OrderDetail` toont onderin het Overzicht wat de order oplevert: **Vergoeding** (`order.bedrag`), **Meerwerk**, **Totaal** en **Uitbetaling**. Zonder dit moet de spuiter de order uit om te zien wat hij verdient.

- Meerwerk telt **pas mee in het totaal als de klant akkoord is** (`meerwerk.status === 'akkoord'`). Tot dat moment staat er "€85 aangevraagd" met de toelichting dat SpuitwerkOnline akkoord vraagt — een aanvraag is geen bedrag waar je op mag rekenen. `orderTotaal()` in `useOrders.ts` is de enige plek waar dit wordt gerekend; `Profiel.vue` gebruikt dezelfde functie, zodat de bedragen op beide pagina's niet uiteen kunnen lopen.
- Er staat **bewust geen (verwachte) uitbetaaldatum**. SpuitwerkOnline heeft de uitbetaaltermijn nog niet vastgelegd, en Robert waarschuwde dat een uitbetaaldatum die niet klopt meer vertrouwen kost dan hij oplevert. De rij zegt daarom alleen wie er aan zet is: *Volgt na afronding* → *Staat open* → *Uitbetaald*. Ook het logboek noemt geen uitbetaaldatum meer (dat gebruikte eerder `order.datum`, de órderdatum). Zodra de termijn vaststaat kan hier een datum bij.
- **Betaling vs uitbetaling** worden uit elkaar gehouden in de copy: "Wacht op klantbetaling" (klant → SpuitwerkOnline) tegenover "Wacht op jouw uitbetaling" (SpuitwerkOnline → spuiter).

### Routing

`src/router/index.ts` uses **history mode** (`createWebHistory(import.meta.env.BASE_URL)`), so routes resolve under the version base (e.g. `/v3/order/123`). Netlify SPA-fallback for deep links is configured in the root `netlify.toml`.

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

**Native PrimeVue first.** The theme is the single source of truth: `SpuitwerkPreset` in `main.ts` (Lara base, sky primary). `src/assets/main.css` does **not** define colours of its own — its variables (`--surface`, `--card`, `--border`, `--text`, `--muted`, `--radius`) are aliases for `--p-*` tokens, and the hand-built parts reference those. Change a colour in the preset and it lands everywhere at once. Never reintroduce a hex literal outside the preset; the one exception is `kleurToHex()`, which maps RAL/NCS paint names to swatch colours and is product data, not theming.

Components registered globally in `main.ts` with a `P` prefix: `PButton`, `PTag`, `PMessage`, `PCheckbox`, `PInputText`, `PTextarea`, `PAvatar`, `PIconField`, `PInputIcon`.

- **Status badge** = `PTag` with a severity from `STATUS_SEVERITY` (`useOrders.ts`). Only rendered on `OrderDetail`; the dashboard carries the phase in its group headings instead.
- **Messages** = `PMessage severity="info|warn|success|error"`, with an optional `<strong>` heading inside for the uppercase label.
- **Search field** = `PIconField` + `PInputIcon` + `PInputText`.

**Type scale.** Font sizes come from a seven-step rem scale defined in `main.css` (`--text-xs` … `--text-3xl`, 0.8rem – 2.125rem). The root font size is deliberately **not** pinned, so `1rem` is whatever the reader set in their browser and all text scales with it — which matters for a phone used in a workshop. Two rules:

- **Text** uses the scale. Never a raw `px` font-size, and never a value outside the seven steps.
- **Icons and structure** (widths, heights, borders, radii, icon `font-size`) stay in `px`: they belong to px-sized containers, and PrimeVue does the same for its own radii and border widths. An icon that grew with the reader's text setting would burst the fixed circle it sits in.

Input fields are pinned to at least `1rem`; below 16px iOS zooms in on focus.

**Deliberate deviations from stock Lara** — each is configured *in the preset*, not worked around in CSS, and each has a reason:

| Deviation | Why |
|---|---|
| `text.color` → `{surface.900}`, `mutedColor` → `{surface.600}` | Lara's defaults (700/500) are too light for a phone held in a workshop under changing light. |
| `content.borderRadius` → 12px (Lara: 6px) | Matches the calm, roomy card layout. Tag is pulled back to 6px so badges stay crisp. |
| Tag severities → the **700** tint instead of Lara's 500 | White-on-500 fails WCAG AA (sky 2.8, green 2.3, orange 2.8, red 3.8 against a 4.5 requirement). The 700 tint scores 5.0–6.5. |
| Message `text` → 14px / weight 400 (Lara: 1rem / 500) | With `html{font-size:15px}`, Lara's 1rem body renders *larger* than the 12px/700 heading above it and nearly as heavy, so the heading stops reading as a heading. |
| Message `info` → `{primary.*}` instead of `{blue.*}` | The app runs on sky; Lara's blue clashes with it. |
| Message text → the **700/800** tint instead of Lara's 600 | The tinted text itself is kept (it reads calmer than black on a coloured panel), but Lara's 600 level fails contrast against its own 50-background: 2.8–4.4:1 where 4.5 is required. At 700/800 it scores 4.8–7.1. |

**Still hand-built, on purpose:** the order card (`OrderCard.vue`), the fase groups on the dashboard, the timeline, the panel table and the signal footer strips. The footer strip is white by default and only takes a tint when there is something to act on (red = overdue, orange = do not hand over, green = paid, may go). A grey resting tint was tried and dropped: it sat too close to the page background, so the card looked like it bled into the page, and it diluted the signal by putting a coloured band on every card. These are bespoke compositions with no PrimeVue equivalent — forcing `Card`/`Panel` around them would add markup without adding behaviour. They take all their colours from the same tokens, so they cannot drift.

*Note:* `PMessage` animates its height open on mount (native Lara behaviour). Harmless in a real browser; in a hidden/headless pane the animation can stall at height 0, so measure with the pane fronted.
- **Headers**: the global `.top-bar` (logo + avatar) in `App.vue` renders **only on the dashboard** (`route.path === '/'`). All sub-pages have their own sticky `.app-header` (back button + title) at `top:0` — this avoids two stacked headers eating vertical space on mobile.
- **Tabler Icons** for all icons (class `ti ti-*`), loaded as a webfont — `@tabler/icons-webfont` is imported in `main.ts`. (Outline only; the project migrated off PrimeIcons.)
- **No Tailwind** — all styling is in `src/assets/main.css`, which aliases PrimeVue tokens (see above). Views use the global classes (`card`, `ordercard`, `section-label`, `detail-row`, `bottom-bar`, `panel-table`) — avoid scoped styles.
- Font: **Fira Sans** (Google Fonts).
- Build output goes to **`dist/v3`** at the repo root (configured in `vite.config.ts`).

### Language

All UI text, variable names, and code comments are in **Dutch**.

### Known duplication

`kleurToHex()` is duplicated in `Dashboard.vue`, `OrderDetail.vue`, and `BevestigOntvangst.vue`. If extending color logic, update all three.
