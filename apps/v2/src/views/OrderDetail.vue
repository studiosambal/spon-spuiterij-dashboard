<template>
  <div v-if="order">
    <header class="app-header">
      <button class="back-btn" @click="router.back()">
        <i class="ti ti-arrow-left" /> Terug
      </button>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
        <h1 style="font-family:monospace">{{ order.id }}</h1>
        <span :class="['badge', 'badge-' + order.status]" style="flex-shrink:0">{{ STATUS_LABELS[order.status] }}</span>
      </div>
      <div class="subtitle" style="color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ klantPlaats(order) }}</div>
    </header>

    <main class="page-content" :style="{ paddingBottom: order.status === 'productie_gereed' ? '24px' : '140px' }">

      <!-- Te laat: verwachte opleverdatum overschreden -->
      <div v-if="order.te_laat" class="alert alert-error">
        <strong><template v-if="order.gereed_relatief">{{ order.gereed_relatief }}</template></strong>
		Deze order had <template v-if="order.verwacht_gereed_datum">{{ order.verwacht_gereed_datum }}</template> afgerond moeten zijn. Rond het zo snel mogelijk af.
      </div>

      <!-- Opmerking alert — alleen relevant voor ontvangst, daarna vervallen -->
      <div v-if="order.opmerkingen && order.status === 'bevestigd'" class="alert alert-warning">
        <strong>Let op bij ontvangst</strong>
        {{ order.opmerkingen }}
      </div>

      <div v-if="order.status === 'meerwerk_wacht'" class="alert alert-warning">
        <strong>Wacht op akkoord</strong>
        We wachten op akkoord van de klant voor het meerwerk. Zodra het akkoord binnen is, kan de productie worden hervat.
      </div>
      <div v-else-if="order.status === 'ontvangen'" class="alert alert-info">
        <strong>Ontvangst bevestigd</strong>
        Controleer de order en start het spuitwerk. Je kunt een foto maken van de binnenkomst.
      </div>
      <div v-else-if="order.status === 'productie_gereed'" class="alert alert-warning">
        <strong>Wachten op betaling</strong>
        Klant heeft nog niet betaald. Geef de goederen nog niet af. Je ontvangt een melding zodra de betaling is bevestigd.
      </div>
      <template v-else-if="order.status === 'klaar'">
        <div class="alert alert-success">
          <strong>Betaling bevestigd, klaar voor overdracht</strong>
		  Je kunt de goederen overhandigen. Maak een opleverfoto, zo sta je sterk bij latere schadeklachten.
        </div>
      </template>

      <!-- Diensten — geclusterd per dienst: naam, hoeveelheid, kleur, opdracht, panelen -->
      <div class="section-label">{{ order.diensten.length > 1 ? `Diensten (${order.diensten.length})` : 'Opdracht' }}</div>

      <div v-for="(dienst, di) in order.diensten" :key="di" class="card" style="padding:0;overflow:hidden">

        <!-- Kaart-kop: thumbnail + naam + hoeveelheid + kleurstaal (zoals het dashboard) -->
        <div style="display:flex;align-items:center;gap:12px;padding:12px 14px">
          <div class="oc-thumb">
            <img :src="dienstImage(dienst.naam)" :alt="dienst.naam" />
          </div>
          <div style="min-width:0;flex:1">
            <div style="font-size:16px;font-weight:600;line-height:1.25;color:var(--text)">{{ dienst.naam }}</div>
            <div style="font-size:13px;color:var(--muted);margin-top:1px">{{ dienstHoeveelheid(dienst) }}</div>
            <div style="display:flex;align-items:center;gap:6px;margin-top:4px">
              <span :style="{ display:'inline-block', width:'14px', height:'14px', borderRadius:'4px', flexShrink:0, border:'1px solid rgba(0,0,0,0.18)', background: kleurOnbekend(dienst) ? '#e2e8f0' : kleurToHex(dienst.kleur) }" />
              <span class="oc-kleur" :style="kleurOnbekend(dienst) ? { fontStyle:'italic' } : {}">{{ dienst.kleur }}</span>
            </div>
          </div>
        </div>

        <!-- Mengrecept (alleen bij een mengverhouding) -->
        <div v-if="dienst.kleur_recept" style="border-top:1px solid var(--border);padding:11px 14px">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin-bottom:6px">Mengrecept</div>
          <div style="font-size:12px;color:var(--text);background:#f8fafc;border:1px solid var(--border);border-radius:6px;padding:6px 8px;font-family:monospace;white-space:pre-wrap">{{ dienst.kleur_recept }}</div>
        </div>

        <!-- Eigenschappen — gelabeld 2-koloms rooster -->
        <div style="border-top:1px solid var(--border);padding:12px 14px;display:grid;grid-template-columns:1fr 1fr;gap:12px 16px">
          <div v-for="eig in eigenschappen(dienst)" :key="eig.label">
            <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--muted)">{{ eig.label }}</div>
            <div style="font-size:14px;font-weight:600;color:var(--text);margin-top:1px">{{ eig.waarde }}</div>
          </div>
        </div>

        <!-- Handgreepgaten (indien van toepassing) -->
        <div v-if="dienst.handgreepgaten" style="border-top:1px solid var(--border);padding:11px 14px">
          <div style="display:flex;align-items:center;gap:7px;font-size:13px;font-weight:700;color:#9a3412;background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:7px 10px">
            <i class="ti ti-alert-circle" style="font-size:15px" />
            Handgreepgaten herstellen op {{ dienst.handgreepgaten_aantal }} panelen
          </div>
        </div>

        <!-- Panelen van deze dienst -->
        <table class="panel-table" style="border-top:1px solid var(--border)">
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
              <td style="font-weight:700;color:var(--muted);border-top:1px solid var(--border);background:#f8fafc">Totaal</td>
              <td style="font-weight:700;border-top:1px solid var(--border);background:#f8fafc">{{ dienstHoeveelheid(dienst) }}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Tijdlijn — waar staat de order in het proces -->
      <div class="section-label">Tijdlijn</div>
      <div class="card">
        <div v-for="(stap, i) in tijdlijn" :key="stap.key" style="display:flex;gap:12px">
          <div style="display:flex;flex-direction:column;align-items:center">
            <div :style="{ width:'22px', height:'22px', borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background: stap.state === 'done' ? 'var(--primary)' : stap.state === 'current' ? 'var(--primary-light)' : '#fff', border: stap.state === 'todo' ? '2px solid var(--border)' : stap.state === 'current' ? '2px solid var(--primary)' : 'none' }">
              <i v-if="stap.state === 'done'" class="ti ti-check" style="font-size:12px;color:#fff" />
              <span v-else-if="stap.state === 'current'" style="display:block;width:8px;height:8px;border-radius:50%;background:var(--primary)" />
            </div>
            <div v-if="i < tijdlijn.length - 1" :style="{ width:'2px', flex:'1', minHeight:'16px', background: stap.state === 'done' ? 'var(--primary)' : 'var(--border)' }" />
          </div>
          <div :style="{ paddingBottom: i < tijdlijn.length - 1 ? '16px' : '0', minWidth:'0' }">
            <div :style="{ fontSize:'14px', fontWeight: stap.state === 'current' ? 700 : 600, color: stap.state === 'todo' ? 'var(--muted)' : 'var(--text)' }">{{ stap.label }}</div>
            <div v-if="stap.datum" style="font-size:12px;color:var(--muted);margin-top:1px">{{ stap.datum }}</div>
          </div>
        </div>
      </div>

      <!-- Overzicht — order-niveau (los van het spuitwerk) -->
      <div class="section-label">Overzicht</div>
      <div class="card">
        <div class="detail-row">
          <span class="label">Ordernummer</span>
          <span class="value" style="font-family:monospace">{{ order.id }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Klant</span>
          <span class="value">{{ klantPlaats(order) }}</span>
        </div>
        <div v-if="order.ontvangstdatum || order.verwacht_levering" class="detail-row">
          <span class="label">Aanlevering</span>
          <span class="value">{{ order.ontvangstdatum ?? order.verwacht_levering }}</span>
        </div>
        <div v-if="order.verwacht_gereed_datum" class="detail-row">
          <span class="label">Oplevering</span>
          <span class="value" :style="order.te_laat ? 'color:#b91c1c;font-weight:600' : ''">{{ order.verwacht_gereed_datum }}<template v-if="order.gereed_relatief"> · {{ order.gereed_relatief }}</template></span>
        </div>
        <div class="detail-row">
          <span class="label">Service</span>
          <span class="value">{{ TYPE_SERVICE_LABELS[order.type_service] }}</span>
        </div>
        <div v-if="order.aanlevering" class="detail-row">
          <span class="label">Aanlevering</span>
          <span class="value">{{ order.aanlevering === 'klant' ? 'Door de klant' : 'Door een koerier' }}</span>
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
        <div style="text-align:center;padding:8px;font-size:13px;color:var(--muted)">
          <i class="ti ti-circle-check" style="color:var(--primary);margin-right:6px" />
          Order afgerond
        </div>
      </template>

    </div>
  </div>

  <div v-else class="page-content">
    <div class="card" style="color:var(--muted);font-size:14px">Order niet gevonden.</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  useOrders, STATUS_LABELS, STATUS_ORDER,
  TYPE_SERVICE_LABELS, OPPERVLAK_LABELS, GLANSGRAAD_LABELS,
  dienstHoeveelheid, klantPlaats, type Dienst, type PaneelMaat, type OrderStatus
} from '@/composables/useOrders'
import { dienstImage } from '@/lib/dienstImage'

