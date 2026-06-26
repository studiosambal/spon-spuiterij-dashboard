# SpuitwerkOnline – Spuiterdashboard

Een mobiel-eerst webapp waarmee spuiters van SpuitwerkOnline hun opdrachten beheren: van productinname en foto's tot meerwerk melden en oplevering. Gebouwd voor gebruik op de smartphone in de werkplaats (max. 430px breed).

> **Demo / prototype** — er is (nog) geen backend. Alle data is mock-data in het geheugen. Een refresh zet alles terug naar de uitgangssituatie.

## Twee versies naast elkaar

Deze repo is een **monorepo** met twee zelfstandige versies van het ontwerpvoorstel, zodat je ze makkelijk kunt vergelijken:

| Versie | Map | Live op | Rol |
|--------|-----|---------|-----|
| **v1** | `apps/v1/` | `/v1` | Bevroren eerder voorstel |
| **v2** | `apps/v2/` | `/v2` | Nieuwste voorstel (hierin wordt doorontwikkeld) |

De hoofd-URL (`/`) toont een kleine **landingspagina** (`landing/`) met een keuze tussen v1 en v2. Beide versies delen via npm-workspaces één `node_modules` — je installeert dus maar één keer.

## Tech stack

- **Vue 3** + **TypeScript** + **Vite**
- **Vue Router** (history-mode; elke versie draait onder zijn eigen base `/v1/` of `/v2/`)
- **PrimeVue 4** met een eigen `SkyPreset` (Lara-basis, sky-500 als primaire kleur) + **PrimeIcons**
- Styling via CSS custom properties in `src/assets/main.css` — **geen Tailwind**
- Lettertype: **Fira Sans** (Google Fonts)
- **npm-workspaces** monorepo; deploy via **Netlify**

## Aan de slag

Vereist: Node.js 18+ en npm.

```bash
npm install        # alle dependencies in één keer (workspaces, gedeelde node_modules)
npm run dev:v2     # dev-server voor v2 op http://localhost:5174
npm run dev:v1     # dev-server voor v1 op http://localhost:5173
```

Je werkt doorgaans aan één versie tegelijk. Open de URL op je telefoon (of versmal je browser tot ±430px) voor de bedoelde weergave.

## Scripts (root)

| Commando | Doel |
|----------|------|
| `npm run dev:v1` | Dev-server voor v1 (poort 5173, hot reload) |
| `npm run dev:v2` | Dev-server voor v2 (poort 5174, hot reload) |
| `npm run build` | Bouwt v1 → `dist/v1`, v2 → `dist/v2` en de landing → `dist/index.html` |

Per versie kun je ook losse scripts draaien met `npm run <script> -w v1` (of `-w v2`).

## Deploy (Netlify)

Netlify bouwt vanaf branch `main` met `npm run build` en publiceert de map `dist`. Configuratie staat in `netlify.toml` (build-commando, publish-map, Node-versie, en SPA-redirects per versie). Resultaat:

```
/        → landingspagina (keuze v1 / v2)
/v1      → versie 1
/v2      → versie 2
```

## Projectstructuur

```
apps/
├── v1/                  # Bevroren eerder voorstel (base /v1/)
│   ├── src/
│   ├── index.html
│   └── vite.config.ts
└── v2/                  # Nieuwste voorstel (base /v2/) — kopie van v1 als startpunt
landing/index.html       # Keuzepagina op /
scripts/assemble-landing.mjs   # Kopieert landing/ naar dist/ tijdens de build
netlify.toml             # Build- en deployconfig
dist/                    # Build-output (gitignored; Netlify bouwt dit)
```

Elke versie heeft dezelfde interne opbouw:

```
apps/<versie>/src/
├── views/              # Pagina's (Dashboard, OrderDetail, Meerwerk, ...)
├── composables/
│   ├── useOrders.ts    # Centrale datalaag: types, labelmaps, mock-orders, mutaties
│   └── useAuth.ts      # Mock ingelogde spuiter (naam, bedrijf, initialen)
├── router/index.ts     # Routes (history-mode)
├── assets/main.css     # Alle styling via CSS custom properties
├── images/             # SVG's en afbeeldingen
├── App.vue
└── main.ts             # App-bootstrap + PrimeVue/SkyPreset
```

### Datalaag

State wordt gedeeld via module-niveau `ref()`-objecten in de composables — een lichtgewicht globale store zonder Pinia/Vuex. `useOrders.ts` bevat alle TypeScript-types, labelmaps en de reactieve `orders`-array. Lezen gaat via `getOrder()`; muteren via `updateStatus()`, `markBeforeFoto()`, `updateKleur()` en `updateVerwachtGereed()`.

### Routes

| Route | Pagina |
|-------|--------|
| `/` | Dashboard — lopende + afgeronde opdrachten |
| `/order/:id` | Orderdetail — volledige order + statusafhankelijke acties |
| `/order/:id/bevestig` | Productinname-checklist |
| `/order/:id/meerwerk` | Meer-/minderwerk melden |
| `/order/:id/foto/:type` | Foto's vastleggen (`before`/`after`) |
| `/profiel` | Profiel met financieel/uitbetalingsoverzicht |
| `/account` | Accountinstellingen (wachtwoord, uitloggen) |

(Routes zijn relatief aan de base van de versie, dus bv. `/v2/order/123`.)

### Statusflow van een order

```
bevestigd → (meerwerk_wacht) → ontvangen → in_productie → productie_gereed → klaar → afgerond
```

- **`meerwerk_wacht`** is een zijtoestand, geen lineaire stap.
- **`ontvangen` → `in_productie`** gaat automatisch: zodra de spuiter de vóór-foto maakt, schuift de status door. Er is bewust geen handmatige "Start"-knop — een spuiter met verfhanden pakt zijn telefoon niet voor administratie.
- **Meerwerk melden** kan tijdens de `in_productie`-fase, omdat extra werk meestal pas tijdens het schuren/voorbereiden naar boven komt.

## Conventies

- Alle UI-tekst, variabelen en comments zijn in het **Nederlands**.
- Styling via de globale CSS-classes en custom properties uit `main.css` — vermijd scoped styles.
- PrimeVue-componenten zijn globaal geregistreerd met `P`-prefix (`PButton`, `PTag`, ...).
