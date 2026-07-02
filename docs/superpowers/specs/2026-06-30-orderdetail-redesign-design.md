# OrderDetail-redesign — dashboard-taal doortrekken

Datum: 2026-06-30
Status: goedgekeurd, gereed voor implementatie

## Doel

Het dashboard kreeg een nieuwe visuele taal (OrderCard: productthumbnail per
dienst, ordernummer in monospace, gekleurde status-pill, strakke kaarten). De
sub-pagina's hangen nog in de oude stijl. Deze ronde trekt die taal door op de
**OrderDetail** (de order-overzichtpagina) — diepgaand. De overige pagina's
(Controle, Meerwerk, Profiel, ProductieFoto, Account) volgen in latere rondes.

## Scope

Alleen `apps/v2/src/views/OrderDetail.vue` + een kleine gedeelde helper.
Geen functionele wijzigingen aan de status-flow of de onderbalk-acties.

## Ontwerpbesluiten

1. **Dienst-blok = kaart-kop + detail eronder.** Elk dienst krijgt één kaart.
   Bovenin exact de dashboard-kop: thumbnail (56px) + dienstnaam + hoeveelheid
   (`dienstHoeveelheid`) + kleurstaal (swatch + label). Daaronder, na een divider,
   de verdieping. Zo sluit kaart → detail naadloos aan.

2. **Kleurstrook-links vervalt.** De echte verfkleur leeft nu in de swatch naast
   het kleurlabel (net als op de kaart). Onbekende kleur ('later' /
   'kleurvoorbeeld') → grijze swatch + cursief label, zoals de OrderCard.

3. **Eigenschappen als gelabeld 2-koloms rooster**, niet als kale pills.
   Glansgraad / Zijdig / Structuur / Materiaal elk met een klein uppercase-label
   erboven. Reden: op een detailpagina moet de spuiter de specs precies kunnen
   lezen; kale pills ("Mat", "Rondom") verliezen hun betekenis. Sluit aan op de
   label/waarde-rijen van het Afhandeling-blok.

4. **Elk dienst-blok is zelf-compleet.** Volgorde in de detail-body:
   mengrecept (indien aanwezig) → eigenschappen-rooster → handgreepgaten-melding
   (indien aanwezig) → panelen/onderdelen-tabel met totaal. De tabelkop is per
   dienst: **B×H (cm)** als de panelen afmetingen hebben, anders **Onderdeel**.

5. **Status.** Blijft de pill in de header (zelfde tint-taal als de kaart) plus
   de bestaande onderbalk als actiezone. Geen extra status-footer-strook op de
   detailpagina — de onderbalk draagt de status-guidance al. Alerts (te laat /
   wacht op betaling / opmerking bij ontvangst) blijven, in de rustigere stijl.

6. **Afhandeling** blijft een kaart met label/waarde-rijen (type service,
   ophaalwijze, opleverduur).

## Gedeelde helper

`dienstImage(naam)` (thumbnail-mapping + SVG-imports) staat nu lokaal in
OrderCard.vue. Verplaatsen naar `src/lib/dienstImage.ts` en vanuit zowel
OrderCard als OrderDetail importeren — voorkomt dubbele code nu beide de
thumbnail tonen.

`kleurToHex()` blijft voorlopig gedupliceerd (bestaande conventie, zie
CLAUDE.md); buiten scope van deze ronde.

## Buiten scope

- Overige sub-pagina's (eigen rondes).
- Status-flow, datamodel, onderbalk-logica.
- Unificatie van `kleurToHex()`.
