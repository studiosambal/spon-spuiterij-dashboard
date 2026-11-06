<template>
  <div v-if="order">
    <header class="app-header">
      <!-- Kruimelpad i.p.v. 'Terug': je ziet waar je bent en komt altijd bij de orders -->
      <Kruimelpad :items="[{ label: 'Orders', to: '/' }, { label: String(route.params.id) }]" />
      <!-- Het ordernummer is de paginatitel: uniek, en waar je op zoekt.
           De status staat er direct naast: die hoort bij de order, niet in een hoek. -->
      <div class="od-titel">
        <h1>{{ order.id }}</h1>
        <PTag :severity="STATUS_SEVERITY[order.status]" :value="STATUS_LABELS[order.status]" style="flex-shrink:0" />
      </div>
    </header>

    <main class="page-content">
      <!-- Volgende stap. Eén kaart, twee lagen. Bovenin een kopregel met de deadline: het feit, het
           signaal en 'Wijzigen' rechts, zoals Stripe een bewerkbare sectie toont. Alleen
           die kopregel kleurt bij een signaal. Daaronder de volgende stap, met de actie
           als titel, één zin en de knoppen. Zo staat elke actie bij waar hij over gaat. Mobiel staan
           de knoppen in de balk onderin (zelfde 'acties'), vanaf tablet in de kaart. -->
      <section class="odb" :class="stap.toon !== 'rust' && 'is-' + stap.toon">
        <header v-if="stap.feit" class="odb-kop">
          <i class="ti ti-calendar-event odb-kop-icoon" aria-hidden="true" />
          <span class="odb-kop-feit">
            <span class="odb-kop-label">{{ stap.feit.label }}</span>
            <strong class="odb-kop-datum tnum">{{ stap.feit.waarde }}</strong>
            <span v-if="stap.feit.badge" class="od-badge odb-kop-badge" :class="{ 'is-telaat': order.te_laat }">
              <span v-if="order.te_laat" class="stip" aria-hidden="true" />{{ stap.feit.badge }}
            </span>
          </span>
          <button v-if="order.status === 'in_productie'" type="button" class="odb-wijzig"
                  @click="router.push('/order/' + order.id + '/opleverdatum')">Wijzigen</button>
        </header>
        <div class="odb-body">
          <div class="odb-tekst">
            <div class="odb-eyebrow">{{ acties.length ? 'Volgende stap' : 'Status' }}</div>
            <div class="odb-titel">
              <i v-if="stap.toon === 'stop'" class="ti ti-hand-stop" aria-hidden="true" />
              <i v-else-if="stap.toon === 'klaar'" class="ti ti-circle-check" aria-hidden="true" />
              {{ stapB.titel }}
            </div>
            <p class="odb-uitleg">{{ stapB.tekst }}</p>
            <div v-if="order.opmerkingen && order.status === 'bevestigd'" class="od-let-op">
              <i class="ti ti-alert-triangle" aria-hidden="true" />
              <span><strong style="display:inline">Opmerking van de klant:</strong> {{ order.opmerkingen }}</span>
            </div>
            <button v-if="order.status === 'afgerond' && order.opgehaalddatum" class="tekst-actie"
                    style="padding-left:0" @click="maakOverdrachtOngedaan(order.id)">Ongedaan maken</button>
          </div>
          <div v-if="acties.length" class="odb-knoppen">
            <PButton v-for="a in acties" :key="a.label" :label="a.label" :icon="a.icon"
                     :outlined="a.outlined" @click="a.doe" />
          </div>
        </div>
      </section>

      <div class="detail-layout">
        <div class="detail-hoofd">
          <!-- Opdracht — per dienst: naam, kleur, specs, afmetingen -->
          <div class="od-sectiekop">
            <h2 class="section-label">{{ order.diensten.length > 1 ? `Diensten (${order.diensten.length})` : 'Opdracht' }}</h2>
            <!-- Werkbon bij de spullen: zo hoort een stapel altijd bij zijn order -->
            <button v-if="order.status !== 'bevestigd'" type="button" class="tekst-actie"
                    @click="router.push('/order/' + order.id + '/werkbon')">
              <i class="ti ti-printer" aria-hidden="true" /> Werkbon printen
            </button>
          </div>

          <div v-for="(dienst, di) in order.diensten" :key="di" class="card od-dienst">
            <div class="od-dienst-kop">
              <div class="oc-thumb">
                <img :src="dienstImage(dienst.naam)" :alt="dienst.naam" />
              </div>
              <div style="min-width:0">
                <div class="od-dienst-naam">{{ dienst.naam }}</div>
                <div class="tnum" style="font-size:var(--text-sm);color:var(--muted);margin-top:2px">{{ dienstHoeveelheid(dienst) }}</div>
              </div>
            </div>

            <!-- Kleur op een eigen regel: daar staat of valt het spuitwerk mee. Geen
                 kleurstaal: kleuren worden vrij ingevoerd en een benadering misleidt. -->
            <div class="od-kleur">
              <div class="od-label">Kleur</div>
              <div class="od-kleur-waarde" :class="{ 'is-onbekend': kleurOnbekend(dienst) }">{{ dienst.kleur }}</div>
              <div v-if="dienst.kleur_recept" class="od-recept"><span>Mengrecept</span>{{ dienst.kleur_recept }}</div>
            </div>

            <dl class="od-specs">
              <div v-for="eig in dienstEigenschappen(dienst)" :key="eig.label">
                <dt class="od-label">{{ eig.label }}</dt>
                <dd>{{ eig.waarde }}</dd>
              </div>
            </dl>

            <div v-if="dienst.handgreepgaten" class="od-let-op-dienst">
              <i class="ti ti-alert-circle" style="font-size:16px;flex-shrink:0" />
              Handgreepgaten herstellen op {{ dienst.handgreepgaten_aantal }} panelen
            </div>

            <!-- Afmetingen lopen door tot de kaartrand: geen kaart-in-een-kaart -->
            <table class="panel-table od-tabel">
              <thead>
                <tr>
                  <th v-if="heeftAfmetingen(dienst)">B&times;H (cm)</th>
                  <th v-else>Onderdeel</th>
                  <th>Aantal</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(p, i) in dienst.panelen" :key="i">
                  <td v-if="heeftAfmetingen(dienst)" class="tnum">{{ paneelMaat(p) }}</td>
                  <td v-else>{{ p.omschrijving || `Onderdeel ${i + 1}` }}</td>
                  <td>{{ p.aantal }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td>Totaal</td>
                  <td>{{ dienstHoeveelheid(dienst) }}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- Gegevens: alle naslag bij elkaar, met het geld als optelling eronder -->
          <h2 class="section-label">Gegevens</h2>
          <div class="card" style="padding:0;overflow:hidden">
            <div class="od-gegevens">
              <div class="detail-row">
                <span class="label">Klant</span>
                <span class="value">{{ klantPlaats(order) }}</span>
              </div>
              <div v-if="aanleveringSamenvatting" class="detail-row">
                <span class="label">Aanlevering</span>
                <span class="value">{{ aanleveringSamenvatting }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Service</span>
                <span class="value">{{ TYPE_SERVICE_LABELS[order.type_service] }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Afhalen</span>
                <span class="value">{{ order.ophaalmethode === 'klant' ? 'Door de klant' : 'Door een vervoerder' }}</span>
              </div>
              <!-- Betaling loopt los van de productie: de klant kan al eerder betalen -->
              <div v-if="order.status !== 'afgerond'" class="detail-row">
                <span class="label">Betaling klant</span>
                <span class="value" :style="order.betaald ? 'color:var(--signaal-klaar-fg);font-weight:600' : ''">
                  {{ order.betaald ? 'Betaald' : 'Nog niet betaald' }}<span v-if="order.betaald && order.betaaldatum" class="od-sub">op {{ order.betaaldatum }}</span>
                </span>
              </div>
              <!-- Meerwerk dat (nog) niet meetelt: wel noemen, niet optellen -->
              <div v-if="meerwerkOpen" class="detail-row">
                <span class="label">Meerwerk</span>
                <span class="value">{{ meerwerkOpen.tekst }}<span class="od-sub">{{ meerwerkOpen.sub }}</span></span>
              </div>
              <!-- Uitbetaling pas vanaf 'afgerond': zolang de order loopt is 'volgt na
                   afronding' altijd waar en zegt het niets. -->
              <div v-if="order.status === 'afgerond'" class="detail-row">
                <span class="label">Uitbetaling</span>
                <span class="value" :style="order.uitbetaald ? 'color:var(--signaal-klaar-fg);font-weight:600' : ''">
                  {{ order.uitbetaald ? 'Uitbetaald' : 'Staat open' }}
                  <span v-if="!order.uitbetaald" class="od-sub">SpuitwerkOnline betaalt je vergoeding uit</span>
                </span>
              </div>
            </div>
            <!-- Orderwaarde = wat de klant betaalt voor het spuitwerk (Robert, 5 nov): spuiter en
                 klant praten zo over hetzelfde bedrag en de marge komt niet ter sprake. -->
            <dl class="od-bedragen">
              <template v-if="meerwerkBedrag">
                <div class="od-bedrag"><dt>Orderwaarde</dt><dd>{{ formatEuro(order.bedrag) }}</dd></div>
                <div class="od-bedrag"><dt>Goedgekeurd meerwerk</dt><dd>+ {{ formatEuro(meerwerkBedrag) }}</dd></div>
                <div class="od-bedrag is-totaal"><dt>Totale orderwaarde</dt><dd>{{ formatEuro(orderTotaal(order)) }}</dd></div>
              </template>
              <div v-else class="od-bedrag is-totaal"><dt>Orderwaarde</dt><dd>{{ formatEuro(order.bedrag) }}</dd></div>
            </dl>
          </div>
        </div>

        <aside class="detail-zij">
          <!-- Voortgang (voorstel E, 5 nov): gedaan = wat er gebeurd is, zonder datums;
               nog te doen = alleen het werk van de spuiter. De betaling loopt los: die
               komt bij gedaan zodra hij binnen is, en telt alleen mee als slot op meegeven. -->
          <h2 class="section-label">Voortgang</h2>
          <div class="card od-voortgang">
            <template v-if="gedaan.length">
              <h3 class="od-vg-kop">Gedaan</h3>
              <ul class="od-tijdlijn">
                <li v-for="(t, i) in gedaan" :key="i" class="od-tl is-gedaan">
                  <span class="od-tl-bol" aria-hidden="true"><i class="ti ti-check" /></span>
                  <span class="od-tl-tekst">{{ t }}</span>
                </li>
              </ul>
            </template>
            <template v-if="nogTeDoen.length">
              <h3 class="od-vg-kop">Nog te doen</h3>
              <ul class="od-tijdlijn">
                <li v-for="(s, i) in nogTeDoen" :key="i" class="od-tl" :class="s.nu ? 'is-nu' : 'is-later'">
                  <span class="od-tl-bol" aria-hidden="true" />
                  <span class="od-tl-tekst">{{ s.tekst }}</span>
                  <span v-if="s.slot" class="od-slot" :class="'is-' + s.slot.soort">
                    <i :class="s.slot.soort === 'open' ? 'ti ti-lock-open' : s.slot.soort === 'dicht' ? 'ti ti-lock' : 'ti ti-clock'" aria-hidden="true" />{{ s.slot.tekst }}
                  </span>
                </li>
              </ul>
            </template>
          </div>
        </aside>
      </div>

      <!-- Mobiel: de acties in de meeschuivende balk onderin, onder je duim -->
      <div v-if="acties.length" class="bottom-bar od-balk">
        <PButton v-for="a in acties" :key="a.label" :label="a.label" :icon="a.icon"
                 :outlined="a.outlined" @click="a.doe" />
      </div>
    </main>
  </div>

  <div v-else class="page-content">
    <div class="card" style="color:var(--muted);font-size:var(--text-base)">Order niet gevonden.</div>
  </div>
</template>

<script setup lang="ts">
import Kruimelpad from '@/components/Kruimelpad.vue'
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  useOrders, orderLogboek, STATUS_LABELS, STATUS_SEVERITY, STATUS_ORDER,
  TYPE_SERVICE_LABELS, dienstEigenschappen,
  dienstHoeveelheid, orderTotaal, klantPlaats,
  type Dienst, type PaneelMaat
} from '@/composables/useOrders'
import { dienstImage } from '@/lib/dienstImage'

const router = useRouter()
const route  = useRoute()
const { getOrder, updateStatus, ontvangGoederen, maakOverdrachtOngedaan } = useOrders()

const order = computed(() => getOrder(route.params.id as string))

function formatEuro(bedrag: number): string {
  return '€' + bedrag.toLocaleString('nl-NL')
}

// ── Volgende stap: per status één paneel ──
// toon: 'rust' (wit) tenzij er een signaal is — rood te laat, oranje niet meegeven,
// groen mag mee. Het feit is meestal de opleverdatum; die doet ertoe tot de order
// gereed is. Daarna telt iets anders (gereed gemeld, betaald, afgerond).
// stop = niet meegeven: rood, net als te laat. Dit mag nooit gemist worden.
type Toon = 'rust' | 'telaat' | 'stop' | 'klaar'
interface Stap { toon: Toon; feit?: { label: string; waarde: string; badge?: string }; titel?: string; tekst: string }

const opleverFeit = computed(() => {
  const o = order.value
  if (!o?.verwacht_gereed_datum) return undefined
  return { label: 'Opleveren vóór', waarde: o.verwacht_gereed_datum, badge: o.gereed_relatief }
})

const stap = computed<Stap>(() => {
  const o = order.value!
  switch (o.status) {
    case 'bevestigd': {
      const wie = o.aanlevering === 'klant' ? 'via de klant' : o.aanlevering === 'koerier' ? 'via koerier' : undefined
      return {
        toon: 'rust',
        feit: { label: 'Levering verwacht', waarde: o.verwacht_levering ?? 'Nog onbekend', badge: wie },
        tekst: 'Binnengekomen? Bevestig het met één tik, dan weten wij dat alles veilig bij je is.',
      }
    }
    case 'ontvangen':
      return { toon: o.te_laat ? 'telaat' : 'rust', feit: opleverFeit.value,
               tekst: 'Begin je eraan? Loop dan eerst even kleur en maten na.' }
    case 'meerwerk_wacht': {
      const m = o.meerwerk
      return {
        toon: 'rust', feit: opleverFeit.value, titel: 'Wacht op akkoord van de klant',
        tekst: m
          ? `${m.behandelaar} is aan zet sinds ${m.datum}. ${m.laatsteUpdate}. Zodra de klant heeft besloten, krijg je bericht. Daarin staat ook of de opleverdatum verschuift.`
          : 'SpuitwerkOnline regelt het akkoord met de klant. Zodra de klant heeft besloten, krijg je bericht. Daarin staat ook of de opleverdatum verschuift.',
      }
    }
    case 'in_productie':
      return o.te_laat
        ? { toon: 'telaat', feit: opleverFeit.value, tekst: 'De opleverdatum is verstreken. Meld de order gereed zodra hij klaar is.' }
        : { toon: 'rust',   feit: opleverFeit.value, tekst: o.betaald
            ? 'De klant heeft al betaald. Meld de order gereed met een foto, dan mag hij meteen mee.'
            : 'Klaar met spuiten? Meld de order gereed met een foto van het resultaat.' }
    case 'productie_gereed':
      return {
        toon: 'stop', feit: o.gereeddatum ? { label: 'Gereed gemeld', waarde: o.gereeddatum } : undefined,
        titel: 'Nog niet meegeven',
        tekst: 'De klant heeft nog niet betaald aan SpuitwerkOnline. Je krijgt bericht zodra de betaling binnen is.',
      }
    case 'klaar':
      return {
        toon: 'klaar', feit: o.betaaldatum ? { label: 'Betaald', waarde: o.betaaldatum } : undefined,
        titel: 'Mag mee met de klant',
        tekst: 'Een opleverfoto bij de overdracht helpt bij schadevragen.',
      }
    case 'afgerond':
      return {
        toon: 'rust', feit: o.opgehaalddatum ? { label: 'Afgerond', waarde: o.opgehaalddatum } : undefined,
        tekst: o.uitbetaald ? 'Je vergoeding is uitbetaald.' : 'SpuitwerkOnline betaalt je vergoeding uit.',
      }
  }
})

// Paneel: de actie zelf als titel, één korte zin eronder. De deadline staat
// in de kopregel, dus de tekst hoeft die niet te herhalen.
const stapB = computed<{ titel: string; tekst: string }>(() => {
  const o = order.value!
  switch (o.status) {
    case 'bevestigd':        return { titel: 'Ontvangst bevestigen', tekst: 'Binnengekomen? Eén tik, dan weten wij dat alles veilig bij je is.' }
    case 'ontvangen':        return { titel: 'Controle starten', tekst: 'Loop kleur en maten na voordat je begint.' }
    case 'meerwerk_wacht':   return { titel: 'Wacht op akkoord van de klant', tekst: stap.value.tekst }
    case 'in_productie':     return o.te_laat
      ? { titel: 'Gereed melden', tekst: 'Maak een foto van het resultaat zodra de order klaar is.' }
      : { titel: 'Gereed melden', tekst: o.betaald
          ? 'De klant heeft al betaald. Maak een foto van het resultaat, dan mag het meteen mee.'
          : 'Klaar met spuiten? Maak een foto van het resultaat, dan vragen wij de klant om te betalen.' }
    case 'productie_gereed': return { titel: 'Nog niet meegeven', tekst: stap.value.tekst }
    case 'klaar':            return { titel: 'Mag mee met de klant', tekst: stap.value.tekst }
    case 'afgerond':         return { titel: 'Afgerond', tekst: stap.value.tekst }
  }
})

// Acties: één lijst, getoond in het paneel (tablet/desktop) én in de balk (mobiel)
interface Actie { label: string; icon: string; outlined?: boolean; doe: () => void }
const acties = computed<Actie[]>(() => {
  const o = order.value
  if (!o) return []
  const naar = (pad: string) => () => router.push('/order/' + o.id + pad)
  switch (o.status) {
    // Goederen aannemen: één tik, geen vragen (mag ook door stagiair/boekhouder)
    case 'bevestigd':      return [{ label: 'Bevestig ontvangst', icon: 'ti ti-check', doe: ontvangstBevestigen }]
    case 'meerwerk_wacht': return [{ label: 'Bekijk meerwerk', icon: 'ti ti-eye', outlined: true, doe: naar('/meerwerk') }]
    // Volgorde overal: secundair eerst, primair laatst (zie in_productie)
    case 'ontvangen': return [
      ...(!o.beforeFotoGemaakt ? [{ label: 'Foto maken (optioneel)', icon: 'ti ti-camera', outlined: true, doe: naar('/foto/before') }] : []),
      { label: 'Controle starten', icon: 'ti ti-circle-check', doe: naar('/controle') },
    ]
    case 'in_productie': return [
      ...(!o.beforeFotoGemaakt ? [{ label: 'Startfoto maken (optioneel)', icon: 'ti ti-camera', outlined: true, doe: naar('/foto/before') }] : []),
      { label: 'Gereed melden', icon: 'ti ti-camera', doe: naar('/foto/after') },
    ]
    // Tekst volgt de ophaalmethode: 'overhandigd aan klant' klopt niet bij een vervoerder
    case 'klaar': return [{
      label: o.ophaalmethode === 'klant' ? 'Overhandigd aan klant' : 'Overgedragen aan vervoerder',
      icon: 'ti ti-circle-check', doe: () => updateStatus(o.id, 'afgerond'),
    }]
    default: return []
  }
})

// Goederen aannemen. De tik is de handeling: hier wordt de aanname geregistreerd
// en start de opleverklok. Het scherm erna is een bevestiging van iets dat al is
// gebeurd — niet de plek waar het alsnog gebeurt.
function ontvangstBevestigen() {
  const o = order.value
  if (!o) return
  ontvangGoederen(o.id)
  router.push('/order/' + o.id + '/ontvangst')
}

// ── Voortgang: gedaan (uit het logboek, zonder datums) en nog te doen ──
const gedaan = computed<string[]>(() =>
  order.value ? orderLogboek(order.value).filter(r => r.state === 'gedaan').map(r => r.tekst) : []
)
interface Stap2 { tekst: string; nu?: boolean; slot?: { soort: 'open' | 'dicht' | 'wacht'; tekst: string } }
const nogTeDoen = computed<Stap2[]>(() => {
  const o = order.value
  if (!o) return []
  const rang = STATUS_ORDER[o.status]
  const r: Stap2[] = []
  if (o.status === 'bevestigd') r.push({ tekst: 'Ontvangst bevestigen', nu: true })
  if (rang < STATUS_ORDER.in_productie) r.push(o.status === 'meerwerk_wacht'
    ? { tekst: 'Productie starten', slot: { soort: 'wacht', tekst: 'wacht op akkoord klant' } }
    : { tekst: 'Controle', nu: o.status === 'ontvangen' })
  if (rang < STATUS_ORDER.productie_gereed) r.push({ tekst: 'Gereed melden', nu: o.status === 'in_productie' })
  // Het slot verschijnt pas als het ertoe doet: zodra de klant betaald heeft, of het werk gereed is
  if (rang < STATUS_ORDER.afgerond) r.push({
    tekst: o.ophaalmethode === 'klant' ? 'Meegeven aan de klant' : 'Meegeven aan de vervoerder',
    nu: o.status === 'klaar',
    slot: o.betaald ? { soort: 'open', tekst: 'betaald' }
        : rang >= STATUS_ORDER.productie_gereed ? { soort: 'dicht', tekst: 'wacht op betaling' } : undefined,
  })
  return r
})

// ── Geld ──
// Meerwerk telt pas mee als SpuitwerkOnline akkoord heeft van de klant.
const meerwerkBedrag = computed(() => {
  const m = order.value?.meerwerk
  return m?.status === 'akkoord' ? (m.goedgekeurdBedrag ?? m.indicatie ?? 0) : 0
})
const meerwerkOpen = computed(() => {
  const m = order.value?.meerwerk
  if (!m || m.status === 'akkoord') return null
  if (m.status === 'afgewezen') return { tekst: 'Niet goedgekeurd', sub: 'Dit meerwerk wordt niet vergoed' }
  return { tekst: m.indicatie ? formatEuro(m.indicatie) + ' aangevraagd' : 'Aangevraagd', sub: 'Telt mee zodra de klant akkoord is' }
})

// Eén rij i.p.v. twee: datum en wie in één regel. Al binnen? Dan staat de datum in
// de tijdlijn en zegt deze rij alleen nog hóe het kwam.
const aanleveringSamenvatting = computed(() => {
  const o = order.value
  if (!o) return ''
  const wie = o.aanlevering === 'klant' ? 'door de klant' : o.aanlevering === 'koerier' ? 'door een koerier' : null
  if (o.ontvangstdatum) return wie ? wie[0].toUpperCase() + wie.slice(1) : ''
  return [o.verwacht_levering, wie].filter(Boolean).join(' · ')
})

function heeftAfmetingen(d: Dienst): boolean {
  return d.panelen.some(p => p.breedte > 0 && p.hoogte > 0)
}

function kleurOnbekend(d: Dienst): boolean {
  return d.kleur_methode === 'later' || d.kleur_methode === 'kleurvoorbeeld'
}


function paneelMaat(p: PaneelMaat): string {
  if (p.breedte > 0 && p.hoogte > 0) return `${p.breedte} × ${p.hoogte} cm`
  if (p.breedte > 0 || p.hoogte > 0) return `${Math.max(p.breedte, p.hoogte)} cm`
  return p.omschrijving
}
</script>
