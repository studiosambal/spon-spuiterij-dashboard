<template>
  <div v-if="order">
    <header class="app-header">
      <button class="back-btn" @click="router.back()">
        <i class="ti ti-arrow-left" /> Terug
      </button>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
        <!-- Zelfde behandeling als op het dashboard: het ordernummer is een
             referentie, geen titel. De dienstnaam hieronder draagt het gewicht. -->
        <span style="font-family:monospace;font-weight:600;font-size:var(--text-sm);color:var(--muted)">{{ order.id }}</span>
        <PTag :severity="STATUS_SEVERITY[order.status]" :value="STATUS_LABELS[order.status]" style="flex-shrink:0" />
      </div>
      <div class="subtitle" style="color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ klantPlaats(order) }}</div>
      <!-- Opleverdatum in de sticky header: hij blijft in beeld terwijl de spuiter
           door de specs scrolt, en hij hoort bij de order — niet bij een dienst. -->
      <div v-if="order.verwacht_gereed_datum"
           style="display:flex;align-items:center;gap:7px;margin-top:5px;font-size:var(--text-sm)"
           :style="order.te_laat ? 'color:var(--p-red-700)' : 'color:var(--text)'">
        <i class="ti ti-flag" style="font-size:14px;flex-shrink:0" />
        <span>Opleveren vóór <strong>{{ order.verwacht_gereed_datum }}</strong><template v-if="order.gereed_relatief"> &middot; {{ order.gereed_relatief }}</template></span>
      </div>
    </header>

    <main class="page-content" :style="{ paddingBottom: order.status === 'productie_gereed' ? '24px' : '140px' }">

      <!-- Te laat: verwachte opleverdatum overschreden -->
      <PMessage severity="error" v-if="order.te_laat">
        <strong><template v-if="order.gereed_relatief">{{ order.gereed_relatief }}</template></strong>
		Deze order had <template v-if="order.verwacht_gereed_datum">{{ order.verwacht_gereed_datum }}</template> afgerond moeten zijn. Rond het zo snel mogelijk af.
      </PMessage>

      <!-- Opmerking alert — alleen relevant voor ontvangst, daarna vervallen -->
      <PMessage severity="warn" v-if="order.opmerkingen && order.status === 'bevestigd'">
        <strong>Let op bij ontvangst</strong>
        {{ order.opmerkingen }}
      </PMessage>

      <PMessage severity="warn" v-if="order.status === 'meerwerk_wacht'">
        <strong>Wacht op akkoord</strong>
        We wachten op akkoord van de klant voor het meerwerk. Zodra het akkoord binnen is, kan de productie worden hervat.
      </PMessage>
      <PMessage severity="info" v-else-if="order.status === 'ontvangen'">
        <strong>Ontvangst bevestigd</strong>
        Controleer de order en start het spuitwerk. Je kunt een foto maken van de binnenkomst.
      </PMessage>
      <PMessage severity="warn" v-else-if="order.status === 'productie_gereed'">
        <strong>Wachten op betaling</strong>
        Klant heeft nog niet betaald. Geef de goederen nog niet af. Je ontvangt een melding zodra de betaling is bevestigd.
      </PMessage>
      <template v-else-if="order.status === 'klaar'">
        <PMessage severity="success">
          <strong>Betaling bevestigd, klaar voor overdracht</strong>
		  Je kunt de goederen overhandigen. Maak een opleverfoto, zo sta je sterk bij latere schadeklachten.
        </PMessage>
      </template>

      <!-- Diensten — geclusterd per dienst: naam, hoeveelheid, kleur, opdracht, panelen -->
      <div class="section-label">{{ order.diensten.length > 1 ? `Diensten (${order.diensten.length})` : 'Opdracht' }}</div>

      <div v-for="(dienst, di) in order.diensten" :key="di" class="card" style="padding:0;overflow:hidden">

        <!-- Kaart-kop: thumbnail + naam + hoeveelheid + kleurstaal (zoals het dashboard) -->
        <div style="display:flex;align-items:center;gap:14px;padding:14px 16px">
          <div class="oc-thumb">
            <img :src="dienstImage(dienst.naam)" :alt="dienst.naam" />
          </div>
          <div style="min-width:0;flex:1">
            <div style="font-size:var(--text-lg);font-weight:600;line-height:1.25;color:var(--text)">{{ dienst.naam }}</div>
            <div style="font-size:var(--text-sm);color:var(--muted);margin-top:2px">{{ dienstHoeveelheid(dienst) }}</div>
          </div>
        </div>

        <!-- Alle specs onder elkaar in één kolom: zo scant de spuiter van boven
             naar beneden "wat moet ik weten". Kleur staat bovenaan en is als enige
             vet — dat is de spec waar het spuitwerk op staat of valt. -->
        <div style="padding:2px 16px 14px">
          <div class="spec-rij">
            <span class="label">Kleur</span>
            <span class="waarde" :style="kleurOnbekend(dienst) ? 'color:var(--muted);font-style:italic' : ''">
              <strong v-if="!kleurOnbekend(dienst)">{{ dienst.kleur }}</strong>
              <template v-else>{{ dienst.kleur }}</template>
            </span>
          </div>
          <div v-for="eig in eigenschappen(dienst)" :key="eig.label" class="spec-rij">
            <span class="label">{{ eig.label }}</span>
            <span class="waarde">{{ eig.waarde }}</span>
          </div>
        </div>

        <!-- Mengrecept: eigen blok, want het is een instructie en geen spec-waarde -->
        <div v-if="dienst.kleur_recept" style="padding:0 16px 14px">
          <div class="subpaneel">
            <div class="subpaneel-kop">Mengrecept</div>
            <div style="padding:10px 12px;font-size:var(--text-sm);color:var(--text);font-family:monospace;white-space:pre-wrap;background:var(--card)">{{ dienst.kleur_recept }}</div>
          </div>
        </div>

        <!-- Handgreepgaten (indien van toepassing) -->
        <div v-if="dienst.handgreepgaten" style="padding:0 16px 14px">
          <div style="display:flex;align-items:center;gap:8px;font-size:var(--text-sm);font-weight:600;color:var(--p-orange-800);background:var(--p-orange-50);border:1px solid var(--p-orange-200);border-radius:8px;padding:9px 11px">
            <i class="ti ti-alert-circle" style="font-size:16px;flex-shrink:0" />
            Handgreepgaten herstellen op {{ dienst.handgreepgaten_aantal }} panelen
          </div>
        </div>

        <!-- Panelen als blok in de kaart: wat er fysiek ligt is een eigen
             onderwerp, niet de zoveelste rij onder de specs. -->
        <div style="padding:0 16px 16px">
          <div class="subpaneel">
        <table class="panel-table">
          <thead>
            <tr>
              <th v-if="heeftAfmetingen(dienst)">B&times;H (cm)</th>
              <th v-else>Onderdeel</th>
              <th>Aantal</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(p, i) in dienst.panelen" :key="i">
              <td v-if="heeftAfmetingen(dienst)">{{ paneelMaat(p) }}</td>
              <td v-else>{{ p.omschrijving || `Onderdeel ${i + 1}` }}</td>
              <td><strong>{{ p.aantal }}</strong></td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td style="font-weight:700;color:var(--muted);border-top:1px solid var(--hairline);background:var(--p-surface-50)">Totaal</td>
              <td style="font-weight:700;border-top:1px solid var(--hairline);background:var(--p-surface-50)">{{ dienstHoeveelheid(dienst) }}</td>
            </tr>
          </tfoot>
        </table>
          </div>
        </div>
      </div>

      <!-- Het volledige orderdossier. Ordernummer, klant en opleverdatum staan ook in
           de sticky header; dat is bewust. De header is meelopende context tijdens het
           werken, dit blok is het complete overzicht dat je in één keer naleest. -->
      <div class="section-label">Overzicht</div>
      <div class="card">

        <!-- Status als uitklapbaar element: dichtgeklapt zegt het wáár de order staat
             én wat er volgt, open toont het de hele route met datums. Een badge alleen
             ('Ontvangen') laat de vraag 'en dan?' onbeantwoord. -->
        <button class="status-rij" :aria-expanded="toonTijdlijn" @click="toonTijdlijn = !toonTijdlijn">
          <span class="label">Status</span>
          <span class="waarde">
            <span style="font-weight:600;color:var(--text)">{{ STATUS_LABELS[order.status] }}</span>
            <span v-if="volgendeStap && !toonTijdlijn" style="display:block;color:var(--muted);font-size:var(--text-sm);margin-top:1px">
              {{ volgendeStap.tekst }}<template v-if="volgendeStap.datum"> &middot; {{ volgendeStap.datum }}</template>
            </span>
          </span>
          <i :class="toonTijdlijn ? 'ti ti-chevron-up' : 'ti ti-chevron-down'" style="color:var(--muted);flex-shrink:0" />
        </button>

        <div v-if="toonTijdlijn" class="logboek">
          <div v-for="(regel, i) in logboek" :key="i" class="log-regel">
            <span :class="['log-bol', 'log-bol-' + regel.state]">
              <i v-if="regel.state === 'gedaan'" class="ti ti-check" style="font-size:10px" />
            </span>
            <span class="log-datum">{{ regel.datum ?? (regel.state === 'nu' ? 'nu' : '') }}</span>
            <span :class="['log-tekst', 'log-tekst-' + regel.state]">{{ regel.tekst }}</span>
          </div>
        </div>

        <div class="detail-row">
          <span class="label">Ordernummer</span>
          <span class="value" style="font-family:monospace">{{ order.id }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Klant</span>
          <span class="value">{{ klantPlaats(order) }}</span>
        </div>
        <div v-if="aanleveringSamenvatting" class="detail-row">
          <span class="label">Aanlevering</span>
          <span class="value">{{ aanleveringSamenvatting }}</span>
        </div>
        <div v-if="order.verwacht_gereed_datum" class="detail-row">
          <span class="label">Opleveren vóór</span>
          <span class="value" :style="order.te_laat ? 'color:var(--p-red-700);font-weight:600' : ''">{{ gereedRegel(order) }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Service</span>
          <span class="value">{{ TYPE_SERVICE_LABELS[order.type_service] }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Afhalen</span>
          <span class="value">{{ order.ophaalmethode === 'klant' ? 'Door de klant' : 'Door een vervoerder' }}</span>
        </div>
      </div>
    </main>

    <!-- Bottom actions — info-alerts staan bovenin; hier alleen acties -->
    <div v-if="order.status !== 'productie_gereed'" class="bottom-bar">

      <!-- BEVESTIGD: goederen aannemen — één tik, geen vragen (mag ook door stagiair/boekhouder) -->
      <template v-if="order.status === 'bevestigd'">
        <PButton label="Bevestig ontvangst" icon="ti ti-check"
                 @click="ontvangstBevestigen" />
      </template>

      <!-- MEERWERK_WACHT: afwijking gemeld, SpuitwerkOnline regelt akkoord met de klant -->
      <template v-else-if="order.status === 'meerwerk_wacht'">
        <PButton label="Bekijk meerwerk" icon="ti ti-eye" outlined
                 @click="router.push('/order/' + order.id + '/meerwerk')" />
      </template>

      <!-- ONTVANGEN: goederen binnen, controle volgt bij start spuitwerk -->
      <template v-else-if="order.status === 'ontvangen'">
        <PButton label="Controle starten" icon="ti ti-circle-check"
                 @click="router.push('/order/' + order.id + '/controle')" />
        <PButton v-if="!order.beforeFotoGemaakt"
                 label="Foto maken (optioneel)" icon="ti ti-camera" outlined
                 @click="router.push('/order/' + order.id + '/foto/before')" />
      </template>

      <!-- IN_PRODUCTIE: opleverfoto maken; startfoto blijft mogelijk tot die er is -->
      <template v-else-if="order.status === 'in_productie'">
        <PButton label="Opleverfoto maken" icon="ti ti-camera"
                 @click="router.push('/order/' + order.id + '/foto/after')" />
        <PButton v-if="!order.beforeFotoGemaakt"
                 label="Startfoto maken (optioneel)" icon="ti ti-camera" outlined
                 @click="router.push('/order/' + order.id + '/foto/before')" />
      </template>

      <!-- KLAAR: betaling ontvangen, overdracht -->
      <template v-else-if="order.status === 'klaar'">
        <PButton label="Overhandigd aan klant" icon="ti ti-circle-check"
                 @click="updateStatus(order.id, 'afgerond'); router.back()" />
      </template>

      <!-- AFGEROND -->
      <template v-else-if="order.status === 'afgerond'">
        <div style="text-align:center;padding:8px;font-size:var(--text-sm);color:var(--muted)">
          <i class="ti ti-circle-check" style="color:var(--primary);margin-right:6px" />
          Order afgerond
        </div>
      </template>

    </div>
  </div>

  <div v-else class="page-content">
    <div class="card" style="color:var(--muted);font-size:var(--text-base)">Order niet gevonden.</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  useOrders, orderLogboek, STATUS_LABELS, STATUS_SEVERITY,
  TYPE_SERVICE_LABELS, OPPERVLAK_LABELS, GLANSGRAAD_LABELS,
  dienstHoeveelheid, klantPlaats, type Order, type Dienst, type PaneelMaat
} from '@/composables/useOrders'
import { dienstImage } from '@/lib/dienstImage'

const router = useRouter()
const route  = useRoute()
const { getOrder, updateStatus } = useOrders()

const order = computed(() => getOrder(route.params.id as string))

// Eén rij i.p.v. twee losse 'Aanlevering'-rijen: datum en wie in één regel
const aanleveringSamenvatting = computed(() => {
  const o = order.value
  if (!o) return ''
  const wie = o.aanlevering === 'klant' ? 'door de klant' : o.aanlevering === 'koerier' ? 'door een koerier' : null
  // Al binnen? Dan staat de ontvangstdatum in het statuselement; deze rij zegt
  // dan alleen nog hóe het kwam. Anders zou dezelfde datum er twee keer staan.
  if (o.ontvangstdatum) return wie ? wie[0].toUpperCase() + wie.slice(1) : ''
  return [o.verwacht_levering, wie].filter(Boolean).join(' · ')
})

const toonTijdlijn = ref(false)

const logboek = computed(() => (order.value ? orderLogboek(order.value) : []))

// Dichtgeklapt zegt de statusregel niet alleen wáár je bent maar ook wat er volgt —
// 'Ontvangen' alleen laat de vraag 'en dan?' open.
const volgendeStap = computed(() => logboek.value.find(r => r.state === 'verwacht'))

// De opleverdatum leeft in de tijdlijn — dat is de plek voor 'wanneer gebeurt wat'.
// Het relatieve ('over 8 dagen', '3 dagen te laat') maakt hem meteen bruikbaar.
function gereedRegel(o: Order): string | undefined {
  if (!o.verwacht_gereed_datum) return undefined
  return o.gereed_relatief ? `${o.verwacht_gereed_datum} · ${o.gereed_relatief}` : o.verwacht_gereed_datum
}

// Goederen aannemen: naar het bevestigingsscherm. Dat scherm registreert de
// aanname (status ontvangen + start de opleverklok) en toont dat controleren pas
// later hoeft, met de optie meteen een foto te maken.
function ontvangstBevestigen() {
  const o = order.value
  if (!o) return
  router.push('/order/' + o.id + '/ontvangst')
}

function heeftAfmetingen(d: Dienst): boolean {
  return d.panelen.some(p => p.breedte > 0 && p.hoogte > 0)
}

function kleurOnbekend(d: Dienst): boolean {
  return d.kleur_methode === 'later' || d.kleur_methode === 'kleurvoorbeeld'
}

// Eigenschappen als gelabelde waarden voor het 2-koloms rooster
function eigenschappen(d: Dienst): { label: string; waarde: string }[] {
  return [
    { label: 'Glans', waarde: GLANSGRAAD_LABELS[d.glansgraad] },
    { label: 'Behandeling',     waarde: d.zijdig },
    { label: 'Structuur',  waarde: d.oppervlaktestructuur === 'glad' ? 'Glad' : 'Huidige structuur' },
    { label: 'Materiaal',  waarde: OPPERVLAK_LABELS[d.oppervlaktemateriaal] },
  ]
}

function paneelMaat(p: PaneelMaat): string {
  if (p.breedte > 0 && p.hoogte > 0) return `${p.breedte} × ${p.hoogte} cm`
  if (p.breedte > 0 || p.hoogte > 0) return `${Math.max(p.breedte, p.hoogte)} cm`
  return p.omschrijving
}

</script>
