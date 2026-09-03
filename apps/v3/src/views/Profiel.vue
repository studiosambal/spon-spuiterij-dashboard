<template>
  <div>
    <header class="app-header">
      <button class="back-btn" @click="router.back()">
        <i class="ti ti-arrow-left" /> Terug
      </button>
      <h1>{{ spuiter.naam }}</h1>
      <div class="subtitle">{{ spuiter.bedrijf }}</div>
    </header>

    <main class="page-content">

      <!-- Statistieken grid -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">

        <div class="card" style="padding:16px;cursor:pointer;display:flex;flex-direction:column;justify-content:space-between"
             @click="router.push('/')">
          <div style="font-size:var(--text-sm);color:var(--muted);margin-bottom:6px">Actieve orders</div>
          <div style="font-size:var(--text-3xl);font-weight:700;color:var(--text);line-height:1">{{ actieveOrders }}</div>
          <div style="font-size:var(--text-sm);color:var(--muted);margin-top:4px;display:flex;align-items:center;justify-content:space-between">
            <span>in behandeling</span>
            <i class="ti ti-arrow-right" style="color:var(--primary);font-size:12px" />
          </div>
        </div>

        <div class="card" style="padding:16px;cursor:pointer;display:flex;flex-direction:column;justify-content:space-between"
             @click="router.push('/')">
          <div style="font-size:var(--text-sm);color:var(--muted);margin-bottom:6px">Afgerond</div>
          <div style="font-size:var(--text-3xl);font-weight:700;color:var(--text);line-height:1">{{ afgerondOrders }}</div>
          <div style="font-size:var(--text-sm);color:var(--muted);margin-top:4px;display:flex;align-items:center;justify-content:space-between">
            <span>totaal</span>
            <i class="ti ti-arrow-right" style="color:var(--primary);font-size:12px" />
          </div>
        </div>

        <div class="card" style="padding:16px">
          <div style="font-size:var(--text-sm);color:var(--muted);margin-bottom:6px">Tegoed</div>
          <div style="font-size:var(--text-3xl);font-weight:700;color:var(--p-amber-800);line-height:1">{{ formatEuro(tegoed) }}</div>
          <div style="font-size:var(--text-sm);color:var(--p-yellow-700);margin-top:4px">wacht op uitbetaling</div>
        </div>

        <div class="card" style="padding:16px">
          <div style="font-size:var(--text-sm);color:var(--muted);margin-bottom:6px">Uitbetaald</div>
          <div style="font-size:var(--text-3xl);font-weight:700;color:var(--p-green-700);line-height:1">{{ formatEuro(ontvangen) }}</div>
          <div style="font-size:var(--text-sm);color:var(--p-green-600);margin-top:4px">totaal</div>
        </div>

      </div>

      <!-- Wacht op uitbetaling -->
      <template v-if="teOntvangenUitbetaling.length > 0">
        <div class="section-label">Wacht op uitbetaling ({{ teOntvangenUitbetaling.length }})</div>
        <div class="card" style="padding:0;overflow:hidden">
          <div v-for="(order, i) in teOntvangenUitbetaling" :key="order.id"
               style="display:flex;align-items:center;gap:12px;padding:12px 14px;cursor:pointer"
               :style="i < teOntvangenUitbetaling.length - 1 ? { borderBottom: '1px solid var(--hairline)' } : {}"
               @click="router.push('/order/' + order.id)">
            <div class="oc-thumb">
              <img :src="dienstImage(order.product)" :alt="order.product" />
            </div>
            <div style="flex:1;min-width:0">
              <div style="font-weight:600;font-size:var(--text-base);color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ klantPlaats(order) }}</div>
              <div style="font-size:var(--text-sm);color:var(--muted);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ order.product }}</div>
              <div style="font-size:var(--text-xs);color:var(--muted);margin-top:2px">{{ order.datum }}</div>
            </div>
            <div style="text-align:right;flex-shrink:0">
              <div style="font-size:var(--text-lg);font-weight:700;color:var(--p-amber-800)">{{ formatEuro(order.bedrag) }}</div>
              <div style="font-size:var(--text-xs);color:var(--p-yellow-700);margin-top:2px">tegoed</div>
            </div>
          </div>
        </div>
      </template>

      <!-- Recent uitbetaald -->
      <template v-if="recentUitbetaald.length > 0">
        <div class="section-label">Recent uitbetaald</div>
        <div class="card" style="padding:0;overflow:hidden">
          <div v-for="(order, i) in recentUitbetaald" :key="order.id"
               style="display:flex;align-items:center;gap:12px;padding:12px 14px;cursor:pointer"
               :style="i < recentUitbetaald.length - 1 ? { borderBottom: '1px solid var(--hairline)' } : {}"
               @click="router.push('/order/' + order.id)">
            <div class="oc-thumb">
              <img :src="dienstImage(order.product)" :alt="order.product" />
            </div>
            <div style="flex:1;min-width:0">
              <div style="font-weight:600;font-size:var(--text-base);color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ klantPlaats(order) }}</div>
              <div style="font-size:var(--text-sm);color:var(--muted);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ order.product }}</div>
              <div style="font-size:var(--text-xs);color:var(--muted);margin-top:2px">{{ order.datum }}</div>
            </div>
            <div style="text-align:right;flex-shrink:0">
              <div style="font-size:var(--text-lg);font-weight:700;color:var(--p-green-700)">{{ formatEuro(order.bedrag) }}</div>
              <div style="font-size:var(--text-xs);color:var(--p-green-600);margin-top:2px;display:flex;align-items:center;gap:3px;justify-content:flex-end">
                <i class="ti ti-check" style="font-size:10px" /> uitbetaald
              </div>
            </div>
          </div>
        </div>
      </template>


      <div class="section-label">Account</div>
      <div class="card" style="padding:0;overflow:hidden">
        <button style="width:100%;display:flex;align-items:center;gap:12px;padding:16px;background:none;border:none;cursor:pointer;font-family:inherit;text-align:left"
                @click="router.push('/account')">
          <i class="ti ti-settings" style="font-size:18px;color:var(--muted)" />
          <span style="flex:1;font-size:var(--text-base);font-weight:600;color:var(--text)">Accountinstellingen</span>
          <i class="ti ti-chevron-right" style="font-size:14px;color:var(--muted)" />
        </button>
      </div>

    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useOrders, klantPlaats } from '@/composables/useOrders'
import { useAuth } from '@/composables/useAuth'
import { dienstImage } from '@/lib/dienstImage'

const router = useRouter()
const { orders } = useOrders()
const { spuiter } = useAuth()

const actieveOrders = computed(() =>
  orders.value.filter(o => o.status !== 'afgerond').length
)

const afgerondOrders = computed(() =>
  orders.value.filter(o => o.status === 'afgerond').length
)

const tegoed = computed(() =>
  orders.value
    .filter(o => o.status === 'afgerond' && !o.uitbetaald)
    .reduce((sum, o) => sum + o.bedrag, 0)
)

const ontvangen = computed(() =>
  orders.value
    .filter(o => o.uitbetaald)
    .reduce((sum, o) => sum + o.bedrag, 0)
)

const teOntvangenUitbetaling = computed(() =>
  orders.value.filter(o => o.status === 'afgerond' && !o.uitbetaald)
)

const recentUitbetaald = computed(() =>
  orders.value.filter(o => o.uitbetaald)
)

function formatEuro(bedrag: number): string {
  return '€' + bedrag.toLocaleString('nl-NL')
}
</script>
