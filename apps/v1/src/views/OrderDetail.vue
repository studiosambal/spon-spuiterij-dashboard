<template>
  <div v-if="order">
    <header class="app-header">
      <button class="back-btn" @click="router.back()">
        <i class="pi pi-arrow-left" /> Terug
      </button>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
        <h1>{{ order.klant }}</h1>
        <span :class="['badge', 'badge-' + order.status]">{{ STATUS_LABELS[order.status] }}</span>
      </div>
      <div class="subtitle" style="color:var(--muted)">Order&nbsp;<span style="font-family:monospace">{{ order.id }}</span></div>
    </header>

    <main class="page-content" style="padding-bottom:140px">

      <!-- Kleur hero — eerste en belangrijkste info voor de spuiter -->
      <div class="card" style="display:flex;align-items:stretch;overflow:hidden;padding:0;gap:0;min-height:100px">
        <div :style="{
          width: '88px',
          flexShrink: 0,
          background: kleurToHex(order.kleur),
          boxShadow: 'inset -1px 0 0 rgba(0,0,0,0.10)'
        }" />
        <div style="padding:14px 16px;flex:1;min-width:0">
          <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)">Kleur</div>
          <div style="font-size:20px;font-weight:700;line-height:1.25;margin-top:4px;color:var(--text)">{{ order.kleur }}</div>
          <div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:6px">
            <span style="background:#f1f5f9;border:1px solid var(--border);border-radius:5px;padding:3px 9px;font-size:13px;font-weight:600;color:var(--text)">
              {{ GLANSGRAAD_LABELS[order.glansgraad] }}
            </span>
            <span style="background:#f1f5f9;border:1px solid var(--border);border-radius:5px;padding:3px 9px;font-size:13px;font-weight:600;color:var(--text)">
              {{ order.oppervlaktestructuur === 'glad' ? 'Glad' : 'Huidige structuur' }}
            </span>
            <span style="background:#f1f5f9;border:1px solid var(--border);border-radius:5px;padding:3px 9px;font-size:13px;font-weight:600;color:var(--text)">
              {{ order.zijdig }}
            </span>
          </div>
          <div v-if="order.handgreepgaten"
               style="margin-top:10px;display:flex;align-items:center;gap:6px;font-size:13px;font-weight:700;color:#9a3412;background:#fff7ed;border:1px solid #fed7aa;border-radius:6px;padding:6px 10px">
            <i class="pi pi-exclamation-circle" />
            Handgreepgaten herstellen op {{ order.handgreepgaten_aantal }} panelen
          </div>
        </div>
      </div>

      <!-- Opmerking alert — alleen relevant voor ontvangst, daarna vervallen -->
      <PMessage v-if="order.opmerkingen && order.status === 'bevestigd'" severity="warn" :closable="false"
                style="border-radius:var(--radius);font-size:14px">
        <template #messageicon><i class="pi pi-exclamation-triangle" /></template>
        <strong style="display:block;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin-bottom:2px">Let op bij ontvangst</strong>
        {{ order.opmerkingen }}
      </PMessage>

      <!-- Panelen -->
      <div class="section-label">Panelen</div>
      <div class="card" style="padding:0;overflow:hidden">
        <table class="panel-table">
          <thead>
            <tr>
              <th>Omschrijving</th>
              <th v-if="hasDimensions">B&times;H (cm)</th>
              <th>Aantal</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(p, i) in order.panelen" :key="i">
              <td>{{ p.omschrijving || `Paneel ${i + 1}` }}</td>
              <td v-if="hasDimensions">{{ p.breedte > 0 ? `${p.breedte}x${p.hoogte}` : '' }}</td>
              <td><strong>{{ p.aantal }}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Opdracht -->
      <div class="section-label">Opdracht</div>
      <div class="card">
        <div class="detail-row">
          <span class="label">Wat wordt gespoten</span>
          <span class="value">{{ order.spuiten_wat }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Materiaal</span>
          <span class="value">{{ OPPERVLAK_LABELS[order.oppervlaktemateriaal] }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Type service</span>
          <span class="value">{{ TYPE_SERVICE_LABELS[order.type_service] }}</span>
        </div>
      </div>

      <!-- Afhandeling -->
      <div class="section-label">Afhandeling</div>
      <div class="card">
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
        <div class="detail-row">
          <span class="label">Ophaalmoment</span>
          <span class="value" style="color:var(--muted);font-style:italic">Nog niet ingepland</span>
        </div>
        <div v-if="order.verwacht_gereed_werkdagen" class="detail-row">
          <span class="label">Verwachte opleverduur</span>
          <span class="value" style="font-weight:600;color:var(--primary)">
            Over {{ order.verwacht_gereed_werkdagen }} werkdagen
          </span>
        </div>
      </div>

      <!-- Processtatus -->
      <div class="section-label">Processtatus</div>
      <div class="card">
        <div v-for="(step, i) in processSteps" :key="step.key" class="process-step">
          <div :class="['step-dot', stepDotClass(step)]">
            <i v-if="stepIsDone(step)" class="pi pi-check" style="font-size:12px" />
            <span v-else>{{ i + 1 }}</span>
          </div>
          <div class="step-body">
            <div :class="['step-label', stepLabelClass(step)]">{{ step.label }}</div>
            <div v-if="step.current || stepIsDone(step)" class="step-desc" v-html="step.desc" />
          </div>
        </div>
      </div>
    </main>

    <!-- Bottom actions -->
    <div class="bottom-bar">

      <!-- BEVESTIGD: product inleveren -->
      <template v-if="order.status === 'bevestigd'">
        <PButton label="Productinname starten" icon="pi pi-check-circle"
                 @click="router.push('/order/' + order.id + '/bevestig')" />
      </template>

      <!-- MEERWERK_WACHT: product ontvangen via vervoerder, klant moet remote akkoord geven -->
      <template v-else-if="order.status === 'meerwerk_wacht'">
        <PMessage severity="warn" :closable="false" style="border-radius:var(--radius);font-size:14px;width:100%">
          <strong style="display:block;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin-bottom:2px">Wachten op akkoord klant</strong>
          Het meerwerk is verstuurd naar de klant ter goedkeuring.
          Je kunt pas starten als de klant akkoord heeft gegeven.
        </PMessage>
        <PButton label="Klant heeft akkoord gegeven" icon="pi pi-check-circle"
                 @click="markAkkoordEnGaVervolgStap" />
        <PButton label="Meerwerk bekijken" icon="pi pi-pen-to-square" outlined
                 @click="router.push('/order/' + order.id + '/meerwerk')" />
      </template>

      <!-- ONTVANGEN: before-foto maken, daarna automatisch in_productie -->
      <template v-else-if="order.status === 'ontvangen'">
        <div class="alert alert-info">
          <strong>Foto bij ontvangst</strong>
          Maak minimaal 1 foto van het product in de huidige staat. Na opslaan start de productie automatisch.
        </div>
        <PButton label="Foto bij ontvangst maken" icon="pi pi-camera"
                 @click="router.push('/order/' + order.id + '/foto/before')" />
      </template>

      <!-- IN_PRODUCTIE: opleverfoto maken -->
      <template v-else-if="order.status === 'in_productie'">
        <PButton label="Opleverfoto maken en afronden" icon="pi pi-camera"
                 @click="router.push('/order/' + order.id + '/foto/after')" />
      </template>

      <!-- PRODUCTIE_GEREED: wachten op betaling SpuitwerkOnline -->
      <template v-else-if="order.status === 'productie_gereed'">
        <PMessage severity="warn" :closable="false" style="border-radius:var(--radius);font-size:14px;width:100%">
          <strong style="display:block;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin-bottom:2px">Wachten op betaling</strong>
          Klant heeft nog niet betaald via SpuitwerkOnline. Geef het product nog niet af.
          Je ontvangt een melding zodra de betaling is bevestigd.
        </PMessage>
      </template>

      <!-- KLAAR: betaling ontvangen, overdracht -->
      <template v-else-if="order.status === 'klaar'">
        <PMessage severity="success" :closable="false" style="border-radius:var(--radius);font-size:14px;width:100%">
          <strong style="display:block;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin-bottom:2px">Betaling bevestigd, klaar voor overdracht</strong>
          SpuitwerkOnline heeft de betaling bevestigd. De klant is onderweg.
        </PMessage>
        <div class="alert alert-info">
          <strong>Controleer voor overdracht</strong>
          Vergelijk het product met de opleverfoto's. Overhandig pas als de toestand overeenkomt.
          Zo ben je beschermd bij claims over transportschade achteraf.
        </div>
        <PButton label="Product overhandigd aan klant" icon="pi pi-check-circle"
                 @click="updateStatus(order.id, 'afgerond'); router.back()" />
      </template>

      <!-- AFGEROND -->
      <template v-else-if="order.status === 'afgerond'">
        <div style="text-align:center;padding:8px;font-size:13px;color:var(--muted)">
          <i class="pi pi-check-circle" style="color:var(--primary);margin-right:6px" />
          Order afgerond
        </div>
      </template>

      <!-- Probleem melden — beschikbaar zodra product er is, niet bij bevestigd en afgerond -->
      <template v-if="order.status !== 'afgerond' && order.status !== 'bevestigd'">
        <button
          style="background:none;border:none;color:var(--muted);font-size:13px;cursor:pointer;padding:2px 0;font-family:inherit;display:flex;align-items:center;gap:5px;align-self:center;margin-top:2px"
          @click="router.push('/order/' + order.id + '/meerwerk')">
          <i class="pi pi-flag" style="font-size:12px" />
          Probleem melden
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
  useOrders, STATUS_LABELS, STATUS_ORDER,
  TYPE_SERVICE_LABELS, OPPERVLAK_LABELS, GLANSGRAAD_LABELS,
  type OrderStatus
} from '@/composables/useOrders'

const router = useRouter()
const route  = useRoute()
const { getOrder, updateStatus, markBeforeFoto } = useOrders()

function markAkkoordEnGaVervolgStap() {
  // Klant heeft akkoord gegeven op meerwerk → door naar productie
  updateStatus(route.params.id as string, 'in_productie')
}

const order = computed(() => getOrder(route.params.id as string))

const hasDimensions = computed(() => {
  return order.value?.panelen.some(p => p.breedte > 0 || p.hoogte > 0) ?? false
})

interface ProcessStep {
  key: OrderStatus; label: string; desc: string; current: boolean; done: boolean
}

// Lineaire processtappen — meerwerk_wacht is geen stap maar een tussenstatus
const allSteps: { key: OrderStatus; label: string; desc: string }[] = [
  { key: 'bevestigd',        label: 'Bestelling bevestigd',   desc: 'Order aangemaakt en bevestigd naar klant' },
  { key: 'ontvangen',        label: 'Product ontvangen',       desc: 'Productinname afgerond, foto bij ontvangst gemaakt' },
  { key: 'in_productie',     label: 'In productie',            desc: 'Spuiterij is begonnen met het spuitwerk' },
  { key: 'productie_gereed', label: 'Productie gereed',        desc: 'Spuitwerk klaar, opleverfoto gemaakt, wachten op betaling' },
  { key: 'klaar',            label: 'Klaar voor ophalen',      desc: 'Betaling bevestigd door SpuitwerkOnline, klant is onderweg' },
  { key: 'afgerond',         label: 'Afgerond',                desc: 'Product overhandigd aan klant' },
]

// Voor meerwerk_wacht: gebruik 'ontvangen' als huidige stap in de linear flow
// (meerwerk wordt altijd ontdekt nadat het product er al is)
const effectiveStatus = computed(() =>
  order.value?.status === 'meerwerk_wacht' ? 'ontvangen' : order.value?.status
)

const processSteps = computed<ProcessStep[]>(() =>
  allSteps.map(s => ({
    ...s,
    current: effectiveStatus.value === s.key,
    done:    order.value ? STATUS_ORDER[order.value.status] > STATUS_ORDER[s.key] : false
  }))
)

function stepIsDone(s: ProcessStep)  { return s.done }
function stepDotClass(s: ProcessStep) {
  if (s.done) return 'step-dot-done'
  if (s.current) return 'step-dot-current'
  return 'step-dot-pending'
}
function stepLabelClass(s: ProcessStep) {
  if (s.done) return 'step-label-done'
  if (s.current) return 'step-label-current'
  return 'step-label-pending'
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
