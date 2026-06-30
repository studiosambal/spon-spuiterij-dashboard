<template>
  <main class="page-content">

    <!-- Zoeken op ordernummer of klantnaam -->
    <div style="position:relative">
      <i class="pi pi-search" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--muted);font-size:14px" />
      <input v-model="zoek" type="search" placeholder="Zoek op ordernummer of naam"
             style="width:100%;height:44px;padding:0 12px 0 36px;border:1px solid var(--border);border-radius:var(--radius);font-family:inherit;font-size:15px;background:#fff;color:var(--text)" />
    </div>

    <div v-if="zoek && geenResultaten" class="card" style="text-align:center;color:var(--muted);padding:24px">
      <i class="pi pi-search" style="font-size:24px;display:block;margin-bottom:8px;opacity:.4" />
      Geen orders gevonden voor "{{ zoek }}"
    </div>

    <!-- ── TE ONTVANGEN ─────────────────────────────────────── -->
    <template v-if="teOntvangenOrders.length > 0">
      <button class="section-label"
              style="display:flex;justify-content:space-between;align-items:center;width:100%;background:none;border:none;cursor:pointer;padding:4px 0;min-height:44px;font-family:inherit"
              @click="toonTeOntvangen = !toonTeOntvangen">
        <span>Te ontvangen ({{ teOntvangenOrders.length }})</span>
        <i :class="toonTeOntvangen ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" style="color:var(--muted)" />
      </button>

      <div v-if="toonTeOntvangen" v-for="order in teOntvangenOrders" :key="order.id"
           class="order-item"
           @click="router.push('/order/' + order.id)">
        <div v-if="order.te_laat" style="position:absolute;left:0;top:0;bottom:0;width:5px;background:#dc2626" />
        <div class="order-item-body">
          <div :style="regel1">
            <span :style="ordernrStyle">{{ order.id }}</span>
            <span :style="klantStyle">{{ order.klant }}</span>
          </div>
          <div class="meta">{{ order.product }}</div>
          <div style="display:flex;align-items:center;gap:6px;margin-top:3px">
            <template v-if="kleurOnbekend(order)">
              <span class="meta" style="margin-top:0;font-style:italic">Kleur nog te bepalen</span>
            </template>
            <template v-else>
              <span :style="kleurSwatch(order)" />
              <span class="meta" style="margin-top:0">{{ kleurLabel(order) }}</span>
            </template>
          </div>
          <div v-if="order.verwacht_levering"
               style="margin-top:5px;display:flex;align-items:center;gap:5px;font-size:13px;font-weight:600;color:var(--primary)">
            <i class="pi pi-calendar" style="font-size:12px" />
            Binnenkomst {{ order.verwacht_levering }}
          </div>
          <div v-else style="margin-top:5px;font-size:13px;color:var(--muted);font-style:italic">
            Binnenkomst nog onbekend
          </div>
        </div>
        <i class="pi pi-chevron-right order-item-arrow" />
      </div>
    </template>

    <!-- ── ACTIEVE ORDERS ───────────────────────────────────── -->
    <div class="section-label" style="margin-top:4px">Actieve orders ({{ actieveOrders.length }})</div>

    <div v-if="actieveOrders.length === 0" class="card" style="text-align:center;color:var(--muted);padding:24px">
      <i class="pi pi-check-circle" style="font-size:28px;display:block;margin-bottom:8px;color:var(--primary);opacity:.5" />
      {{ zoek ? 'Geen actieve orders gevonden' : 'Geen actieve orders' }}
    </div>

    <div v-for="order in actieveOrders" :key="order.id"
         class="order-item"
         @click="router.push('/order/' + order.id)">
      <div class="order-item-body">
        <div :style="regel1">
          <span :style="ordernrStyle">{{ order.id }}</span>
          <span :style="klantStyle">{{ order.klant }}</span>
        </div>
        <div class="meta">{{ order.product }}</div>
        <div style="display:flex;align-items:center;gap:6px;margin-top:3px">
          <span :style="kleurSwatch(order)" />
          <span class="meta" style="margin-top:0">{{ kleurLabel(order) }}</span>
        </div>
        <div class="badge-wrap" style="margin-top:6px">
          <span :class="['badge', 'badge-' + order.status]">{{ STATUS_LABELS[order.status] }}</span>
        </div>
      </div>
      <i class="pi pi-chevron-right order-item-arrow" />
      <!-- Te laat: subtiele volle-breedte balk onderaan de kaart, met datum-context -->
      <div v-if="order.te_laat"
           style="width:calc(100% + 33px);margin:6px -14px -14px -19px;background:#fef2f2;border-top:1px solid #fecaca;border-radius:0 0 4px 4px;color:#b91c1c;font-size:13px;font-weight:600;display:flex;align-items:center;gap:8px;padding:9px 19px">
        <i class="pi pi-clock" style="font-size:13px;flex-shrink:0" />
        <span><strong>Te laat</strong><template v-if="order.verwacht_gereed_datum"> · verwacht klaar {{ order.verwacht_gereed_datum }}</template></span>
      </div>
    </div>

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
          <i :class="toonAfgerond ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" style="color:var(--muted)" />
        </span>
      </button>

      <template v-if="toonAfgerond">
        <div v-if="afgerondOrders.length === 0" class="card" style="text-align:center;color:var(--muted);padding:20px">
          {{ zoek ? 'Geen afgeronde orders gevonden' : 'Nog geen afgeronde orders' }}
        </div>

        <div v-for="order in afgerondOrders" :key="order.id"
             class="order-item"
             style="opacity:0.85"
             @click="router.push('/order/' + order.id)">
          <div class="order-item-body">
            <div :style="regel1">
              <span :style="ordernrStyle">{{ order.id }}</span>
              <span :style="klantStyle">{{ order.klant }}</span>
            </div>
            <div class="meta">{{ order.product }}</div>
            <div style="margin-top:5px;display:flex;flex-direction:column;gap:3px">
              <span v-if="order.uitbetaald"
                    style="display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:600;color:#15803d;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:4px;padding:2px 8px;white-space:nowrap;align-self:flex-start">
                <i class="pi pi-check" style="font-size:12px" /> Uitbetaald
              </span>
              <span v-else
                    style="display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:600;color:#854d0e;background:#fef9c3;border:1px solid #fde68a;border-radius:4px;padding:2px 8px;white-space:nowrap;align-self:flex-start">
                <i class="pi pi-clock" style="font-size:12px" /> Wacht op uitbetaling
              </span>
              <span style="font-size:12px;color:var(--muted)">{{ order.datum }}</span>
            </div>
          </div>
          <i class="pi pi-chevron-right order-item-arrow" />
        </div>
      </template>
    </div>

  </main>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useOrders, STATUS_LABELS, STATUS_ORDER, type Order } from '@/composables/useOrders'

