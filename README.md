# SpuitwerkOnline – Spuiterdashboard

Een mobiel-eerst webapp waarmee spuiters van SpuitwerkOnline hun opdrachten beheren: van productinname en foto's tot meerwerk melden en oplevering. Gebouwd voor gebruik op de smartphone in de werkplaats (max. 430px breed).

> **Demo / prototype** — er is (nog) geen backend. Alle data is mock-data in het geheugen. Een refresh zet alles terug naar de uitgangssituatie.

## Tech stack

- **Vue 3** + **TypeScript** + **Vite**
- **Vue Router** (hash-history, geen serverconfig nodig)
- **PrimeVue 4** met een eigen `SkyPreset` (Lara-basis, sky-500 als primaire kleur) + **PrimeIcons**
- Styling via CSS custom properties in `src/assets/main.css` — **geen Tailwind**
- Lettertype: **Fira Sans** (Google Fonts)

## Aan de slag

Vereist: Node.js 18+ en npm.

```bash
npm install      # dependencies installeren
npm run dev      # dev-server op http://localhost:5173 (ook op het netwerk via --host)
```

Open de URL op je telefoon (of versmal je browser tot ±430px) voor de bedoelde weergave.

## Scripts

| Commando | Doel |
|----------|------|
| `npm run dev` | Dev-server met hot reload, bereikbaar op alle netwerkinterfaces |
| `npm run build` | Type-check (`vue-tsc`) en productie-build → output naar `public/` |
| `npm run preview` | Lokale preview van de productie-build |

Er zijn geen tests geconfigureerd. TypeScript-fouten komen naar boven via `vue-tsc` tijdens de build.

## Projectstructuur

```
src/
├── views/              # Pagina's (Dashboard, OrderDetail, Meerwerk, ...)
├── composables/
│   ├── useOrders.ts    # Centrale datalaag: types, labelmaps, mock-orders, mutaties
│   └── useAuth.ts      # Mock ingelogde spuiter (naam, bedrijf, initialen)
├── router/index.ts     # Routes (hash-history)
├── assets/main.css     # Alle styling via CSS custom properties
├── images/             # SVG's en afbeeldingen
├── App.vue
└── main.ts             # App-bootstrap + PrimeVue/SkyPreset
public/                 # Build-output én vooraf gebouwde statische assets
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
