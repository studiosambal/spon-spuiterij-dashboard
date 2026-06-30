<template>
  <div v-if="order">
    <header class="app-header">
      <button class="back-btn" @click="router.back()">
        <i class="pi pi-arrow-left" /> Terug
      </button>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
        <h1 style="font-family:monospace">{{ order.id }}</h1>
        <span :class="['badge', 'badge-' + order.status]">{{ STATUS_LABELS[order.status] }}</span>
      </div>
      <div class="subtitle" style="color:var(--muted)">{{ order.klant }}</div>
    </header>

    <main class="page-content" style="padding-bottom:140px">

      <!-- Te laat: verwachte opleverdatum overschreden -->
      <div v-if="order.te_laat" class="alert alert-error">
        <strong>Te laat<template v-if="order.verwacht_gereed_datum"> · verwacht klaar {{ order.verwacht_gereed_datum }}</template></strong>
        SpuitwerkOnline stemt een nieuwe datum met de klant af. Ga door met je werk; je hoeft zelf niets te doen.
      </div>

      <!-- Opmerking alert — alleen relevant voor ontvangst, daarna vervallen -->
      <div v-if="order.opmerkingen && order.status === 'bevestigd'" class="alert alert-warning">
        <strong>Let op bij ontvangst</strong>
        {{ order.opmerkingen }}
      </div>

      <!-- Diensten — geclusterd per dienst: naam, hoeveelheid, kleur, opdracht, panelen -->
      <div class="section-label">{{ order.diensten.length > 1 ? `Diensten (${order.diensten.length})` : 'Opdracht' }}</div>

      <div v-for="(dienst, di) in order.diensten" :key="di" class="card" style="padding:0;overflow:hidden">

        <!-- Kleurstrook + dienstnaam (titel) + kleur als eigenschap -->
        <div style="display:flex;align-items:stretch;min-height:84px">
          <div :style="stripStyle(dienst)" />
          <div style="padding:12px 14px;flex:1;min-width:0">
            <div style="font-size:18px;font-weight:700;line-height:1.2;color:var(--text)">{{ dienst.naam }}</div>
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin-top:10px">Kleur</div>
            <div style="font-size:15px;font-weight:600;color:var(--text);line-height:1.2">{{ dienst.kleur }}</div>
            <div v-if="dienst.kleur_recept"
                 style="font-size:12px;color:var(--text);margin-top:6px;background:#f8fafc;border:1px solid var(--border);border-radius:6px;padding:6px 8px;font-family:monospace;white-space:pre-wrap">{{ dienst.kleur_recept }}</div>
            <div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:6px">
              <span :style="chipStyle">{{ GLANSGRAAD_LABELS[dienst.glansgraad] }}</span>
              <span :style="chipStyle">{{ dienst.zijdig }}</span>
              <span :style="chipStyle">{{ dienst.oppervlaktestructuur === 'glad' ? 'Glad' : 'Huidige structuur' }}</span>
              <span :style="chipStyle">{{ OPPERVLAK_LABELS[dienst.oppervlaktemateriaal] }}</span>
            </div>
            <div v-if="dienst.handgreepgaten"
                 style="margin-top:10px;display:flex;align-items:center;gap:6px;font-size:13px;font-weight:700;color:#9a3412;background:#fff7ed;border:1px solid #fed7aa;border-radius:6px;padding:6px 10px">
              <i class="pi pi-exclamation-circle" />
              Handgreepgaten herstellen op {{ dienst.handgreepgaten_aantal }} panelen
            </div>
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

      <!-- Afhandeling -->
      <div class="section-label">Afhandeling</div>
      <div class="card">
        <div class="detail-row">
          <span class="label">Type service</span>
          <span class="value">{{ TYPE_SERVICE_LABELS[order.type_service] }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Ophaalwijze</span>
          <span class="value">
            {{ order.ophaalmethode === 'klant' ? 'Wordt opgehaald door de klant' : 'Wordt opgehaald door een vervoerder' }}
          </span>
        </div>
        <div v-if="order.ophaalmethode !== 'klant'" class="detail-row">
          <span class="label" style="font-size:12px;color:var(--muted)">Ophaaladres</span>
          <span class="value" style="font-size:12px;color:var(--muted)">{{ order.adres }}</span>
        </div>
        <div v-if="order.verwacht_gereed_werkdagen" class="detail-row">
          <span class="label">Verwachte opleverduur</span>
          <span class="value" :style="order.te_laat ? 'font-weight:600;color:#b91c1c' : 'font-weight:600;color:var(--primary)'">
            {{ order.te_laat ? 'Overschreden' : `Over ${order.verwacht_gereed_werkdagen} werkdagen` }}
          </span>
        </div>
      </div>
    </main>

    <!-- Bottom actions -->
    <div class="bottom-bar">

      <!-- BEVESTIGD: goederen aannemen — één tik, geen vragen (mag ook door stagiair/boekhouder) -->
      <template v-if="order.status === 'bevestigd'">
        <PButton label="Goederen ontvangen" icon="pi pi-inbox"
                 @click="ontvangstBevestigen" />
        <div style="text-align:center;font-size:12px;color:var(--muted);margin-top:2px">
          Eén tik en de goederen staan als ontvangen. De klant krijgt automatisch bericht. Kleur en maten controleer je later, bij de start.
        </div>
      </template>

      <!-- MEERWERK_WACHT: afwijking gemeld, SpuitwerkOnline regelt akkoord met de klant -->
      <template v-else-if="order.status === 'meerwerk_wacht'">
        <div class="alert alert-warning" style="width:100%">
          <strong>Gemeld bij SpuitwerkOnline</strong>
          SpuitwerkOnline neemt contact op met de klant en haalt akkoord op. Je krijgt bericht zodra je verder kunt.
        </div>
        <PButton label="Melding bekijken" icon="pi pi-eye" outlined
                 @click="router.push('/order/' + order.id + '/meerwerk')" />
      </template>

      <!-- ONTVANGEN: goederen binnen, controle volgt bij start spuitwerk -->
      <template v-else-if="order.status === 'ontvangen'">
        <div class="alert alert-info">
          <strong>Goederen binnen, klant is op de hoogte</strong>
          Kijk kleur en maten rustig na bij de start van het spuitwerk.
        </div>
        <PButton label="Controle starten" icon="pi pi-check-circle"
                 @click="router.push('/order/' + order.id + '/controle')" />
        <PButton v-if="!order.beforeFotoGemaakt"
                 label="Foto maken (optioneel)" icon="pi pi-camera" outlined
                 @click="router.push('/order/' + order.id + '/foto/before')" />
      </template>

      <!-- IN_PRODUCTIE: opleverfoto maken -->
      <template v-else-if="order.status === 'in_productie'">
        <PButton label="Opleverfoto maken" icon="pi pi-camera"
                 @click="router.push('/order/' + order.id + '/foto/after')" />
      </template>

      <!-- PRODUCTIE_GEREED: wachten op betaling SpuitwerkOnline -->
      <template v-else-if="order.status === 'productie_gereed'">
        <div class="alert alert-warning" style="width:100%">
          <strong>Wachten op betaling</strong>
          Klant heeft nog niet betaald via SpuitwerkOnline. Geef het product nog niet af.
          Je ontvangt een melding zodra de betaling is bevestigd.
        </div>
      </template>

      <!-- KLAAR: betaling ontvangen, overdracht -->
      <template v-else-if="order.status === 'klaar'">
        <div class="alert alert-success" style="width:100%">
          <strong>Betaling bevestigd, klaar voor overdracht</strong>
          SpuitwerkOnline heeft de betaling bevestigd. De klant is onderweg.
        </div>
        <div class="alert alert-info">
          <strong>Check voor je overdraagt</strong>
          Leg het naast je opleverfoto's en geef het pas mee als alles klopt. Zo sta je sterk bij latere schadeklachten.
        </div>
        <PButton label="Overhandigd aan klant" icon="pi pi-check-circle"
                 @click="updateStatus(order.id, 'afgerond'); router.back()" />
      </template>

      <!-- AFGEROND -->
      <template v-else-if="order.status === 'afgerond'">
        <div style="text-align:center;padding:8px;font-size:13px;color:var(--muted)">
          <i class="pi pi-check-circle" style="color:var(--primary);margin-right:6px" />
          Order afgerond
        </div>
      </template>

      <!-- Afwijking melden — alleen tijdens het controlemoment (status 'ontvangen'); daarna is de productie gestart en kan het niet meer -->
      <template v-if="order.status === 'ontvangen'">
        <button
          style="background:none;border:none;color:var(--muted);font-size:13px;cursor:pointer;min-height:44px;padding:2px 12px;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:5px;align-self:center;margin-top:2px"
          @click="router.push('/order/' + order.id + '/meerwerk')">
          <i class="pi pi-flag" style="font-size:12px" />
          Afwijking melden
        </button>
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
  useOrders, STATUS_LABELS,
  TYPE_SERVICE_LABELS, OPPERVLAK_LABELS, GLANSGRAAD_LABELS,
  dienstHoeveelheid, type Dienst, type PaneelMaat
} from '@/composables/useOrders'