const router = useRouter()
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

// ── Stijl-tokens voor de compacte regel ──────────────────────────────
const regel1 = 'display:flex;align-items:baseline;gap:8px;min-width:0'
const ordernrStyle = 'font-family:monospace;font-weight:700;font-size:15px;color:var(--text);flex-shrink:0'
const klantStyle = 'font-size:13px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap'

// ── Kleur: een order kan meerdere diensten met eigen kleur hebben ─────
function kleurOnbekend(order: Order): boolean {
  return order.diensten.every(d => d.kleur_methode === 'later' || d.kleur_methode === 'kleurvoorbeeld')
}
function meerdereKleuren(order: Order): boolean {
  return new Set(order.diensten.map(d => d.kleur)).size > 1
}
function kleurLabel(order: Order): string {
  return meerdereKleuren(order) ? 'Meerdere kleuren' : order.diensten[0]?.kleur ?? ''
}
function kleurHex(order: Order): string {
  return kleurToHex(order.diensten[0]?.kleur ?? '')
}
function kleurSwatch(order: Order): string {
  const base = 'display:inline-block;width:18px;height:18px;border-radius:4px;flex-shrink:0;border:1px solid rgba(0,0,0,0.18)'
  if (meerdereKleuren(order)) {
    const [a, b] = order.diensten
    return `${base};background:linear-gradient(135deg, ${kleurToHex(a.kleur)} 50%, ${kleurToHex(b.kleur)} 50%)`
  }
  return `${base};background:${kleurHex(order)}`
}

function kleurToHex(k: string): string {
  const l = k.toLowerCase()
  if (l.includes('zwart') || l.includes('9005') || l.includes('piano')) return '#18181b'
  if (l.includes('gebroken wit') || l.includes('9001')) return '#f5f0e8'
  if (l.includes('wit') || l.includes('9003') || l.includes('9016')) return '#f0f0f0'
  if (l.includes('rood') || l.includes('3020')) return '#dc2626'
  if (l.includes('blauw') || l.includes('5011')) return '#1d4ed8'
  if (l.includes('saliegreen') || l.includes('salige') || l.includes('6021')) return '#7aab78'
  if (l.includes('groen')) return '#15803d'
  if (l.includes('antraciet') || l.includes('7016')) return '#374151'
  if (l.includes('grijs') || l.includes('7035')) return '#9ca3af'
  if (l.includes('taupe') || l.includes('beige')) return '#a89880'
  if (l.includes('oranje')) return '#ea580c'
  if (l.includes('petrol') || l.includes('5021')) return '#0e7490'
  if (l.includes('bn.00.86') || l.includes('sikkens')) return '#c8bfb0'
  return '#e2e8f0'
}

</script>
