<template>
    <header class="app-header">
      <button class="back-btn" @click="router.back()">
        <i class="ti ti-arrow-left" /> Terug
      </button>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
        <h1 style="font-family:monospace">{{ order?.id }}</h1>
      </div>
      <div class="subtitle" style="color:var(--muted)">{{ klantPlaats(order) }}</div>
    </header>

  <div v-if="order" style="min-height:100dvh;display:flex;flex-direction:column">
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 20px;text-align:center">
      <div style="width:80px;height:80px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;margin-bottom:20px">
        <i class="ti ti-check" style="font-size:36px;color:#fff" />
      </div>
      <div style="font-size:22px;font-weight:700;color:var(--text);margin-bottom:8px">Ontvangst bevestigd</div>

      <div style="width:100%;margin-top:32px;padding:16px;background:#fff;border-radius:var(--radius);border:1px solid var(--border);text-align:left">
        <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);margin-bottom:4px">Wat nu?</div>
        <div style="font-size:15px;color:var(--text);line-height:1.5">
			Je hoeft de order nog niet te controleren. We raden je wel aan foto's te maken, daarmee sta je sterk bij eventuele latere schadeklachten.
        </div>
        <div v-if="order.verwacht_gereed_datum"
             style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border);display:flex;align-items:center;gap:8px;font-size:14px;color:var(--text)">
          <i class="ti ti-flag" style="color:var(--primary);font-size:16px" />
          <span>Opleveren vóór <strong>{{ order.verwacht_gereed_datum }}</strong></span>
        </div>
      </div>
    </div>

    <div style="padding:16px;display:flex;flex-direction:column;gap:10px">
      <PButton v-if="!order.beforeFotoGemaakt" label="Foto's maken" icon="ti ti-camera"
               @click="router.push('/order/' + order.id + '/foto/before')" />
      <PButton label="Order controleren" icon="ti ti-arrow-right"
               :outlined="!order.beforeFotoGemaakt"
               @click="router.push('/order/' + order.id)" />
      <PButton label="Naar overzicht" icon="ti ti-home" outlined
               @click="router.push('/')" />
    </div>
  </div>

  <div v-else class="page-content">
    <div class="card" style="color:var(--muted);font-size:14px">Order niet gevonden.</div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useOrders, klantPlaats } from '@/composables/useOrders'

const router = useRouter()
const route  = useRoute()
const { getOrder, ontvangGoederen } = useOrders()

const order = computed(() => getOrder(route.params.id as string))

// Registreer de aanname en start de opleverklok. Idempotent: bij een order die
// al 'ontvangen' is doet dit niets, dus terugkeren naar dit scherm is veilig.
onMounted(() => {
  ontvangGoederen(route.params.id as string)
})
</script>
