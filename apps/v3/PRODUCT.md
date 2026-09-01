# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primair: de **spuiter** bij een aangesloten spuiterij die opdrachten uitvoert voor SpuitwerkOnline. Hij gebruikt de app op zijn smartphone in de werkplaats — haast, vieze handen, wisselend licht. Secundair: degene die goederen aanneemt bij levering (vaak een stagiair of boekhouder, soms de spuiter zelf midden in een klus); die heeft geen tijd voor vragen of invoer.

## Product Purpose

Een mobiel-eerst dashboard waarmee de spuiter zijn SpuitwerkOnline-orders beheert door de hele cyclus: bevestiging → ontvangst → controle → productie → gereed → ophalen → uitbetaling, inclusief foto's en het melden van afwijkingen/meerwerk. Dit is een **prototype zonder backend** (mock-data, refresh reset alles). Succes = stakeholders (Robert / SpuitwerkOnline) overtuigen met het ideale scenario; daarna wordt bepaald wat er echt gebouwd wordt.

## Positioning

SpuitwerkOnline bezit de klantrelatie; de spuiter voert uit. De werkstroom-mechanismen die dit product uniek maken en die toekomstig werk moet bewaren:

- **Ontvangst en controle zijn gesplitst**: aannemen gebeurt in één tik zonder vragen (wie aanneemt heeft geen tijd); de inhoudelijke controle volgt later, bij de start van het spuiten.
- **De klok start bij ontvangst**: opleverdatum = 15 werkdagen vanaf ontvangst, automatisch. De spuiter heeft daar geen invloed op; controle uitstellen schuift de deadline niet op.
- **Order bevriest bij ontvangst**; afwijkingen worden dáárna alleen nog via het meerwerk-kanaal gemeld.
- **Meerwerk loopt via kantoor**: de spuiter meldt, SpuitwerkOnline regelt klantakkoord. De spuiter bevestigt nooit zelf iets richting de klant.

## Operating Context

Goederen komen binnen via de klant zelf of per koerier. De spuiter werkt orders af tussen spuitgangen door; melden van afwijkingen kan alleen in het controle-venster (bewuste productkeuze van Patrick, iets strakker dan Roberts praktijk "ook tijdens schuren ontdekt"). Robert (spuiter, stakeholder) is de toetssteen voor de werkstroom; open punten voor het gesprek met hem staan in `docs/2026-07-20-bespreeklijst-orderbegeleiding.md`.

## Capabilities and Constraints

- Vue 3 + TypeScript + Vite SPA in een monorepo (`apps/v3`, base `/v3/`, poort 5175); mock-data via composables, geen Pinia, geen Tailwind. PrimeVue 4 met eigen SkyPreset.
- Ontworpen voor max. 430px breed; desktop is geen doel.
- Alle UI-tekst, code en comments in het **Nederlands**; copy in de **je-vorm** vanuit de spuiter als lezer.
- Prototype toont het **ideale scenario** — features niet strippen omdat iets technisch nog niet kan; uitkleden gebeurt later bewust.
- Expliciet onbeslist (bespreken met Robert): meldmoment meerwerk (alleen bij controle of ook tijdens productie), prominentie van de uitbetalingssectie, opsplitsing van de status "afgerond" in facturatiestappen, en of spuiters zelf opleverdatums kunnen zetten.

## Brand Commitments

- Naam en logo **SpuitwerkOnline** (`src/images/logo-spuitwerkonline.svg`), primaire kleur sky-500 (#0ea5e9), lettertype Fira Sans.
- Bindende stijlvoorwaarde van Patrick: **geen herkenbare AI-designclichés** (zoals linker-accentranden op callouts); het geheel moet bewust ontworpen aanvoelen, rustig en vlak.

## Evidence on Hand

- Mock-orders met realistische Nederlandse klantnamen, diensten, maten en kleuren in `src/composables/useOrders.ts`.
- Dienst-illustraties (SVG's: keuken, binnendeur, trapleuning, radiator, buffetkast) en logo in `src/images/`.
- Géén echte klantdata, testimonials of cijfers — niet verzinnen.

## Product Principles

1. **Het ideale scenario wint** — het prototype laat zien hoe het hoort te werken, niet wat nu al kan.
2. **De spuiter is de lezer** — alle copy in de je-vorm, vanuit zijn perspectief en tempo.
3. **Snelheid in de werkplaats boven volledigheid** — grote tap targets, minimale verplichte invoer, ontvangst in één tik.
4. **De klantrelatie is van SpuitwerkOnline** — de spuiter meldt en voert uit, kantoor beslist en communiceert.
5. **Elke status vertelt "wat nu"** — geen kale labels maar de eerstvolgende actie of verwachting.

## Accessibility & Inclusion

Werkplaatsgebruik stelt de eisen: tap targets ≥ 44px, checkboxes extra groot (28px), invoervelden ≥ 16px (geen auto-zoom op iOS), en donkerder secundaire tekst dan gebruikelijk voor contrast bij fel of juist slecht licht.
