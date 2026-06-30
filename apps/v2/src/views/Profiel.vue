<template>
  <div>
    <header class="app-header">
      <button class="back-btn" @click="router.back()">
        <i class="pi pi-arrow-left" /> Terug
      </button>
      <h1>{{ spuiter.naam }}</h1>
      <div class="subtitle">{{ spuiter.bedrijf }}</div>
    </header>

    <main class="page-content">

      <!-- Statistieken grid -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">

        <div class="card" style="padding:16px;cursor:pointer;display:flex;flex-direction:column;justify-content:space-between"
             @click="router.push('/')">
          <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);margin-bottom:6px">Actieve orders</div>
          <div style="font-size:32px;font-weight:700;color:var(--text);line-height:1">{{ actieveOrders }}</div>
          <div style="font-size:13px;color:var(--muted);margin-top:4px;display:flex;align-items:center;justify-content:space-between">
            <span>in behandeling</span>
            <i class="pi pi-arrow-right" style="color:var(--primary);font-size:12px" />
          </div>
        </div>

        <div class="card" style="padding:16px;cursor:pointer;display:flex;flex-direction:column;justify-content:space-between"
             @click="router.push('/')">
          <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);margin-bottom:6px">Afgerond</div>
          <div style="font-size:32px;font-weight:700;color:var(--text);line-height:1">{{ afgerondOrders }}</div>
          <div style="font-size:13px;color:var(--muted);margin-top:4px;display:flex;align-items:center;justify-content:space-between">
            <span>totaal</span>
            <i class="pi pi-arrow-right" style="color:var(--primary);font-size:12px" />
          </div>
        </div>

        <div class="card" style="padding:16px;border-color:#fde68a;background:#fefce8">
          <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#92400e;margin-bottom:6px">Tegoed</div>
          <div style="font-size:32px;font-weight:700;color:#92400e;line-height:1">{{ formatEuro(tegoed) }}</div>
          <div style="font-size:13px;color:#a16207;margin-top:4px">wacht op uitbetaling</div>
        </div>

        <div class="card" style="padding:16px;border-color:#bbf7d0;background:#f0fdf4">
          <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#15803d;margin-bottom:6px">Ontvangen</div>
          <div style="font-size:32px;font-weight:700;color:#15803d;line-height:1">{{ formatEuro(ontvangen) }}</div>
          <div style="font-size:13px;color:#16a34a;margin-top:4px">uitbetaald</div>
        </div>

      </div>

      <!-- Wacht op uitbetaling -->
      <template v-if="teOntvangenUitbetaling.length > 0">
        <div class="section-label">Wacht op uitbetaling ({{ teOntvangenUitbetaling.length }})</div>
        <div class="card" style="padding:0;overflow:hidden">
          <div v-for="(order, i) in teOntvangenUitbetaling" :key="order.id"
               style="display:flex;align-items:center;gap:12px;padding:14px 16px;cursor:pointer"
               :style="i < teOntvangenUitbetaling.length - 1 ? { borderBottom: '1px solid var(--border)' } : {}"
               @click="router.push('/order/' + order.id)">
            <div style="flex:1;min-width:0">
              <div style="font-weight:600;font-size:15px;color:var(--text)">{{ order.klant }}</div>
              <div style="font-size:13px;color:var(--muted);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ order.product }}</div>
              <div style="font-size:12px;color:var(--muted);margin-top:2px">{{ order.datum }}</div>
            </div>
            <div style="text-align:right;flex-shrink:0">
              <div style="font-size:17px;font-weight:700;color:#92400e">{{ formatEuro(order.bedrag) }}</div>
              <div style="font-size:11px;color:#a16207;margin-top:2px">tegoed</div>
            </div>
            <i class="pi pi-chevron-right" style="color:#cbd5e1;font-size:13px;flex-shrink:0" />
          </div>
        </div>
      </template>

      <!-- Recent uitbetaald -->
      <template v-if="recentUitbetaald.length > 0">
        <div class="section-label">Recent uitbetaald</div>
        <div class="card" style="padding:0;overflow:hidden">
          <div v-for="(order, i) in recentUitbetaald" :key="order.id"
               style="display:flex;align-items:center;gap:12px;padding:14px 16px;cursor:pointer"
               :style="i < recentUitbetaald.length - 1 ? { borderBottom: '1px solid var(--border)' } : {}"
               @click="router.push('/order/' + order.id)">
            <div style="flex:1;min-width:0">
              <div style="font-weight:600;font-size:15px;color:var(--text)">{{ order.klant }}</div>
              <div style="font-size:13px;color:var(--muted);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ order.product }}</div>
              <div style="font-size:12px;color:var(--muted);margin-top:2px">{{ order.datum }}</div>
            </div>
            <div style="text-align:right;flex-shrink:0">
              <div style="font-size:17px;font-weight:700;color:#15803d">{{ formatEuro(order.bedrag) }}</div>
              <div style="font-size:11px;color:#16a34a;margin-top:2px;display:flex;align-items:center;gap:3px;justify-content:flex-end">
                <i class="pi pi-check" style="font-size:10px" /> uitbetaald
              </div>
            </div>
            <i class="pi pi-chevron-right" style="color:#cbd5e1;font-size:13px;flex-shrink:0" />
          </div>
        </div>
      </template>


      <div class="section-label">Account</div>
      <div class="card" style="padding:0;overflow:hidden">
        <button style="width:100%;display:flex;align-items:center;gap:12px;padding:16px;background:none;border:none;cursor:pointer;font-family:inherit;text-align:left"
                @click="router.push('/account')">
          <i class="pi pi-cog" style="font-size:18px;color:var(--muted)" />
          <span style="flex:1;font-size:15px;font-weight:600;color:var(--text)">Accountinstellingen</span>
          <i class="pi pi-chevron-right" style="font-size:14px;color:var(--muted)" />
        </button>
      </div>

    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useOrders } from '@/composables/useOrders'
import { useAuth } from '@/composables/useAuth'

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
