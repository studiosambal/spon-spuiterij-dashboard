# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

This is the **v4** workspace (the newest proposal — v3 made responsive) of an npm-workspaces monorepo (see the root `README.md`). Run commands from the repo root.

```bash
npm run dev:v4          # Start v4 dev server at http://localhost:5176
npm run build -w v4     # Type-check (vue-tsc) then build this workspace → dist/v4
npm run build           # Build all versions → dist/ (v4 lands in dist/v4)
```

This app is served under base `/v4/` and builds to `dist/v4`. There are no tests configured. Type errors surface via `vue-tsc` during the build (config in `apps/v4/tsconfig.json`, scoped to `src/`).

## Architecture

A **Vue 3 + TypeScript + Vite** mobile-first SPA for spray painters (*spuiters*) at SpuitwerkOnline. The phone in the workshop is the primary use; v4 adds tablet and desktop **through the same markup** (responsive, not a second variant). **No backend** — all data is mock in-memory state.

### Responsive (new in v4)

One layout, three widths. **Mobile (< 768px) is pixel-identical to v3** — every responsive rule is a `min-width` media query or a helper class that does nothing on a phone. All of it lives at the bottom of `src/assets/main.css` (block "Responsive") plus a few helper classes just above it.

| Width | What changes |
|---|---|
| < 768px | v3 as-is: top-bar only on the dashboard, sticky `.app-header` per sub-page, sticky `.bottom-bar`. |
| ≥ 768px (tablet) | The top-bar shows on **every** page (logo → orders, name + avatar → profiel) and the `.app-header` becomes a plain page title. Forms/steps sit in a readable column (`.pagina-smal`, 760px; Profiel `.pagina-midden`, 1040px). Order cards flow into a grid. Button rows (`.actie-rij`) go side by side, primary action on the right. |
| ≥ 1024px (desktop) | `.bottom-bar` stops floating and sits under the form. **OrderDetail goes two-column**: opdracht + gegevens on the left, a sticky Activiteit (timeline) column on the right. |