const router = useRouter()
const route  = useRoute()
const { getOrder, updateStatus } = useOrders()

const order = computed(() => getOrder(route.params.id as string))

// Goederen aannemen: één tik, geen vragen. Alleen "ontvangen" melden — geen opleverdatum
// beloven (de spuiter is nog niet begonnen). De opleverduur volgt bij de start van de productie.
function ontvangstBevestigen() {
  const o = order.value
  if (!o) return
  updateStatus(o.id, 'ontvangen')
}

function heeftAfmetingen(d: Dienst): boolean {
  return d.panelen.some(p => p.breedte > 0 && p.hoogte > 0)
}

function kleurOnbekend(d: Dienst): boolean {
  return d.kleur_methode === 'later' || d.kleur_methode === 'kleurvoorbeeld'
}

// Kleurstrook links: echte kleur, of een subtiele arcering als de kleur nog niet bekend is
function stripStyle(d: Dienst) {
  const base = { width: '74px', flexShrink: '0', boxShadow: 'inset -1px 0 0 rgba(0,0,0,0.10)' }
  if (kleurOnbekend(d)) {
    return { ...base, background: 'repeating-linear-gradient(45deg, #eef2f6 0, #eef2f6 7px, #dfe6ee 7px, #dfe6ee 14px)' }
  }
  return { ...base, background: kleurToHex(d.kleur) }
}

function paneelMaat(p: PaneelMaat): string {
  if (p.breedte > 0 && p.hoogte > 0) return `${p.breedte}x${p.hoogte}`
  if (p.breedte > 0 || p.hoogte > 0) return `${Math.max(p.breedte, p.hoogte)} cm`
  return p.omschrijving
}

const chipStyle = 'background:#f1f5f9;border:1px solid var(--border);border-radius:5px;padding:3px 9px;font-size:13px;font-weight:600;color:var(--text)'

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