const router = useRouter()
const route  = useRoute()
const { getOrder, updateStatus } = useOrders()

const order = computed(() => getOrder(route.params.id as string))

// Tijdlijn: vaste mijlpalen met status done / current / todo (afgeleid van STATUS_ORDER)
const tijdlijn = computed(() => {
  const o = order.value
  if (!o) return []
  const huidig = STATUS_ORDER[o.status]
  const stappen: { key: OrderStatus; label: string; datum?: string }[] = [
    { key: 'ontvangen',        label: 'Ontvangen',          datum: o.ontvangstdatum },
    { key: 'in_productie',     label: 'In productie' },
    { key: 'productie_gereed', label: 'Gereed',             datum: o.verwacht_gereed_datum },
    { key: 'klaar',            label: 'Klaar voor ophalen' },
    { key: 'afgerond',         label: 'Opgehaald' },
  ]
  return stappen.map(s => ({
    ...s,
    state: (huidig > STATUS_ORDER[s.key] ? 'done' : huidig === STATUS_ORDER[s.key] ? 'current' : 'todo') as 'done' | 'current' | 'todo',
  }))
})

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

function kleurToHex(k: string): string {
  const l = k.toLowerCase()
  if (l.includes('zwart') || l.includes('9005') || l.includes('piano')) return '#18181b'
  if (l.includes('gebroken wit') || l.includes('9001')) return '#f5f0e8'
  if (l.includes('wit') || l.includes('9003') || l.includes('9016')) return '#f8f8f8'
  if (l.includes('rood') || l.includes('3020')) return '#dc2626'
  if (l.includes('blauw') || l.includes('5011')) return '#1d4ed8'
  if (l.includes('saliegreen') || l.includes('6021')) return '#7aab78'
  if (l.includes('groen')) return '#15803d'
  if (l.includes('antraciet') || l.includes('7016')) return '#374151'
  if (l.includes('grijs') || l.includes('7035')) return '#9ca3af'
  if (l.includes('taupe') || l.includes('beige')) return '#a89880'
  if (l.includes('oranje')) return '#ea580c'
  if (l.includes('petrol') || l.includes('5021')) return '#0e7490'
  if (l.includes('bn.00.86') || l.includes('sikkens')) return '#c8bfb0'
  return '#94a3b8'
}
</script>