- **Content max-width 1240px** (`.app-body` and `.top-bar-inner` share it so logo and page title align).
- **`.order-lijst` / `.order-rij`** (dashboard groups): one white list per phase, rows split by a hairline. Below 1024px a row is a compact block (wat → klant → wat nu); from 1024px the same markup becomes one row with fixed columns `wat · klant · wat nu · ›` via `grid-template-areas`, so the 'wat nu' label always sits in the same column.
- **Kruimelpad** (`src/components/Kruimelpad.vue`): every sub-page header starts with it instead of a 'Terug' button — `Orders / SOL-… / Pagina`, links in `--primary`, the current page grey; the first item carries a chevron so it also reads as 'back' on a phone. Pass `items: { label, to? }[]`; the last item is the current page.
- **OrderDetail** (approved Stripe-style design in `Open Design/orderdetail-stripe/`): breadcrumb `Orders / id` → h1 + status tag → **volgende-stap card** (`.odb`) → `.detail-layout` with `.detail-hoofd` (Opdracht cards, Gegevens) and `aside.detail-zij` (Activiteit). The card has two layers. The header row (`.odb-kop`) holds the fact (opleverdatum while it matters, later gereed gemeld / betaald / afgerond), its badge and, while `in_productie`, **Wijzigen** at the right end (Stripe inline-edit pattern). The body (`.odb-body`) shows 'Volgende stap', the action itself as title (`stapB`, e.g. "Gereed melden"), one sentence and the buttons. Colour sits where the signal is about: overdue tints only the header red; 'Nog niet meegeven' (red, hand-stop icon) and 'Mag mee met de klant' (green, check icon) tint the whole card, header one shade stronger than the body, with a big bold title. Actions come from one `acties` list, rendered in the panel from 768px and in the sticky mobile `.od-balk` below that. The side column **Voortgang** (voorstel E, 5 nov; mockups in `Open Design/tijdlijn-voorstellen/`) has two plain lists without dates or connecting line: **Gedaan** (the `gedaan` entries of `orderLogboek`, in order of occurrence; the customer's payment simply appears there when it comes in) and **Nog te doen** (only the spuiter's own work: ontvangst bevestigen, controle, gereed melden, meegeven; the current one in primary). Payment is not a step: it only shows as a lock badge on meegeven, and only once it matters (paid: green 'betaald'; work gereed but unpaid: red 'wacht op betaling'). Gereed melden is the spuiter's own action, never a condition next to payment. No colour swatch: colours are entered freely, so a hex guess misleads.
- **Input method, not width, drives copy and touch sizing**: `@media (hover: hover) and (pointer: fine)` shrinks buttons to 48px and adds card hover. `useMuis()` (`src/composables/useMuis.ts`) exposes the same query for copy: "Foto toevoegen"/"klik" with a mouse, "Foto maken"/"tik" with a finger. (Headless Chromium reports `pointer: fine` even when emulating a phone — screenshots there show the mouse variants.)
- **Bevestigingsschermen** (Ontvangst, Controle afgerond, Gemeld bij SpuitwerkOnline, Foto's opgeslagen / Gereed gemeld) share one Stripe-style pattern: `Kruimelpad` on the wide container, then `.ont-kolom` (680px, centered) with `.ont-kop` (green check, title, klant · id), one `.od-stap` panel with what happens now, optional next-step rows `.ont-stap` (icon, title, one line, a real `PButton`; several rows share one `.ont-stappen` card with a hairline, only one filled button: e.g. Ontvangst offers photos first, then "Controle starten"), and `.ont-acties` with 'Naar overzicht'.

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
- **Berichten aan de spuiter** (decision Patrick, 1 Nov): the spuiter only gets a message when he has to act or can continue. Exactly two, by mail to the spuiterij's address: **"Je kunt verder met SOL-…"** after the klant decides on meerwerk (it also says whether the opleverdatum shifts), and **"SOL-… mag mee"** once the klant has paid. Nothing else: no confirmation of a melding, no payout notice; he sees those in the portal. Copy may only promise a message at those two moments; anywhere else write text that holds without one ("Je ziet het hier zodra…"). Promises to the klant ("wij laten de klant het weten") are SpuitwerkOnline's business and stay. WhatsApp and a profile setting may come later.
- **Geen gedachtestreepjes in zichtbare tekst.** No —, – or a hyphen between spaces as a sentence separator anywhere the spuiter reads (labels, copy, timeline, placeholders, aria-labels). Rewrite with a comma, a full stop or two sentences ("Klant heeft betaald, mag mee"). Hyphens inside compounds (SOL-2025-004, e-mailadres) are fine, and so are code comments. Colour names as delivered by the configurator ("RAL 9001 - Gebroken Wit") are product data, not copy.
- **Naam:** the app is the **Spuiterportaal**. Browser tab "Spuiterportaal • SpuitwerkOnline"; the top bar shows a small muted "Spuiterportaal" after a divider next to the logo from 600px (hidden on phones, where it does not fit beside logo and avatar).
- **Gereed melden** is the one name for this step everywhere: the button on the order (camera icon), the page title and breadcrumb of `/foto/after`, and its bottom button. The spuiter must know from the start that the photo reports the order ready, not just saves a picture. The receipt photo (`/foto/before`) keeps its own wording.
- **Nieuwe opleverdatum** (`Opleverdatum.vue`, decision Patrick + Robert 30 Oct): the default stays 15 workdays from receipt, no per-spuiter lead time. While `in_productie`, the order panel shows a small "Wijzigen" (pencil) right next to the opleverdatum and its badge: Stripe's inline-edit pattern, the edit sits with the value it changes, not among the next-step buttons. Convention for every `acties` list: secondary first, primary last; desktop shows them left to right, the mobile `.od-balk` uses column-reverse so the primary sits on top. The spuiter picks a date (1 week, 2 weeks, or own date) and a reason (`drukte`, `ondergrond`, `overig` with required toelichting). `verschuifOplevering()` stores each change in `order.datumWijzigingen` (old and new date, reason, toelichting) so SpuitwerkOnline can later see who shifts most; no report yet. Status stays the same, the new date shows everywhere, the timeline logs it, and the confirmation says we inform the klant. Undo restores the previous date.
- **Meerwerk / afwijking melden**: reporting runs through SpuitwerkOnline (office arranges customer approval); the spuiter never confirms customer approval themselves. **Only offered during the controle window** (status `ontvangen` — both the Controle screen and the OrderDetail footer link). Once production starts (`in_productie`) the footer link disappears: deviations must be caught at controle, not after. (Note: this slightly overrides Robert's earlier "discoverable during sanding/prep" rationale — a deliberate product choice by Patrick.) The form starts with checkboxes **"Wat wijkt er af?"** in Robert's order (5 nov): **huidige afwerking is anders** (Robert's wording; formerly "staat van het werk"), **specificaties kloppen niet**, overige; only the cards for ticked options appear. Specificaties shows the whole configuration per dienst (materiaal, zijdig, kleur) with a counter per orderregel, a free text "Wat klopt er verder niet?" (maten, soort, materiaal; `specificaties`) and extra items; at least one of the three is required. Staat van het werk requires a description, a photo and the spuiter's own **geschatte meerkosten**, so SpuitwerkOnline never has to ask for a price afterwards. 'Overige' (free text, e.g. kleur of maten) has optional meerkosten, so nobody squeezes a deviation into the wrong box just to add a price; `indicatie` is the total of both.

### Geld per order

`OrderDetail` toont onder Gegevens wat de order oplevert, als optelling: **Orderwaarde** (`order.bedrag`, wat de klant betaalt voor het spuitwerk, zodat spuiter en klant over hetzelfde bedrag praten en de marge niet ter sprake komt; Robert 5 nov), **+ goedgekeurd meerwerk** en **Totale orderwaarde** (`orderTotaal()`). **Betaling klant** is een los kenmerk naast de productiestatus: de klant kan al tijdens productie betalen (`betaaldVoorGereed`). Dan meldt "Gereed melden" de order direct als `klaar` (mag mee) in plaats van `productie_gereed`. Uitbetaling aan de spuiter (punt 4 en 5 van Robert) is nog open. Meerwerk dat nog wacht of is afgewezen wordt genoemd maar niet opgeteld. **Uitbetaling** staat er pas vanaf `afgerond` (staat open / uitbetaald): daarvoor is 'volgt na afronding' altijd waar.

- Meerwerk telt **pas mee in het totaal als de klant akkoord is** (`meerwerk.status === 'akkoord'`). Tot dat moment staat er "€85 aangevraagd" met de toelichting dat SpuitwerkOnline akkoord vraagt — een aanvraag is geen bedrag waar je op mag rekenen. `orderTotaal()` in `useOrders.ts` is de enige plek waar dit wordt gerekend; `Profiel.vue` gebruikt dezelfde functie, zodat de bedragen op beide pagina's niet uiteen kunnen lopen.
- Er staat **bewust geen (verwachte) uitbetaaldatum**. SpuitwerkOnline heeft de uitbetaaltermijn nog niet vastgelegd, en Robert waarschuwde dat een uitbetaaldatum die niet klopt meer vertrouwen kost dan hij oplevert. De rij zegt daarom alleen waar de uitbetaling staat: *Volgt na afronding* → *Staat open* → *Uitbetaald*. Bij een lopende order staat er niets meer bij — dat de klant eerst moet betalen is de zorg van SpuitwerkOnline, niet van de spuiter. Ook het logboek noemt geen uitbetaaldatum meer (dat gebruikte eerder `order.datum`, de órderdatum). Zodra de termijn vaststaat kan hier een datum bij.
- **Toon van de copy: collegiaal, niet controlerend.** De spuiter helpt SpuitwerkOnline. Teksten bedanken en helpen ("Binnengekomen? Bevestig het met één tik, dan weten wij dat alles veilig bij je is"), ze dreigen of beleren niet ("Na de start kan dat niet meer", "Zo sta je sterk…"). De copy legt het opleverklok-mechanisme (15 werkdagen vanaf ontvangst) nergens uit: dat zou uitstellen van de ontvangst belonen. De datum zelf tonen mag wel.
- **Betaling vs uitbetaling** worden uit elkaar gehouden in de copy: "Wacht op klantbetaling" (klant → SpuitwerkOnline) tegenover "Wacht op jouw uitbetaling" (SpuitwerkOnline → spuiter).

### Routing

`src/router/index.ts` uses **history mode** (`createWebHistory(import.meta.env.BASE_URL)`), so routes resolve under the version base (e.g. `/v3/order/123`). Netlify SPA-fallback for deep links is configured in the root `netlify.toml`.

| Route | View |
|-------|------|
| `/` | Dashboard — active + completed order list |
| `/order/:id` | OrderDetail — full order + status-driven actions |
| `/order/:id/ontvangst` | Ontvangst — receipt-confirmation step (registers receipt on mount, starts the clock, offers a photo) |
| `/order/:id/controle` | Controle — colour & dimension check at start of spraying → in productie |
| `/order/:id/werkbon` | Werkbon: A4 to print and put with the goods (order number big, klant, dates, per dienst kleur, specs and aantallen). Mobile preview, print CSS shows only the paper. Reached from the Ontvangst confirmation and "Werkbon printen" next to the Opdracht heading (from `ontvangen`). Replaces Robert's photo-as-link idea (6 nov) |
| `/order/:id/meerwerk` | Meerwerk — afwijking/extra-work reporting (via SpuitwerkOnline) |
| `/order/:id/opleverdatum` | Opleverdatum — spuiter passes on a new expected completion date (in productie) |
| `/order/:id/foto/:type` | ProductieFoto — photo documentation (`before`/`after`) |
| `/profiel` | Profiel — spuiter profile with financial/payout overview |
| `/account` | Account — account settings (password change, logout) |

### UI setup

**Native PrimeVue first.** The theme is the single source of truth: `SpuitwerkPreset` in `main.ts` (Lara base, own blue primary scale built around the configurator accent `#4ea9ea` on 400). `src/assets/main.css` does **not** define colours of its own — its variables (`--surface`, `--card`, `--border`, `--text`, `--muted`, `--radius`) are aliases for `--p-*` tokens, and the hand-built parts reference those. Change a colour in the preset and it lands everywhere at once. Never reintroduce a hex literal outside the preset; the one exception is `kleurToHex()`, which maps RAL/NCS paint names to swatch colours and is product data, not theming.

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

**Still hand-built, on purpose:** the order row (`OrderCard.vue`), the fase groups on the dashboard, the timeline and the panel table. Each row carries one 'wat nu' label (`.or-chip`). Colour is signal only: grey = waiting on someone else (no fill on desktop, so signals stand out in the column), sky = your turn (same colour as the buttons), red = overdue **and** do not hand over (both must never be missed), orange = waiting on someone else that needs attention (e.g. meerwerk akkoord), green = paid, may go. Orange is the SpuitwerkOnline brand orange `#ff6600` (own `orange` primitive in the preset; text uses 800, fills 700). A phase with an overdue order also shows a red `n te laat` tag in its heading. Visual style follows the approved Stripe-style proposal (`Open Design/spuiter-orders-stripe/`): the preset defines its own cool neutral `surface` scale (canvas `#f9fcff` and slate text `#364053` (`surface-900`), both taken from the customer configurator so dashboard and website feel like one product; panel border `surface-300`), 8px radius, a blue-tinted `--shadow`, bold headings (page title 2rem/700, section titles `--text-lg`/400 (only the h1 is bold: every page has exactly one, 2rem/700 from 768px; on the order page it is the order number), sentence case everywhere (no uppercase in tags or message titles), order numbers in tabular figures (monospace only for paint recipes), and `--primary` = `primary-700` so links and icons pass contrast), and on desktop each phase list gets a column header (`.kolomkop`: Opdracht · Klant · Wat nu). Signal labels are soft 50-tint fills with a 200-tint border. These are bespoke compositions with no PrimeVue equivalent — forcing `Card`/`Panel` around them would add markup without adding behaviour. They take all their colours from the same tokens, so they cannot drift.

*Note:* `PMessage` animates its height open on mount (native Lara behaviour). Harmless in a real browser; in a hidden/headless pane the animation can stall at height 0, so measure with the pane fronted.
- **Headers**: the global `.top-bar` (logo + avatar) in `App.vue` renders **only on the dashboard** (`route.path === '/'`). All sub-pages have their own sticky `.app-header` (back button + title) at `top:0` — this avoids two stacked headers eating vertical space on mobile.
- **Tabler Icons** for all icons (class `ti ti-*`), loaded as a webfont — `@tabler/icons-webfont` is imported in `main.ts`. (Outline only; the project migrated off PrimeIcons.)
- **No Tailwind** — all styling is in `src/assets/main.css`, which aliases PrimeVue tokens (see above). Views use the global classes (`card`, `order-lijst`, `section-label`, `detail-row`, `bottom-bar`, `panel-table`) — avoid scoped styles.
- Font: **Fira Sans** (Google Fonts).
- Build output goes to **`dist/v3`** at the repo root (configured in `vite.config.ts`).

### Language

All UI text, variable names, and code comments are in **Dutch**.

### Known duplication

Small view helpers (`heeftAfmetingen`, `paneelMaat`, `kleurOnbekend`, `formatEuro`) are repeated across `OrderDetail.vue`, `Controle.vue`, `Meerwerk.vue` and `Profiel.vue`. Update them together.
