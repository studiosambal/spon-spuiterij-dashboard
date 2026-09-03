<template>
  <main class="page-content">

    <!-- Zoeken op ordernummer of klantnaam -->
    <PIconField>
      <PInputIcon class="ti ti-search" />
      <PInputText v-model="zoek" type="search" placeholder="Zoek op ordernummer of naam"
                  style="width:100%" />
    </PIconField>

    <div v-if="zoek && geenResultaten" class="card" style="text-align:center;color:var(--muted);padding:24px">
      <i class="ti ti-search" style="font-size:24px;display:block;margin-bottom:8px;opacity:.4" />
      Geen orders gevonden voor "{{ zoek }}"
    </div>

    <!-- ── TE ONTVANGEN ─────────────────────────────────────── -->
    <template v-if="teOntvangenOrders.length > 0">
      <button class="section-label"
              style="display:flex;justify-content:space-between;align-items:center;width:100%;background:none;border:none;cursor:pointer;padding:4px 0;min-height:44px;font-family:inherit"
              @click="toonTeOntvangen = !toonTeOntvangen">
        <span>Binnenkomst verwacht ({{ teOntvangenOrders.length }})</span>
        <i :class="toonTeOntvangen ? 'ti ti-chevron-up' : 'ti ti-chevron-down'" style="color:var(--muted)" />
      </button>
      <template v-if="toonTeOntvangen">
        <OrderCard v-for="order in teOntvangenOrders" :key="order.id" :order="order" />
      </template>
    </template>

    <!-- ── ACTIEVE ORDERS — gegroepeerd per fase, op actievolgorde ── -->
    <template v-if="actieveOrders.length === 0">
      <div class="section-label">Actieve orders (0)</div>
      <div class="card" style="text-align:center;color:var(--muted);padding:24px">
        <i class="ti ti-circle-check" style="font-size:28px;display:block;margin-bottom:8px;color:var(--primary);opacity:.5" />
        {{ zoek ? 'Geen actieve orders gevonden' : 'Geen actieve orders' }}
      </div>
    </template>

    <template v-for="groep in actieveGroepen" :key="groep.status">
      <div class="section-label">{{ groep.titel }} ({{ groep.orders.length }})</div>
      <OrderCard v-for="order in groep.orders" :key="order.id" :order="order" />
    </template>

    <!-- ── AFGERONDE ORDERS ─────────────────────────────────── -->
    <div style="display:flex;flex-direction:column;gap:14px;margin-top:10px">
      <button class="section-label"
              style="display:flex;justify-content:space-between;align-items:center;width:100%;background:none;border:none;cursor:pointer;padding:4px 0;min-height:44px;font-family:inherit"
              @click="toonAfgerond = !toonAfgerond">
        <span>Afgerond ({{ afgerondOrders.length }})</span>
        <span style="display:flex;align-items:center;gap:6px">
          <span v-if="uitbetalingOpenstaand > 0" style="color:var(--p-yellow-800);font-weight:700;font-size:var(--text-xs)">
            {{ uitbetalingOpenstaand }} wacht op uitbetaling
          </span>
          <i :class="toonAfgerond ? 'ti ti-chevron-up' : 'ti ti-chevron-down'" style="color:var(--muted)" />
        </span>
      </button>

      <template v-if="toonAfgerond">
        <div v-if="afgerondOrders.length === 0" class="card" style="text-align:center;color:var(--muted);padding:20px">
          {{ zoek ? 'Geen afgeronde orders gevonden' : 'Nog geen afgeronde orders' }}
        </div>
        <OrderCard v-for="order in afgerondOrders" :key="order.id" :order="order" />
      </template>
    </div>

  </main>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useOrders, type Order, type OrderStatus } from '@/composables/useOrders'
import OrderCard from '@/components/OrderCard.vue'

const { orders } = useOrders()
const toonTeOntvangen = ref(true)
const toonAfgerond = ref(false)
const zoek = ref('')

function matchZoek(o: Order): boolean {
  const q = zoek.value.trim().toLowerCase()
  if (!q) return true
  return o.id.toLowerCase().includes(q) || o.klant.toLowerCase().includes(q)
}

const teOntvangenOrders = computed(() =>
  [...orders.value]
    .filter(o => o.status === 'bevestigd' && matchZoek(o))
    .sort((a, b) => (a.verwacht_levering ?? '').localeCompare(b.verwacht_levering ?? ''))
)

const actieveOrders = computed(() =>
  [...orders.value].filter(o => o.status !== 'afgerond' && o.status !== 'bevestigd' && matchZoek(o))
)

// Fasegroepen op procesvolgorde (zelfde volgorde als de tijdlijn op de detailpagina):
// de urgentie draagt de volgorde niet — dat doen de signaalkleuren in de footers.
// De groepskop draagt de fase — de kaarten hebben daardoor geen badge nodig.
const FASE_GROEPEN: { status: OrderStatus; titel: string }[] = [
  { status: 'ontvangen',        titel: 'Te controleren' },
  { status: 'meerwerk_wacht',   titel: 'Wacht op akkoord' },
  { status: 'in_productie',     titel: 'In productie' },
  { status: 'productie_gereed', titel: 'Wacht op betaling' },
  { status: 'klaar',            titel: 'Klaar voor ophalen' },
]

const actieveGroepen = computed(() =>
  FASE_GROEPEN
    .map(g => ({
      ...g,
      orders: actieveOrders.value
        .filter(o => o.status === g.status)
        .sort((a, b) => Number(b.te_laat ?? false) - Number(a.te_laat ?? false)),  // te laat bovenaan
    }))
    .filter(g => g.orders.length > 0)
)

const afgerondOrders = computed(() =>
  [...orders.value]
    .filter(o => o.status === 'afgerond' && matchZoek(o))
    .sort((a, b) => b.id.localeCompare(a.id))  // nieuwste eerst
)

const geenResultaten = computed(() =>
  teOntvangenOrders.value.length === 0 &&
  actieveOrders.value.length === 0 &&
  afgerondOrders.value.length === 0
)

const uitbetalingOpenstaand = computed(() =>
  afgerondOrders.value.filter(o => !o.uitbetaald).length
)
</script>
