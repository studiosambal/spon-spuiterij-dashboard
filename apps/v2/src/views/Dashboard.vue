<template>
  <main class="page-content">

    <!-- Zoeken op ordernummer of klantnaam -->
    <div style="position:relative">
      <i class="ti ti-search" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--muted);font-size:14px" />
      <input v-model="zoek" type="search" placeholder="Zoek op ordernummer of naam"
             style="width:100%;height:44px;padding:0 12px 0 36px;border:1px solid var(--border);border-radius:var(--radius);font-family:inherit;font-size:15px;background:#fff;color:var(--text)" />
    </div>

    <div v-if="zoek && geenResultaten" class="card" style="text-align:center;color:var(--muted);padding:24px">
      <i class="ti ti-search" style="font-size:24px;display:block;margin-bottom:8px;opacity:.4" />
      Geen orders gevonden voor "{{ zoek }}"
    </div>

    <!-- ── TE ONTVANGEN ─────────────────────────────────────── -->
    <template v-if="teOntvangenOrders.length > 0">
      <button class="section-label"
              style="display:flex;justify-content:space-between;align-items:center;width:100%;background:none;border:none;cursor:pointer;padding:4px 0;min-height:44px;font-family:inherit"
              @click="toonTeOntvangen = !toonTeOntvangen">
        <span>Te ontvangen ({{ teOntvangenOrders.length }})</span>
        <i :class="toonTeOntvangen ? 'ti ti-chevron-up' : 'ti ti-chevron-down'" style="color:var(--muted)" />
      </button>
      <template v-if="toonTeOntvangen">
        <OrderCard v-for="order in teOntvangenOrders" :key="order.id" :order="order" />
      </template>
    </template>

    <!-- ── ACTIEVE ORDERS ───────────────────────────────────── -->
    <div class="section-label" style="margin-top:4px">Actieve orders ({{ actieveOrders.length }})</div>

    <div v-if="actieveOrders.length === 0" class="card" style="text-align:center;color:var(--muted);padding:24px">
      <i class="ti ti-circle-check" style="font-size:28px;display:block;margin-bottom:8px;color:var(--primary);opacity:.5" />
      {{ zoek ? 'Geen actieve orders gevonden' : 'Geen actieve orders' }}
    </div>

    <OrderCard v-for="order in actieveOrders" :key="order.id" :order="order" />

    <!-- ── AFGERONDE ORDERS ─────────────────────────────────── -->
    <div style="display:flex;flex-direction:column;gap:10px;margin-top:4px">
      <button class="section-label"
              style="display:flex;justify-content:space-between;align-items:center;width:100%;background:none;border:none;cursor:pointer;padding:4px 0;min-height:44px;font-family:inherit"
              @click="toonAfgerond = !toonAfgerond">
        <span>Afgerond ({{ afgerondOrders.length }})</span>
        <span style="display:flex;align-items:center;gap:6px">
          <span v-if="uitbetalingOpenstaand > 0" style="color:#854d0e;font-weight:700;font-size:12px">
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
import { useOrders, STATUS_ORDER, type Order } from '@/composables/useOrders'
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
  [...orders.value]
    .filter(o => o.status !== 'afgerond' && o.status !== 'bevestigd' && matchZoek(o))
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status])
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
